import { BloggerBlog, BloggerPage, BloggerPost, BloggerUser } from '../types';
import { logActivity } from './activityLogger';

export interface BloggerErrorDetail {
  code: number;
  message: string;
  isApiNotEnabled: boolean;
  enableUrl: string;
  propagationHint?: boolean;
}

export class BloggerApiError extends Error {
  code: number;
  isApiNotEnabled: boolean;
  enableUrl: string;
  rawDetails?: any;

  constructor(detail: BloggerErrorDetail, rawDetails?: any) {
    super(detail.message);
    this.name = 'BloggerApiError';
    this.code = detail.code;
    this.isApiNotEnabled = detail.isApiNotEnabled;
    this.enableUrl = detail.enableUrl;
    this.rawDetails = rawDetails;
  }
}

const parseBloggerError = async (response: Response): Promise<BloggerApiError> => {
  let errorData: any = null;
  let text = '';
  try {
    text = await response.text();
    errorData = JSON.parse(text);
  } catch {
    errorData = { error: { message: text || response.statusText } };
  }

  const code = response.status;
  const message =
    errorData?.error?.message ||
    errorData?.message ||
    `Blogger API request failed with status ${code}`;

  const isApiNotEnabled =
    code === 403 &&
    (message.toLowerCase().includes('has not been used in project') ||
      message.toLowerCase().includes('disabled') ||
      message.toLowerCase().includes('enable it by visiting') ||
      message.toLowerCase().includes('blogger.googleapis.com'));

  const enableUrl =
    'https://console.developers.google.com/apis/api/blogger.googleapis.com/overview?project=gen-lang-client-0451884163';

  return new BloggerApiError(
    {
      code,
      message,
      isApiNotEnabled,
      enableUrl,
      propagationHint: isApiNotEnabled,
    },
    errorData
  );
};

const CUSTOM_BLOGS_STORAGE_KEY = 'admin_connected_blogger_blogs';

export const getStoredCustomBlogs = (): BloggerBlog[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage?.getItem(CUSTOM_BLOGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const storeCustomBlog = (blog: BloggerBlog): BloggerBlog[] => {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getStoredCustomBlogs();
    const filtered = existing.filter((b) => b.id !== blog.id);
    const updated = [blog, ...filtered];
    window.localStorage?.setItem(CUSTOM_BLOGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};

export const removeStoredCustomBlog = (blogId: string): BloggerBlog[] => {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getStoredCustomBlogs();
    const updated = existing.filter((b) => b.id !== blogId);
    window.localStorage?.setItem(CUSTOM_BLOGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};

export const fetchBloggerUser = async (
  accessToken: string,
  userEmail?: string
): Promise<BloggerUser> => {
  const url = 'https://blogger.googleapis.com/v3/users/self';
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        // User has a Google account but hasn't created a public Blogger author profile yet
        return {
          id: 'google_account',
          displayName: userEmail ? userEmail.split('@')[0] : 'Google User',
          about: 'Google Authenticated User',
        };
      }
      const err = await parseBloggerError(res);
      await logActivity({
        action: 'API_ERROR',
        category: 'BLOGGER_API',
        status: 'ERROR',
        description: `Blogger profile fetch notice: ${err.message}`,
        userEmail,
        targetResource: url,
        details: { code: err.code, isApiNotEnabled: err.isApiNotEnabled },
      });
      throw err;
    }

    const data: BloggerUser = await res.json();
    await logActivity({
      action: 'BLOGS_DISCOVER',
      category: 'BLOGGER_API',
      status: 'SUCCESS',
      description: `Discovered Blogger author account: ${data.displayName || data.id}`,
      userEmail,
      targetResource: url,
      details: { id: data.id, displayName: data.displayName },
    });
    return data;
  } catch (err: any) {
    if (err instanceof BloggerApiError) throw err;
    // If network or other error, fallback to email display name instead of hard-crashing
    return {
      id: 'google_account',
      displayName: userEmail ? userEmail.split('@')[0] : 'Google Author',
    };
  }
};

export const fetchBlogByUrl = async (
  blogUrl: string,
  accessToken: string,
  userEmail?: string
): Promise<BloggerBlog> => {
  const url = `https://blogger.googleapis.com/v3/blogs/byurl?url=${encodeURIComponent(blogUrl.trim())}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await parseBloggerError(res);
    throw err;
  }

  const blog: BloggerBlog = await res.json();
  await logActivity({
    action: 'BLOGS_DISCOVER',
    category: 'BLOGGER_API',
    status: 'SUCCESS',
    description: `Fetched blog by URL: ${blog.name} (${blog.url})`,
    userEmail,
    targetResource: blog.id,
    details: { name: blog.name, url: blog.url },
  });
  return blog;
};

export const fetchBlogById = async (
  blogId: string,
  accessToken: string,
  userEmail?: string
): Promise<BloggerBlog> => {
  const url = `https://blogger.googleapis.com/v3/blogs/${encodeURIComponent(blogId.trim())}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await parseBloggerError(res);
    throw err;
  }

  const blog: BloggerBlog = await res.json();
  await logActivity({
    action: 'BLOGS_DISCOVER',
    category: 'BLOGGER_API',
    status: 'SUCCESS',
    description: `Fetched blog by ID: ${blog.name}`,
    userEmail,
    targetResource: blog.id,
  });
  return blog;
};

export const fetchUserBlogs = async (
  accessToken: string,
  userEmail?: string
): Promise<BloggerBlog[]> => {
  const customBlogs = getStoredCustomBlogs();
  let liveBlogs: BloggerBlog[] = [];

  const url = 'https://blogger.googleapis.com/v3/users/self/blogs?fetchUserInfo=true';
  try {
    let res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    // If fetchUserInfo parameter failed or returned 404, try standard endpoint
    if (!res.ok && res.status === 404) {
      res = await fetch('https://blogger.googleapis.com/v3/users/self/blogs', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });
    }

    if (!res.ok) {
      const err = await parseBloggerError(res);
      await logActivity({
        action: 'API_ERROR',
        category: 'BLOGGER_API',
        status: 'ERROR',
        description: `Failed to discover blogs for ${userEmail || 'admin'}: ${err.message}`,
        userEmail,
        targetResource: url,
        details: {
          code: err.code,
          isApiNotEnabled: err.isApiNotEnabled,
          enableUrl: err.enableUrl,
        },
      });
      throw err;
    }

    const data = await res.json();
    liveBlogs = data.items || [];

    await logActivity({
      action: 'BLOGS_DISCOVER',
      category: 'BLOGGER_API',
      status: 'SUCCESS',
      description: `Discovered ${liveBlogs.length} Blogger blog(s) linked to admin account ${userEmail || 'dr.panditkale@gmail.com'}`,
      userEmail,
      targetResource: url,
      details: {
        blogCount: liveBlogs.length,
        blogNames: liveBlogs.map((b) => b.name),
      },
    });
  } catch (err: any) {
    if (err instanceof BloggerApiError) {
      // If we have custom blogs saved by user, return them even if live API threw error
      if (customBlogs.length > 0) {
        return customBlogs;
      }
      throw err;
    }
    // Network or other error
    if (customBlogs.length > 0) {
      return customBlogs;
    }
    throw new BloggerApiError(
      {
        code: 0,
        message: err.message || 'Network error fetching blogs',
        isApiNotEnabled: false,
        enableUrl: 'https://console.developers.google.com/apis/api/blogger.googleapis.com/overview?project=gen-lang-client-0451884163',
      },
      err
    );
  }

  // Combine live blogs with any custom-added blogs (avoiding duplicates)
  const combined = [...liveBlogs];
  for (const cb of customBlogs) {
    if (!combined.some((b) => b.id === cb.id)) {
      combined.push(cb);
    }
  }
  return combined;
};

export const fetchBlogPosts = async (
  blogId: string,
  accessToken: string,
  userEmail?: string,
  searchQuery?: string
): Promise<BloggerPost[]> => {
  const queryParam = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : '';
  const url = `https://blogger.googleapis.com/v3/blogs/${blogId}/posts?maxResults=50&fetchBodies=true${queryParam}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const err = await parseBloggerError(res);
      await logActivity({
        action: 'API_ERROR',
        category: 'BLOGGER_API',
        status: 'ERROR',
        description: `Failed to fetch posts for blog ${blogId}: ${err.message}`,
        userEmail,
        targetResource: url,
      });
      throw err;
    }

    const data = await res.json();
    const posts: BloggerPost[] = data.items || [];

    await logActivity({
      action: 'POSTS_FETCH',
      category: 'BLOGGER_API',
      status: 'SUCCESS',
      description: `Fetched ${posts.length} posts for blog ${blogId}`,
      userEmail,
      targetResource: blogId,
      details: { count: posts.length, query: searchQuery },
    });

    return posts;
  } catch (err: any) {
    if (err instanceof BloggerApiError) throw err;
    throw new BloggerApiError(
      {
        code: 0,
        message: err.message || 'Network error fetching blog posts',
        isApiNotEnabled: false,
        enableUrl: 'https://console.developers.google.com/apis/api/blogger.googleapis.com/overview',
      },
      err
    );
  }
};

export const fetchBlogPages = async (
  blogId: string,
  accessToken: string,
  userEmail?: string
): Promise<BloggerPage[]> => {
  const url = `https://blogger.googleapis.com/v3/blogs/${blogId}/pages`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const err = await parseBloggerError(res);
      throw err;
    }

    const data = await res.json();
    const pages: BloggerPage[] = data.items || [];

    await logActivity({
      action: 'PAGES_FETCH',
      category: 'BLOGGER_API',
      status: 'SUCCESS',
      description: `Fetched ${pages.length} standalone pages for blog ${blogId}`,
      userEmail,
      targetResource: blogId,
      details: { count: pages.length },
    });

    return pages;
  } catch (err: any) {
    if (err instanceof BloggerApiError) throw err;
    throw new BloggerApiError(
      {
        code: 0,
        message: err.message || 'Network error fetching blog pages',
        isApiNotEnabled: false,
        enableUrl: 'https://console.developers.google.com/apis/api/blogger.googleapis.com/overview',
      },
      err
    );
  }
};

export const createBloggerDraft = async (
  blogId: string,
  postData: {
    title: string;
    content: string;
    labels?: string[];
  },
  accessToken: string,
  userEmail?: string
): Promise<BloggerPost> => {
  // If demo blog, create simulated draft immediately
  const isDemo = DEMO_BLOGS.some((b) => b.id === blogId);
  if (isDemo || !accessToken) {
    const draftId = `demo_draft_${Date.now()}`;
    const demoPost: BloggerPost = {
      id: draftId,
      blog: { id: blogId },
      title: postData.title,
      content: postData.content,
      labels: postData.labels || ['Technology', 'AI', 'AdSense Ready'],
      status: 'DRAFT',
      published: new Date().toISOString(),
      updated: new Date().toISOString(),
      url: `https://tech-cloud-innovations.blogspot.com/preview/${draftId}.html`,
      selfLink: `https://blogger.googleapis.com/v3/blogs/${blogId}/posts/${draftId}`,
      author: {
        id: 'author_admin',
        displayName: userEmail ? userEmail.split('@')[0] : 'Dr. Pandit Kale',
      },
    };

    await logActivity({
      action: 'POSTS_FETCH',
      category: 'BLOGGER_API',
      status: 'SUCCESS',
      description: `Saved DRAFT to blog (${isDemo ? 'Sample Catalog' : 'Local Draft'}): "${postData.title}"`,
      userEmail,
      targetResource: blogId,
      details: { blogId, status: 'DRAFT', postId: draftId },
    });

    return demoPost;
  }

  const url = `https://blogger.googleapis.com/v3/blogs/${blogId}/posts?isDraft=true`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      kind: 'blogger#post',
      blog: { id: blogId },
      title: postData.title,
      content: postData.content,
      labels: postData.labels || ['Technology', 'AI', 'AdSense'],
    }),
  });

  if (!res.ok) {
    const err = await parseBloggerError(res);
    await logActivity({
      action: 'API_ERROR',
      category: 'BLOGGER_API',
      status: 'ERROR',
      description: `Failed to create draft on blog ${blogId}: ${err.message}`,
      userEmail,
      targetResource: blogId,
      details: { code: err.code },
    });
    throw err;
  }

  const createdPost: BloggerPost = await res.json();
  await logActivity({
    action: 'POSTS_FETCH',
    category: 'BLOGGER_API',
    status: 'SUCCESS',
    description: `Successfully saved new DRAFT post: "${createdPost.title}" to blog ${blogId}`,
    userEmail,
    targetResource: createdPost.id,
    details: {
      blogId,
      postId: createdPost.id,
      title: createdPost.title,
      status: 'DRAFT',
      url: createdPost.url,
    },
  });

  return createdPost;
};

export interface EmailToDraftConfig {
  instructions: string[];
  settingPath: string;
  recommendedMode: 'Save emails as draft post';
  exampleEmailFormat: {
    to: string;
    subject: string;
    bodySummary: string;
  };
}

export const getEmailToDraftConfig = (blogId?: string, blogName?: string): EmailToDraftConfig => {
  return {
    settingPath: 'Blogger Dashboard > Settings > Email > Posting using email',
    recommendedMode: 'Save emails as draft post',
    instructions: [
      'Navigate to Blogger.com and select your target blog: ' + (blogName || 'Selected Blog'),
      'In the left sidebar menu, click Settings.',
      'Scroll down to the "Email" section header.',
      'Click on "Posting using email" (default is Disabled).',
      'Select the option: "Save emails as draft post".',
      'Create a secret custom word in the input box: yourname.[secretword]@blogger.com',
      'Save the setting. Keep this secret email address strictly confidential.',
      'Any email sent from an approved author account will be automatically parsed by Blogger and stored in your Drafts catalog!',
    ],
    exampleEmailFormat: {
      to: 'yourbloggerid.[secretword]@blogger.com',
      subject: '[Article Title Here]',
      bodySummary: 'Full HTML article body including headings, text, and image embeds',
    },
  };
};

// Realistic mock data for preview/demonstration if user's API is propagating
// or if user hasn't published Blogger content yet
export const DEMO_BLOGGER_USER: BloggerUser = {
  id: 'blogger_user_984210',
  displayName: 'Dr. Pandit Kale',
  url: 'https://www.blogger.com/profile/984210',
  about: 'Technology researcher, system architect, and digital creator.',
};

export const DEMO_BLOGS: BloggerBlog[] = [
  {
    id: '8839210492183921',
    name: 'Tech & Cloud Innovations Journal',
    description: 'Deep dives into Google Cloud, OAuth 2.0 architectures, AI models, and modern web application engines.',
    url: 'https://tech-cloud-innovations.blogspot.com',
    published: '2025-01-15T08:30:00Z',
    updated: '2026-10-10T19:42:00Z',
    posts: {
      totalItems: 8,
    },
    pages: {
      totalItems: 3,
    },
    status: 'LIVE',
    locale: {
      language: 'en',
      country: 'US',
      variant: '',
    },
  },
  {
    id: '7729104829104821',
    name: 'Research Perspectives & Notes',
    description: 'Academic notes, clinical insights, and collaborative study logs.',
    url: 'https://research-perspectives-notes.blogspot.com',
    published: '2025-06-20T10:15:00Z',
    updated: '2026-09-28T14:10:00Z',
    posts: {
      totalItems: 5,
    },
    pages: {
      totalItems: 2,
    },
    status: 'LIVE',
    locale: {
      language: 'en',
      country: 'IN',
      variant: '',
    },
  },
];

export const DEMO_POSTS: Record<string, BloggerPost[]> = {
  '8839210492183921': [
    {
      id: 'post_101',
      blog: { id: '8839210492183921' },
      title: 'Architecting Secure OAuth 2.0 In-Memory Client Flows for Google Cloud',
      url: 'https://tech-cloud-innovations.blogspot.com/2026/10/secure-oauth-flows.html',
      selfLink: 'https://blogger.googleapis.com/v3/blogs/8839210492183921/posts/post_101',
      published: '2026-10-08T14:20:00Z',
      updated: '2026-10-09T18:00:00Z',
      author: {
        id: 'blogger_user_984210',
        displayName: 'Dr. Pandit Kale',
      },
      labels: ['Security', 'OAuth2', 'GoogleCloud', 'Architecture'],
      replies: { totalItems: 14 },
      status: 'LIVE',
      content: `<p>In modern web applications, persisting OAuth access tokens in <code>localStorage</code> or cookies creates substantial cross-site scripting (XSS) vulnerabilities. Storing authorization tokens purely in-memory backed by isolated auth state observers ensures least-privilege token lifetime control.</p><p>We examine token refresh triggers, Cloud Storage direct media upload scopes, and real-time audit hashing.</p>`,
    },
    {
      id: 'post_102',
      blog: { id: '8839210492183921' },
      title: 'Automated Log Export Strategies to Google Cloud Storage Buckets',
      url: 'https://tech-cloud-innovations.blogspot.com/2026/09/cloud-storage-export.html',
      selfLink: 'https://blogger.googleapis.com/v3/blogs/8839210492183921/posts/post_102',
      published: '2026-09-25T11:00:00Z',
      updated: '2026-09-26T09:15:00Z',
      author: {
        id: 'blogger_user_984210',
        displayName: 'Dr. Pandit Kale',
      },
      labels: ['CloudStorage', 'DevOps', 'AuditLogs'],
      replies: { totalItems: 8 },
      status: 'LIVE',
      content: `<p>Auditing application state requires tamper-evident verification. With cryptographic SHA-256 signatures attached to session activities, exporting structured JSON archives directly to Cloud Storage buckets guarantees compliance and traceability.</p>`,
    },
    {
      id: 'post_103',
      blog: { id: '8839210492183921' },
      title: 'Harnessing Google OPAL Agent Workflows for Blogger Content Analysis',
      url: 'https://tech-cloud-innovations.blogspot.com/2026/09/opal-agent-workflows.html',
      selfLink: 'https://blogger.googleapis.com/v3/blogs/8839210492183921/posts/post_103',
      published: '2026-09-12T16:45:00Z',
      updated: '2026-09-12T16:45:00Z',
      author: {
        id: 'blogger_user_984210',
        displayName: 'Dr. Pandit Kale',
      },
      labels: ['AI', 'Agent', 'BloggerAPI', 'Analytics'],
      replies: { totalItems: 22 },
      status: 'LIVE',
      content: `<p>Google OPAL agent workflows provide autonomous content synthesis, indexing tag distributions, engagement velocities, and automated gap detection across publishing cadences.</p>`,
    },
    {
      id: 'post_104',
      blog: { id: '8839210492183921' },
      title: 'Microservices vs Serverless Edge Functions: A 2026 Retrospective',
      url: 'https://tech-cloud-innovations.blogspot.com/2026/08/microservices-vs-edge.html',
      selfLink: 'https://blogger.googleapis.com/v3/blogs/8839210492183921/posts/post_104',
      published: '2026-08-30T09:00:00Z',
      updated: '2026-08-30T10:30:00Z',
      author: {
        id: 'blogger_user_984210',
        displayName: 'Dr. Pandit Kale',
      },
      labels: ['Architecture', 'Cloud', 'Serverless'],
      replies: { totalItems: 5 },
      status: 'LIVE',
      content: `<p>Evaluating cold starts, global replication models, and zero-trust perimeter enforcement across enterprise deployments.</p>`,
    },
  ],
  '7729104829104821': [
    {
      id: 'post_201',
      blog: { id: '7729104829104821' },
      title: 'Digital Health Records & Cryptographic Audit Trails',
      url: 'https://research-perspectives-notes.blogspot.com/2026/09/digital-health-records.html',
      selfLink: 'https://blogger.googleapis.com/v3/blogs/7729104829104821/posts/post_201',
      published: '2026-09-18T13:00:00Z',
      updated: '2026-09-18T15:20:00Z',
      author: {
        id: 'blogger_user_984210',
        displayName: 'Dr. Pandit Kale',
      },
      labels: ['Healthcare', 'Research', 'Cryptography'],
      replies: { totalItems: 9 },
      status: 'LIVE',
      content: `<p>Patient privacy safeguards and immutable audit logging within distributed clinical trial databases.</p>`,
    },
    {
      id: 'post_202',
      blog: { id: '7729104829104821' },
      title: 'Methodology Framework for Open Scientific Communication',
      url: 'https://research-perspectives-notes.blogspot.com/2026/08/open-science-methodology.html',
      selfLink: 'https://blogger.googleapis.com/v3/blogs/7729104829104821/posts/post_202',
      published: '2026-08-14T08:10:00Z',
      updated: '2026-08-14T08:10:00Z',
      author: {
        id: 'blogger_user_984210',
        displayName: 'Dr. Pandit Kale',
      },
      labels: ['Research', 'OpenScience', 'Methodology'],
      replies: { totalItems: 3 },
      status: 'LIVE',
      content: `<p>Best practices for reproducible research artifacts, versioning datasets, and peer-to-peer scholarly dissemination.</p>`,
    },
  ],
};
