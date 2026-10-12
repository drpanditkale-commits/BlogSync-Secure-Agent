import { ActivityLog } from '../types';

// In-memory log buffer
let logsList: ActivityLog[] = [];
let listeners: ((logs: ActivityLog[]) => void)[] = [];

// Lightweight browser-compatible SHA-256 generator for audit hash
export const computeSha256 = async (message: string): Promise<string> => {
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Simple fallback hash
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
};

export const logActivity = async (
  entry: Omit<ActivityLog, 'id' | 'timestamp' | 'hash'>
): Promise<ActivityLog> => {
  const timestamp = new Date().toISOString();
  const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const payloadToHash = JSON.stringify({
    id,
    timestamp,
    action: entry.action,
    category: entry.category,
    status: entry.status,
    description: entry.description,
    userEmail: entry.userEmail,
    details: entry.details,
    targetResource: entry.targetResource,
  });

  const hash = await computeSha256(payloadToHash);

  const fullLog: ActivityLog = {
    ...entry,
    id,
    timestamp,
    hash,
  };

  logsList = [fullLog, ...logsList].slice(0, 500); // keep up to 500 recent audit logs
  notifyListeners();
  return fullLog;
};

export const getLogs = (): ActivityLog[] => {
  return [...logsList];
};

export const clearLogs = () => {
  logsList = [];
  notifyListeners();
};

export const subscribeLogs = (callback: (logs: ActivityLog[]) => void) => {
  listeners.push(callback);
  callback([...logsList]);
  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
};

const notifyListeners = () => {
  listeners.forEach((cb) => cb([...logsList]));
};

// Seed initial system boot log
logActivity({
  action: 'CREDENTIALS_VERIFY',
  category: 'SECURITY',
  status: 'INFO',
  description: 'Application session initialized with Google OAuth 2.0 security policies.',
  targetResource: 'gen-lang-client-0451884163',
  details: {
    runtime: 'Google AI Studio Preview',
    protocol: 'OAuth 2.0 + PKCE',
    storageSecurity: 'Bearer Token Direct Transmission',
  },
});
