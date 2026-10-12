import React from 'react';
import { User } from 'firebase/auth';
import {
  Sparkles,
  KeyRound,
  ShieldCheck,
  LogOut,
  ExternalLink,
  BookOpen,
  Radio,
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  hasToken: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenCredentials: () => void;
  onOpenAdminLogin: () => void;
  isSigningIn: boolean;
  activeTab: 'pipeline' | 'blogs' | 'agent' | 'logs';
  setActiveTab: (tab: 'pipeline' | 'blogs' | 'agent' | 'logs') => void;
  logsCount: number;
  apiStatus: 'connected' | 'needs_api_enable' | 'demo' | 'disconnected';
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  hasToken,
  onSignIn,
  onSignOut,
  onOpenCredentials,
  onOpenAdminLogin,
  isSigningIn,
  activeTab,
  setActiveTab,
  logsCount,
  apiStatus,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('pipeline')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Google OPAL
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-medium">
                  Multi-Agent Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                RSS to 1500w AdSense Post • Visuals • Legal • Blogger Draft
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'pipeline'
                  ? 'bg-gradient-to-r from-orange-500/25 to-amber-500/20 text-orange-400 border border-orange-500/40 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>6-Agent Pipeline</span>
            </button>
            <button
              onClick={() => setActiveTab('blogs')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'blogs'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Blogs &amp; Posts</span>
            </button>
            <button
              onClick={() => setActiveTab('agent')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'agent'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>OPAL Agent</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'logs'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Activity Logs</span>
              {logsCount > 0 && (
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-300 font-semibold">
                  {logsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2.5">
            {/* Admin Login Window Button */}
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-950/40 hover:bg-orange-900/40 text-orange-300 border border-orange-500/30 transition"
              title="Admin Login &amp; Connected Blogger Accounts"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Admin Login</span>
            </button>

            {/* Credentials Button */}
            <button
              onClick={onOpenCredentials}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Verify Credentials, OAuth Scopes &amp; API Keys"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Credentials</span>
            </button>

            {/* Google Auth / Sign-in */}
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 bg-slate-800/60 pl-2 pr-3 py-1 rounded-full border border-slate-700">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-6 h-6 rounded-full border border-slate-600"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-orange-600 text-[11px] font-bold flex items-center justify-center text-white">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="text-left hidden sm:block max-w-[120px] truncate">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {user.displayName || 'Google Account'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onSignOut}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Google Sign In Official Button Style */
              <button
                onClick={onSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm border border-slate-300 transition active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav bottom strip */}
      <div className="md:hidden flex border-t border-slate-800 bg-slate-950 px-3 py-2 justify-around">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center space-x-1 text-xs py-1 px-2 rounded ${
            activeTab === 'pipeline' ? 'text-orange-400 font-bold bg-orange-950/40' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pipeline</span>
        </button>
        <button
          onClick={() => setActiveTab('blogs')}
          className={`flex items-center space-x-1 text-xs py-1 px-2 rounded ${
            activeTab === 'blogs' ? 'text-orange-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Blogs</span>
        </button>
        <button
          onClick={() => setActiveTab('agent')}
          className={`flex items-center space-x-1 text-xs py-1 px-2 rounded ${
            activeTab === 'agent' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Agent</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center space-x-1 text-xs py-1 px-2 rounded ${
            activeTab === 'logs' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Logs</span>
        </button>
      </div>
    </header>
  );
};
