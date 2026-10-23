import { describe, it, expect } from 'vitest';
import {
  getFileFingerprint,
  validateFile,
  sanitizeFilename,
  deduplicateFilename,
  getFileExtension,
  getBaseName,
  formatFileSize,
  sortDocuments,
} from './fileUtils';
import type { TidyDocument } from '../types';

describe('fileUtils', () => {
  describe('getFileExtension & getBaseName', () => {
    it('correctly extracts extensions and base names', () => {
      expect(getFileExtension('report.pdf')).toBe('.pdf');
      expect(getFileExtension('NOTES.TXT')).toBe('.txt');
      expect(getFileExtension('archive.tar.gz')).toBe('.gz');
      expect(getFileExtension('noextension')).toBe('');

      expect(getBaseName('report.pdf')).toBe('report');
      expect(getBaseName('my.notes.txt')).toBe('my.notes');
      expect(getBaseName('plain')).toBe('plain');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes into readable strings', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });
  });

  describe('validateFile', () => {
    it('accepts valid txt and pdf files under 50 MB', () => {
      const validTxt = new File(['hello world'], 'notes.txt', { type: 'text/plain' });
      const validPdf = new File(['%PDF-1.4...'], 'document.pdf', { type: 'application/pdf' });

      expect(validateFile(validTxt).valid).toBe(true);
      expect(validateFile(validPdf).valid).toBe(true);
    });

    it('accepts a 32.1 MB Computer Networks PDF (below the 50 MB limit)', () => {
      const cnPdf = new File(['mock content'], 'Computer_Networks.pdf', { type: 'application/pdf' });
      const size32_1MB = Math.round(32.1 * 1024 * 1024);
      Object.defineProperty(cnPdf, 'size', { value: size32_1MB });

      const result = validateFile(cnPdf);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts a file exactly at the 50 MB limit (52,428,800 bytes)', () => {
      const boundaryPdf = new File(['boundary content'], 'large_document.pdf', { type: 'application/pdf' });
      const exact50MB = 50 * 1024 * 1024;
      Object.defineProperty(boundaryPdf, 'size', { value: exact50MB });

      const result = validateFile(boundaryPdf);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects unsupported file formats', () => {
      const exe = new File(['binary'], 'virus.exe', { type: 'application/octet-stream' });
      const img = new File(['image data'], 'photo.png', { type: 'image/png' });

      expect(validateFile(exe).valid).toBe(false);
      expect(validateFile(exe).error).toContain('Unsupported file type');
      expect(validateFile(img).valid).toBe(false);
    });

    it('rejects 0 byte empty files', () => {
      const empty = new File([], 'empty.txt', { type: 'text/plain' });
      const result = validateFile(empty);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('is empty');
    });

    it('rejects files slightly above the 50 MB limit (50 MB + 1 byte)', () => {
      const oversizedFile = new File(['test'], 'oversized.pdf', { type: 'application/pdf' });
      Object.defineProperty(oversizedFile, 'size', { value: 50 * 1024 * 1024 + 1 });

      const result = validateFile(oversizedFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds the 50 MB limit');
    });

    it('rejects files clearly exceeding 50 MB limit with a clear error message', () => {
      const hugeFile = new File(['test'], 'giant_course.pdf', { type: 'application/pdf' });
      Object.defineProperty(hugeFile, 'size', { value: 65 * 1024 * 1024 });

      const result = validateFile(hugeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds the 50 MB limit (65.0 MB)');
    });
  });

  describe('getFileFingerprint', () => {
    it('creates stable fingerprint combining name, size, and lastModified', () => {
      const file1 = new File(['abc'], 'file.txt', { lastModified: 1600000000000 });
      const file2 = new File(['abc'], 'file.txt', { lastModified: 1600000000000 });
      const file3 = new File(['different content'], 'file.txt', { lastModified: 1600000000000 });
      const file4 = new File(['abc'], 'file.txt', { lastModified: 1700000000000 });

      expect(getFileFingerprint(file1)).toBe(getFileFingerprint(file2));
      expect(getFileFingerprint(file1)).not.toBe(getFileFingerprint(file3));
      expect(getFileFingerprint(file1)).not.toBe(getFileFingerprint(file4));
    });
  });

  describe('sanitizeFilename', () => {
    it('removes illegal filesystem and path traversal characters', () => {
      expect(sanitizeFilename('../../../etc/passwd')).not.toContain('/');
      expect(sanitizeFilename('my:super*illegal?name.txt')).toBe('my_super_illegal_name.txt');
      expect(sanitizeFilename('   spaces_and_dots...   ')).toBe('spaces_and_dots');
      expect(sanitizeFilename('')).toBe('untitled');
    });
  });

  describe('deduplicateFilename', () => {
    it('appends incrementing counter to avoid name collisions', () => {
      const used = new Set(['invoice.pdf', 'invoice (1).pdf']);
      const result1 = deduplicateFilename('invoice.pdf', used);
      expect(result1).toBe('invoice (2).pdf');

      used.add(result1);
      const result2 = deduplicateFilename('invoice.pdf', used);
      expect(result2).toBe('invoice (3).pdf');
    });

    it('returns original name when no collision exists', () => {
      const used = new Set(['different.txt']);
      expect(deduplicateFilename('unique.txt', used)).toBe('unique.txt');
    });
  });

  describe('sortDocuments', () => {
    const mockDocs: TidyDocument[] = [
      {
        id: '1',
        fingerprint: '1',
        createdAt: 100,
        file: new File([], 'b.txt'),
        originalName: 'b.txt',
        mimeType: 'text/plain',
        size: 500,
        status: 'pending',
        approved: false,
        isEditing: false,
        suggestedCategory: 'report',
      },
      {
        id: '2',
        fingerprint: '2',
        createdAt: 200,
        file: new File([], 'a.txt'),
        originalName: 'a.txt',
        mimeType: 'text/plain',
        size: 100,
        status: 'completed',
        approved: true,
        isEditing: false,
        suggestedCategory: 'invoice',
      },
    ];

    it('sorts by name ascending and descending', () => {
      const asc = sortDocuments(mockDocs, 'name', 'asc');
      expect(asc[0].originalName).toBe('a.txt');
      expect(asc[1].originalName).toBe('b.txt');

      const desc = sortDocuments(mockDocs, 'name', 'desc');
      expect(desc[0].originalName).toBe('b.txt');
      expect(desc[1].originalName).toBe('a.txt');
    });

    it('sorts by size', () => {
      const asc = sortDocuments(mockDocs, 'size', 'asc');
      expect(asc[0].size).toBe(100);
      expect(asc[1].size).toBe(500);
    });
  });
});
