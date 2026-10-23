import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { TidyDocument } from '../types';
import { getFileExtension, sanitizeFilename, deduplicateFilename, formatFileSize } from '../utils/fileUtils';

export interface ExportResult {
  zipBlob: Blob;
  filename: string;
  folderConvention: string;
  totalFiles: number;
  organizedCount: number;
  originalsCount: number;
  manifest: Array<{
    originalName: string;
    storedOriginalName: string;
    organizedPath: string;
    category: string;
    size: number;
  }>;
}

/** In-memory set of exported filenames in current browser session to prevent overwrites */
const sessionExportFilenames = new Set<string>();

/**
 * Formats a Date object into user's local `YYYY-MM-DD_HH-mm-ss` string.
 * Uses local time methods (getFullYear, getMonth, getDate, getHours, getMinutes, getSeconds).
 */
export function formatLocalTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Generates a unique, collision-safe ZIP filename based on local date & time:
 * Format: `TidyByte_Organized_YYYY-MM-DD_HH-mm-ss.zip`
 * If two exports occur within the exact same second, appends a collision-safe `_1`, `_2` suffix.
 */
export function generateExportFilename(
  date: Date = new Date(),
  tracker: Set<string> = sessionExportFilenames
): { filename: string; folderConvention: string } {
  const timestamp = formatLocalTimestamp(date);
  const base = `TidyByte_Organized_${timestamp}`;
  const defaultFilename = `${base}.zip`;

  if (!tracker.has(defaultFilename)) {
    tracker.add(defaultFilename);
    return { filename: defaultFilename, folderConvention: base };
  }

  let counter = 1;
  while (tracker.has(`${base}_${counter}.zip`)) {
    counter++;
  }
  const uniqueFilename = `${base}_${counter}.zip`;
  const uniqueFolder = `${base}_${counter}`;
  tracker.add(uniqueFilename);

  return { filename: uniqueFilename, folderConvention: uniqueFolder };
}

/** Reset session filename tracker (primarily for testing) */
export function resetSessionExportTracker(): void {
  sessionExportFilenames.clear();
}

/**
 * Builds the export ZIP package with deterministic collision resolution,
 * timestamped naming, and detailed manifest metadata.
 */
export async function generateExportZip(
  approvedDocs: TidyDocument[],
  exportDate: Date = new Date(),
  tracker?: Set<string>
): Promise<ExportResult> {
  if (approvedDocs.length === 0) {
    throw new Error('No approved documents available for export.');
  }

  const { filename, folderConvention } = generateExportFilename(exportDate, tracker);

  const zip = new JSZip();
  const organizedFolder = zip.folder('organized');
  const originalsFolder = zip.folder('originals');

  if (!organizedFolder || !originalsFolder) {
    throw new Error('Failed to initialize ZIP folder hierarchy.');
  }

  // Collision tracking structures
  const usedNamesPerCategory = new Map<string, Set<string>>();
  const usedOriginalNames = new Set<string>();

  const manifest: ExportResult['manifest'] = [];

  for (const doc of approvedDocs) {
    const category = (doc.editedCategory ?? doc.suggestedCategory ?? 'uncategorized').toLowerCase();
    const rawSuggestedBase = (doc.editedName ?? doc.suggestedName ?? doc.originalName).trim();
    const sanitizedBase = sanitizeFilename(rawSuggestedBase);
    const ext = getFileExtension(doc.originalName);
    const suggestedFull = `${sanitizedBase}${ext}`;

    // 1. Resolve collision in category folder
    if (!usedNamesPerCategory.has(category)) {
      usedNamesPerCategory.set(category, new Set());
    }
    const categoryNames = usedNamesPerCategory.get(category)!;
    const dedupedOrganizedName = deduplicateFilename(suggestedFull, categoryNames);
    categoryNames.add(dedupedOrganizedName);

    const targetCategoryFolder = organizedFolder.folder(category)!;
    targetCategoryFolder.file(dedupedOrganizedName, doc.file);

    // 2. Resolve collision in originals folder
    const dedupedOriginalName = deduplicateFilename(doc.originalName, usedOriginalNames);
    usedOriginalNames.add(dedupedOriginalName);
    originalsFolder.file(dedupedOriginalName, doc.file);

    const organizedPath = `organized/${category}/${dedupedOrganizedName}`;

    manifest.push({
      originalName: doc.originalName,
      storedOriginalName: dedupedOriginalName,
      organizedPath,
      category,
      size: doc.size,
    });
  }

  // 3. Category count summary
  const categoryCounts: Record<string, number> = {};
  for (const item of manifest) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }

  const categoryLines = Object.entries(categoryCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cat, count]) => `  • ${cat}: ${count} file${count === 1 ? '' : 's'}`)
    .join('\n');

  // 4. Detailed file manifest table
  const manifestRows = manifest
    .map(
      (m, i) =>
        `${String(i + 1).padStart(2, ' ')}. [Original] ${m.storedOriginalName} (${formatFileSize(m.size)})\n` +
        `    └──> [Organized] ${m.organizedPath} (Category: ${m.category})`,
    )
    .join('\n\n');

  // 5. Formatted README with local export time and archive convention
  const pad = (n: number) => String(n).padStart(2, '0');
  const localFormattedDate = `${exportDate.getFullYear()}-${pad(exportDate.getMonth() + 1)}-${pad(exportDate.getDate())} ` +
    `${pad(exportDate.getHours())}:${pad(exportDate.getMinutes())}:${pad(exportDate.getSeconds())}`;

  const readmeContent = [
    '================================================================================',
    '                          TIDYBYTE EXPORT ARCHIVE                               ',
    '                       "Less clutter. More clarity."                            ',
    '================================================================================',
    '',
    `Archive Filename:   ${filename}`,
    `Folder Convention:  ${folderConvention}`,
    `Export Date (Local): ${localFormattedDate}`,
    `Export Date (UTC):   ${exportDate.toISOString()}`,
    `Total Files Exported: ${manifest.length}`,
    '',
    'FOLDER STRUCTURE OVERVIEW:',
    '--------------------------------------------------------------------------------',
    '• organized/   : Cleanly sorted into category subdirectories with suggested names',
    '• originals/   : Exact, pristine copies of all uploaded files (never overwritten)',
    '',
    'CATEGORY BREAKDOWN:',
    '--------------------------------------------------------------------------------',
    categoryLines,
    '',
    'FILE MANIFEST & RENAMING MAPPING:',
    '--------------------------------------------------------------------------------',
    manifestRows,
    '',
    'IMPORTANT NOTICE & DISCLAIMER:',
    '--------------------------------------------------------------------------------',
    'This archive was organized using TidyByte Frontend MVP (Demo Mode).',
    'Suggestions were generated deterministically based on filename cues and keyword',
    'rules without external AI inference or remote data transmission.',
    '',
    'Hacktoberfest 2026 — Week 3 "Slow and Steady"',
    '================================================================================',
  ].join('\n');

  zip.file('README.txt', readmeContent);

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return {
    zipBlob,
    filename,
    folderConvention,
    totalFiles: manifest.length,
    organizedCount: manifest.length,
    originalsCount: manifest.length,
    manifest,
  };
}

/**
 * High-level export trigger that generates the ZIP at export time
 * and saves it with descriptive timestamped filename.
 */
export async function exportAsZip(
  documents: TidyDocument[],
  exportDate: Date = new Date()
): Promise<{ filename: string; zipBlob: Blob; folderConvention: string }> {
  const approved = documents.filter((d) => d.approved && d.status === 'completed');
  if (approved.length === 0) {
    throw new Error('No approved documents to export.');
  }

  const result = await generateExportZip(approved, exportDate);
  saveAs(result.zipBlob, result.filename);
  return {
    filename: result.filename,
    zipBlob: result.zipBlob,
    folderConvention: result.folderConvention,
  };
}
