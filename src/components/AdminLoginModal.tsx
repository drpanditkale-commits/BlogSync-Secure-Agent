import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { BloggerBlog } from '../types';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  LogOut,
  KeyRound,
  ExternalLink,
  User as UserIcon,
  RefreshCw,
  BookOpen,
  ArrowRight,
  Globe,
  PlusCircle,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import { OAUTH_SCOPES } from '../services/firebase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isSigningIn: boolean;
  blogs: BloggerBlog[];
  selectedBlog: BloggerBlog | null;
  onSelectBlog: (blog: BloggerBlog) => void;
  onFetchBlogs: () => Promise<void>;
  isLoadingBlogs: boolean;
  onAddBlog?: (urlOrId: string) => Promise<void>;
  onEnableDemoMode?: () => void;
  isDemoMode?: boolean;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  user,
  accessToken,
  onSignIn,
  onSignOut,
  isSigningIn,
  blogs,
  selectedBlog,
  onSelectBlog,
  onFetchBlogs,
  isLoadingBlogs,
  onAddBlog,
  onEnableDemoMode,
  isDemoMode,
}) => {
  const [blogInput, setBlogInput] = useState('');
  const [isAddingBlog, setIsAddingBlog] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleAddBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogInput.trim() || !onAddBlog) return;
    setIsAddingBlog(true);
    setAddError(null);
    try {
      await onAddBlog(blogInput.trim());
      setBlogInput('');
      setShowAddForm(false);
    } catch (err: any) {
      setAddError(err.message || 'Failed to find or link blog');
    } finally {
      setIsAddingBlog(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl text-slate-100 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Admin &amp; Blogger Accounts Window</h2>
              <p className="text-xs text-slate-400">dr.panditkale@gmail.com • Connected Blogs Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Admin Identity Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3.5">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Admin'}
                    className="w-12 h-12 rounded-full border-2 border-orange-500/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-600 to-amber-600 font-bold text-lg flex items-center justify-center text-white shadow-md">
                    P
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {user?.displayName || 'Dr. Pandit Kale (Admin)'}
                  </h3>
                  <p className="text-xs font-mono text-orange-400">dr.panditkale@gmail.com</p>
                  <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 mt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      {accessToken ? 'Active Google OAuth 2.0 Session' : user ? 'Signed In (Needs Re-auth for Live API)' : 'Ready to Authenticate'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Action Buttons: Sign In / Fetch Blogs */}
              <div className="flex flex-wrap items-center gap-2">
                {!accessToken && (
                  <button
                    onClick={onSignIn}
                    disabled={isSigningIn}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs shadow hover:bg-slate-200 transition disabled:opacity-50"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-700" />
                    <span>{isSigningIn ? 'Connecting...' : 'Sign In with Google'}</span>
                  </button>
                )}
                <button
                  onClick={onFetchBlogs}
                  disabled={isLoadingBlogs || isSigningIn}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition active:scale-95 disabled:opacity-50"
                  title="Fetch all blogs from Blogger API v3"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBlogs ? 'animate-spin' : ''}`} />
                  <span>{isLoadingBlogs ? 'Fetching Blogs...' : 'Fetch All Blogs on Admin Account'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
              <div>
                <span className="text-slate-500">Google Cloud Project:</span>
                <p className="font-mono text-slate-300 truncate">{firebaseConfig.projectId}</p>
              </div>
              <div>
                <span className="text-slate-500">OAuth Client:</span>
                <p className="font-mono text-slate-300 truncate">420074911597-web</p>
              </div>
              <div>
                <span className="text-slate-500">Connected Blogs:</span>
                <p className="font-bold text-emerald-400">{blogs.length} Available</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar: Add Blog & Sample Blogs */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                <PlusCircle className="w-3.5 h-3.5 text-orange-400" />
                <span>Link Blog by URL or Blog ID</span>
              </button>
              {onEnableDemoMode && (
                <button
                  onClick={onEnableDemoMode}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition"
                  title="Load sample blogs to test 6-agent pipeline"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Load Sample Blogs</span>
                </button>
              )}
            </div>
            <a
              href="https://console.developers.google.com/apis/api/blogger.googleapis.com/overview?project=gen-lang-client-0451884163"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-[11px] text-orange-400 hover:underline"
            >
              <span>Enable Blogger API in GCP</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Add Blog Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddBlogSubmit}
              className="p-4 bg-slate-950 rounded-xl border border-orange-500/40 space-y-3 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  Directly Link Any Blogger Blog to Admin Account
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Enter your Blogspot address (e.g. <code>https://example.blogspot.com</code>) or numeric Blog ID. It will be immediately connected and available for draft saving.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://myblog.blogspot.com or numeric blog ID..."
                  value={blogInput}
                  onChange={(e) => setBlogInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={isAddingBlog || !blogInput.trim()}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {isAddingBlog ? 'Linking...' : 'Link Blog'}
                </button>
              </div>
              {addError && <p className="text-[11px] text-red-400">{addError}</p>}
            </form>
          )}

          {/* Connected Blogs List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Connected Blogger Blogs on Admin Account ({blogs.length})
                </h3>
              </div>
              <a
                href="https://www.blogger.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-orange-400 hover:underline flex items-center space-x-1"
              >
                <span>Open Blogger.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {blogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 space-y-3">
                <Globe className="w-10 h-10 mx-auto text-slate-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    No Blogs Loaded for dr.panditkale@gmail.com Yet
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Click <strong>"Fetch All Blogs on Admin Account"</strong> above, or link a blog directly by URL/ID.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={onFetchBlogs}
                    disabled={isLoadingBlogs}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    Fetch Blogs Now
                  </button>
                  {onEnableDemoMode && (
                    <button
                      onClick={onEnableDemoMode}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition"
                    >
                      Use Sample Blogs
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {blogs.map((b) => {
                  const isSelected = selectedBlog?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => onSelectBlog(b)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-orange-950/30 border-orange-500/70 shadow-md ring-1 ring-orange-500/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-white">{b.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                            {b.status || 'LIVE'}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold">
                              ACTIVE TARGET
                            </span>
                          )}
                        </div>
                        <a
                          href={b.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-slate-400 hover:text-orange-400 font-mono flex items-center space-x-1"
                        >
                          <span className="truncate max-w-xs">{b.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                        <p className="text-[11px] text-slate-500">
                          Total Posts: <strong className="text-slate-300">{b.posts?.totalItems || 0}</strong> • Blog ID: <code className="text-slate-400">{b.id}</code>
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                        <a
                          href={`https://www.blogger.com/blog/posts/${b.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1 transition"
                        >
                          <span>Dashboard</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => onSelectBlog(b)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                            isSelected
                              ? 'bg-orange-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <span>{isSelected ? 'Active Target' : 'Select'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Permissions / Scopes List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300">Authorized Workspace Scopes</span>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono">https://www.googleapis.com/auth/blogger</span>
                </div>
                <span className="text-slate-500">Read &amp; Drafts Write</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono">https://www.googleapis.com/auth/devstorage.read_write</span>
                </div>
                <span className="text-slate-500">Cloud Storage Bucket</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 sticky bottom-0 z-10 backdrop-blur-md flex items-center justify-between">
          {user ? (
            <button
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="flex items-center space-x-1.5 text-xs text-red-400 hover:text-red-300 font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect Session</span>
            </button>
          ) : (
            <button
              onClick={onSignIn}
              disabled={isSigningIn}
              className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow"
            >
              Sign in with Google
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
