import type { SupportedFileType, TidyDocument, SortField, SortOrder } from '../types';
import { SUPPORTED_TYPES, MAX_FILE_SIZE } from '../types';

/** Generate a unique ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Generate a stable file fingerprint based on filename, size, and last modified date */
export function getFileFingerprint(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

/** Format bytes to human-readable string */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Get the file extension from a filename (with dot, in lowercase) */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : '';
}

/** Get the filename without extension */
export function getBaseName(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.slice(0, lastDot) : filename;
}

/** Validate whether a file is supported and within limits */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const ext = getFileExtension(file.name);
  if (!SUPPORTED_TYPES[ext]) {
    return {
      valid: false,
      error: `Unsupported file type "${ext || '(none)'}". Only .txt and .pdf files are accepted.`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `"${file.name}" exceeds the 50 MB limit (${formatFileSize(file.size)}).`,
    };
  }
  if (file.size === 0) {
    return {
      valid: false,
      error: `"${file.name}" is empty (0 bytes).`,
    };
  }
  return { valid: true };
}

/** Determine the SupportedFileType for a file */
export function getFileType(file: File): SupportedFileType | null {
  const ext = getFileExtension(file.name);
  return SUPPORTED_TYPES[ext] ?? null;
}

/** Read text content from a .txt file safely */
export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error(`Failed to read "${file.name}".`));
    // Read only first 12KB for demo suggestion purposes
    const slice = file.slice(0, 12288);
    reader.readAsText(slice);
  });
}

/** Sanitize a filename: remove reserved chars, path traversal sequences, and control codes */
export function sanitizeFilename(name: string): string {
  // Strip control chars (0-31 and 127) and illegal filesystem chars
  let cleaned = '';
  for (let i = 0; i < name.length; i++) {
    const code = name.charCodeAt(i);
    const char = name[i];
    if (code < 32 || code === 127 || '<>:"/\\|?*'.includes(char)) {
      cleaned += '_';
    } else {
      cleaned += char;
    }
  }

  return cleaned
    .replace(/_{2,}/g, '_')
    .replace(/^[.\s_]+|[.\s_]+$/g, '')
    .slice(0, 90)
    || 'untitled';
}

/** Deduplicate a filename within a set of existing names deterministically */
export function deduplicateFilename(name: string, existingNames: Set<string>): string {
  if (!existingNames.has(name)) return name;
  let counter = 1;
  const ext = getFileExtension(name);
  const base = getBaseName(name);
  let candidate: string;
  do {
    candidate = `${base} (${counter})${ext}`;
    counter++;
  } while (existingNames.has(candidate));
  return candidate;
}

/** Sort documents by various fields */
export function sortDocuments(
  docs: TidyDocument[],
  field: SortField,
  order: SortOrder,
): TidyDocument[] {
  const sorted = [...docs].sort((a, b) => {
    let comparison = 0;
    switch (field) {
      case 'name': {
        const nameA = (a.editedName ?? a.suggestedName ?? a.originalName).toLowerCase();
        const nameB = (b.editedName ?? b.suggestedName ?? b.originalName).toLowerCase();
        comparison = nameA.localeCompare(nameB);
        break;
      }
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'category': {
        const catA = a.editedCategory ?? a.suggestedCategory ?? 'uncategorized';
        const catB = b.editedCategory ?? b.suggestedCategory ?? 'uncategorized';
        comparison = catA.localeCompare(catB);
        break;
      }
      case 'date':
        comparison = a.createdAt - b.createdAt;
        break;
    }
    return order === 'asc' ? comparison : -comparison;
  });
  return sorted;
}
