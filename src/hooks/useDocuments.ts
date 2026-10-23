import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { saveAs } from 'file-saver';
import type { TidyDocument, DocumentStats, DocumentCategory, SortField, SortOrder } from '../types';
import { MAX_FILES } from '../types';
import {
  generateId,
  getFileFingerprint,
  validateFile,
  getFileType,
  sortDocuments,
} from '../utils/fileUtils';
import { processDocuments } from '../engine/demoOrganizer';
import { exportAsZip } from '../engine/exportZip';

export interface LastExportInfo {
  blob: Blob;
  filename: string;
  timestamp: number;
}

export interface UseDocumentsReturn {
  /** All documents in workspace */
  documents: TidyDocument[];
  /** Computed statistics */
  stats: DocumentStats;
  /** Whether the organizer is currently running */
  isProcessing: boolean;
  /** Whether an export is in progress */
  isExporting: boolean;
  /** Details of the most recently exported package (if any) */
  lastExport: LastExportInfo | null;
  /** Global error notification */
  error: string | null;
  /** Success notification */
  successMessage: string | null;
  /** Current sort field */
  sortField: SortField;
  /** Current sort order */
  sortOrder: SortOrder;
  /** Set sort field and order */
  setSorting: (field: SortField, order?: SortOrder) => void;
  /** Add files from drop or file dialog */
  addFiles: (files: FileList | File[]) => void;
  /** Remove a document by ID */
  removeDocument: (id: string) => void;
  /** Clear all documents from workspace */
  clearAll: () => void;
  /** Run the demo organizer on pending documents */
  organizeFiles: () => Promise<void>;
  /** Toggle approval state for a single document */
  toggleApproval: (id: string) => void;
  /** Approve all completed documents */
  approveAll: () => void;
  /** Revoke approval for all documents */
  unapproveAll: () => void;
  /** Start editing a document */
  startEditing: (id: string) => void;
  /** Save edits to a document */
  saveEdits: (id: string, name: string, category: DocumentCategory) => void;
  /** Cancel editing */
  cancelEditing: (id: string) => void;
  /** Export approved documents to structured ZIP */
  exportDocuments: () => Promise<void>;
  /** Download the last exported ZIP again without re-running processing */
  downloadLastExport: () => void;
  /** Dismiss error notification */
  dismissError: () => void;
  /** Dismiss success notification */
  dismissSuccess: () => void;
}

export function useDocuments(): UseDocumentsReturn {
  const [documents, setDocuments] = useState<TidyDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<LastExportInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Ref to always access current documents without stale closure
  const documentsRef = useRef<TidyDocument[]>(documents);
  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  // Compute workspace metrics
  const stats = useMemo<DocumentStats>(() => {
    const total = documents.length;
    const pending = documents.filter((d) => d.status === 'pending').length;
    const processing = documents.filter((d) => d.status === 'processing').length;
    const completed = documents.filter((d) => d.status === 'completed').length;
    const errors = documents.filter((d) => d.status === 'error').length;
    const approved = documents.filter((d) => d.approved).length;
    const totalSizeBytes = documents.reduce((sum, d) => sum + d.size, 0);
    return { total, pending, processing, completed, errors, approved, totalSizeBytes };
  }, [documents]);

  // Sort setter
  const setSorting = useCallback((field: SortField, order?: SortOrder) => {
    setSortField(field);
    if (order) {
      setSortOrder(order);
    } else {
      setSortOrder((prev) => (field === sortField ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
    }
  }, [sortField]);

  /**
   * Robust file addition:
   * - Pure state updates (no mutation of external arrays in updater)
   * - Strict fingerprint comparison: name + size + lastModified
   * - Distinguishes duplicate files from distinct files with same name
   * - Gracefully notifies when duplicate files are skipped
   */
  const addFiles = useCallback((files: FileList | File[]) => {
    setError(null);
    setSuccessMessage(null);

    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const currentDocs = documentsRef.current;
    const existingFingerprints = new Set(currentDocs.map((d) => d.fingerprint));
    const remainingSlots = MAX_FILES - currentDocs.length;

    if (remainingSlots <= 0) {
      setError(`Workspace capacity reached (${MAX_FILES} files maximum). Remove some files before uploading more.`);
      return;
    }

    const filesToConsider = fileList.slice(0, remainingSlots);
    const overflowCount = fileList.length - filesToConsider.length;

    const errors: string[] = [];
    const duplicatesSkipped: string[] = [];
    const validNewDocs: TidyDocument[] = [];
    const batchFingerprints = new Set<string>();

    for (const file of filesToConsider) {
      // 1. Validate format & size
      const validation = validateFile(file);
      if (!validation.valid) {
        errors.push(validation.error!);
        continue;
      }

      const mimeType = getFileType(file);
      if (!mimeType) continue;

      // 2. Check fingerprint for exact duplicate in workspace or within this batch
      const fingerprint = getFileFingerprint(file);
      if (existingFingerprints.has(fingerprint) || batchFingerprints.has(fingerprint)) {
        duplicatesSkipped.push(file.name);
        continue;
      }

      batchFingerprints.add(fingerprint);

      validNewDocs.push({
        id: generateId(),
        fingerprint,
        createdAt: Date.now(),
        file,
        originalName: file.name,
        mimeType,
        size: file.size,
        status: 'pending',
        approved: false,
        isEditing: false,
      });
    }

    if (overflowCount > 0) {
      errors.push(`Note: ${overflowCount} file(s) exceeded the batch limit (${MAX_FILES} total).`);
    }

    // Pure functional state update: create new array without external side-effects
    if (validNewDocs.length > 0) {
      setDocuments((prev) => [...prev, ...validNewDocs]);
    }

    // Feedback messages
    if (errors.length > 0) {
      setError(errors.join(' '));
    }

    if (validNewDocs.length > 0) {
      let msg = `Added ${validNewDocs.length} file${validNewDocs.length === 1 ? '' : 's'}.`;
      if (duplicatesSkipped.length > 0) {
        msg += ` (${duplicatesSkipped.length} duplicate${duplicatesSkipped.length === 1 ? '' : 's'} skipped: ${duplicatesSkipped.join(', ')})`;
      }
      setSuccessMessage(msg);
    } else if (duplicatesSkipped.length > 0) {
      setSuccessMessage(
        `All selected file(s) are already in your workspace: ${duplicatesSkipped.join(', ')}.`
      );
    }
  }, []);

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setDocuments([]);
    setLastExport(null);
    setError(null);
    setSuccessMessage(null);
  }, []);

  const updateDocument = useCallback((id: string, updates: Partial<TidyDocument>) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    );
  }, []);

  const organizeFiles = useCallback(async () => {
    const current = documentsRef.current;
    const pending = current.filter((d) => d.status === 'pending' || d.status === 'error');
    if (pending.length === 0) {
      setSuccessMessage('All files in the workspace have already been organized.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await processDocuments(current, updateDocument);
      setSuccessMessage(
        `Generated demo suggestions for ${pending.length} file${pending.length === 1 ? '' : 's'}. Review and approve them below.`
      );
    } catch {
      setError('An error occurred during demo processing. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [updateDocument]);

  const toggleApproval = useCallback((id: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id && d.status === 'completed'
          ? { ...d, approved: !d.approved }
          : d,
      ),
    );
  }, []);

  const approveAll = useCallback(() => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.status === 'completed' ? { ...d, approved: true } : d,
      ),
    );
  }, []);

  const unapproveAll = useCallback(() => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.status === 'completed' ? { ...d, approved: false } : d,
      ),
    );
  }, []);

  const startEditing = useCallback((id: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              isEditing: true,
              editedName: d.editedName ?? d.suggestedName ?? d.originalName,
              editedCategory: d.editedCategory ?? d.suggestedCategory ?? 'uncategorized',
            }
          : d,
      ),
    );
  }, []);

  const saveEdits = useCallback((id: string, name: string, category: DocumentCategory) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, isEditing: false, editedName: name.trim() || d.originalName, editedCategory: category }
          : d,
      ),
    );
  }, []);

  const cancelEditing = useCallback((id: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isEditing: false } : d)),
    );
  }, []);

  const exportDocuments = useCallback(async () => {
    const current = documentsRef.current;
    const approved = current.filter((d) => d.approved && d.status === 'completed');
    if (approved.length === 0) {
      setError('Please approve at least one organized document before exporting.');
      return;
    }

    setIsExporting(true);
    setError(null);
    try {
      const { filename, zipBlob } = await exportAsZip(approved);
      setLastExport({ blob: zipBlob, filename, timestamp: Date.now() });
      setSuccessMessage(`Export complete! Downloaded "${filename}".`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const downloadLastExport = useCallback(() => {
    if (lastExport) {
      saveAs(lastExport.blob, lastExport.filename);
      setSuccessMessage(`Downloaded "${lastExport.filename}" again.`);
    }
  }, [lastExport]);

  const dismissError = useCallback(() => setError(null), []);
  const dismissSuccess = useCallback(() => setSuccessMessage(null), []);

  // Sorted documents view
  const sortedDocuments = useMemo(() => {
    return sortDocuments(documents, sortField, sortOrder);
  }, [documents, sortField, sortOrder]);

  return {
    documents: sortedDocuments,
    stats,
    isProcessing,
    isExporting,
    lastExport,
    error,
    successMessage,
    sortField,
    sortOrder,
    setSorting,
    addFiles,
    removeDocument,
    clearAll,
    organizeFiles,
    toggleApproval,
    approveAll,
    unapproveAll,
    startEditing,
    saveEdits,
    cancelEditing,
    exportDocuments,
    downloadLastExport,
    dismissError,
    dismissSuccess,
  };
}
