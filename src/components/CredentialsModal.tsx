import React, { useState } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  Activity,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import { OAUTH_SCOPES } from '../services/firebase';

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  onTestHealth: () => Promise<void>;
  isTestingHealth: boolean;
  healthResults: {
    bloggerStatus: 'SUCCESS' | 'ERROR' | 'IDLE';
    bloggerMessage?: string;
    storageStatus: 'SUCCESS' | 'ERROR' | 'IDLE';
    storageMessage?: string;
    authStatus: 'SUCCESS' | 'ERROR' | 'IDLE';
    authMessage?: string;
  } | null;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  onTestHealth,
  isTestingHealth,
  healthResults,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const projectUrl = `https://console.cloud.google.com/apis/dashboard?project=${firebaseConfig.projectId}`;
  const bloggerEnableUrl = `https://console.developers.google.com/apis/api/blogger.googleapis.com/overview?project=${firebaseConfig.projectId}`;
  const storageBucketUrl = `https://console.cloud.google.com/storage/browser/${firebaseConfig.storageBucket}?project=${firebaseConfig.projectId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Credentials &amp; API Keys Dashboard
              </h2>
              <p className="text-xs text-slate-400">
                Google Cloud Project, OAuth 2.0 Client &amp; Storage Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Quick links banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Project configured: </span>
              <span className="font-mono text-emerald-300 font-semibold">
                {firebaseConfig.projectId}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href={projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                <span>GCP Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">•</span>
              <a
                href={bloggerEnableUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 underline"
              >
                <span>Blogger API Toggle</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Core Credentials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project ID */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Google Cloud Project ID</span>
                <button
                  onClick={() => copyToClipboard(firebaseConfig.projectId, 'projectId')}
                  className="hover:text-white"
                >
                  {copiedKey === 'projectId' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="font-mono text-sm text-slate-200 select-all">
                {firebaseConfig.projectId}
              </p>
            </div>

            {/* Project Number */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Project Number</span>
                <button
                  onClick={() =>
                    copyToClipboard(firebaseConfig.messagingSenderId || '420074911597', 'projNum')
                  }
                  className="hover:text-white"
                >
                  {copiedKey === 'projNum' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="font-mono text-sm text-slate-200 select-all">
                {firebaseConfig.messagingSenderId || '420074911597'}
              </p>
            </div>

            {/* OAuth Client ID */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 md:col-span-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>OAuth 2.0 Web Client ID</span>
                <button
                  onClick={() => copyToClipboard(firebaseConfig.oAuthClientId, 'clientId')}
                  className="hover:text-white"
                >
                  {copiedKey === 'clientId' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="font-mono text-xs text-slate-300 break-all select-all">
                {firebaseConfig.oAuthClientId}
              </p>
            </div>

            {/* Cloud Storage Bucket */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span className="flex items-center space-x-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Target Cloud Storage Bucket</span>
                </span>
                <a
                  href={storageBucketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="font-mono text-xs text-slate-200 break-all select-all">
                {firebaseConfig.storageBucket}
              </p>
            </div>

            {/* Auth Domain */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Auth Domain</span>
                <button
                  onClick={() => copyToClipboard(firebaseConfig.authDomain, 'authDomain')}
                  className="hover:text-white"
                >
                  {copiedKey === 'authDomain' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="font-mono text-xs text-slate-200 select-all">
                {firebaseConfig.authDomain}
              </p>
            </div>
          </div>

          {/* Active OAuth Scopes */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Authorized OAuth 2.0 Scopes (Least Privilege Policy)
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                4 Scopes Active
              </span>
            </div>
            <div className="p-3 divide-y divide-slate-800/60 text-xs">
              {OAUTH_SCOPES.map((scope) => (
                <div key={scope} className="py-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono text-slate-300">{scope}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    {scope.includes('blogger')
                      ? 'Blogger Full Access'
                      : scope.includes('devstorage')
                      ? 'Cloud Storage Bucket R/W'
                      : 'Google Identity'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Diagnostic Health Check */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-semibold text-white">Live Service Diagnostics</h3>
              </div>
              <button
                onClick={onTestHealth}
                disabled={isTestingHealth}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingHealth ? 'animate-spin' : ''}`} />
                <span>{isTestingHealth ? 'Running Tests...' : 'Test API Endpoints'}</span>
              </button>
            </div>

            {healthResults && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                {/* Blogger API Status */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-300">Blogger API</span>
                    {healthResults.bloggerStatus === 'SUCCESS' ? (
                      <span className="text-emerald-400 flex items-center space-x-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Enabled</span>
                      </span>
                    ) : healthResults.bloggerStatus === 'ERROR' ? (
                      <span className="text-amber-400 flex items-center space-x-1 text-[11px]">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Disabled / 403</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Pending</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {healthResults.bloggerMessage || 'Not tested yet.'}
                  </p>
                </div>

                {/* Cloud Storage */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-300">Cloud Storage</span>
                    {healthResults.storageStatus === 'SUCCESS' ? (
                      <span className="text-emerald-400 flex items-center space-x-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Connected</span>
                      </span>
                    ) : healthResults.storageStatus === 'ERROR' ? (
                      <span className="text-amber-400 flex items-center space-x-1 text-[11px]">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Verify Auth</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Pending</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {healthResults.storageMessage || 'Not tested yet.'}
                  </p>
                </div>

                {/* OAuth Bearer Token */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-300">Token Memory</span>
                    {accessToken ? (
                      <span className="text-emerald-400 flex items-center space-x-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>In-Memory OK</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Sign In Needed</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {accessToken
                      ? 'Secure in-memory token ready for Blogger & Storage.'
                      : 'Sign in to generate temporary token.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
