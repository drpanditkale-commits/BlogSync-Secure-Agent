import React from 'react';
import {
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface ApiAlertBannerProps {
  onRetry: () => void;
  isRetrying: boolean;
  onEnableDemoMode: () => void;
  isDemoMode: boolean;
  onOpenCredentials: () => void;
  projectId?: string;
}

export const ApiAlertBanner: React.FC<ApiAlertBannerProps> = ({
  onRetry,
  isRetrying,
  onEnableDemoMode,
  isDemoMode,
  onOpenCredentials,
  projectId = 'gen-lang-client-0451884163',
}) => {
  const gcpConsoleUrl = `https://console.developers.google.com/apis/api/blogger.googleapis.com/overview?project=${projectId}`;

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/70 border-b border-amber-500/30 text-amber-200 px-4 py-4 sm:px-6 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Warning copy */}
        <div className="flex items-start space-x-3.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mt-0.5 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-amber-100">
                Action Required: Enable Blogger API in Google Cloud Project
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                HTTP 403 PERMISSION_DENIED
              </span>
            </div>
            <p className="text-xs text-amber-200/90 mt-1 max-w-3xl leading-relaxed">
              Blogger API has not been used in project{' '}
              <strong className="text-amber-100 font-mono">{projectId}</strong> before or
              it is disabled. Enable it by visiting Google Cloud Console then retry. If you enabled
              this API recently, wait 2–5 minutes for propagation.
            </p>
            <div className="flex items-center space-x-4 mt-2 text-[11px] text-amber-300/80">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Propagation delay: ~2 to 5 minutes</span>
              </span>
              <button
                onClick={onOpenCredentials}
                className="underline hover:text-white flex items-center space-x-1"
              >
                <span>Verify credentials in dashboard</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
          <a
            href={gcpConsoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <span>Enable in Cloud Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 text-xs font-medium border border-amber-500/40 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Checking API...' : 'Retry Connection'}</span>
          </button>

          {!isDemoMode && (
            <button
              onClick={onEnableDemoMode}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 text-xs font-medium border border-indigo-500/30 transition"
              title="Preview with sample Blogger data and export features while waiting for propagation"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Preview Demo Data</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
