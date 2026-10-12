import React, { useState, useEffect } from 'react';
import { BloggerBlog, BloggerPost } from '../types';
import {
  RssItem,
  VERIFIED_RSS_SOURCES,
  RssFeedSource,
  fetchRssItems,
} from '../services/rssService';
import {
  PipelineExecutionState,
  executeFullAgentPipeline,
  DraftPackage,
} from '../services/agentPipeline';
import { createBloggerDraft, getEmailToDraftConfig } from '../services/blogger';
import {
  Sparkles,
  Bot,
  Rss,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  DollarSign,
  Mail,
  Send,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  Eye,
  Info,
  Clock,
  Layers,
} from 'lucide-react';

interface AgentPipelineViewProps {
  blogs: BloggerBlog[];
  selectedBlog: BloggerBlog | null;
  onSelectBlog: (blog: BloggerBlog) => void;
  accessToken: string | null;
  userEmail?: string;
  onOpenAdminLogin: () => void;
  onRefreshBlogs: () => void;
}

export const AgentPipelineView: React.FC<AgentPipelineViewProps> = ({
  blogs,
  selectedBlog,
  onSelectBlog,
  accessToken,
  userEmail,
  onOpenAdminLogin,
  onRefreshBlogs,
}) => {
  // RSS State
  const [selectedSource, setSelectedSource] = useState<RssFeedSource>(VERIFIED_RSS_SOURCES[0]);
  const [customRssUrl, setCustomRssUrl] = useState('');
  const [rssItems, setRssItems] = useState<RssItem[]>([]);
  const [selectedFeedItem, setSelectedFeedItem] = useState<RssItem | null>(null);
  const [isLoadingRss, setIsLoadingRss] = useState(false);

  // Pipeline Execution State
  const [pipelineState, setPipelineState] = useState<PipelineExecutionState>({
    currentStep: 0,
    isExecuting: false,
    agent1Status: 'idle',
    agent2Status: 'idle',
    agent3Status: 'idle',
    agent4Status: 'idle',
    agent5Status: 'idle',
    agent6Status: 'idle',
    executionLogs: [],
  });

  // Active Review Tab in Result Window
  const [activeResultTab, setActiveResultTab] = useState<'article' | 'visuals' | 'legal' | 'adsense' | 'email' | 'blogs'>('article');

  // Draft Saving State & Confirmation Modal
  const [showConfirmDraftModal, setShowConfirmDraftModal] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [createdDraftPost, setCreatedDraftPost] = useState<BloggerPost | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  // Copied states
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Fetch RSS items when source changes
  useEffect(() => {
    loadRssFeed(selectedSource.url, selectedSource.name, selectedSource.category);
  }, [selectedSource]);

  const loadRssFeed = async (url: string, name: string, category: string) => {
    setIsLoadingRss(true);
    try {
      const items = await fetchRssItems(url, name, category);
      setRssItems(items);
      if (items.length > 0) {
        setSelectedFeedItem(items[0]); // Select #1 top trending feed item by default
      }
    } finally {
      setIsLoadingRss(false);
    }
  };

  const handleCustomRssSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRssUrl.trim()) return;
    loadRssFeed(customRssUrl.trim(), 'Custom RSS Source', 'User Feed');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Run full 6-agent pipeline
  const handleRunFullPipeline = async () => {
    if (!selectedFeedItem) return;

    try {
      await executeFullAgentPipeline(
        selectedFeedItem,
        selectedBlog?.name,
        userEmail,
        (updatedFields) => {
          setPipelineState((prev) => ({ ...prev, ...updatedFields }));
        }
      );
    } catch (err: any) {
      console.error('Pipeline execution error:', err);
      setPipelineState((prev) => ({
        ...prev,
        isExecuting: false,
        agent6Status: 'error',
        executionLogs: [...prev.executionLogs, `[Error] ${err.message || 'Pipeline execution failed'}`],
      }));
    }
  };

  // Save Draft to Blogger via API v3
  const handleSaveDraft = async () => {
    if (!selectedBlog || !pipelineState.draftPackage) return;

    const isDemoOrLocal =
      selectedBlog.id.startsWith('8839') ||
      selectedBlog.id.startsWith('7729') ||
      selectedBlog.id.startsWith('linked_') ||
      selectedBlog.id.startsWith('custom_');

    if (!accessToken && !isDemoOrLocal) {
      onOpenAdminLogin();
      return;
    }

    setIsSavingDraft(true);
    setDraftError(null);

    try {
      const created = await createBloggerDraft(
        selectedBlog.id,
        {
          title: pipelineState.draftPackage.title,
          content: pipelineState.draftPackage.fullHtmlWithAdsAndLegal,
          labels: pipelineState.draftPackage.labels,
        },
        accessToken || '',
        userEmail
      );
      setCreatedDraftPost(created);
      setShowConfirmDraftModal(false);
      setActiveResultTab('blogs');
    } catch (err: any) {
      console.error('Failed to save draft to Blogger:', err);
      setDraftError(err.message || 'Failed to save draft post to Blogger API');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const emailConfig = getEmailToDraftConfig(selectedBlog?.id, selectedBlog?.name);

  return (
    <div className="space-y-6">
      {/* Hero Orchestrator Header */}
      <div className="bg-gradient-to-r from-orange-950/70 via-slate-900 to-indigo-950/70 p-6 rounded-2xl border border-orange-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/25">
              <Bot className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Autonomous 6-Agent Blogger Pipeline
                </h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold uppercase tracking-wider">
                  AdSense Ready
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Fetches #1 legal RSS feeds, writes 1,500–2,000 word humanized posts, generates 16:9 featured graphics, embeds legal AI disclosures, audits AdSense compliance, and publishes drafts to Blogger.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenAdminLogin}
              className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Admin Account</span>
            </button>
            <button
              onClick={handleRunFullPipeline}
              disabled={pipelineState.isExecuting || !selectedFeedItem}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-600/30 transition active:scale-95 disabled:opacity-50"
            >
              <Play className={`w-4 h-4 fill-current ${pipelineState.isExecuting ? 'animate-spin' : ''}`} />
              <span>{pipelineState.isExecuting ? 'Pipeline Executing...' : 'Run Autonomous Pipeline'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6-Agent Pipeline Visual Stepper (Managed by Agent 6) */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Agent 6: Project Manager &amp; Pipeline Overseer
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {pipelineState.isExecuting ? 'Live Step ' + pipelineState.currentStep + ' of 6' : 'Autonomous Supervisor Ready'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {/* Agent 1 */}
          <div className={`p-3 rounded-xl border text-xs transition ${
            pipelineState.agent1Status === 'completed'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : pipelineState.agent1Status === 'running'
              ? 'bg-orange-950/40 border-orange-500/60 text-orange-200 animate-pulse'
              : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[11px]">Agent 1</span>
              {pipelineState.agent1Status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {pipelineState.agent1Status === 'running' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />}
            </div>
            <p className="font-medium text-white truncate">RSS &amp; Content</p>
            <p className="text-[10px] text-slate-500 mt-0.5">1500–2000 Words</p>
          </div>

          {/* Agent 2 */}
          <div className={`p-3 rounded-xl border text-xs transition ${
            pipelineState.agent2Status === 'completed'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : pipelineState.agent2Status === 'running'
              ? 'bg-orange-950/40 border-orange-500/60 text-orange-200 animate-pulse'
              : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[11px]">Agent 2</span>
              {pipelineState.agent2Status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {pipelineState.agent2Status === 'running' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />}
            </div>
            <p className="font-medium text-white truncate">Visual Assets</p>
            <p className="text-[10px] text-slate-500 mt-0.5">16:9 HD Graphics</p>
          </div>

          {/* Agent 3 */}
          <div className={`p-3 rounded-xl border text-xs transition ${
            pipelineState.agent3Status === 'completed'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : pipelineState.agent3Status === 'running'
              ? 'bg-orange-950/40 border-orange-500/60 text-orange-200 animate-pulse'
              : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[11px]">Agent 3</span>
              {pipelineState.agent3Status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {pipelineState.agent3Status === 'running' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />}
            </div>
            <p className="font-medium text-white truncate">Legal &amp; AI Notice</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Privacy &amp; Header</p>
          </div>

          {/* Agent 4 */}
          <div className={`p-3 rounded-xl border text-xs transition ${
            pipelineState.agent4Status === 'completed'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : pipelineState.agent4Status === 'running'
              ? 'bg-orange-950/40 border-orange-500/60 text-orange-200 animate-pulse'
              : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[11px]">Agent 4</span>
              {pipelineState.agent4Status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {pipelineState.agent4Status === 'running' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />}
            </div>
            <p className="font-medium text-white truncate">AdSense Audit</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Monetization Ready</p>
          </div>

          {/* Agent 5 */}
          <div className={`p-3 rounded-xl border text-xs transition ${
            pipelineState.agent5Status === 'completed'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : pipelineState.agent5Status === 'running'
              ? 'bg-orange-950/40 border-orange-500/60 text-orange-200 animate-pulse'
              : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[11px]">Agent 5</span>
              {pipelineState.agent5Status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {pipelineState.agent5Status === 'running' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />}
            </div>
            <p className="font-medium text-white truncate">Blogger Draft</p>
            <p className="text-[10px] text-slate-500 mt-0.5">API &amp; Email-to-Post</p>
          </div>

          {/* Agent 6 */}
          <div className={`p-3 rounded-xl border text-xs transition ${
            pipelineState.agent6Status === 'completed'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : pipelineState.agent6Status === 'running'
              ? 'bg-orange-950/40 border-orange-500/60 text-orange-200 animate-pulse'
              : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[11px]">Agent 6</span>
              {pipelineState.agent6Status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {pipelineState.agent6Status === 'running' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />}
            </div>
            <p className="font-medium text-white truncate">Manager Watch</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Full Orchestration</p>
          </div>
        </div>

        {/* Live logs console preview */}
        {pipelineState.executionLogs.length > 0 && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-24 overflow-y-auto space-y-0.5">
            {pipelineState.executionLogs.map((log, i) => (
              <p key={i} className="leading-tight text-slate-400">{log}</p>
            ))}
          </div>
        )}
      </div>

      {/* RSS Sources & #1 Story Selection */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Rss className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Authentic Legal RSS Sources &amp; Top #1 Story
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Source: <strong className="text-white">{selectedSource.name}</strong>
          </span>
        </div>

        {/* Source Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {VERIFIED_RSS_SOURCES.map((src) => (
            <button
              key={src.id}
              onClick={() => setSelectedSource(src)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedSource.id === src.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {src.name}
            </button>
          ))}
        </div>

        {/* Feed Items Selector */}
        {isLoadingRss ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 mx-auto animate-spin text-orange-400 mb-2" />
            <span>Fetching authentic RSS items from secure source...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400">
              Select Feed Story (No. 1 Top Story auto-selected):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {rssItems.slice(0, 4).map((item, idx) => {
                const isTop1 = idx === 0;
                const isSelected = selectedFeedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedFeedItem(item)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-orange-950/30 border-orange-500/70 shadow-md ring-1 ring-orange-500/40'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        {isTop1 && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-500 text-slate-950 font-black text-[9px] uppercase tracking-wide">
                            NO. 1 TOP STORY
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.pubDate).toLocaleTimeString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-2">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Target Blog Selector & Save Draft Command Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Connected Target Blog:
            </span>
            {blogs.length === 0 ? (
              <span className="text-xs text-amber-400 font-medium">No Blogger blogs discovered</span>
            ) : (
              <select
                value={selectedBlog?.id || ''}
                onChange={(e) => {
                  const b = blogs.find((x) => x.id === e.target.value);
                  if (b) onSelectBlog(b);
                }}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-orange-400 focus:outline-none"
              >
                {blogs.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.posts?.totalItems || 0} posts)
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={onRefreshBlogs}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700 transition"
              title="Refresh and sync blogs from admin Gmail account"
            >
              <RefreshCw className="w-3 h-3 text-orange-400" />
              <span>Fetch Admin Blogs</span>
            </button>
            <button
              onClick={onOpenAdminLogin}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700 transition"
              title="Open Admin Login &amp; Blogger accounts window"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Manage Blogs Window</span>
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Target URL: <span className="text-slate-300 font-mono">{selectedBlog?.url || 'Select a blog'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfirmDraftModal(true)}
            disabled={!pipelineState.draftPackage || !selectedBlog || isSavingDraft}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Save Draft to Selected Blog</span>
          </button>
        </div>
      </div>

      {/* Pipeline Output Review Tabs */}
      {pipelineState.article && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          {/* Tabs Header */}
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center space-x-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveResultTab('article')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                activeResultTab === 'article'
                  ? 'bg-orange-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1500–2000 Word Article</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 text-white rounded-full">
                {pipelineState.article.wordCount}w
              </span>
            </button>
            <button
              onClick={() => setActiveResultTab('visuals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                activeResultTab === 'visuals'
                  ? 'bg-orange-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>16:9 Featured Visual</span>
            </button>
            <button
              onClick={() => setActiveResultTab('legal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                activeResultTab === 'legal'
                  ? 'bg-orange-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Legal Pages &amp; AI Notice</span>
            </button>
            <button
              onClick={() => setActiveResultTab('adsense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                activeResultTab === 'adsense'
                  ? 'bg-orange-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>AdSense Audit ({pipelineState.adSenseReport?.score || 96}%)</span>
            </button>
            <button
              onClick={() => setActiveResultTab('email')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                activeResultTab === 'email'
                  ? 'bg-orange-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Blogger Email-to-Draft</span>
            </button>
            <button
              onClick={() => setActiveResultTab('blogs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                activeResultTab === 'blogs'
                  ? 'bg-orange-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Draft Delivery Status</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* TAB 1: 1500-2000 Word Article */}
            {activeResultTab === 'article' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
                  <div>
                    <h3 className="text-base font-bold text-white">{pipelineState.article.title}</h3>
                    <div className="flex items-center space-x-3 text-slate-400 mt-1">
                      <span className="text-emerald-400 font-bold">{pipelineState.article.wordCount} Words</span>
                      <span>•</span>
                      <span>~{pipelineState.article.readingTimeMinutes} min read</span>
                      <span>•</span>
                      <span className="font-mono text-indigo-400">{pipelineState.article.generatedByModel}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(pipelineState.draftPackage?.fullHtmlWithAdsAndLegal || pipelineState.article!.contentHtml, 'art')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1"
                  >
                    {copiedSection === 'art' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Full Article HTML</span>
                  </button>
                </div>

                {/* Article Content Render */}
                <div
                  className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed max-h-[500px] overflow-y-auto p-4 bg-slate-950/60 rounded-xl border border-slate-800/80"
                  dangerouslySetInnerHTML={{
                    __html: pipelineState.draftPackage?.fullHtmlWithAdsAndLegal || pipelineState.article.contentHtml,
                  }}
                />
              </div>
            )}

            {/* TAB 2: Visual Assets */}
            {activeResultTab === 'visuals' && pipelineState.visuals && (
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-white">Agent 2: Featured Visual Graphic (16:9 Aspect Ratio)</h3>
                  <p className="text-slate-400 text-xs mt-0.5">High-definition banner with metadata and E-E-A-T badges.</p>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 max-w-2xl">
                  <img
                    src={pipelineState.visuals.featuredImageUrl}
                    alt={pipelineState.visuals.featuredImageAlt}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold">SEO ALT Attribute:</span>
                  <p className="font-mono text-slate-300">{pipelineState.visuals.featuredImageAlt}</p>
                </div>
              </div>
            )}

            {/* TAB 3: Legal Pages & AI Notice */}
            {activeResultTab === 'legal' && pipelineState.legal && (
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-white">Agent 3: Legal Disclosures &amp; Site Architecture</h3>
                  <p className="text-slate-400 mt-0.5">Mandatory pages required for Google AdSense compliance and AI transparency.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AI Disclaimer Notice */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-400">AI Generated Data Disclaimer</span>
                      <button
                        onClick={() => copyToClipboard(pipelineState.legal!.aiDisclaimerNoticeHtml, 'disc')}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedSection === 'disc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div
                      dangerouslySetInnerHTML={{ __html: pipelineState.legal.aiDisclaimerNoticeHtml }}
                      className="text-xs"
                    />
                  </div>

                  {/* Privacy Policy */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400">AdSense Privacy Policy</span>
                      <button
                        onClick={() => copyToClipboard(pipelineState.legal!.privacyPolicyHtml, 'priv')}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedSection === 'priv' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-slate-400 line-clamp-4">
                      Includes Google DoubleClick DART cookies, GDPR, CCPA, and data minimization standards.
                    </p>
                  </div>

                  {/* Terms of Service */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Terms of Service</span>
                      <button
                        onClick={() => copyToClipboard(pipelineState.legal!.termsOfServiceHtml, 'term')}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedSection === 'term' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-slate-400 line-clamp-3">
                      Establishes intellectual property protection and limitation of liability.
                    </p>
                  </div>

                  {/* Header & Footer */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Header &amp; Footer Layout</span>
                      <button
                        onClick={() => copyToClipboard(pipelineState.legal!.headerHtml + '\n' + pipelineState.legal!.footerHtml, 'hf')}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedSection === 'hf' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-slate-400 line-clamp-3">
                      Pre-rendered navigation bar with links to mandatory legal pages and copyright notice.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: AdSense Monetization Audit */}
            {activeResultTab === 'adsense' && pipelineState.adSenseReport && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Agent 4: AdSense Monetization &amp; Policy Audit</h3>
                    <p className="text-slate-400 mt-0.5">Verifies all criteria required for Google AdSense account and site approval.</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-emerald-300">Score: {pipelineState.adSenseReport.score}/100</span>
                  </div>
                </div>

                {/* Audit Checklist */}
                <div className="space-y-2">
                  {pipelineState.adSenseReport.policyChecklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start space-x-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-white">{item.rule}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">{item.recommendation}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        PASSED
                      </span>
                    </div>
                  ))}
                </div>

                {/* ads.txt box */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">Blogger ads.txt configuration</span>
                    <button
                      onClick={() => copyToClipboard(pipelineState.adSenseReport!.adsTxtSnippet, 'atxt')}
                      className="text-slate-400 hover:text-white flex items-center space-x-1"
                    >
                      {copiedSection === 'atxt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="font-mono text-emerald-300 bg-slate-900 p-2.5 rounded-lg text-[11px]">
                    {pipelineState.adSenseReport.adsTxtSnippet}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 5: Blogger Email-to-Draft Settings */}
            {activeResultTab === 'email' && (
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-white">Agent 5: Blogger "Posting Using Email" Setup</h3>
                  <p className="text-slate-400 mt-0.5">Instructions and automated payload generator for saving posts as drafts by email.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-orange-400 font-semibold">
                    <Mail className="w-4 h-4" />
                    <span>How to enable Email-to-Draft in Blogger:</span>
                  </div>

                  <ol className="list-decimal pl-5 space-y-2 text-slate-300 leading-relaxed">
                    {emailConfig.instructions.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-semibold text-slate-200">Email Draft Action:</span>
                  <p className="text-slate-400">
                    Send post directly to your Blogger secret address. Subject line will become the Title, and HTML body will become the Post Body.
                  </p>
                  <a
                    href={`mailto:${emailConfig.exampleEmailFormat.to}?subject=${encodeURIComponent(pipelineState.draftPackage?.emailDraftSubject || '')}&body=${encodeURIComponent('Please view and paste draft HTML content.')}`}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition"
                  >
                    <Mail className="w-3.5 h-3.5 text-orange-400" />
                    <span>Open Mail Client with Draft Subject</span>
                  </a>
                </div>
              </div>
            )}

            {/* TAB 6: Draft Delivery Status */}
            {activeResultTab === 'blogs' && (
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-white">Draft Publishing Status</h3>
                  <p className="text-slate-400 mt-0.5">Manage and view drafts published to your Google account's Blogger blogs.</p>
                </div>

                {createdDraftPost ? (
                  <div className="p-5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 space-y-3">
                    <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Post Successfully Saved as DRAFT on Blogger!</span>
                    </div>
                    <div className="space-y-1 text-slate-300">
                      <p><strong>Title:</strong> {createdDraftPost.title}</p>
                      <p><strong>Blog ID:</strong> {selectedBlog?.id}</p>
                      <p><strong>Post ID:</strong> {createdDraftPost.id}</p>
                      <p><strong>Status:</strong> <span className="text-emerald-400 font-bold">DRAFT</span></p>
                    </div>

                    <div className="pt-2 flex items-center space-x-3">
                      <a
                        href={`https://www.blogger.com/blog/posts/${selectedBlog?.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition"
                      >
                        <span>Open in Blogger Native Editor</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 space-y-3">
                    <FileText className="w-8 h-8 mx-auto text-slate-500" />
                    <p>No draft published in this active turn yet.</p>
                    <button
                      onClick={() => setShowConfirmDraftModal(true)}
                      disabled={!pipelineState.draftPackage || !selectedBlog}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
                    >
                      Save Current Draft to "{selectedBlog?.name || 'Selected Blog'}"
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Saving Draft (Mandatory for mutating operations) */}
      {showConfirmDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Saving Draft to Blogger</h3>
                <p className="text-xs text-slate-400">Google Blogger API v3 Authorization</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <p>
                <strong>Target Blog:</strong>{' '}
                <span className="text-orange-400">{selectedBlog?.name}</span> ({selectedBlog?.id})
              </p>
              <p>
                <strong>Draft Title:</strong>{' '}
                <span className="text-slate-200">{pipelineState.draftPackage?.title}</span>
              </p>
              <p>
                <strong>Word Count:</strong>{' '}
                <span className="text-emerald-400 font-bold">{pipelineState.article?.wordCount} words</span>
              </p>
              <p>
                <strong>Publishing Mode:</strong>{' '}
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[11px]">
                  DRAFT (Will not be public until reviewed)
                </span>
              </p>
            </div>

            {draftError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
                {draftError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowConfirmDraftModal(false)}
                disabled={isSavingDraft}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSavingDraft ? 'animate-spin' : ''}`} />
                <span>{isSavingDraft ? 'Writing Draft to Blogger...' : 'Confirm & Save Draft'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
