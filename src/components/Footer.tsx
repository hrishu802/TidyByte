import { FolderArchive, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-ivory-dark/60 bg-white/40 mt-12 sm:mt-16 text-forest-muted">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          {/* Brand info */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-forest text-mint flex items-center justify-center shrink-0">
              <FolderArchive className="w-3 h-3" />
            </div>
            <span className="font-semibold text-forest">TidyByte</span>
            <span className="text-ivory-dark">•</span>
            <span className="italic">"Less clutter. More clarity."</span>
          </div>

          {/* Hacktoberfest badge */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-forest-muted/70 text-[11px]">
            <span className="inline-flex items-center gap-1 font-medium text-forest">
              <Sparkles className="w-3 h-3 text-mint-dark" />
              DEV Challenge
            </span>
            <span className="text-ivory-dark">•</span>
            <span>Hacktoberfest 2026 Week 3</span>
            <span className="text-ivory-dark">•</span>
            <span className="font-semibold text-forest">Theme: "Slow and Steady"</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
