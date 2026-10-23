import { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  FileQuestion,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';
import type { TidyDocument, DocumentCategory, SortField, SortOrder } from '../types';
import { ALL_CATEGORIES, CATEGORY_META } from '../types';
import { DocumentRow } from './DocumentRow';

interface DocumentListProps {
  documents: TidyDocument[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSetSorting: (field: SortField, order?: SortOrder) => void;
  onToggleApproval: (id: string) => void;
  onApproveAll: () => void;
  onUnapproveAll: () => void;
  onStartEditing: (id: string) => void;
  onSaveEdits: (id: string, name: string, category: DocumentCategory) => void;
  onCancelEditing: (id: string) => void;
  onRemove: (id: string) => void;
}

type StatusFilter = 'all' | 'pending' | 'completed' | 'approved' | 'error';

export function DocumentList({
  documents,
  sortField,
  sortOrder,
  onSetSorting,
  onToggleApproval,
  onApproveAll,
  onUnapproveAll,
  onStartEditing,
  onSaveEdits,
  onCancelEditing,
  onRemove,
}: DocumentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    let filtered = documents;

    // 1. Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((d) => {
        const orig = d.originalName.toLowerCase();
        const suggested = (d.suggestedName ?? '').toLowerCase();
        const edited = (d.editedName ?? '').toLowerCase();
        const desc = (d.suggestedDescription ?? '').toLowerCase();
        const cat = (d.editedCategory ?? d.suggestedCategory ?? '').toLowerCase();
        return orig.includes(q) || suggested.includes(q) || edited.includes(q) || desc.includes(q) || cat.includes(q);
      });
    }

    // 2. Status filter
    switch (statusFilter) {
      case 'pending':
        filtered = filtered.filter((d) => d.status === 'pending');
        break;
      case 'completed':
        filtered = filtered.filter((d) => d.status === 'completed');
        break;
      case 'approved':
        filtered = filtered.filter((d) => d.approved);
        break;
      case 'error':
        filtered = filtered.filter((d) => d.status === 'error');
        break;
    }

    // 3. Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(
        (d) => (d.editedCategory ?? d.suggestedCategory ?? 'uncategorized') === categoryFilter,
      );
    }

    return filtered;
  }, [documents, searchQuery, statusFilter, categoryFilter]);

  // Available categories in the current workspace
  const activeCategories = useMemo(() => {
    const cats = new Set<DocumentCategory>();
    documents.forEach((d) => {
      const cat = d.editedCategory ?? d.suggestedCategory;
      if (cat) cats.add(cat);
    });
    return ALL_CATEGORIES.filter((c) => cats.has(c));
  }, [documents]);

  const hasActiveFilters =
    statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery.trim() !== '';

  const completedCount = documents.filter((d) => d.status === 'completed').length;
  const approvedCount = documents.filter((d) => d.approved).length;

  if (documents.length === 0) return null;

  return (
    <section aria-label="Documents workspace" className="space-y-3 sm:space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white/95 p-3 sm:p-4 rounded-2xl border border-ivory-dark/60 shadow-xs space-y-3">
        {/* Top bar: Search Input + Toggle Filter button + Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-muted/50 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename, category, or description..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-ivory/60 border border-ivory-dark/70 rounded-xl focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest text-forest placeholder:text-forest-muted/40 transition-colors min-h-[42px]"
              aria-label="Search documents"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-forest-muted hover:text-forest hover:bg-ivory-warm"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`
                inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border rounded-xl transition-colors min-h-[42px]
                ${showAdvancedFilters || hasActiveFilters
                  ? 'bg-forest text-ivory border-forest shadow-xs'
                  : 'bg-white text-forest-muted border-ivory-dark/70 hover:border-forest-muted hover:bg-ivory-warm/40'
                }
              `}
              aria-label="Filter documents"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-mint ml-0.5" />
              )}
            </button>

            {/* Sort selector */}
            <div className="relative">
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [f, o] = e.target.value.split('-') as [SortField, SortOrder];
                  onSetSorting(f, o);
                }}
                className="px-3 py-2 pr-7 text-xs sm:text-sm font-medium bg-white text-forest border border-ivory-dark/70 rounded-xl focus:outline-none focus:border-forest cursor-pointer appearance-none min-h-[42px]"
                aria-label="Sort documents"
              >
                <option value="date-asc">Oldest added</option>
                <option value="date-desc">Newest added</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="size-asc">Size (Smallest)</option>
                <option value="size-desc">Size (Largest)</option>
                <option value="category-asc">Category</option>
                <option value="status-asc">Status</option>
              </select>
              <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-forest-muted/60 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Filter controls panel */}
        {(showAdvancedFilters || hasActiveFilters) && (
          <div className="pt-2 border-t border-ivory-dark/40 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[11px] font-medium text-forest-muted/70 mr-1">Status:</span>
              {(['all', 'pending', 'completed', 'approved', 'error'] as StatusFilter[]).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`
                      px-2.5 py-1 rounded-lg font-medium transition-colors capitalize
                      ${statusFilter === status
                        ? 'bg-forest text-ivory shadow-xs'
                        : 'bg-ivory/70 text-forest-muted hover:text-forest hover:bg-ivory-warm'
                      }
                    `}
                  >
                    {status}
                  </button>
                ),
              )}
            </div>

            {/* Category Filter */}
            {activeCategories.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-forest-muted/70">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory | 'all')}
                  className="px-2.5 py-1 text-xs border border-ivory-dark/70 rounded-lg bg-white text-forest focus:outline-none focus:border-forest"
                >
                  <option value="all">All categories ({activeCategories.length})</option>
                  {activeCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_META[cat].label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reset action */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1 text-xs text-forest hover:underline ml-auto"
              >
                <RotateCcw className="w-3 h-3" />
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Bulk selection helper row */}
        {completedCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-ivory-dark/40 text-xs text-forest-muted">
            <div className="flex items-center gap-2">
              <span className="font-medium text-forest">
                {approvedCount} of {completedCount} approved for export
              </span>
            </div>

            <div className="flex items-center gap-2">
              {approvedCount < completedCount ? (
                <button
                  type="button"
                  onClick={onApproveAll}
                  className="inline-flex items-center gap-1 font-semibold text-forest hover:text-forest-light hover:underline"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Approve All ({completedCount})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onUnapproveAll}
                  className="inline-flex items-center gap-1 font-medium text-forest-muted hover:text-forest hover:underline"
                >
                  Unselect All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Document items list */}
      <div className="space-y-2.5">
        {filteredDocs.length === 0 ? (
          <div className="bg-white/80 rounded-2xl border border-dashed border-ivory-dark/80 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-ivory-warm flex items-center justify-center text-forest-muted mb-3">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h4 className="text-sm sm:text-base font-semibold text-forest">
              No matching documents
            </h4>
            <p className="text-xs sm:text-sm text-forest-muted/70 mt-1 max-w-sm">
              {hasActiveFilters
                ? 'Try adjusting your search query, status, or category filter to view your files.'
                : 'No documents in workspace.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-forest text-ivory hover:bg-forest-light transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              onToggleApproval={onToggleApproval}
              onStartEditing={onStartEditing}
              onSaveEdits={onSaveEdits}
              onCancelEditing={onCancelEditing}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {/* Filter result summary */}
      {hasActiveFilters && filteredDocs.length > 0 && (
        <p className="text-xs text-forest-muted/60 text-center pt-1">
          Showing {filteredDocs.length} of {documents.length} document{documents.length === 1 ? '' : 's'}
        </p>
      )}
    </section>
  );
}
