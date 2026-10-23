import { useState } from 'react';
import { Info, Sparkles, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export function DemoBanner() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-forest/15 bg-white/80 backdrop-blur-xs p-3.5 sm:p-4 text-forest shadow-2xs">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-forest/10 border border-forest/15 flex items-center justify-center shrink-0 mt-0.5 text-forest">
          <Sparkles className="w-4 h-4 text-forest" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-forest">
                Demo Mode Active
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-mint/30 text-forest border border-mint">
                Deterministic
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-xs font-medium text-forest-muted hover:text-forest transition-colors p-1"
              aria-label={isExpanded ? 'Collapse demo explanation' : 'Expand demo explanation'}
            >
              <span>{isExpanded ? 'Less' : 'How it works'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <p className="text-xs text-forest-muted/80 mt-1 leading-relaxed">
            Suggestions are generated using deterministic rule-based algorithms from filenames and text samples.
            No external AI API keys, subscriptions, or remote data transmissions are needed for this MVP.
          </p>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-ivory-dark/60 space-y-2 text-xs text-forest-muted leading-relaxed animate-fade-in">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-forest">Data Stays On Your Device:</strong> All parsing and ZIP generation runs entirely in your web browser. Uploaded documents are never transmitted to external servers.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                <p>
                  <strong className="text-forest">Future Milestones:</strong> Real generative AI reasoning with LLM embeddings and vision models will be integrated in a later development milestone.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
