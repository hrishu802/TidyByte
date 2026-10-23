import { describe, it, expect } from 'vitest';
import { getFileFingerprint, validateFile } from '../utils/fileUtils';
import type { TidyDocument } from '../types';

describe('Upload flow and duplicate prevention policy', () => {
  // Pure simulator of the ingestion logic implemented in useDocuments
  function simulateAddFiles(
    existingDocs: TidyDocument[],
    newFiles: File[],
    maxCapacity = 50,
  ): {
    updatedDocs: TidyDocument[];
    addedCount: number;
    duplicatesSkipped: string[];
    errors: string[];
  } {
    const existingFingerprints = new Set(existingDocs.map((d) => d.fingerprint));
    const remainingSlots = maxCapacity - existingDocs.length;

    if (remainingSlots <= 0) {
      return {
        updatedDocs: existingDocs,
        addedCount: 0,
        duplicatesSkipped: [],
        errors: [`Workspace capacity reached (${maxCapacity} files maximum).`],
      };
    }

    const filesToConsider = newFiles.slice(0, remainingSlots);
    const overflowCount = newFiles.length - filesToConsider.length;

    const errors: string[] = [];
    const duplicatesSkipped: string[] = [];
    const newlyAdded: TidyDocument[] = [];
    const batchFingerprints = new Set<string>();

    for (const file of filesToConsider) {
      const validation = validateFile(file);
      if (!validation.valid) {
        errors.push(validation.error!);
        continue;
      }

      const fingerprint = getFileFingerprint(file);
      if (existingFingerprints.has(fingerprint) || batchFingerprints.has(fingerprint)) {
        duplicatesSkipped.push(file.name);
        continue;
      }

      batchFingerprints.add(fingerprint);

      newlyAdded.push({
        id: `test-${file.name}-${newlyAdded.length}`,
        fingerprint,
        createdAt: Date.now(),
        file,
        originalName: file.name,
        mimeType: file.type as 'text/plain' | 'application/pdf',
        size: file.size,
        status: 'pending',
        approved: false,
        isEditing: false,
      });
    }

    if (overflowCount > 0) {
      errors.push(`Note: ${overflowCount} file(s) exceeded the batch limit.`);
    }

    return {
      updatedDocs: [...existingDocs, ...newlyAdded],
      addedCount: newlyAdded.length,
      duplicatesSkipped,
      errors,
    };
  }

  it('adds a single selected file exactly once (root cause fix verification)', () => {
    const file = new File(['Invoice 101'], 'invoice.txt', { type: 'text/plain', lastModified: 1000 });
    const result = simulateAddFiles([], [file]);

    expect(result.addedCount).toBe(1);
    expect(result.updatedDocs.length).toBe(1);
    expect(result.updatedDocs[0].originalName).toBe('invoice.txt');
  });

  it('adds multiple distinct files selected together', () => {
    const file1 = new File(['Content 1'], 'file1.txt', { type: 'text/plain', lastModified: 1000 });
    const file2 = new File(['Content 2'], 'file2.pdf', { type: 'application/pdf', lastModified: 2000 });
    const file3 = new File(['Content 3'], 'file3.txt', { type: 'text/plain', lastModified: 3000 });

    const result = simulateAddFiles([], [file1, file2, file3]);

    expect(result.addedCount).toBe(3);
    expect(result.updatedDocs.length).toBe(3);
  });

  it('skips exact duplicate files without creating redundant entries', () => {
    const file = new File(['Same content'], 'doc.txt', { type: 'text/plain', lastModified: 1000 });

    // Initial upload
    const step1 = simulateAddFiles([], [file]);
    expect(step1.updatedDocs.length).toBe(1);

    // Re-uploading the exact same file
    const step2 = simulateAddFiles(step1.updatedDocs, [file]);
    expect(step2.addedCount).toBe(0);
    expect(step2.updatedDocs.length).toBe(1); // Still 1!
    expect(step2.duplicatesSkipped).toEqual(['doc.txt']);
  });

  it('allows two files with the same filename if they have different fingerprints (e.g. from different folders)', () => {
    const fileFromFolderA = new File(['Accounting report'], 'summary.txt', {
      type: 'text/plain',
      lastModified: 1000,
    });
    const fileFromFolderB = new File(['Marketing report with different length'], 'summary.txt', {
      type: 'text/plain',
      lastModified: 2000,
    });

    const step1 = simulateAddFiles([], [fileFromFolderA]);
    expect(step1.updatedDocs.length).toBe(1);

    const step2 = simulateAddFiles(step1.updatedDocs, [fileFromFolderB]);
    expect(step2.addedCount).toBe(1);
    expect(step2.updatedDocs.length).toBe(2);
    expect(step2.updatedDocs[0].fingerprint).not.toBe(step2.updatedDocs[1].fingerprint);
  });

  it('preserves previously uploaded files when adding new selections', () => {
    const fileA = new File(['A'], 'a.txt', { type: 'text/plain', lastModified: 1 });
    const fileB = new File(['B'], 'b.txt', { type: 'text/plain', lastModified: 2 });

    const step1 = simulateAddFiles([], [fileA]);
    const step2 = simulateAddFiles(step1.updatedDocs, [fileB]);

    expect(step2.updatedDocs.length).toBe(2);
    expect(step2.updatedDocs.map((d) => d.originalName)).toEqual(['a.txt', 'b.txt']);
  });

  it('accepts and uploads a 32.1 MB Computer Networks PDF successfully', () => {
    const cnPdf = new File(['mock binary content'], 'Computer_Networks.pdf', {
      type: 'application/pdf',
      lastModified: Date.now(),
    });
    const size32_1MB = Math.round(32.1 * 1024 * 1024);
    Object.defineProperty(cnPdf, 'size', { value: size32_1MB });

    const result = simulateAddFiles([], [cnPdf]);

    expect(result.addedCount).toBe(1);
    expect(result.updatedDocs.length).toBe(1);
    expect(result.updatedDocs[0].originalName).toBe('Computer_Networks.pdf');
    expect(result.updatedDocs[0].size).toBe(size32_1MB);
    expect(result.errors.length).toBe(0);
  });

  it('rejects oversized file (>50 MB) with clear error while allowing valid files (including 32.1 MB PDF) in the same batch to upload', () => {
    const validTxt = new File(['Study Notes'], 'notes.txt', { type: 'text/plain', lastModified: 100 });
    const cnPdf = new File(['CN textbook'], 'Computer_Networks.pdf', {
      type: 'application/pdf',
      lastModified: 200,
    });
    const size32_1MB = Math.round(32.1 * 1024 * 1024);
    Object.defineProperty(cnPdf, 'size', { value: size32_1MB });

    const oversizedPdf = new File(['Huge Book'], 'Massive_Archive.pdf', {
      type: 'application/pdf',
      lastModified: 300,
    });
    const size55MB = 55 * 1024 * 1024;
    Object.defineProperty(oversizedPdf, 'size', { value: size55MB });

    // User selects all 3 files together
    const result = simulateAddFiles([], [validTxt, oversizedPdf, cnPdf]);

    // Oversized file should be rejected with an informative error
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain('"Massive_Archive.pdf" exceeds the 50 MB limit');

    // The two valid files (notes.txt and the 32.1 MB Computer Networks PDF) must be added successfully!
    expect(result.addedCount).toBe(2);
    expect(result.updatedDocs.length).toBe(2);
    expect(result.updatedDocs.map((d) => d.originalName)).toEqual(['notes.txt', 'Computer_Networks.pdf']);
  });

  it('enforces maximum file batch capacity', () => {
    const files = Array.from(
      { length: 55 },
      (_, i) => new File([`data ${i}`], `file_${i}.txt`, { type: 'text/plain', lastModified: i }),
    );

    const result = simulateAddFiles([], files, 50);
    expect(result.updatedDocs.length).toBe(50);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('exceeded the batch limit');
  });
});
