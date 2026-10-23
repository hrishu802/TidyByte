import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export type NotificationType = 'error' | 'success' | 'info';

export interface NotificationAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface NotificationProps {
  type: NotificationType;
  message: string;
  action?: NotificationAction;
  onDismiss: () => void;
}

const styles: Record<
  NotificationType,
  { container: string; icon: React.ReactNode; text: string; close: string; actionBtn: string }
> = {
  error: {
    container: 'bg-rose-50 border-rose-200 text-rose-900',
    icon: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
    text: 'text-rose-900',
    close: 'text-rose-600 hover:bg-rose-100',
    actionBtn: 'bg-rose-800 text-white hover:bg-rose-900',
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
    text: 'text-emerald-900',
    close: 'text-emerald-600 hover:bg-emerald-100',
    actionBtn: 'bg-forest text-mint hover:bg-forest-light border border-forest-light/60',
  },
  info: {
    container: 'bg-mint-light/50 border-mint-dark/30 text-forest',
    icon: <Info className="w-4 h-4 text-forest shrink-0 mt-0.5" />,
    text: 'text-forest',
    close: 'text-forest-muted hover:bg-mint-light',
    actionBtn: 'bg-forest text-ivory hover:bg-forest-light',
  },
};

export function Notification({ type, message, action, onDismiss }: NotificationProps) {
  const s = styles[type];

  return (
    <aside
      className={`
        flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-xs animate-fade-in
        ${s.container}
      `}
      role="alert"
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        {s.icon}
        <p className={`text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line break-words ${s.text}`}>
          {message}
        </p>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl shadow-2xs transition-all active:scale-[0.98] ${s.actionBtn}`}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className={`p-1 rounded-lg transition-colors shrink-0 ${s.close}`}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
