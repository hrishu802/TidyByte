import type { TidyDocument, DocumentCategory } from '../types';
import { getBaseName, readTextFile, sanitizeFilename } from '../utils/fileUtils';

/**
 * DEMO ORGANIZER
 *
 * This module generates DETERMINISTIC demo suggestions for document organization.
 * It uses filename patterns and text content (when available) to produce plausible
 * suggestions. These are clearly labelled as demo results throughout the UI.
 *
 * A real AI inference engine will replace this module in a later milestone.
 */

/** Keyword-to-category mapping for demo classification */
const KEYWORD_CATEGORIES: Array<{ keywords: string[]; category: DocumentCategory }> = [
  { keywords: ['invoice', 'billing', 'payment', 'amount due', 'total due'], category: 'invoice' },
  { keywords: ['receipt', 'transaction', 'purchase', 'order confirmation'], category: 'receipt' },
  { keywords: ['contract', 'agreement', 'terms and conditions', 'hereby', 'parties'], category: 'contract' },
  { keywords: ['report', 'analysis', 'findings', 'summary', 'quarterly', 'annual'], category: 'report' },
  { keywords: ['meeting', 'notes', 'minutes', 'agenda', 'action items', 'todo'], category: 'notes' },
  { keywords: ['letter', 'dear', 'sincerely', 'regards', 'to whom'], category: 'letter' },
  { keywords: ['manual', 'guide', 'instructions', 'how to', 'tutorial', 'documentation'], category: 'manual' },
  { keywords: ['slide', 'presentation', 'deck'], category: 'presentation' },
  { keywords: ['spreadsheet', 'data', 'table', 'column', 'row'], category: 'spreadsheet' },
];

/** Classify text or filename into a category */
function classifyContent(text: string): DocumentCategory {
  const lower = text.toLowerCase();
  for (const { keywords, category } of KEYWORD_CATEGORIES) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return 'uncategorized';
}

/** Generate a cleaner suggested filename from the original */
function suggestName(originalName: string, category: DocumentCategory, content?: string): string {
  const base = getBaseName(originalName);

  // Clean up common patterns
  let cleaned = base
    .replace(/[-_]+/g, ' ')              // dashes/underscores → spaces
    .replace(/\b(copy|final|v\d+|draft)\b/gi, '') // remove filler words
    .replace(/\(\d+\)/g, '')             // remove (1), (2) suffixes
    .replace(/\s{2,}/g, ' ')             // collapse spaces
    .trim();

  // If the name is very short or just numbers, try to use category + first words of content
  if (cleaned.length < 3 || /^\d+$/.test(cleaned)) {
    if (content && content.trim().length > 0) {
      const firstLine = content.trim().split('\n')[0].slice(0, 60).trim();
      const words = firstLine.split(/\s+/).slice(0, 5).join(' ');
      cleaned = words || `${category} document`;
    } else {
      cleaned = `${category} document`;
    }
  }

  // Title case
  cleaned = cleaned
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return sanitizeFilename(cleaned);
}

/** Generate a short description */
function suggestDescription(
  originalName: string,
  category: DocumentCategory,
  content?: string,
): string {
  if (content && content.trim().length > 20) {
    const firstLine = content.trim().split('\n')[0].slice(0, 120).trim();
    return `${firstLine}${content.length > 120 ? '…' : ''}`;
  }
  return `${category.charAt(0).toUpperCase() + category.slice(1)} file originally named "${originalName}".`;
}

/** Simulate processing delay for demo realism */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process a single document with demo logic.
 * Returns the updated document with suggestions filled in.
 */
export async function processDocument(doc: TidyDocument): Promise<Partial<TidyDocument>> {
  // Simulate some processing time (200-800ms per file)
  await delay(200 + Math.random() * 600);

  let textContent: string | undefined;
  let lowConfidence = false;

  // Try to read text content for .txt files
  if (doc.mimeType === 'text/plain') {
    try {
      textContent = await readTextFile(doc.file);
    } catch {
      lowConfidence = true;
    }
  } else {
    // PDF: we can't read content in the browser without a PDF library
    // Mark as low confidence
    lowConfidence = true;
  }

  const combinedText = [doc.originalName, textContent ?? ''].join(' ');
  const category = classifyContent(combinedText);
  const name = suggestName(doc.originalName, category, textContent);
  const description = suggestDescription(doc.originalName, category, textContent);

  return {
    status: 'completed',
    textContent: textContent?.slice(0, 500), // Store only a preview
    suggestedName: name,
    suggestedCategory: category,
    suggestedDescription: description,
    lowConfidence,
  };
}

/**
 * Process all pending documents in a batch.
 * Calls onUpdate for each document as it completes.
 */
export async function processDocuments(
  docs: TidyDocument[],
  onUpdate: (id: string, updates: Partial<TidyDocument>) => void,
): Promise<void> {
  const pending = docs.filter((d) => d.status === 'pending' || d.status === 'error');

  for (const doc of pending) {
    onUpdate(doc.id, { status: 'processing' });
    try {
      const updates = await processDocument(doc);
      onUpdate(doc.id, updates);
    } catch {
      onUpdate(doc.id, {
        status: 'error',
        errorMessage: 'Demo processing failed unexpectedly.',
      });
    }
  }
}
