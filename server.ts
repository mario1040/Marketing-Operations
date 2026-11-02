import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { StorageRepository } from './src/server/storage';
import { ContentItem, Campaign, TeamMember, Workspace, Brand } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const storage = new StorageRepository();

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
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
  const isDev = process.env.NODE_ENV !== 'production';
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

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (isDev: ${isDev})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
