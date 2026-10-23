import { useState } from 'react';
import {
  FileText,
  FileType,
  Check,
  X,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  Clock3,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import type { TidyDocument, DocumentCategory } from '../types';
import { ALL_CATEGORIES, CATEGORY_META } from '../types';
import { formatFileSize, getFileExtension } from '../utils/fileUtils';

interface DocumentRowProps {
  doc: TidyDocument;
  onToggleApproval: (id: string) => void;
  onStartEditing: (id: string) => void;
  onSaveEdits: (id: string, name: string, category: DocumentCategory) => void;
  onCancelEditing: (id: string) => void;
  onRemove: (id: string) => void;
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') {
    return (
      <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center shrink-0 text-rose-700 shadow-2xs">
        <FileType className="w-5 h-5" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-forest/5 border border-forest/10 flex items-center justify-center shrink-0 text-forest shadow-2xs">
      <FileText className="w-5 h-5" />
    </div>
  );
}

function StatusIndicator({ status, errorMessage }: { status: string; errorMessage?: string }) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
          <Clock3 className="w-3 h-3 text-amber-600" />
          Pending
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-mint/30 text-forest border border-mint animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin text-forest" />
          Analyzing…
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
          <Check className="w-3 h-3 text-emerald-600" />
          Organized
        </span>
      );
    case 'error':
      return (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200"
          title={errorMessage || 'Processing error'}
        >
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Failed
        </span>
      );
    default:
      return null;
  }
}

function CategoryPill({ category }: { category: DocumentCategory }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.uncategorized;
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${meta.color} ${meta.border}`}
    >
      {meta.label}
    </span>
  );
}

interface InlineEditorProps {
  doc: TidyDocument;
  onSave: (id: string, name: string, category: DocumentCategory) => void;
  onCancel: (id: string) => void;
}

function InlineEditor({ doc, onSave, onCancel }: InlineEditorProps) {
  const ext = getFileExtension(doc.originalName);
  const initialName = doc.editedName ?? doc.suggestedName ?? doc.originalName;
  const initialCat = doc.editedCategory ?? doc.suggestedCategory ?? 'uncategorized';

  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<DocumentCategory>(initialCat);

  return (
    <div className="bg-white rounded-xl border-2 border-mint-dark/50 p-3.5 sm:p-4.5 shadow-sm space-y-3.5 animate-fade-in">
      <div className="flex items-center justify-between pb-2 border-b border-ivory-dark/40">
        <div className="flex items-center gap-2">
          <Pencil className="w-3.5 h-3.5 text-forest" />
          <span className="text-xs font-semibold text-forest uppercase tracking-wider">
            Edit Organization Details
          </span>
        </div>
        <span className="text-xs text-forest-muted/60 truncate max-w-[200px]">
          Original: {doc.originalName}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Filename input */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-forest-muted">
            Suggested Filename (without extension)
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter filename..."
              className="flex-1 px-3 py-2 text-sm bg-ivory/60 border border-ivory-dark rounded-lg focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest text-forest min-h-[42px]"
              autoFocus
            />
            <span className="px-2 py-2 rounded-lg bg-ivory-warm text-xs font-mono text-forest-muted border border-ivory-dark/60 shrink-0">
              {ext}
            </span>
          </div>
        </div>

        {/* Category selector */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-forest-muted">
            Category Folder
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            className="w-full px-3 py-2 text-sm bg-ivory/60 border border-ivory-dark rounded-lg focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest text-forest min-h-[42px]"
          >
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_META[cat].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => onCancel(doc.id)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg text-forest-muted hover:text-forest hover:bg-ivory-warm transition-colors min-h-[40px]"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(doc.id, name, category)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-forest text-ivory hover:bg-forest-light transition-colors shadow-xs min-h-[40px]"
        >
          <Check className="w-3.5 h-3.5 text-mint" />
          Apply Changes
        </button>
      </div>
    </div>
  );
}

export function DocumentRow({
  doc,
  onToggleApproval,
  onStartEditing,
  onSaveEdits,
  onCancelEditing,
  onRemove,
}: DocumentRowProps) {
  const ext = getFileExtension(doc.originalName);
  const currentSuggested = doc.editedName ?? doc.suggestedName ?? doc.originalName;
  const currentCategory = doc.editedCategory ?? doc.suggestedCategory ?? 'uncategorized';

  const isCompleted = doc.status === 'completed';
  const hasEdits = doc.editedName !== undefined || doc.editedCategory !== undefined;

  // Inline editing card
  if (doc.isEditing) {
    return (
      <InlineEditor
        doc={doc}
        onSave={onSaveEdits}
        onCancel={onCancelEditing}
      />
    );
  }

  return (
    <article
      className={`
        rounded-xl border transition-all duration-150 relative bg-white/95 group
        ${doc.approved
          ? 'border-mint-dark/60 bg-mint/5 ring-1 ring-mint/40 shadow-xs'
          : 'border-ivory-dark/60 hover:border-ivory-dark hover:shadow-xs'
        }
      `}
    >
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-start gap-3">
        {/* Left top row on mobile: Checkbox + Icon + Status */}
        <div className="flex items-center sm:items-start gap-2.5 shrink-0">
          {/* Approval checkbox */}
          {isCompleted ? (
            <button
              type="button"
              onClick={() => onToggleApproval(doc.id)}
              className={`
                w-6 h-6 sm:w-5 sm:h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0
                ${doc.approved
                  ? 'bg-forest border-forest text-mint shadow-xs'
                  : 'border-stone-300 hover:border-forest bg-white'
                }
              `}
              aria-label={doc.approved ? `Approved. Click to unapprove ${doc.originalName}` : `Click to approve ${doc.originalName}`}
            >
              {doc.approved && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          ) : (
            <div className="w-6 h-6 sm:w-5 sm:h-5 rounded-md border border-stone-200 bg-stone-50 shrink-0" />
          )}

          <FileTypeIcon mimeType={doc.mimeType} />

          {/* Mobile-only status & actions row */}
          <div className="sm:hidden ml-auto flex items-center gap-1.5">
            <StatusIndicator status={doc.status} errorMessage={doc.errorMessage} />
          </div>
        </div>

        {/* Main document metadata content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Filename header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {isCompleted ? (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-forest break-all sm:break-normal">
                      {currentSuggested}
                      <span className="font-mono text-xs text-forest-muted/60 ml-0.5">{ext}</span>
                    </p>
                    {hasEdits && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        Edited
                      </span>
                    )}
                  </div>
                  {currentSuggested !== doc.originalName && (
                    <div className="flex items-center gap-1 text-[11px] text-forest-muted/65 truncate">
                      <span className="italic">Original:</span>
                      <span className="truncate">{doc.originalName}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm font-medium text-forest truncate">
                  {doc.originalName}
                </p>
              )}
            </div>

            {/* Desktop status indicator */}
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <StatusIndicator status={doc.status} errorMessage={doc.errorMessage} />
            </div>
          </div>

          {/* Description line if completed */}
          {isCompleted && doc.suggestedDescription && (
            <p className="text-xs text-forest-muted/80 leading-relaxed line-clamp-2 sm:line-clamp-1 bg-ivory/50 px-2.5 py-1 rounded-md border border-ivory-dark/30">
              {doc.suggestedDescription}
            </p>
          )}

          {/* Meta badges row */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-forest-muted/70">
            {isCompleted && (
              <CategoryPill category={currentCategory} />
            )}

            <span className="font-mono">{formatFileSize(doc.size)}</span>
            <span className="text-ivory-dark">•</span>
            <span className="uppercase font-semibold tracking-wider text-[10px]">
              {doc.mimeType === 'application/pdf' ? 'PDF' : 'Plain Text'}
            </span>

            {/* Confidence indicator */}
            {isCompleted && (
              <>
                <span className="text-ivory-dark">•</span>
                {doc.lowConfidence ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <HelpCircle className="w-3 h-3 text-amber-600" />
                    Filename heuristic
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Content analyzed
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Card actions: ALWAYS accessible on mobile, with hover elegance on desktop */}
        <div className="flex items-center gap-1 shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end sm:justify-start">
          {isCompleted && (
            <button
              type="button"
              onClick={() => onStartEditing(doc.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-ivory-warm/60 sm:bg-transparent hover:bg-ivory-warm text-forest-muted hover:text-forest transition-colors text-xs font-medium min-h-[36px]"
              aria-label={`Edit suggestion for ${doc.originalName}`}
              title="Edit suggestions"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="sm:hidden">Edit</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onRemove(doc.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50/60 sm:bg-transparent hover:bg-rose-50 text-rose-700 hover:text-rose-800 transition-colors text-xs font-medium min-h-[36px]"
            aria-label={`Remove ${doc.originalName}`}
            title="Remove from workspace"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="sm:hidden">Remove</span>
          </button>
        </div>
      </div>
    </article>
  );
}
