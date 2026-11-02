import express from 'express';
import cors from 'cors';
import { timingSafeEqual } from 'node:crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { PostgresStorageRepository } from './src/server/postgres-storage';
import { StorageRepository } from './src/server/storage';
import { ContentItem, Campaign, TeamMember, Workspace, Brand } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  // Production must use PostgreSQL exclusively. Never silently downgrade to JSON.
  if (!isDev && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production; refusing to start with local JSON storage');
  }
  if (!isDev && (!process.env.API_TOKEN || process.env.API_TOKEN.length < 32)) {
    throw new Error('API_TOKEN must be configured with at least 32 characters in production');
  }

  let storage: StorageRepository;
  if (process.env.DATABASE_URL) {
    // If a database URL was supplied, connection failure is always fatal.
    storage = await PostgresStorageRepository.connect();
    console.log('Connected to PostgreSQL database');
  } else {
    console.warn('Using local JSON file storage for development only');
    storage = new StorageRepository();
  }
  const isPostgres = storage instanceof PostgresStorageRepository;

  const app = express();
  const apiToken = process.env.API_TOKEN;

  const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || isDev || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin is not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  }));
  app.use(express.json({ limit: '2mb' }));
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Health check is public
  app.get('/api/health', async (_req, res) => {
    try {
      await storage.ping();
      res.json({
        status: 'ok',
        database: isPostgres ? 'connected' : 'not_configured',
        storage: isPostgres ? 'postgresql' : 'local_json',
        time: new Date().toISOString(),
      });
    } catch {
      res.status(503).json({ status: 'error', database: 'unavailable' });
    }
  });

  // Bearer token check only when configured and in production
  if (apiToken && apiToken.length >= 32 && !isDev) {
    app.use('/api', (req, res, next) => {
      const authorization = req.header('authorization') || '';
      const supplied = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
      const expectedBuffer = Buffer.from(apiToken);
      const suppliedBuffer = Buffer.from(supplied);
      if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      next();
    });
  }

  // Do not acknowledge a mutation until its PostgreSQL snapshot is committed.
  app.use((req, res, next) => {
    const sendJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      void storage.flush()
        .then(() => sendJson(body))
        .catch(error => {
          console.error('PostgreSQL commit failed:', error);
          if (!res.headersSent) res.status(503);
          sendJson({ error: 'Database persistence failed; retry the operation' });
        });
      return res;
    }) as typeof res.json;
    next();
  });

  // One-time preservation of any pre-existing browser-local records.
  app.post('/api/migrations/browser-cache', async (req, res) => {
    try {
      const result = await storage.importBrowserCache(req.body);
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Browser cache import failed';
      res.status(400).json({ error: message });
    }
  });

  // --- WORKSPACE ENDPOINTS ---
  app.get('/api/workspaces', (_req, res) => {
    try {
      const workspaces = storage.getWorkspaces();
      res.json(workspaces);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/workspaces/:workspaceId', (req, res) => {
    try {
      const ws = storage.getWorkspace(req.params.workspaceId);
      if (!ws) {
        return res.status(404).json({ error: 'Workspace not found' });
      }
      res.json(ws);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/workspaces', (req, res) => {
    try {
      const newWs = storage.createWorkspace(req.body);
      res.status(201).json(newWs);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/workspaces/:workspaceId', (req, res) => {
    try {
      const updated = storage.updateWorkspace(req.params.workspaceId, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/workspaces/:workspaceId', (req, res) => {
    try {
      const cascade = req.query.cascade !== 'false';
      const permanent = req.query.permanent === 'true';
      if (permanent) {
        const success = storage.deleteWorkspace(req.params.workspaceId, cascade);
        return res.json({ success, mode: 'deleted' });
      }
      const success = storage.archiveWorkspace(req.params.workspaceId);
      res.json({ success, mode: 'archived' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- SCOPED WORKSPACE DATA ENDPOINT ---
  app.get('/api/workspaces/:workspaceId/data', (req, res) => {
    try {
      const data = storage.getScopedData(req.params.workspaceId);
      res.json(data);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  // --- BRANDS ENDPOINTS ---
  app.get('/api/workspaces/:workspaceId/brands', (req, res) => {
    try {
      const brands = storage.getBrands(req.params.workspaceId);
      res.json(brands);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/workspaces/:workspaceId/brands', (req, res) => {
    try {
      const brandData: Partial<Brand> = {
        ...req.body,
        workspaceId: req.params.workspaceId,
      };
      const created = storage.createBrand(brandData);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/brands/:brandId', (req, res) => {
    try {
      const updated = storage.updateBrand(req.params.brandId, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- CONTENT CRUD ---
  app.get('/api/workspaces/:workspaceId/content', (req, res) => {
    try {
      const items = storage.getContent(req.params.workspaceId, req.query);
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/workspaces/:workspaceId/content', (req, res) => {
    try {
      const item: ContentItem = {
        ...req.body,
        workspaceId: req.params.workspaceId,
      };
      if (!item.topic || !item.brandId || !item.contentDate) {
        return res.status(400).json({ error: 'Missing required fields: topic, brandId, contentDate' });
      }
      const created = storage.createContent(item);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/content/:id', (req, res) => {
    try {
      const updated = storage.updateContent(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/content/:id', (req, res) => {
    try {
      const success = storage.deleteContent(req.params.id);
      res.json({ success, id: req.params.id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- CAMPAIGNS & TEAM ---
  app.get('/api/workspaces/:workspaceId/campaigns', (req, res) => {
    try {
      const camps = storage.getCampaigns(req.params.workspaceId);
      res.json(camps);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/workspaces/:workspaceId/campaigns', (req, res) => {
    try {
      const camp: Campaign = {
        ...req.body,
        workspaceId: req.params.workspaceId,
      };
      const created = storage.createCampaign(camp);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/campaigns/:id', (req, res) => {
    try {
      const updated = storage.updateCampaign(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/campaigns/:id', (req, res) => {
    try {
      const success = storage.deleteCampaign(req.params.id);
      res.json({ success, id: req.params.id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- INTEGRITY DIAGNOSTICS ---
  app.get('/api/diagnostics/integrity', (_req, res) => {
    try {
      const report = storage.runIntegrityAudit();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/diagnostics/repair', (_req, res) => {
    try {
      const result = storage.safeAutoRepair();
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/workspaces/:workspaceId/team', (req, res) => {
    try {
      const member: TeamMember = {
        ...req.body,
        workspaceId: req.params.workspaceId,
      };
      const created = storage.createTeamMember(member);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- BACKWARD COMPATIBLE & SYSTEM ENDPOINTS ---
  app.get('/api/data', (_req, res) => {
    try {
      const raw = storage.getRawDatabase();
      const firstWs = raw.workspaces[0];
      const scoped = firstWs ? storage.getScopedData(firstWs.id) : null;
      res.json({
        ...raw,
        scoped,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/reset-data', (_req, res) => {
    try {
      const fresh = storage.resetData();
      res.json({ success: true, message: 'Database reset to initial demo seeds', fresh });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Middleware / Static serving
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, () => {
    console.log(`Marketing API listening on port ${PORT} (isDev: ${isDev})`);
  });

  const shutdown = async () => {
    server.close();
    await storage.close();
    process.exit(0);
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
