import { Sparkles, FolderArchive, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  totalFiles?: number;
  approvedCount?: number;
}

export function Header({ totalFiles = 0, approvedCount = 0 }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-forest/95 backdrop-blur-md border-b border-forest-light/60 text-ivory">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-mint/15 border border-mint/25 flex items-center justify-center shrink-0 shadow-inner">
            <FolderArchive className="w-4.5 h-4.5 text-mint" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white leading-none">
                TidyByte
              </span>
              <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-mint/15 text-mint border border-mint/30">
                <Sparkles className="w-2.5 h-2.5" />
                MVP Demo
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-mint/80 font-normal tracking-wide truncate mt-0.5">
              Less clutter. More clarity.
            </p>
          </div>
        </div>

        {/* Status badges & quick counters */}
        <div className="flex items-center gap-2 shrink-0">
          {totalFiles > 0 && (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-forest-light/80 border border-forest-muted/50 text-xs text-ivory/80">
              <span>{totalFiles} file{totalFiles === 1 ? '' : 's'} loaded</span>
              {approvedCount > 0 && (
                <>
                  <span className="text-forest-muted">•</span>
                  <span className="text-mint font-medium">{approvedCount} ready</span>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-forest-light/60 border border-ivory/10 text-[11px] text-ivory/70">
            <ShieldCheck className="w-3.5 h-3.5 text-mint" />
            <span className="hidden sm:inline">Local & Private</span>
            <span className="sm:hidden">Local</span>
          </div>
        </div>
      </div>
    </header>
  );
}
