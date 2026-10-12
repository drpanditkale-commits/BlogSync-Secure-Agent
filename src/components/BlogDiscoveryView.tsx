import React, { useState } from 'react';
import {
  BloggerBlog,
  BloggerPost,
  BloggerUser,
} from '../types';
import {
  BookOpen,
  Calendar,
  ExternalLink,
  MessageSquare,
  Search,
  Tag,
  RefreshCw,
  Eye,
  FileText,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  Filter,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface BlogDiscoveryViewProps {
  bloggerUser: BloggerUser | null;
  blogs: BloggerBlog[];
  selectedBlog: BloggerBlog | null;
  posts: BloggerPost[];
  isLoadingBlogs: boolean;
  isLoadingPosts: boolean;
  onSelectBlog: (blog: BloggerBlog) => void;
  onRefreshBlogs: () => void;
  onRefreshPosts: () => void;
  isDemoMode: boolean;
  syncFeedback?: { type: 'loading' | 'success' | 'error' | 'info'; message: string } | null;
  onDismissFeedback?: () => void;
  onLookupBlog?: (urlOrId: string) => Promise<void>;
  onEnableDemoMode?: () => void;
}

export const BlogDiscoveryView: React.FC<BlogDiscoveryViewProps> = ({
  bloggerUser,
  blogs,
  selectedBlog,
  posts,
  isLoadingBlogs,
  isLoadingPosts,
  onSelectBlog,
  onRefreshBlogs,
  onRefreshPosts,
  isDemoMode,
  syncFeedback,
  onDismissFeedback,
  onLookupBlog,
  onEnableDemoMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [activePostModal, setActivePostModal] = useState<BloggerPost | null>(null);
  const [showUrlLookup, setShowUrlLookup] = useState(false);
  const [directInput, setDirectInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleDirectLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directInput.trim() || !onLookupBlog) return;
    setIsLookingUp(true);
    setLookupError(null);
    try {
      await onLookupBlog(directInput.trim());
      setDirectInput('');
      setShowUrlLookup(false);
    } catch (err: any) {
      setLookupError(err.message || 'Could not find blog with this URL or ID');
    } finally {
      setIsLookingUp(false);
    }
  };

  // Extract all unique labels
  const allLabels = Array.from(
    new Set(posts.flatMap((p) => p.labels || []))
  );

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLabel = selectedLabel
      ? post.labels && post.labels.includes(selectedLabel)
      : true;
    return matchesSearch && matchesLabel;
  });

  return (
    <div className="space-y-6">
      {/* Sync Status Banner */}
      {syncFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-md transition-all ${
            syncFeedback.type === 'loading'
              ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-200'
              : syncFeedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
              : syncFeedback.type === 'error'
              ? 'bg-red-950/70 border-red-500/40 text-red-200'
              : 'bg-amber-950/70 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {syncFeedback.type === 'loading' && (
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
            )}
            {syncFeedback.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            {syncFeedback.type === 'error' && (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            {syncFeedback.type === 'info' && (
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="font-medium leading-relaxed">{syncFeedback.message}</span>
          </div>
          {onDismissFeedback && (
            <button
              onClick={onDismissFeedback}
              className="p-1 hover:text-white rounded text-slate-400"
              title="Dismiss notification"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Author & Header Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white">
                Blogger Account &amp; Publication Discovery
              </h1>
              {isDemoMode && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  Sample Catalog
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Discovered {blogs.length} publication(s) for{' '}
              <span className="text-slate-200 font-medium">
                {bloggerUser?.displayName || 'Authenticated Google Author'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onLookupBlog && (
            <button
              onClick={() => setShowUrlLookup(!showUrlLookup)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              title="Lookup blog directly by blogspot URL or ID"
            >
              <span>Direct URL / ID Lookup</span>
            </button>
          )}
          <button
            onClick={onRefreshBlogs}
            disabled={isLoadingBlogs}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition active:scale-95 disabled:opacity-60"
            title="Fetch blogs and sync live catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBlogs ? 'animate-spin' : ''}`} />
            <span>{isLoadingBlogs ? 'Syncing Blogs...' : 'Sync Blogs'}</span>
          </button>
        </div>
      </div>

      {/* Direct URL / ID Lookup Collapsible Bar */}
      {showUrlLookup && (
        <form
          onSubmit={handleDirectLookup}
          className="p-4 bg-slate-900 border border-orange-500/30 rounded-2xl space-y-2 shadow-lg animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Direct Blog Lookup by URL or Blog ID
            </span>
            <button
              type="button"
              onClick={() => setShowUrlLookup(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. https://myblog.blogspot.com or numeric blog ID..."
              value={directInput}
              onChange={(e) => setDirectInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={isLookingUp || !directInput.trim()}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              {isLookingUp ? 'Fetching...' : 'Fetch Blog'}
            </button>
          </div>
          {lookupError && (
            <p className="text-[11px] text-red-400">{lookupError}</p>
          )}
        </form>
      )}

      {/* Blogs Selection Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Discovered Blogs ({blogs.length})
          </h2>
          <span className="text-xs text-slate-500">
            Select a blog to inspect its articles and metadata
          </span>
        </div>

        {blogs.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No Blogger blogs discovered yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              If you have recently created a blog on blogger.com, verify API permissions or click
              "Sync Blogs" above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogs.map((blog) => {
              const isSelected = selectedBlog?.id === blog.id;
              return (
                <div
                  key={blog.id}
                  onClick={() => onSelectBlog(blog)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-850 bg-gradient-to-br from-slate-900 to-orange-950/20 border-orange-500/60 shadow-lg shadow-orange-500/10 ring-1 ring-orange-500/30'
                      : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-white line-clamp-1">
                        {blog.name}
                      </h3>
                      <a
                        href={blog.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-500 hover:text-orange-400 p-1"
                        title="Open on Blogger"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 min-h-[32px]">
                      {blog.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1 text-slate-300 font-medium">
                        <FileText className="w-3.5 h-3.5 text-orange-400" />
                        <span>{blog.posts?.totalItems || 0} posts</span>
                      </span>
                      {blog.pages && (
                        <span className="flex items-center space-x-1 text-slate-400 text-[11px]">
                          <span>{blog.pages.totalItems} pages</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 text-[11px] text-orange-400 font-semibold">
                      <span>{isSelected ? 'Active' : 'Inspect'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Blog Drill-Down & Posts Section */}
      {selectedBlog && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">{selectedBlog.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  {selectedBlog.status || 'LIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                URL:{' '}
                <a
                  href={selectedBlog.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:underline"
                >
                  {selectedBlog.url}
                </a>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onRefreshPosts}
                disabled={isLoadingPosts}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPosts ? 'animate-spin' : ''}`} />
                <span>Sync Posts</span>
              </button>
            </div>
          </div>

          {/* Search & Label Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search post title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>

            {/* Labels filter chips */}
            {allLabels.length > 0 && (
              <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none">
                <button
                  onClick={() => setSelectedLabel(null)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition ${
                    selectedLabel === null
                      ? 'bg-orange-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({posts.length})
                </button>
                {allLabels.map((lbl) => (
                  <button
                    key={lbl}
                    onClick={() => setSelectedLabel(selectedLabel === lbl ? null : lbl)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                      selectedLabel === lbl
                        ? 'bg-orange-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    #{lbl}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Posts List */}
          {isLoadingPosts ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-orange-400 mb-2" />
              <p className="text-xs">Fetching articles from Blogger API...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/60">
              <p className="text-xs">No posts matched the current query or filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-sm text-slate-100 hover:text-orange-400 transition cursor-pointer"
                        onClick={() => setActivePostModal(post)}
                      >
                        {post.title}
                      </h4>
                      {post.status && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {post.status}
                        </span>
                      )}
                    </div>

                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(post.published).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <UserIcon className="w-3 h-3 text-slate-500" />
                        <span>{post.author?.displayName || 'Author'}</span>
                      </span>
                      {post.replies && (
                        <span className="flex items-center space-x-1">
                          <MessageSquare className="w-3 h-3 text-slate-500" />
                          <span>{post.replies.totalItems} comments</span>
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {post.labels && post.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {post.labels.map((l) => (
                          <span
                            key={l}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-orange-300 font-mono"
                          >
                            #{l}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setActivePostModal(post)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read Preview</span>
                    </button>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-orange-400 rounded-lg bg-slate-800/40 hover:bg-slate-800 transition"
                      title="Open on Blogger"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Modal Preview */}
      {activePostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{activePostModal.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Published {new Date(activePostModal.published).toLocaleString()} by{' '}
                  {activePostModal.author?.displayName}
                </p>
              </div>
              <button
                onClick={() => setActivePostModal(null)}
                className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="border-t border-slate-800 pt-4">
              {activePostModal.content ? (
                <div
                  className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: activePostModal.content }}
                />
              ) : (
                <p className="text-xs text-slate-500 italic">No content body available.</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
              <a
                href={activePostModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:underline flex items-center space-x-1"
              >
                <span>View Live Article on Blogger</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setActivePostModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
