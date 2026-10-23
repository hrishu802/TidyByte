import { describe, it, expect, beforeEach } from 'vitest';
import JSZip from 'jszip';
import {
  generateExportZip,
  formatLocalTimestamp,
  generateExportFilename,
  resetSessionExportTracker,
} from './exportZip';
import type { TidyDocument } from '../types';

describe('exportZip - Timestamped naming and collision safety', () => {
  beforeEach(() => {
    resetSessionExportTracker();
  });

  describe('formatLocalTimestamp', () => {
    it('formats date into local YYYY-MM-DD_HH-mm-ss format with 2-digit zero padding', () => {
      // Create a known local date: 2026-03-05 07:09:04
      const d = new Date(2026, 2, 5, 7, 9, 4);
      const formatted = formatLocalTimestamp(d);
      expect(formatted).toBe('2026-03-05_07-09-04');
    });

    it('correctly uses the local timezone hours, minutes, and seconds', () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const expected = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_` +
        `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      expect(formatLocalTimestamp(now)).toBe(expected);
    });
  });

  describe('generateExportFilename', () => {
    it('generates filename matching TidyByte_Organized_YYYY-MM-DD_HH-mm-ss.zip', () => {
      const testDate = new Date(2026, 9, 24, 14, 30, 45); // Oct 24, 2026 14:30:45
      const { filename, folderConvention } = generateExportFilename(testDate);
      expect(filename).toBe('TidyByte_Organized_2026-10-24_14-30-45.zip');
      expect(folderConvention).toBe('TidyByte_Organized_2026-10-24_14-30-45');
    });

    it('makes exports within different seconds distinguishable', () => {
      const time1 = new Date(2026, 9, 24, 10, 15, 20);
      const time2 = new Date(2026, 9, 24, 10, 15, 21);

      const export1 = generateExportFilename(time1);
      const export2 = generateExportFilename(time2);

      expect(export1.filename).toBe('TidyByte_Organized_2026-10-24_10-15-20.zip');
      expect(export2.filename).toBe('TidyByte_Organized_2026-10-24_10-15-21.zip');
      expect(export1.filename).not.toBe(export2.filename);
    });

    it('guarantees unique filenames using collision-safe suffix when exports occur in the exact same second', () => {
      const sameSecond = new Date(2026, 9, 24, 12, 0, 0);

      const first = generateExportFilename(sameSecond);
      const second = generateExportFilename(sameSecond);
      const third = generateExportFilename(sameSecond);

      expect(first.filename).toBe('TidyByte_Organized_2026-10-24_12-00-00.zip');
      expect(second.filename).toBe('TidyByte_Organized_2026-10-24_12-00-00_1.zip');
      expect(third.filename).toBe('TidyByte_Organized_2026-10-24_12-00-00_2.zip');

      // Ensure all 3 filenames are completely distinct and can coexist in Downloads folder
      const allNames = new Set([first.filename, second.filename, third.filename]);
      expect(allNames.size).toBe(3);
    });
  });

  describe('generateExportZip end-to-end package generation', () => {
    it('generates ZIP with timestamped filename and matches README.txt metadata', async () => {
      const file = new File(['Invoice contents'], 'bill.pdf', { type: 'application/pdf', lastModified: 100 });
      const doc: TidyDocument = {
        id: 'doc-1',
        fingerprint: 'bill.pdf:16:100',
        createdAt: 100,
        file,
        originalName: 'bill.pdf',
        mimeType: 'application/pdf',
        size: file.size,
        status: 'completed',
        suggestedName: 'Monthly Bill',
        suggestedCategory: 'invoice',
        approved: true,
        isEditing: false,
      };

      const exportDate = new Date(2026, 9, 24, 16, 20, 10);
      const result = await generateExportZip([doc], exportDate);

      expect(result.filename).toBe('TidyByte_Organized_2026-10-24_16-20-10.zip');
      expect(result.folderConvention).toBe('TidyByte_Organized_2026-10-24_16-20-10');

      const zip = await JSZip.loadAsync(result.zipBlob);
      const readme = await zip.file('README.txt')!.async('string');

      expect(readme).toContain('Archive Filename:   TidyByte_Organized_2026-10-24_16-20-10.zip');
      expect(readme).toContain('Folder Convention:  TidyByte_Organized_2026-10-24_16-20-10');
      expect(readme).toContain('Export Date (Local): 2026-10-24 16:20:10');
    });

    it('preserves distinct contents when two files share the exact same original filename', async () => {
      const contentA = 'Content of file A from Accounting';
      const contentB = 'Content of file B from Marketing';

      const fileA = new File([contentA], 'report.txt', { type: 'text/plain', lastModified: 1000 });
      const fileB = new File([contentB], 'report.txt', { type: 'text/plain', lastModified: 2000 });

      const docA: TidyDocument = {
        id: 'doc-a',
        fingerprint: 'report.txt:34:1000',
        createdAt: 1000,
        file: fileA,
        originalName: 'report.txt',
        mimeType: 'text/plain',
        size: fileA.size,
        status: 'completed',
        suggestedName: 'Financial Overview',
        suggestedCategory: 'invoice',
        approved: true,
        isEditing: false,
      };

      const docB: TidyDocument = {
        id: 'doc-b',
        fingerprint: 'report.txt:33:2000',
        createdAt: 2000,
        file: fileB,
        originalName: 'report.txt',
        mimeType: 'text/plain',
        size: fileB.size,
        status: 'completed',
        suggestedName: 'Campaign Summary',
        suggestedCategory: 'report',
        approved: true,
        isEditing: false,
      };

      const result = await generateExportZip([docA, docB]);
      expect(result.totalFiles).toBe(2);

      const zip = await JSZip.loadAsync(result.zipBlob);

      // Originals preserved and deduplicated
      const originalFile1 = zip.file('originals/report.txt');
      const originalFile2 = zip.file('originals/report (1).txt');
      expect(originalFile1).not.toBeNull();
      expect(originalFile2).not.toBeNull();
      expect(await originalFile1!.async('string')).toBe(contentA);
      expect(await originalFile2!.async('string')).toBe(contentB);

      // Organized folder preserved
      const organizedFileA = zip.file('organized/invoice/Financial Overview.txt');
      const organizedFileB = zip.file('organized/report/Campaign Summary.txt');
      expect(organizedFileA).not.toBeNull();
      expect(organizedFileB).not.toBeNull();
    });

    it('resolves collisions when two files end up with the same suggested name in the same category', async () => {
      const file1 = new File(['Invoice 1 data'], 'inv1.pdf', { type: 'application/pdf', lastModified: 100 });
      const file2 = new File(['Invoice 2 data'], 'inv2.pdf', { type: 'application/pdf', lastModified: 200 });

      const doc1: TidyDocument = {
        id: 'inv-1',
        fingerprint: 'inv1.pdf:14:100',
        createdAt: 100,
        file: file1,
        originalName: 'inv1.pdf',
        mimeType: 'application/pdf',
        size: file1.size,
        status: 'completed',
        suggestedName: 'Monthly Invoice',
        suggestedCategory: 'invoice',
        approved: true,
        isEditing: false,
      };

      const doc2: TidyDocument = {
        id: 'inv-2',
        fingerprint: 'inv2.pdf:14:200',
        createdAt: 200,
        file: file2,
        originalName: 'inv2.pdf',
        mimeType: 'application/pdf',
        size: file2.size,
        status: 'completed',
        suggestedName: 'Monthly Invoice',
        suggestedCategory: 'invoice',
        approved: true,
        isEditing: false,
      };

      const result = await generateExportZip([doc1, doc2]);
      const zip = await JSZip.loadAsync(result.zipBlob);

      const fileA = zip.file('organized/invoice/Monthly Invoice.pdf');
      const fileB = zip.file('organized/invoice/Monthly Invoice (1).pdf');

      expect(fileA).not.toBeNull();
      expect(fileB).not.toBeNull();
      expect(await fileA!.async('string')).toBe('Invoice 1 data');
      expect(await fileB!.async('string')).toBe('Invoice 2 data');
    });

    it('safely packages a 32.1 MB Computer Networks PDF into the ZIP without memory or corruption issues', async () => {
      const size32_1MB = Math.round(32.1 * 1024 * 1024);
      const file = new File(['%PDF-1.4 header and mock binary stream'], 'Computer_Networks.pdf', {
        type: 'application/pdf',
        lastModified: 1700000000000,
      });
      Object.defineProperty(file, 'size', { value: size32_1MB });

      const doc: TidyDocument = {
        id: 'cn-doc-1',
        fingerprint: `Computer_Networks.pdf:${size32_1MB}:1700000000000`,
        createdAt: 1700000000000,
        file,
        originalName: 'Computer_Networks.pdf',
        mimeType: 'application/pdf',
        size: size32_1MB,
        status: 'completed',
        suggestedName: 'Computer Networks Textbook',
        suggestedCategory: 'manual',
        approved: true,
        isEditing: false,
      };

      const result = await generateExportZip([doc]);
      expect(result.totalFiles).toBe(1);

      const zip = await JSZip.loadAsync(result.zipBlob);
      const organizedFile = zip.file('organized/manual/Computer Networks Textbook.pdf');
      const originalFile = zip.file('originals/Computer_Networks.pdf');

      expect(organizedFile).not.toBeNull();
      expect(originalFile).not.toBeNull();

      const readme = await zip.file('README.txt')!.async('string');
      expect(readme).toContain('Computer_Networks.pdf (32.1 MB)');
      expect(readme).toContain('organized/manual/Computer Networks Textbook.pdf');
    });

    it('throws an error if no approved completed files exist', async () => {
      await expect(generateExportZip([])).rejects.toThrow('No approved documents');
    });
  });
});
