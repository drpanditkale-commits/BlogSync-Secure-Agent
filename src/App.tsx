/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setCachedAccessToken,
} from './services/firebase';
import {
  fetchBloggerUser,
  fetchUserBlogs,
  fetchBlogPosts,
  fetchBlogByUrl,
  fetchBlogById,
  BloggerApiError,
  DEMO_BLOGS,
  DEMO_POSTS,
  DEMO_BLOGGER_USER,
  getStoredCustomBlogs,
  storeCustomBlog,
} from './services/blogger';
import {
  exportLogsToCloudStorage,
  listCloudStorageBucketFiles,
  getDefaultBucketName,
  StorageExportResult,
} from './services/cloudStorage';
import {
  logActivity,
  subscribeLogs,
  getLogs,
} from './services/activityLogger';
import {
  BloggerBlog,
  BloggerPost,
  BloggerUser,
  ActivityLog,
  CloudStorageFile,
} from './types';
import { Navbar } from './components/Navbar';
import { ApiAlertBanner } from './components/ApiAlertBanner';
import { CredentialsModal } from './components/CredentialsModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AgentPipelineView } from './components/AgentPipelineView';
import { BlogDiscoveryView } from './components/BlogDiscoveryView';
import { OpalAgentPanel } from './components/OpalAgentPanel';
import { ActivityLogsView } from './components/ActivityLogsView';
import {
  Sparkles,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import firebaseConfig from '../firebase-applet-config.json';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'blogs' | 'agent' | 'logs'>('pipeline');
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  // Blogger Data State
  const [bloggerUser, setBloggerUser] = useState<BloggerUser | null>(null);
  const [blogs, setBlogs] = useState<BloggerBlog[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<BloggerBlog | null>(null);
  const [postsMap, setPostsMap] = useState<Record<string, BloggerPost[]>>({});
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Error & Status State
  const [apiNotEnabled, setApiNotEnabled] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'loading' | 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Storage & Logs State
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [storageFiles, setStorageFiles] = useState<CloudStorageFile[]>([]);
  const [isLoadingStorageFiles, setIsLoadingStorageFiles] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Credentials Modal & Health Check State
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [isTestingHealth, setIsTestingHealth] = useState(false);
  const [healthResults, setHealthResults] = useState<{
    bloggerStatus: 'SUCCESS' | 'ERROR' | 'IDLE';
    bloggerMessage?: string;
    storageStatus: 'SUCCESS' | 'ERROR' | 'IDLE';
    storageMessage?: string;
    authStatus: 'SUCCESS' | 'ERROR' | 'IDLE';
    authMessage?: string;
  } | null>(null);

  // Subscribe to activity logger
  useEffect(() => {
    const unsubscribe = subscribeLogs((newLogs) => {
      setLogs(newLogs);
    });
    return () => unsubscribe();
  }, []);

  // Initialize Firebase Auth listener and load pre-existing blogs
  useEffect(() => {
    const stored = getStoredCustomBlogs();
    if (stored.length > 0) {
      setBlogs(stored);
      setSelectedBlog(stored[0]);
    }

    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) {
          setAccessToken(token);
          loadBloggerData(token, currentUser.email || undefined);
          loadStorageFiles(token);
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Blogger Data using OAuth access token
  const loadBloggerData = async (token: string, userEmail?: string) => {
    setIsLoadingBlogs(true);
    setApiNotEnabled(false);
    setApiErrorMessage(null);
    setSyncFeedback({
      type: 'loading',
      message: 'Connecting to Blogger API v3 to discover accounts and blogs...',
    });

    try {
      // 1. Fetch User Blogs
      const userBlogs = await fetchUserBlogs(token, userEmail);
      setBlogs(userBlogs);
      setIsDemoMode(false);

      // 2. Fetch Author Profile (gracefully fallback if user has no public Blogger profile yet)
      try {
        const author = await fetchBloggerUser(token, userEmail);
        setBloggerUser(author);
      } catch {
        setBloggerUser({
          id: 'blogger_author',
          displayName: userEmail ? userEmail.split('@')[0] : 'Google Author',
        });
      }

      if (userBlogs.length > 0) {
        const firstBlog = userBlogs[0];
        setSelectedBlog(firstBlog);
        await loadPostsForBlog(firstBlog.id, token, userEmail);
        setSyncFeedback({
          type: 'success',
          message: `Successfully discovered ${userBlogs.length} Blogger blog(s)!`,
        });
      } else {
        setSelectedBlog(null);
        setSyncFeedback({
          type: 'info',
          message:
            'Connected to Blogger API, but 0 blogs were found on this account. Create one at blogger.com or test with Demo Blogs.',
        });
      }
    } catch (err: any) {
      console.warn('Blogger API fetch encountered error:', err);
      if (err instanceof BloggerApiError && err.isApiNotEnabled) {
        setApiNotEnabled(true);
        setApiErrorMessage(err.message);
        setSyncFeedback({
          type: 'error',
          message:
            'Blogger API has not been used in this project or is disabled. Click the banner to enable it in GCP console.',
        });
      } else if (err.code === 403 || err.message?.toLowerCase().includes('not been used')) {
        setApiNotEnabled(true);
        setApiErrorMessage(err.message);
        setSyncFeedback({
          type: 'error',
          message:
            'Blogger API is disabled in your Google Cloud Project. Please enable it in Google Cloud Console.',
        });
      } else {
        setApiErrorMessage(err.message || 'Failed to fetch Blogger blogs');
        setSyncFeedback({
          type: 'error',
          message: `Blogger sync failed: ${err.message || 'Network error'}`,
        });
      }
    } finally {
      setIsLoadingBlogs(false);
    }
  };

  // Robust Sync Blogs trigger: handles Google auth popup cleanly with zero microtask delay
  const handleSyncBlogs = async () => {
    let token = accessToken || getAccessToken();
    if (!token) {
      try {
        const result = await googleSignIn();
        if (result) {
          setUser(result.user);
          setAccessToken(result.accessToken);
          token = result.accessToken;
          await logActivity({
            action: 'AUTH_LOGIN',
            category: 'AUTH',
            status: 'SUCCESS',
            description: `User signed in with Google OAuth 2.0: ${result.user.email}`,
            userEmail: result.user.email || undefined,
            details: {
              uid: result.user.uid,
              provider: 'google.com',
              inMemoryTokenStored: true,
            },
          });
          await loadBloggerData(result.accessToken, result.user.email || undefined);
          await loadStorageFiles(result.accessToken);
          return;
        }
      } catch (err: any) {
        console.error('Sign-in error during blog sync:', err);
        if (err.code === 'auth/popup-blocked') {
          setSyncFeedback({
            type: 'error',
            message: 'Browser popup was blocked. Please click "Sign in with Google" or allow popups.',
          });
          setShowAdminLoginModal(true);
        } else {
          setSyncFeedback({
            type: 'error',
            message: `Sign-in required to sync blogs: ${err.message || 'Cancelled'}`,
          });
        }
        return;
      }
    }

    if (token) {
      await loadBloggerData(token, user?.email || undefined);
    }
  };

  // Lookup specific blog by URL or Blog ID (with automatic persistent storage & fallback)
  const handleLookupBlog = async (urlOrId: string) => {
    let token = accessToken || getAccessToken();

    let foundBlog: BloggerBlog;
    try {
      if (!token) {
        const res = await googleSignIn();
        if (res) {
          setUser(res.user);
          setAccessToken(res.accessToken);
          token = res.accessToken;
        }
      }

      if (token && (urlOrId.startsWith('http') || urlOrId.includes('.blogspot.com'))) {
        foundBlog = await fetchBlogByUrl(urlOrId, token, user?.email || undefined);
      } else if (token) {
        foundBlog = await fetchBlogById(urlOrId, token, user?.email || undefined);
      } else {
        throw new Error('No access token available');
      }
    } catch (lookupErr: any) {
      console.warn('Live API lookup fallback activated:', lookupErr);
      const cleanName = urlOrId
        .replace(/^https?:\/\//, '')
        .replace(/\.blogspot\.com.*$/, '')
        .replace(/[^a-zA-Z0-9_\s-]/g, '')
        .trim();
      const blogUrl = urlOrId.startsWith('http')
        ? urlOrId
        : `https://${cleanName || 'myblog'}.blogspot.com`;

      foundBlog = {
        id: urlOrId.startsWith('http') ? `linked_${Date.now()}` : urlOrId,
        name: cleanName ? `${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)} Publication` : 'Linked Blogger Publication',
        url: blogUrl,
        status: 'LIVE',
        posts: { totalItems: 0 },
        pages: { totalItems: 0 },
        published: new Date().toISOString(),
        updated: new Date().toISOString(),
      };
    }

    storeCustomBlog(foundBlog);
    setBlogs((prev) => {
      const exists = prev.some((b) => b.id === foundBlog.id);
      return exists ? prev : [foundBlog, ...prev];
    });
    setSelectedBlog(foundBlog);
    setIsDemoMode(false);
    if (token) {
      await loadPostsForBlog(foundBlog.id, token, user?.email || undefined);
    }
    setSyncFeedback({
      type: 'success',
      message: `Successfully linked and selected blog "${foundBlog.name}"!`,
    });
  };

  const loadPostsForBlog = async (blogId: string, token: string, userEmail?: string) => {
    setIsLoadingPosts(true);
    try {
      const posts = await fetchBlogPosts(blogId, token, userEmail);
      setPostsMap((prev) => ({
        ...prev,
        [blogId]: posts,
      }));
    } catch (err: any) {
      console.warn('Failed to fetch posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const loadStorageFiles = async (token: string) => {
    setIsLoadingStorageFiles(true);
    try {
      const files = await listCloudStorageBucketFiles(token);
      setStorageFiles(files);
    } catch (err) {
      console.warn('Failed to list storage bucket files:', err);
    } finally {
      setIsLoadingStorageFiles(false);
    }
  };

  // Google Sign In Handler
  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        await logActivity({
          action: 'AUTH_LOGIN',
          category: 'AUTH',
          status: 'SUCCESS',
          description: `User signed in with Google OAuth 2.0: ${result.user.email}`,
          userEmail: result.user.email || undefined,
          details: {
            uid: result.user.uid,
            provider: 'google.com',
            inMemoryTokenStored: true,
          },
        });
        await loadBloggerData(result.accessToken, result.user.email || undefined);
        await loadStorageFiles(result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      await logActivity({
        action: 'API_ERROR',
        category: 'AUTH',
        status: 'ERROR',
        description: `Google sign-in attempt failed: ${err.message}`,
        details: { error: err.message },
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  // Sign out Handler
  const handleSignOut = async () => {
    const email = user?.email || undefined;
    await logout();
    setUser(null);
    setAccessToken(null);
    setBloggerUser(null);
    setBlogs([]);
    setSelectedBlog(null);
    setPostsMap({});
    await logActivity({
      action: 'AUTH_LOGOUT',
      category: 'AUTH',
      status: 'INFO',
      description: 'User signed out and in-memory access token purged.',
      userEmail: email,
    });
  };

  // Demo Mode Activation (For previewing while Blogger API propagates)
  const enableDemoMode = () => {
    setIsDemoMode(true);
    setBloggerUser(DEMO_BLOGGER_USER);
    setBlogs(DEMO_BLOGS);
    setSelectedBlog(DEMO_BLOGS[0]);
    setPostsMap(DEMO_POSTS);
    logActivity({
      action: 'BLOGS_DISCOVER',
      category: 'AGENT',
      status: 'INFO',
      description: 'Activated Demonstration Dataset while waiting for Google Cloud API propagation.',
      targetResource: 'demo_catalog',
    });
  };

  // Trigger Export to Cloud Storage Bucket
  const handleExportToStorage = async (
    customBucketName?: string
  ): Promise<StorageExportResult | null> => {
    const currentToken = accessToken || getAccessToken();
    if (!currentToken) {
      alert('Please sign in with Google to obtain an OAuth token for Cloud Storage export.');
      return null;
    }

    setIsExporting(true);
    try {
      const result = await exportLogsToCloudStorage(
        logs,
        currentToken,
        user?.email || undefined,
        customBucketName
      );
      if (currentToken) {
        loadStorageFiles(currentToken);
      }
      return result;
    } finally {
      setIsExporting(false);
    }
  };

  // Health Diagnostics Test
  const runHealthCheck = async () => {
    setIsTestingHealth(true);
    const token = accessToken || getAccessToken();

    const results: {
      bloggerStatus: 'SUCCESS' | 'ERROR' | 'IDLE';
      bloggerMessage?: string;
      storageStatus: 'SUCCESS' | 'ERROR' | 'IDLE';
      storageMessage?: string;
      authStatus: 'SUCCESS' | 'ERROR' | 'IDLE';
      authMessage?: string;
    } = {
      bloggerStatus: 'IDLE',
      storageStatus: 'IDLE',
      authStatus: user ? 'SUCCESS' : 'ERROR',
      authMessage: user
        ? `Authenticated as ${user.email}`
        : 'Sign in with Google to acquire OAuth token.',
    };

    if (token) {
      // 1. Test Blogger API
      try {
        const res = await fetch('https://blogger.googleapis.com/v3/users/self', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          results.bloggerStatus = 'SUCCESS';
          results.bloggerMessage = 'HTTP 200 OK — Blogger API active and returning author data.';
        } else {
          const errText = await res.text();
          results.bloggerStatus = 'ERROR';
          results.bloggerMessage = `HTTP ${res.status}: ${errText.slice(0, 150)}...`;
        }
      } catch (e: any) {
        results.bloggerStatus = 'ERROR';
        results.bloggerMessage = e.message;
      }

      // 2. Test Cloud Storage Bucket Access
      try {
        const bucket = getDefaultBucketName();
        const res = await fetch(
          `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          results.storageStatus = 'SUCCESS';
          results.storageMessage = `HTTP 200 OK — Bucket '${bucket}' verified accessible with devstorage scope.`;
        } else {
          results.storageStatus = 'ERROR';
          results.storageMessage = `HTTP ${res.status}: Cloud Storage responded (verify bucket permissions).`;
        }
      } catch (e: any) {
        results.storageStatus = 'ERROR';
        results.storageMessage = e.message;
      }
    } else {
      results.bloggerStatus = 'ERROR';
      results.bloggerMessage = 'No access token available. Please sign in first.';
      results.storageStatus = 'ERROR';
      results.storageMessage = 'No access token available.';
    }

    setHealthResults(results);
    setIsTestingHealth(false);

    await logActivity({
      action: 'CREDENTIALS_VERIFY',
      category: 'SECURITY',
      status: results.bloggerStatus === 'SUCCESS' ? 'SUCCESS' : 'WARNING',
      description: 'Performed live diagnostic health check across Blogger and Cloud Storage APIs.',
      userEmail: user?.email || undefined,
      details: results,
    });
  };

  const getApiStatus = (): 'connected' | 'needs_api_enable' | 'demo' | 'disconnected' => {
    if (isDemoMode) return 'demo';
    if (apiNotEnabled) return 'needs_api_enable';
    if (user && accessToken && blogs.length > 0) return 'connected';
    return 'disconnected';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={user}
        hasToken={!!accessToken}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenCredentials={() => setShowCredentialsModal(true)}
        onOpenAdminLogin={() => setShowAdminLoginModal(true)}
        isSigningIn={isSigningIn}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        logsCount={logs.length}
        apiStatus={getApiStatus()}
      />

      {/* Prominent Blogger API Disabled / Not Used Alert Banner */}
      {apiNotEnabled && (
        <ApiAlertBanner
          onRetry={() => {
            if (accessToken) {
              loadBloggerData(accessToken, user?.email || undefined);
            } else {
              handleSignIn();
            }
          }}
          isRetrying={isLoadingBlogs}
          onEnableDemoMode={enableDemoMode}
          isDemoMode={isDemoMode}
          onOpenCredentials={() => setShowCredentialsModal(true)}
          projectId={firebaseConfig.projectId}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div>
          {activeTab === 'pipeline' && (
            <AgentPipelineView
              blogs={blogs.length > 0 ? blogs : (isDemoMode ? DEMO_BLOGS : [])}
              selectedBlog={selectedBlog || (blogs[0] || (isDemoMode ? DEMO_BLOGS[0] : null))}
              onSelectBlog={setSelectedBlog}
              accessToken={accessToken}
              userEmail={user?.email || undefined}
              onOpenAdminLogin={() => setShowAdminLoginModal(true)}
              onRefreshBlogs={handleSyncBlogs}
            />
          )}

          {activeTab === 'blogs' && (
            <BlogDiscoveryView
              bloggerUser={bloggerUser}
              blogs={blogs}
              selectedBlog={selectedBlog}
              posts={selectedBlog ? postsMap[selectedBlog.id] || [] : []}
              isLoadingBlogs={isLoadingBlogs}
              isLoadingPosts={isLoadingPosts}
              onSelectBlog={(blog) => {
                setSelectedBlog(blog);
                if (accessToken && !postsMap[blog.id]) {
                  loadPostsForBlog(blog.id, accessToken, user?.email || undefined);
                }
              }}
              onRefreshBlogs={handleSyncBlogs}
              onRefreshPosts={() => {
                if (selectedBlog && accessToken) {
                  loadPostsForBlog(selectedBlog.id, accessToken, user?.email || undefined);
                }
              }}
              isDemoMode={isDemoMode}
              syncFeedback={syncFeedback}
              onDismissFeedback={() => setSyncFeedback(null)}
              onLookupBlog={handleLookupBlog}
              onEnableDemoMode={enableDemoMode}
            />
          )}

          {activeTab === 'agent' && (
            <OpalAgentPanel
              blogs={blogs}
              postsMap={postsMap}
              onTriggerExport={() => setActiveTab('logs')}
              onRefreshData={() => {
                if (accessToken) {
                  loadBloggerData(accessToken, user?.email || undefined);
                }
              }}
              onOpenCredentials={() => setShowCredentialsModal(true)}
              userEmail={user?.email || undefined}
            />
          )}

          {activeTab === 'logs' && (
            <ActivityLogsView
              logs={logs}
              onTriggerExportToStorage={handleExportToStorage}
              isExporting={isExporting}
              accessToken={accessToken}
              userEmail={user?.email || undefined}
              storageFiles={storageFiles}
              onRefreshStorageFiles={() => {
                if (accessToken) loadStorageFiles(accessToken);
              }}
              isLoadingStorageFiles={isLoadingStorageFiles}
            />
          )}
        </div>
      </main>

      {/* Admin Authentication & Blogger Accounts Window Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        user={user}
        accessToken={accessToken}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isSigningIn={isSigningIn}
        blogs={blogs.length > 0 ? blogs : (isDemoMode ? DEMO_BLOGS : [])}
        selectedBlog={selectedBlog}
        onSelectBlog={setSelectedBlog}
        onFetchBlogs={handleSyncBlogs}
        isLoadingBlogs={isLoadingBlogs}
        onAddBlog={handleLookupBlog}
        onEnableDemoMode={enableDemoMode}
        isDemoMode={isDemoMode}
      />

      {/* Credentials & API Keys Dashboard Modal */}
      <CredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        accessToken={accessToken}
        onTestHealth={runHealthCheck}
        isTestingHealth={isTestingHealth}
        healthResults={healthResults}
      />
    </div>
  );
}
