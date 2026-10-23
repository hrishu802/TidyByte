import { Sparkles, Download, CheckCheck, Trash2, Loader2, FileArchive, RotateCcw } from 'lucide-react';
import type { DocumentStats } from '../types';

interface ActionBarProps {
  stats: DocumentStats;
  isProcessing: boolean;
  isExporting: boolean;
  lastExport?: { filename: string } | null;
  onOrganize: () => void;
  onApproveAll: () => void;
  onExport: () => void;
  onDownloadAgain?: () => void;
  onClearAll: () => void;
}

export function ActionBar({
  stats,
  isProcessing,
  isExporting,
  lastExport,
  onOrganize,
  onApproveAll,
  onExport,
  onDownloadAgain,
  onClearAll,
}: ActionBarProps) {
  if (stats.total === 0) return null;

  const pendingCount = stats.pending + stats.errors;
  const hasCompleted = stats.completed > 0;
  const hasApproved = stats.approved > 0;
  const allApproved = stats.approved === stats.completed && stats.completed > 0;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 sm:p-4 rounded-2xl bg-white/95 border border-ivory-dark/60 shadow-xs">
      {/* Primary & secondary action cluster */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Organize Button */}
        {pendingCount > 0 ? (
          <button
            type="button"
            onClick={onOrganize}
            disabled={isProcessing}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-ivory font-semibold text-xs sm:text-sm hover:bg-forest-light active:scale-[0.99] disabled:opacity-60 transition-all shadow-sm min-h-[44px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-mint" />
                <span>Organizing documents…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-mint" />
                <span>Organize Files</span>
                <span className="px-1.5 py-0.5 rounded-md bg-forest-muted text-[11px] font-mono text-mint">
                  {pendingCount}
                </span>
              </>
            )}
          </button>
        ) : (
          <div className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>All files organized</span>
          </div>
        )}

        {/* Quick Approve All */}
        {hasCompleted && !allApproved && (
          <button
            type="button"
            onClick={onApproveAll}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-ivory-dark bg-ivory/40 text-forest font-medium text-xs sm:text-sm hover:bg-ivory-warm active:scale-[0.99] transition-all min-h-[44px]"
          >
            <CheckCheck className="w-4 h-4 text-emerald-700" />
            <span>Approve All</span>
          </button>
        )}

        {/* Export ZIP Button */}
        <button
          type="button"
          onClick={onExport}
          disabled={!hasApproved || isExporting}
          className={`
            flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-sm min-h-[44px]
            ${hasApproved && !isExporting
              ? 'bg-mint-dark text-forest hover:bg-mint active:scale-[0.99]'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
            }
          `}
          title={!hasApproved ? 'Approve at least one document to enable export' : 'Export approved documents to ZIP'}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-forest" />
              <span>Packaging ZIP…</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export ZIP</span>
              {hasApproved && (
                <span className="px-1.5 py-0.5 rounded-md bg-forest/15 text-[11px] font-mono text-forest">
                  {stats.approved}
                </span>
              )}
            </>
          )}
        </button>

        {/* Download Again Button if lastExport is available */}
        {lastExport && onDownloadAgain && (
          <button
            type="button"
            onClick={onDownloadAgain}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-mint-dark/50 bg-mint/25 text-forest font-semibold text-xs sm:text-sm hover:bg-mint/40 active:scale-[0.99] transition-all shadow-2xs min-h-[44px]"
            title={`Download ${lastExport.filename} again without rerunning organization`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-forest" />
            <span>Download again</span>
          </button>
        )}
      </div>

      {/* Right side: status note & clear */}
      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-ivory-dark/40">
        <div className="flex items-center gap-1.5 text-xs text-forest-muted">
          <FileArchive className="w-3.5 h-3.5" />
          <span>
            {stats.approved > 0 ? (
              <strong className="text-forest">{stats.approved} approved</strong>
            ) : (
              '0 approved'
            )}
            <span className="hidden xs:inline"> for export</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Are you sure you want to remove all files from the workspace?')) {
              onClearAll();
            }
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 transition-colors min-h-[36px]"
          title="Remove all files from workspace"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>
    </div>
  );
}
