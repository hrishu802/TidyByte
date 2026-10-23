/** Supported file types for upload */
export type SupportedFileType = 'text/plain' | 'application/pdf';

/** Processing status of a document */
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';

/** Category assigned to a document */
export type DocumentCategory =
  | 'report'
  | 'notes'
  | 'invoice'
  | 'letter'
  | 'manual'
  | 'contract'
  | 'receipt'
  | 'spreadsheet'
  | 'presentation'
  | 'uncategorized';

/** Category display metadata */
export interface CategoryMeta {
  label: string;
  color: string;
  border: string;
}

/** Map of categories to their display metadata matching our forest & ivory palette */
export const CATEGORY_META: Record<DocumentCategory, CategoryMeta> = {
  report:        { label: 'Report',        color: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-200' },
  notes:         { label: 'Notes',         color: 'bg-amber-50 text-amber-800', border: 'border-amber-200' },
  invoice:       { label: 'Invoice',       color: 'bg-teal-50 text-teal-800', border: 'border-teal-200' },
  letter:        { label: 'Letter',        color: 'bg-indigo-50 text-indigo-800', border: 'border-indigo-200' },
  manual:        { label: 'Manual',        color: 'bg-cyan-50 text-cyan-800', border: 'border-cyan-200' },
  contract:      { label: 'Contract',      color: 'bg-rose-50 text-rose-800', border: 'border-rose-200' },
  receipt:       { label: 'Receipt',       color: 'bg-orange-50 text-orange-800', border: 'border-orange-200' },
  spreadsheet:   { label: 'Spreadsheet',   color: 'bg-lime-50 text-lime-800', border: 'border-lime-200' },
  presentation:  { label: 'Presentation',  color: 'bg-purple-50 text-purple-800', border: 'border-purple-200' },
  uncategorized: { label: 'Uncategorized', color: 'bg-stone-100 text-stone-700', border: 'border-stone-200' },
};

/** All available categories */
export const ALL_CATEGORIES: DocumentCategory[] = Object.keys(CATEGORY_META) as DocumentCategory[];

/** Sort field options */
export type SortField = 'name' | 'size' | 'status' | 'category' | 'date';
export type SortOrder = 'asc' | 'desc';

/** A single uploaded document with its suggestion state */
export interface TidyDocument {
  /** Unique identifier */
  id: string;
  /** Stable file fingerprint based on name, size, and lastModified */
  fingerprint: string;
  /** Timestamp when file was added to workspace */
  createdAt: number;
  /** Original File object reference */
  file: File;
  /** Original filename */
  originalName: string;
  /** MIME type */
  mimeType: SupportedFileType;
  /** File size in bytes */
  size: number;
  /** Extracted text content (if available) */
  textContent?: string;
  /** Processing status */
  status: ProcessingStatus;
  /** Error message if status is 'error' */
  errorMessage?: string;
  /** Suggested new filename (without extension) */
  suggestedName?: string;
  /** Suggested category */
  suggestedCategory?: DocumentCategory;
  /** Short description of the document */
  suggestedDescription?: string;
  /** Whether the suggestion has low confidence (e.g. no text content) */
  lowConfidence?: boolean;
  /** User-edited filename (without extension) */
  editedName?: string;
  /** User-edited category */
  editedCategory?: DocumentCategory;
  /** Whether user has approved this document for export */
  approved: boolean;
  /** Whether user is currently editing this document */
  isEditing: boolean;
}

/** Statistics about the current document set */
export interface DocumentStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  errors: number;
  approved: number;
  totalSizeBytes: number;
}

/** Supported file extensions and their MIME types */
export const SUPPORTED_TYPES: Record<string, SupportedFileType> = {
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
};

/** Max file size: 50 MB */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Max number of files per batch */
export const MAX_FILES = 50;
