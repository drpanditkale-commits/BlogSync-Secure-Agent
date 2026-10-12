import { BloggerBlog, BloggerPost, OpalAgentInsight } from '../types';

export const analyzeBlogData = (
  blogs: BloggerBlog[],
  postsMap: Record<string, BloggerPost[]>
): OpalAgentInsight => {
  const totalBlogs = blogs.length;
  let totalPosts = 0;
  const labelCounts: Record<string, number> = {};
  let latestPostDate: string | undefined = undefined;

  blogs.forEach((blog) => {
    totalPosts += blog.posts?.totalItems || 0;
  });

  // Aggregate through fetched posts
  const allPosts = Object.values(postsMap).flat();
  allPosts.forEach((post) => {
    if (post.labels) {
      post.labels.forEach((l) => {
        labelCounts[l] = (labelCounts[l] || 0) + 1;
      });
    }

    if (!latestPostDate || new Date(post.published) > new Date(latestPostDate)) {
      latestPostDate = post.published;
    }
  });

  const topLabels = Object.entries(labelCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const averagePostsPerBlog = totalBlogs > 0 ? Math.round((totalPosts / totalBlogs) * 10) / 10 : 0;

  const recommendations: string[] = [];

  if (totalBlogs === 0) {
    recommendations.push(
      'No active blogs discovered on this Google account. Visit blogger.com to create your first blog publication.'
    );
  } else {
    if (allPosts.length < 5) {
      recommendations.push(
        'Increase publishing velocity to boost search indexing. Aim for at least 1-2 structured technical articles per month.'
      );
    }

    if (topLabels.length === 0) {
      recommendations.push(
        'Tag your posts with descriptive labels (e.g. "Cloud", "Security", "Engineering") to improve categorization and reader discovery.'
      );
    } else {
      recommendations.push(
        `Top topic focus is "${topLabels[0]?.label}". Consider publishing a curated cornerstone guide on this topic.`
      );
    }

    if (latestPostDate) {
      const daysSinceLast = Math.floor(
        (Date.now() - new Date(latestPostDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLast > 30) {
        recommendations.push(
          `Last published post was ${daysSinceLast} days ago. An updated post will keep subscribers engaged.`
        );
      } else {
        recommendations.push('Recent publication detected! Keep the momentum going with follow-up insights.');
      }
    }

    recommendations.push(
      'Export activity logs regularly to Google Cloud Storage bucket to maintain an immutable compliance record.'
    );
  }

  return {
    totalBlogs,
    totalPosts,
    topLabels,
    latestPostDate,
    averagePostsPerBlog,
    healthStatus: totalBlogs > 0 ? 'HEALTHY' : 'UNCONFIGURED',
    recommendations,
  };
};

export interface AgentChatMessage {
  id: string;
  sender: 'user' | 'opal';
  text: string;
  timestamp: string;
  actions?: { label: string; actionId: string }[];
}

export const processOpalAgentQuery = (
  query: string,
  blogs: BloggerBlog[],
  postsMap: Record<string, BloggerPost[]>
): { reply: string; actionSuggestion?: string } => {
  const q = query.toLowerCase().trim();
  const allPosts = Object.values(postsMap).flat();

  if (q.includes('export') || q.includes('storage') || q.includes('bucket')) {
    return {
      reply: `I can securely bundle your session audit logs, attach SHA-256 integrity digests, and transmit them directly to your Google Cloud Storage bucket. Click "Export to Cloud Storage" in the Activity Logs tab.`,
      actionSuggestion: 'export_logs',
    };
  }

  if (q.includes('blog') || q.includes('how many') || q.includes('count')) {
    return {
      reply: `I discovered ${blogs.length} blog(s) linked to your Google Account with a total of ${blogs.reduce(
        (acc, b) => acc + (b.posts?.totalItems || 0),
        0
      )} registered posts. Selected blogs: ${blogs.map((b) => `"${b.name}"`).join(', ')}.`,
      actionSuggestion: 'view_blogs',
    };
  }

  if (q.includes('post') || q.includes('article') || q.includes('latest')) {
    if (allPosts.length === 0) {
      return {
        reply: `No posts have been fetched yet for the active blog. Select a blog and click "Discover & Sync Posts" to allow me to inspect your articles.`,
        actionSuggestion: 'fetch_posts',
      };
    }
    const latest = [...allPosts].sort(
      (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime()
    )[0];
    return {
      reply: `The latest post retrieved is "${latest.title}" published on ${new Date(
        latest.published
      ).toLocaleDateString()} with ${latest.replies?.totalItems || 0} comments.`,
    };
  }

  if (q.includes('credential') || q.includes('api key') || q.includes('token') || q.includes('oauth')) {
    return {
      reply: `Your Google OAuth 2.0 configuration uses Project ID 'gen-lang-client-0451884163' with scopes for Blogger and Cloud Storage. You can inspect all credentials and run live API health checks by clicking "Credentials & API Keys" in the top bar.`,
      actionSuggestion: 'open_credentials',
    };
  }

  if (q.includes('security') || q.includes('hash') || q.includes('audit')) {
    return {
      reply: `All Blogger API discoveries and Cloud Storage exports are recorded with tamper-evident SHA-256 signatures, client IP timestamps, and authorization scope validation in the Activity Logs.`,
      actionSuggestion: 'view_logs',
    };
  }

  return {
    reply: `I am your Google OPAL Agent for Blogger. I can inspect your accounts, analyze blog posts, extract labels, and securely transmit audit logs to your Google Cloud Storage bucket. Try asking "How many blogs do I have?", "What is my latest post?", or "Export activity logs".`,
  };
};
