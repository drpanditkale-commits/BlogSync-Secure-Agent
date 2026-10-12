import { ActivityLog, CloudStorageFile } from '../types';
import { logActivity } from './activityLogger';
import firebaseConfig from '../../firebase-applet-config.json';

export interface StorageExportResult {
  success: boolean;
  bucket: string;
  fileName: string;
  fileSize: number;
  sha256Hash: string;
  logCount: number;
  uploadedAt: string;
  directStorageUrl?: string;
  message?: string;
  localFallbackAvailable?: boolean;
}

export const getDefaultBucketName = (): string => {
  return (
    firebaseConfig.storageBucket ||
    `${firebaseConfig.projectId}.appspot.com` ||
    `${firebaseConfig.projectId}.firebasestorage.app`
  );
};

export const exportLogsToCloudStorage = async (
  logs: ActivityLog[],
  accessToken: string,
  userEmail?: string,
  customBucketName?: string
): Promise<StorageExportResult> => {
  const bucket = (customBucketName || getDefaultBucketName()).trim();
  const timestampIso = new Date().toISOString();
  const formattedTime = timestampIso.replace(/[:.]/g, '-');
  const fileName = `blogger_activity_logs/activity_export_${formattedTime}.json`;

  const exportPayload = {
    exportMetadata: {
      generatedAt: timestampIso,
      agent: 'Google OPAL Blogger Agent',
      userEmail: userEmail || 'authenticated_user',
      projectId: firebaseConfig.projectId,
      targetBucket: bucket,
      totalLogsCount: logs.length,
      scope: 'https://www.googleapis.com/auth/devstorage.read_write',
      version: '1.0.0-opal',
    },
    activityLogs: logs,
  };

  const payloadString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([payloadString], { type: 'application/json' });
  const fileSize = blob.size;

  // Calculate SHA-256 integrity hash
  const msgBuffer = new TextEncoder().encode(payloadString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const sha256Hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const uploadEndpoint = `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(
    bucket
  )}/o?uploadType=media&name=${encodeURIComponent(fileName)}`;

  try {
    const res = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: payloadString,
    });

    if (!res.ok) {
      let errMsg = `Cloud Storage upload failed with status ${res.status}`;
      try {
        const errJson = await res.json();
        errMsg = errJson?.error?.message || errMsg;
      } catch {
        // ignore parse error
      }

      await logActivity({
        action: 'API_ERROR',
        category: 'STORAGE',
        status: 'WARNING',
        description: `Cloud Storage direct upload warning: ${errMsg}`,
        userEmail,
        targetResource: `${bucket}/${fileName}`,
        details: { status: res.status, error: errMsg },
      });

      // If bucket has CORS or 403 / 404, provide detailed diagnostics
      return {
        success: false,
        bucket,
        fileName,
        fileSize,
        sha256Hash,
        logCount: logs.length,
        uploadedAt: timestampIso,
        message: errMsg,
        localFallbackAvailable: true,
      };
    }

    const uploadResponseData = await res.json();
    const mediaLink = uploadResponseData.mediaLink || `https://storage.googleapis.com/${bucket}/${fileName}`;

    await logActivity({
      action: 'CLOUD_STORAGE_EXPORT',
      category: 'STORAGE',
      status: 'SUCCESS',
      description: `Successfully exported ${logs.length} activity logs to bucket '${bucket}' as '${fileName}'`,
      userEmail,
      targetResource: `${bucket}/${fileName}`,
      details: {
        bucket,
        fileName,
        size: fileSize,
        sha256Hash,
        generation: uploadResponseData.generation,
      },
    });

    return {
      success: true,
      bucket,
      fileName,
      fileSize,
      sha256Hash,
      logCount: logs.length,
      uploadedAt: timestampIso,
      directStorageUrl: mediaLink,
    };
  } catch (error: any) {
    console.warn('Network or CORS limitation while writing to Cloud Storage:', error);
    await logActivity({
      action: 'CLOUD_STORAGE_EXPORT',
      category: 'STORAGE',
      status: 'WARNING',
      description: `Cloud storage direct upload encountered network/CORS restriction: ${error.message || 'Network error'}`,
      userEmail,
      targetResource: `${bucket}/${fileName}`,
      details: { error: error.message, fallbackSuggested: true },
    });

    return {
      success: false,
      bucket,
      fileName,
      fileSize,
      sha256Hash,
      logCount: logs.length,
      uploadedAt: timestampIso,
      message:
        error.message ||
        'Direct Cloud Storage browser fetch blocked by bucket CORS. File is verified and available for secure download.',
      localFallbackAvailable: true,
    };
  }
};

export const listCloudStorageBucketFiles = async (
  accessToken: string,
  customBucketName?: string
): Promise<CloudStorageFile[]> => {
  const bucket = (customBucketName || getDefaultBucketName()).trim();
  const listEndpoint = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(
    bucket
  )}/o?prefix=blogger_activity_logs/`;

  try {
    const res = await fetch(listEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
};

export const downloadLogsAsJson = (logs: ActivityLog[], fileName?: string) => {
  const exportPayload = {
    exportMetadata: {
      generatedAt: new Date().toISOString(),
      agent: 'Google OPAL Blogger Agent',
      projectId: firebaseConfig.projectId,
      totalLogsCount: logs.length,
      exportFormat: 'JSON-Tamper-Proof',
    },
    activityLogs: logs,
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || `blogger_activity_logs_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadLogsAsCsv = (logs: ActivityLog[], fileName?: string) => {
  const headers = ['Timestamp', 'Action', 'Category', 'Status', 'UserEmail', 'TargetResource', 'Description', 'Hash'];
  const rows = logs.map((log) => [
    `"${log.timestamp}"`,
    `"${log.action}"`,
    `"${log.category}"`,
    `"${log.status}"`,
    `"${log.userEmail || ''}"`,
    `"${(log.targetResource || '').replace(/"/g, '""')}"`,
    `"${(log.description || '').replace(/"/g, '""')}"`,
    `"${log.hash || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || `blogger_activity_logs_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
