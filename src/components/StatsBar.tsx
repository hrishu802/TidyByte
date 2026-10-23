import { Files, Clock3, CheckCircle2, AlertCircle, HardDrive, ShieldCheck } from 'lucide-react';
import type { DocumentStats } from '../types';
import { formatFileSize } from '../utils/fileUtils';

interface StatsBarProps {
  stats: DocumentStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  if (stats.total === 0) return null;

  return (
    <section aria-label="Document batch statistics" className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {/* Total Documents */}
        <div className="flex items-center gap-2.5 p-3 sm:p-3.5 bg-white/90 rounded-xl border border-ivory-dark/60 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-forest/5 text-forest flex items-center justify-center shrink-0">
            <Files className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-medium text-forest-muted/70 truncate">
              Total Files
            </span>
            <span className="text-base sm:text-lg font-bold text-forest leading-tight">
              {stats.total}
            </span>
          </div>
        </div>

        {/* Pending Suggestions */}
        <div className="flex items-center gap-2.5 p-3 sm:p-3.5 bg-white/90 rounded-xl border border-ivory-dark/60 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock3 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-medium text-forest-muted/70 truncate">
              Pending
            </span>
            <span className={`text-base sm:text-lg font-bold leading-tight ${stats.pending > 0 ? 'text-amber-700' : 'text-forest'}`}>
              {stats.pending}
            </span>
          </div>
        </div>

        {/* Organized */}
        <div className="flex items-center gap-2.5 p-3 sm:p-3.5 bg-white/90 rounded-xl border border-ivory-dark/60 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-medium text-forest-muted/70 truncate">
              Organized
            </span>
            <span className={`text-base sm:text-lg font-bold leading-tight ${stats.completed > 0 ? 'text-emerald-700' : 'text-forest'}`}>
              {stats.completed}
            </span>
          </div>
        </div>

        {/* Approved for Export */}
        <div className="flex items-center gap-2.5 p-3 sm:p-3.5 bg-white/90 rounded-xl border border-ivory-dark/60 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-mint/25 text-forest flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-medium text-forest-muted/70 truncate">
              Approved
            </span>
            <span className="text-base sm:text-lg font-bold text-forest leading-tight">
              {stats.approved}
              <span className="text-xs font-normal text-forest-muted/60 ml-1">
                / {stats.completed}
              </span>
            </span>
          </div>
        </div>

        {/* Total Size */}
        <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 p-3 sm:p-3.5 bg-white/90 rounded-xl border border-ivory-dark/60 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-forest/5 text-forest-muted flex items-center justify-center shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-medium text-forest-muted/70 truncate">
              Batch Size
            </span>
            <span className="text-base sm:text-lg font-bold text-forest leading-tight">
              {formatFileSize(stats.totalSizeBytes)}
            </span>
          </div>
        </div>
      </div>

      {stats.errors > 0 && (
        <div className="mt-2.5 flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{stats.errors} file{stats.errors === 1 ? '' : 's'} encountered processing issues.</span>
        </div>
      )}
    </section>
  );
}
