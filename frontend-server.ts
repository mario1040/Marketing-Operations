import express from 'express';
import path from 'node:path';

const app = express();
const port = Number(process.env.PORT || 3000);
const distPath = path.resolve(process.cwd(), 'dist');
const BACKEND_API_URL = process.env.VITE_API_BASE_URL || 'https://marketing-api.bezaverse.com';

// Health check endpoints for Cloud Run and monitoring
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', async (_req, res) => {
  try {
    const upstreamRes = await fetch(`${BACKEND_API_URL}/api/health`, { method: 'GET' });
    const data = await upstreamRes.json().catch(() => null);
    res.status(upstreamRes.status).json({
      status: upstreamRes.ok && data?.status === 'ok' ? 'ok' : 'degraded',
      service: 'frontend',
      backendStatus: upstreamRes.status,
      backend: data,
    });
  } catch {
    res.status(503).json({
      status: 'degraded',
      service: 'frontend',
      backend: 'unreachable',
    });
  }
});

// Proxy relative /api requests to external backend (https://marketing-api.bezaverse.com)
app.use('/api', async (req, res) => {
  try {
    const targetUrl = `${BACKEND_API_URL}${req.originalUrl}`;
    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (val && !['host', 'connection', 'content-length', 'origin', 'accept-encoding'].includes(key.toLowerCase())) {
        headers.set(key, Array.isArray(val) ? val.join(', ') : val);
      }
    }

    // The upstream (Cloudflare/backend) may choose Zstandard otherwise.
    // Node's proxy must not forward compressed bytes after stripping their encoding header.
    headers.set('accept-encoding', 'identity');
    headers.set('cache-control', 'no-cache');

    const fetchInit: RequestInit = {
      method: req.method,
      headers,
      cache: 'no-store',
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      if (chunks.length > 0) {
        fetchInit.body = Buffer.concat(chunks);
      }
    }

    const response = await fetch(targetUrl, fetchInit);
    res.status(response.status);
    response.headers.forEach((val, key) => {
      if (!['transfer-encoding', 'content-encoding', 'content-length', 'etag', 'last-modified', 'expires'].includes(key.toLowerCase())) {
        res.setHeader(key, val);
      }
    });
    // API payloads contain private business records and must never be cached by the browser.
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('Backend proxy request failed:', err);
    res.status(502).json({ error: 'Backend proxy unreachable' });
  }
});

// Serve frontend static assets
app.use(express.static(distPath, {
  index: false,
  maxAge: '1h',
}));

// Route SPA index.html for all other routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Marketing Operations frontend listening on 0.0.0.0:${port}`);
});

const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
