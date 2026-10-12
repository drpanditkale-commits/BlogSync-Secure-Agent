import React, { useState } from 'react';
import {
  BloggerBlog,
  BloggerPost,
  OpalAgentInsight,
} from '../types';
import {
  analyzeBlogData,
  processOpalAgentQuery,
  AgentChatMessage,
} from '../services/opalAgent';
import { logActivity } from '../services/activityLogger';
import {
  Sparkles,
  Send,
  Zap,
  TrendingUp,
  ShieldCheck,
  Tag,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  FileText,
  Clock,
  ArrowRight,
  Bot,
  RefreshCw,
} from 'lucide-react';

interface OpalAgentPanelProps {
  blogs: BloggerBlog[];
  postsMap: Record<string, BloggerPost[]>;
  onTriggerExport: () => void;
  onRefreshData: () => void;
  onOpenCredentials: () => void;
  userEmail?: string;
}

export const OpalAgentPanel: React.FC<OpalAgentPanelProps> = ({
  blogs,
  postsMap,
  onTriggerExport,
  onRefreshData,
  onOpenCredentials,
  userEmail,
}) => {
  const [queryInput, setQueryInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'init_1',
      sender: 'opal',
      text: `Hello! I am your Google OPAL Agent for Blogger. I automatically inspect your Google-authenticated blogs, audit content health, calculate engagement metrics, and prepare tamper-proof activity logs for Google Cloud Storage export. What would you like to analyze?`,
      timestamp: new Date().toLocaleTimeString(),
      actions: [
        { label: '📊 Analyze All Blogs', actionId: 'run_audit' },
        { label: '🛡️ Cloud Storage Export', actionId: 'export_logs' },
        { label: '🔑 Check Credentials', actionId: 'open_credentials' },
      ],
    },
  ]);

  const insights: OpalAgentInsight = analyzeBlogData(blogs, postsMap);

  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || queryInput;
    if (!q.trim()) return;

    const userMsg: AgentChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQueryInput('');
    setIsProcessing(true);

    await logActivity({
      action: 'OPAL_AGENT_ANALYSIS',
      category: 'AGENT',
      status: 'INFO',
      description: `User prompted OPAL Agent: "${q}"`,
      userEmail,
      details: { query: q },
    });

    setTimeout(async () => {
      const response = processOpalAgentQuery(q, blogs, postsMap);
      const agentMsg: AgentChatMessage = {
        id: `opal_${Date.now()}`,
        sender: 'opal',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, agentMsg]);
      setIsProcessing(false);

      if (response.actionSuggestion === 'export_logs') {
        // Can offer direct export
      }
    }, 600);
  };

  const handleActionClick = (actionId: string) => {
    if (actionId === 'run_audit') {
      onRefreshData();
      handleSendMessage('Run content health audit on all discovered blogs');
    } else if (actionId === 'export_logs') {
      onTriggerExport();
    } else if (actionId === 'open_credentials') {
      onOpenCredentials();
    }
  };

  return (
    <div className="space-y-6">
      {/* Agent Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900/60 p-6 rounded-2xl border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white">Google OPAL Blogger Agent</h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold tracking-wide">
                  AI &amp; Automation Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Autonomous agent indexing Blogger metadata, calculating publication velocity, and
                enforcing secure Google Cloud Storage audit exports via OAuth 2.0.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleActionClick('run_audit')}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Run Auto-Scan</span>
            </button>
            <button
              onClick={onTriggerExport}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Export to Storage</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics & Synthesis Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Discovered Blogs</span>
            <FileText className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{insights.totalBlogs}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {insights.averagePostsPerBlog} avg posts / blog
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Catalog Posts</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{insights.totalPosts}</p>
          <p className="text-[11px] text-slate-500 mt-1">Live articles registered</p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Latest Publication</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-sm font-bold text-slate-200 mt-2 truncate">
            {insights.latestPostDate
              ? new Date(insights.latestPostDate).toLocaleDateString()
              : 'None Yet'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Recency velocity tracked</p>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Publication Health</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center space-x-1.5 mt-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-300">
              {insights.healthStatus === 'HEALTHY' ? 'Optimized' : 'Ready'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">OAuth security verified</p>
        </div>
      </div>

      {/* Two Column Layout: Recommendations & Topic Distribution vs Chat Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recommendations & Labels (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top Labels Distribution */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Top Content Topics &amp; Labels</span>
            </h3>
            {insights.topLabels.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                No labels detected across fetched posts yet. Add tags on Blogger to organize your
                topics.
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {insights.topLabels.map(({ label, count }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300 text-xs">#{label}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 text-[10px] font-semibold">
                      {count} {count === 1 ? 'post' : 'posts'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agent Recommendations */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>OPAL Agent Recommendations</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              {insights.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Conversational Agent Console (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col h-[520px] shadow-xl overflow-hidden">
          {/* Console Header */}
          <div className="px-5 py-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200">
                Interactive OPAL Agent Terminal
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Blogger API v3 + Storage RPC
            </span>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {/* Optional action buttons */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.actions.map((act) => (
                      <button
                        key={act.actionId}
                        onClick={() => handleActionClick(act.actionId)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition"
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center space-x-2 text-xs text-indigo-400 p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>OPAL agent synthesizing query...</span>
              </div>
            )}
          </div>

          {/* Suggested Quick Prompt Chips */}
          <div className="px-5 py-2 bg-slate-950/40 border-t border-slate-800/60 flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleSendMessage('How many blogs do I have?')}
              className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 whitespace-nowrap transition"
            >
              "How many blogs do I have?"
            </button>
            <button
              onClick={() => handleSendMessage('What is my latest article?')}
              className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 whitespace-nowrap transition"
            >
              "What is my latest article?"
            </button>
            <button
              onClick={() => handleSendMessage('Export activity logs to Cloud Storage')}
              className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 whitespace-nowrap transition"
            >
              "Export activity logs"
            </button>
          </div>

          {/* Query Input Bar */}
          <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ask OPAL agent about your blogs, posts, or exports..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!queryInput.trim() || isProcessing}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
