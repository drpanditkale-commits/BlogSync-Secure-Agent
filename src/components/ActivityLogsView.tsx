import React, { useState } from 'react';
import { ActivityLog, CloudStorageFile } from '../types';
import {
  downloadLogsAsJson,
  downloadLogsAsCsv,
  getDefaultBucketName,
  StorageExportResult,
} from '../services/cloudStorage';
import {
  ShieldCheck,
  HardDrive,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Hash,
  Eye,
  FileCode,
  FolderOpen,
  Search,
  X,
} from 'lucide-react';

interface ActivityLogsViewProps {
  logs: ActivityLog[];
  onTriggerExportToStorage: (bucketName: string) => Promise<StorageExportResult | null>;
  isExporting: boolean;
  accessToken: string | null;
  userEmail?: string;
  storageFiles: CloudStorageFile[];
  onRefreshStorageFiles: () => void;
  isLoadingStorageFiles: boolean;
}

export const ActivityLogsView: React.FC<ActivityLogsViewProps> = ({
  logs,
  onTriggerExportToStorage,
  isExporting,
  accessToken,
  userEmail,
  storageFiles,
  onRefreshStorageFiles,
  isLoadingStorageFiles,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [customBucket, setCustomBucket] = useState(getDefaultBucketName());
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportResult, setExportResult] = useState<StorageExportResult | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesCat = filterCategory === 'ALL' || log.category === filterCategory;
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.category.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q) ||
      (log.targetResource && log.targetResource.toLowerCase().includes(q)) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(q)) ||
      (log.hash && log.hash.toLowerCase().includes(q));

    return matchesCat && matchesAction && matchesStatus && matchesSearch;
  });

  const handleStartExport = async () => {
    const res = await onTriggerExportToStorage(customBucket);
    if (res) {
      setExportResult(res);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 p-6 rounded-2xl border border-emerald-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white">
                Tamper-Proof Audit Trail &amp; Cloud Storage Exporter
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Every Blogger API request, auth state shift, and agent discovery is signed with
              cryptographic SHA-256 hashes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export to Cloud Storage Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition active:scale-95"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Export to Cloud Storage Bucket</span>
          </button>

          {/* Quick Download JSON/CSV */}
          <div className="flex items-center space-x-1 bg-slate-800 rounded-xl p-0.5 border border-slate-700">
            <button
              onClick={() => downloadLogsAsJson(logs)}
              className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white text-xs font-medium hover:bg-slate-700 transition flex items-center space-x-1"
              title="Download JSON"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>JSON</span>
            </button>
            <button
              onClick={() => downloadLogsAsCsv(logs)}
              className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white text-xs font-medium hover:bg-slate-700 transition flex items-center space-x-1"
              title="Download CSV"
            >
              <Download className="w-3 h-3 text-indigo-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cloud Storage Files Explorer section */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Cloud Storage Bucket Archives ({storageFiles.length})
            </h2>
            <span className="text-[10px] font-mono text-slate-400">
              gs://{customBucket}/blogger_activity_logs/
            </span>
          </div>
          <button
            onClick={onRefreshStorageFiles}
            disabled={isLoadingStorageFiles}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingStorageFiles ? 'animate-spin' : ''}`} />
            <span>Refresh Bucket</span>
          </button>
        </div>

        {storageFiles.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            No exported log archives detected in the bucket yet. Click "Export to Cloud Storage
            Bucket" above to upload your first session archive.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {storageFiles.map((f) => (
              <div
                key={f.name}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="truncate pr-2">
                  <p className="font-mono text-slate-200 truncate">{f.name.split('/').pop()}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {f.size ? `${Math.round(parseInt(f.size, 10) / 1024)} KB` : 'JSON file'}
                    {f.updated && ` • ${new Date(f.updated).toLocaleDateString()}`}
                  </p>
                </div>
                {f.mediaLink && (
                  <a
                    href={f.mediaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-slate-400 hover:text-emerald-400"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters Toolbar with Search Bar */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-3 text-xs shadow-md">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity logs by action type (e.g. BLOGS_DISCOVER, AUTH_LOGIN, EXPORT), category, resource, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 flex items-center space-x-1 font-medium">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>Category:</span>
            </span>
            {['ALL', 'AUTH', 'BLOGGER_API', 'AGENT', 'STORAGE', 'SECURITY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                  filterCategory === cat
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Action Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Action:</span>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Actions</option>
                <option value="AUTH_LOGIN">AUTH_LOGIN</option>
                <option value="AUTH_LOGOUT">AUTH_LOGOUT</option>
                <option value="BLOGS_DISCOVER">BLOGS_DISCOVER</option>
                <option value="POSTS_FETCH">POSTS_FETCH</option>
                <option value="PAGES_FETCH">PAGES_FETCH</option>
                <option value="OPAL_AGENT_ANALYSIS">OPAL_AGENT_ANALYSIS</option>
                <option value="CLOUD_STORAGE_EXPORT">CLOUD_STORAGE_EXPORT</option>
                <option value="CREDENTIALS_VERIFY">CREDENTIALS_VERIFY</option>
                <option value="API_ERROR">API_ERROR</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
              </select>
            </div>

            {/* Match Counter & Reset */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 font-mono">
                {filteredLogs.length} of {logs.length} logs
              </span>
              {(searchQuery || filterCategory !== 'ALL' || filterAction !== 'ALL' || filterStatus !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterCategory('ALL');
                    setFilterAction('ALL');
                    setFilterStatus('ALL');
                  }}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">SHA-256 Signature</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No activity logs recorded matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : log.status === 'ERROR'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : log.status === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}
                      >
                        {log.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3" />}
                        {log.status === 'ERROR' && <XCircle className="w-3 h-3" />}
                        {log.status === 'WARNING' && <AlertTriangle className="w-3 h-3" />}
                        {log.status === 'INFO' && <Info className="w-3 h-3" />}
                        <span>{log.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                      {log.description}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {log.hash ? (
                        <div className="flex items-center space-x-1">
                          <span>{log.hash.substring(0, 10)}...</span>
                          <button
                            onClick={() => copyHash(log.hash!)}
                            className="hover:text-white"
                            title="Copy SHA-256 hash"
                          >
                            {copiedHash === log.hash ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="View Full Payload"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export to Cloud Storage Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Export Activity Logs to Cloud Storage
                </h3>
                <p className="text-xs text-slate-400">
                  Google OAuth 2.0 Direct Bucket Media Transmission
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Target Cloud Storage Bucket:
                </label>
                <input
                  type="text"
                  value={customBucket}
                  onChange={(e) => setCustomBucket(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1 text-slate-400">
                <p>
                  • Scope applied:{' '}
                  <span className="font-mono text-slate-300">
                    https://www.googleapis.com/auth/devstorage.read_write
                  </span>
                </p>
                <p>
                  • Total activity records to export:{' '}
                  <strong className="text-white">{logs.length} events</strong>
                </p>
                <p>
                  • Tamper verification: Includes cryptographically computed SHA-256 manifest.
                </p>
              </div>
            </div>

            {exportResult && (
              <div
                className={`p-3.5 rounded-xl text-xs space-y-1.5 border ${
                  exportResult.success
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-semibold">
                  {exportResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                  <span>
                    {exportResult.success
                      ? 'Upload Confirmed to Cloud Storage!'
                      : 'Storage Direct Push Notice'}
                  </span>
                </div>
                <p className="font-mono text-[11px] break-all">{exportResult.fileName}</p>
                {exportResult.message && <p>{exportResult.message}</p>}
                {exportResult.localFallbackAvailable && (
                  <div className="pt-2">
                    <button
                      onClick={() => downloadLogsAsJson(logs, exportResult.fileName)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs"
                    >
                      Download Verified JSON Copy
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportResult(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleStartExport}
                disabled={isExporting}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isExporting ? 'animate-spin' : ''}`} />
                <span>{isExporting ? 'Transmitting to Bucket...' : 'Confirm & Export'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Detail Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Activity Log Audit Record</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="font-mono text-slate-300">{selectedLog.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action:</span>
                <span className="font-semibold text-white">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="text-slate-300">{selectedLog.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SHA-256 Hash:</span>
                <span className="font-mono text-[10px] text-emerald-400 select-all">
                  {selectedLog.hash || 'None'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">Payload &amp; Metadata:</p>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
