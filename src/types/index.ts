export interface BloggerUser {
  id: string;
  displayName: string;
  url?: string;
  about?: string;
  blogs?: {
    self: string;
  };
}

export interface BloggerBlog {
  id: string;
  name: string;
  description?: string;
  url: string;
  published: string;
  updated: string;
  posts: {
    totalItems: number;
    selfLink?: string;
  };
  pages?: {
    totalItems: number;
    selfLink?: string;
  };
  status?: string;
  locale?: {
    language: string;
    country: string;
    variant: string;
  };
}

export interface BloggerPost {
  id: string;
  blog: {
    id: string;
  };
  published: string;
  updated: string;
  url: string;
  selfLink: string;
  title: string;
  content?: string;
  author: {
    id: string;
    displayName: string;
    url?: string;
    image?: {
      url: string;
    };
  };
  replies?: {
    totalItems: string | number;
    selfLink?: string;
  };
  labels?: string[];
  status?: 'LIVE' | 'DRAFT' | 'SCHEDULED';
}

export interface BloggerPage {
  id: string;
  blog: {
    id: string;
  };
  published: string;
  updated: string;
  url: string;
  title: string;
  content?: string;
  author: {
    displayName: string;
  };
  status?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action:
    | 'AUTH_LOGIN'
    | 'AUTH_LOGOUT'
    | 'BLOGS_DISCOVER'
    | 'POSTS_FETCH'
    | 'PAGES_FETCH'
    | 'OPAL_AGENT_ANALYSIS'
    | 'CLOUD_STORAGE_EXPORT'
    | 'CREDENTIALS_VERIFY'
    | 'API_ERROR';
  category: 'AUTH' | 'BLOGGER_API' | 'AGENT' | 'STORAGE' | 'SECURITY';
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  description: string;
  userEmail?: string;
  details?: Record<string, any>;
  targetResource?: string;
  hash?: string;
}

export interface CloudStorageFile {
  name: string;
  bucket: string;
  contentType?: string;
  size?: string;
  updated?: string;
  md5Hash?: string;
  mediaLink?: string;
}

export interface OpalAgentInsight {
  totalBlogs: number;
  totalPosts: number;
  topLabels: { label: string; count: number }[];
  latestPostDate?: string;
  averagePostsPerBlog: number;
  healthStatus: 'HEALTHY' | 'NEEDS_ATTENTION' | 'UNCONFIGURED';
  recommendations: string[];
}
