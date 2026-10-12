import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to initialize GoogleGenAI with required aistudio-build User-Agent
const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API: RSS Feed fetcher & proxy (bypasses browser CORS restrictions)
app.get('/api/rss', async (req, res) => {
  try {
    const feedUrl = req.query.url as string;
    if (!feedUrl) {
      return res.status(400).json({ error: 'URL query parameter is required' });
    }

    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GoogleOpalAgent/1.0; +https://ais.google.com)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch RSS from upstream: ${response.statusText}`,
      });
    }

    const xmlText = await response.text();
    res.setHeader('Content-Type', 'application/xml');
    return res.send(xmlText);
  } catch (err: any) {
    console.error('Error fetching RSS:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch RSS feed' });
  }
});

// API: Server-side Gemini content generation for Agent 1 (1500-2000 word humanized AdSense post)
app.post('/api/generate-article', async (req, res) => {
  try {
    const { feedTitle, feedDescription, feedSource, feedCategory } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Return flag so client uses built-in high-grade generator
      return res.json({
        useFallback: true,
        message: 'No GEMINI_API_KEY configured on server; using built-in editorial synthesizer.',
      });
    }

    const prompt = `You are a world-class professional technology journalist and content strategist.
Write an authentic, humanized, in-depth, original blog article based on this breaking story:
Title: "${feedTitle}"
Source: "${feedSource}"
Context: "${feedDescription}"
Category: "${feedCategory}"

MANDATORY EDITORIAL & ADSENSE COMPLIANCE CRITERIA:
1. Target length: EXACTLY between 1,500 and 2,000 words. Comprehensive and deeply analytical.
2. Structure with clean HTML tags:
   - Compelling <h1> title that is engaging and search-friendly
   - Introduction (around 200 words): Hook, context, why this matters today
   - <h2> Deep-Dive: Core Technical & Real-World Breakdown (around 350 words)
   - <h2> Market & Industry Implications (around 300 words)
   - <h3> Practical Impact for Users & Creators (around 250 words)
   - <h2> Strategic Assessment: Pros, Cons & Trade-Offs (with an HTML comparison table or structured list)
   - <h2> Frequently Asked Questions (FAQ) (4 realistic, high-value questions with answers)
   - <h2> Future Outlook & Final Verdict (around 250 words) with concluding thought
3. AdSense Compliance:
   - High EEAT (Experience, Expertise, Authoritativeness, Trustworthiness)
   - 100% humanized editorial voice; no robotic repetitive fluff
   - Safe for all audiences
   - Include 2 thematic in-article Ad placement comment markers: <!-- ADSENSE_INTERSTITIAL_1 --> and <!-- ADSENSE_INTERSTITIAL_2 -->
4. Output valid clean HTML format (only inside <h1>, <h2>, <h3>, <p>, <ul>, <li>, <table>, <blockquote> tags, no outer markdown backticks).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a senior editorial columnist specializing in high-value, humanized, 1500-2000 word search-optimized articles complying with Google AdSense quality guidelines.',
      },
    });

    const text = response.text || '';
    return res.json({ articleHtml: text, sourceModel: 'gemini-3.8-flash' });
  } catch (err: any) {
    console.error('Error in article generation:', err);
    return res.json({
      useFallback: true,
      error: err.message,
    });
  }
});

// Setup Vite middleware for local development
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
