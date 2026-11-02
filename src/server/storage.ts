import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  Workspace,
  Brand,
  ContentItem,
  Campaign,
  TeamMember,
  ActivityLog,
  FilterState,
  IntegrityDiagnosticReport,
} from '../types';
import { checkDataIntegrity } from '../utils/dataDiagnostics';
import {
  DEFAULT_WORKSPACE_ID,
  INITIAL_WORKSPACES,
  INITIAL_BRANDS,
  INITIAL_CONTENT,
  INITIAL_CAMPAIGNS,
  INITIAL_TEAM,
  INITIAL_ACTIVITIES,
} from '../data/initialData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.resolve(DATA_DIR, 'marketing_db.json');
const BACKUP_FILE = path.resolve(DATA_DIR, 'marketing_db.backup.json');

export interface DatabaseSchema {
  workspaces: Workspace[];
  brands: Brand[];
  content: ContentItem[];
  campaigns: Campaign[];
  team: TeamMember[];
  activities: ActivityLog[];
}

export class StorageRepository {
  protected db!: DatabaseSchema;

  constructor(deferInitialization = false) {
    if (!deferInitialization) this.db = this.initAndMigrate();
  }

  protected setDatabase(data: DatabaseSchema): void {
    this.db = data;
  }

  private initAndMigrate(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        // Backup existing data before any transformation
        try {
          fs.writeFileSync(BACKUP_FILE, raw, 'utf-8');
        } catch (backupErr) {
          console.warn('Could not write backup file:', backupErr);
        }

        return this.migrateExistingData(parsed);
      }
    } catch (err) {
      console.error('Error reading database file, resetting to fresh schema:', err);
    }

    const fresh = this.getDefaultSchema();
    this.save(fresh);
    return fresh;
  }

  protected getDefaultSchema(): DatabaseSchema {
    return {
      workspaces: JSON.parse(JSON.stringify(INITIAL_WORKSPACES)),
      brands: JSON.parse(JSON.stringify(INITIAL_BRANDS)),
      content: JSON.parse(JSON.stringify(INITIAL_CONTENT)),
      campaigns: JSON.parse(JSON.stringify(INITIAL_CAMPAIGNS)),
      team: JSON.parse(JSON.stringify(INITIAL_TEAM)),
      activities: JSON.parse(JSON.stringify(INITIAL_ACTIVITIES)),
    };
  }

  /**
   * Idempotent migration from flat multi-brand schema to multi-workspace hierarchy
   */
  protected migrateExistingData(parsed: any): DatabaseSchema {
    const data: DatabaseSchema = {
      workspaces: Array.isArray(parsed.workspaces) && parsed.workspaces.length > 0
        ? parsed.workspaces
        : JSON.parse(JSON.stringify(INITIAL_WORKSPACES)),
      brands: Array.isArray(parsed.brands) ? parsed.brands : [],
      content: Array.isArray(parsed.content) ? parsed.content : [],
      campaigns: Array.isArray(parsed.campaigns) ? parsed.campaigns : [],
      team: Array.isArray(parsed.team) ? parsed.team : [],
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
    };

    const targetWsId = data.workspaces[0]?.id || DEFAULT_WORKSPACE_ID;

    // 1. Migrate Brands
    data.brands = data.brands.map(b => ({
      ...b,
      workspaceId: b.workspaceId || targetWsId,
      status: b.status || 'Active',
      createdAt: b.createdAt || new Date().toISOString(),
      updatedAt: b.updatedAt || new Date().toISOString(),
    }));

    // Ensure initial brands exist if empty
    if (data.brands.length === 0) {
      data.brands = JSON.parse(JSON.stringify(INITIAL_BRANDS));
    }

    // Map brandId -> workspaceId for relationship integrity
    const brandWsMap = new Map<string, string>();
    for (const b of data.brands) {
      brandWsMap.set(b.id, b.workspaceId);
    }

    // 2. Migrate ContentItems
    data.content = data.content.map(c => {
      const wsId = c.workspaceId || brandWsMap.get(c.brandId) || targetWsId;
      return {
        ...c,
        workspaceId: wsId,
      };
    });

    // 3. Migrate Campaigns
    data.campaigns = data.campaigns.map(camp => {
      const wsId = camp.workspaceId || brandWsMap.get(camp.brandId) || targetWsId;
      return {
        ...camp,
        workspaceId: wsId,
      };
    });

    // 4. Migrate TeamMembers
    data.team = data.team.map(m => ({
      ...m,
      workspaceId: m.workspaceId || targetWsId,
    }));

    // 5. Migrate Activities
    data.activities = data.activities.map(a => ({
      ...a,
      workspaceId: a.workspaceId || brandWsMap.get(a.brandId) || targetWsId,
    }));

    this.save(data);
    return data;
  }

  protected save(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      // Atomic write using temp file
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  // --- WORKSPACE OPERATIONS ---
  public getWorkspaces(): Workspace[] {
    return this.db.workspaces.filter(ws => ws.status !== 'Archived');
  }

  public getAllWorkspaces(): Workspace[] {
    return this.db.workspaces;
  }

  public getWorkspace(id: string): Workspace | undefined {
    return this.db.workspaces.find(ws => ws.id === id);
  }

  public createWorkspace(wsData: Partial<Workspace>): Workspace {
    const now = new Date().toISOString();
    const id = wsData.id || `ws-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const slug = (wsData.name || 'new-workspace')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newWs: Workspace = {
      id,
      name: wsData.name || 'Untitled Workspace',
      slug,
      description: wsData.description || '',
      logo: wsData.logo || (wsData.name ? wsData.name[0].toUpperCase() : 'W'),
      type: wsData.type || 'Company',
      industry: wsData.industry || 'General Marketing Operations',
      timezone: wsData.timezone || 'America/New_York',
      defaultLanguage: wsData.defaultLanguage || 'en',
      defaultCurrency: wsData.defaultCurrency || 'USD',
      status: 'Active',
      settings: {
        calendarStartDay: wsData.settings?.calendarStartDay ?? 1,
        timeFormat: wsData.settings?.timeFormat ?? '12h',
        customType: wsData.settings?.customType,
      },
      createdAt: now,
      updatedAt: now,
      createdBy: wsData.createdBy || 'Workspace Admin',
    };

    this.db.workspaces.unshift(newWs);
    this.save(this.db);
    return newWs;
  }

  public updateWorkspace(id: string, updates: Partial<Workspace>): Workspace {
    const idx = this.db.workspaces.findIndex(ws => ws.id === id);
    if (idx === -1) {
      throw new Error(`Workspace ${id} not found`);
    }

    const existing = this.db.workspaces[idx];
    const updated: Workspace = {
      ...existing,
      ...updates,
      id, // immutable
      settings: {
        ...existing.settings,
        ...(updates.settings || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    this.db.workspaces[idx] = updated;
    this.save(this.db);
    return updated;
  }

  public archiveWorkspace(id: string): boolean {
    const active = this.db.workspaces.filter(ws => ws.status !== 'Archived');
    if (active.length <= 1) {
      throw new Error('Cannot archive the only active workspace. Create another workspace first.');
    }
    const idx = this.db.workspaces.findIndex(ws => ws.id === id);
    if (idx === -1) return false;

    this.db.workspaces[idx].status = 'Archived';
    this.db.workspaces[idx].updatedAt = new Date().toISOString();
    this.save(this.db);
    return true;
  }

  public deleteWorkspace(id: string, cascade = true): boolean {
    const active = this.db.workspaces.filter(ws => ws.status !== 'Archived');
    if (active.length <= 1) {
      throw new Error('Cannot delete the only active workspace. Create another workspace first.');
    }
    const idx = this.db.workspaces.findIndex(ws => ws.id === id);
    if (idx === -1) return false;

    this.db.workspaces.splice(idx, 1);

    if (cascade) {
      this.db.brands = this.db.brands.filter(b => b.workspaceId !== id);
      this.db.content = this.db.content.filter(c => c.workspaceId !== id);
      this.db.campaigns = this.db.campaigns.filter(c => c.workspaceId !== id);
      this.db.team = this.db.team.filter(t => t.workspaceId !== id);
      this.db.activities = this.db.activities.filter(a => a.workspaceId !== id);
    }

    this.save(this.db);
    return true;
  }

  // --- BRAND OPERATIONS ---
  public getBrands(workspaceId: string): Brand[] {
    return this.db.brands.filter(b => b.workspaceId === workspaceId && b.status !== 'Archived');
  }

  public createBrand(brandData: Partial<Brand>): Brand {
    if (!brandData.workspaceId) {
      throw new Error('Brand must belong to a workspace');
    }
    const ws = this.getWorkspace(brandData.workspaceId);
    if (!ws) {
      throw new Error(`Workspace ${brandData.workspaceId} does not exist`);
    }

    const now = new Date().toISOString();
    const id = brandData.id || `brd-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const code = (brandData.code || brandData.name?.substring(0, 4) || 'BRD').toUpperCase();

    const newBrand: Brand = {
      id,
      workspaceId: brandData.workspaceId,
      name: brandData.name || 'Untitled Brand',
      code,
      tagline: brandData.tagline || '',
      primaryColor: brandData.primaryColor || '#4F46E5',
      badgeBg: brandData.badgeBg || 'bg-indigo-50',
      badgeText: brandData.badgeText || 'text-indigo-700',
      badgeBorder: brandData.badgeBorder || 'border-indigo-200',
      description: brandData.description || '',
      industry: brandData.industry,
      website: brandData.website,
      defaultPlatforms: brandData.defaultPlatforms || ['LinkedIn', 'YouTube'],
      status: 'Active',
      createdAt: now,
      updatedAt: now,
    };

    this.db.brands.push(newBrand);
    this.save(this.db);
    return newBrand;
  }

  public updateBrand(id: string, updates: Partial<Brand>): Brand {
    const idx = this.db.brands.findIndex(b => b.id === id);
    if (idx === -1) {
      throw new Error(`Brand ${id} not found`);
    }

    const existing = this.db.brands[idx];
    const updated: Brand = {
      ...existing,
      ...updates,
      id,
      workspaceId: existing.workspaceId, // prevent unauthorized workspace transfer
      updatedAt: new Date().toISOString(),
    };

    this.db.brands[idx] = updated;
    this.save(this.db);
    return updated;
  }

  // --- SCOPED DATA RETRIEVAL ---
  public getScopedData(workspaceId: string) {
    const workspace = this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    const brands = this.db.brands.filter(b => b.workspaceId === workspaceId && b.status !== 'Archived');
    const content = this.db.content.filter(c => c.workspaceId === workspaceId);
    const campaigns = this.db.campaigns.filter(c => c.workspaceId === workspaceId);
    const team = this.db.team.filter(t => t.workspaceId === workspaceId);
    const activities = this.db.activities.filter(a => a.workspaceId === workspaceId);

    return {
      workspace,
      workspaces: this.getWorkspaces(),
      brands,
      content,
      campaigns,
      team,
      activities,
    };
  }

  // --- CONTENT CRUD ---
  public getContent(workspaceId: string, query?: any): ContentItem[] {
    let result = this.db.content.filter(c => c.workspaceId === workspaceId);
    if (query?.brandId && query.brandId !== 'all') {
      result = result.filter(c => c.brandId === query.brandId);
    }
    if (query?.status && query.status !== 'all') {
      result = result.filter(c => c.status === query.status);
    }
    if (query?.platform && query.platform !== 'all') {
      result = result.filter(c => c.platform === query.platform);
    }
    return result;
  }

  public createContent(item: ContentItem): ContentItem {
    // 1. Validate workspace exists
    const ws = this.getWorkspace(item.workspaceId);
    if (!ws) {
      throw new Error(`Workspace ${item.workspaceId} not found`);
    }

    // 2. Validate brand exists and belongs to specified workspace
    const brand = this.db.brands.find(b => b.id === item.brandId);
    if (!brand) {
      throw new Error(`Brand ${item.brandId} not found`);
    }
    if (brand.workspaceId !== item.workspaceId) {
      throw new Error(`Brand ${item.brandId} (${brand.name}) belongs to workspace ${brand.workspaceId}, not ${item.workspaceId}`);
    }

    // 3. If campaignId is provided, validate campaign belongs to same workspace & brand
    if (item.campaignId) {
      const camp = this.db.campaigns.find(c => c.id === item.campaignId);
      if (!camp) {
        throw new Error(`Campaign ${item.campaignId} not found in database`);
      }
      if (camp.workspaceId !== item.workspaceId) {
        throw new Error(`Campaign ${item.campaignId} belongs to workspace ${camp.workspaceId}, not ${item.workspaceId}`);
      }
      if (camp.brandId && camp.brandId !== item.brandId) {
        throw new Error(`Campaign ${item.campaignId} is assigned to brand ${camp.brandId}, which does not match content brand ${item.brandId}`);
      }
    }

    if (!item.id) {
      item.id = `cnt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    }
    const now = new Date().toISOString();
    item.createdAt = item.createdAt || now;
    item.updatedAt = now;

    this.db.content.unshift(item);

    // Log activity
    const activity: ActivityLog = {
      id: `act-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      workspaceId: item.workspaceId,
      contentId: item.id,
      contentTopic: item.topic,
      brandId: item.brandId,
      action: `Content created with status "${item.status}"`,
      newValue: item.status,
      user: item.responsiblePerson || 'Marketing Ops',
      timestamp: now,
    };
    this.db.activities.unshift(activity);

    this.save(this.db);
    return item;
  }

  public updateContent(id: string, updates: Partial<ContentItem>): ContentItem {
    const idx = this.db.content.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new Error(`Content item ${id} not found`);
    }

    const prev = this.db.content[idx];
    const targetBrandId = updates.brandId || prev.brandId;
    const targetWorkspaceId = prev.workspaceId;

    // Validate brand belongs to same workspace
    if (updates.brandId && updates.brandId !== prev.brandId) {
      const brand = this.db.brands.find(b => b.id === updates.brandId);
      if (!brand) {
        throw new Error(`Brand ${updates.brandId} not found`);
      }
      if (brand.workspaceId !== targetWorkspaceId) {
        throw new Error(`Brand ${updates.brandId} does not belong to workspace ${targetWorkspaceId}`);
      }
    }

    // Validate campaign association
    const targetCampaignId = updates.campaignId !== undefined ? updates.campaignId : prev.campaignId;
    if (targetCampaignId) {
      const camp = this.db.campaigns.find(c => c.id === targetCampaignId);
      if (!camp) {
        throw new Error(`Campaign ${targetCampaignId} not found`);
      }
      if (camp.workspaceId !== targetWorkspaceId) {
        throw new Error(`Campaign ${targetCampaignId} belongs to workspace ${camp.workspaceId}, not ${targetWorkspaceId}`);
      }
      if (camp.brandId && camp.brandId !== targetBrandId) {
        throw new Error(`Campaign ${targetCampaignId} is assigned to brand ${camp.brandId}, not ${targetBrandId}`);
      }
    }

    const updated: ContentItem = {
      ...prev,
      ...updates,
      id,
      workspaceId: prev.workspaceId, // enforce isolation
      updatedAt: new Date().toISOString(),
    };

    const changes: string[] = [];
    if (prev.status !== updated.status) {
      changes.push(`status updated from "${prev.status}" to "${updated.status}"`);
    }
    if (prev.scheduledPublishingDate !== updated.scheduledPublishingDate) {
      changes.push(`scheduled date moved from ${prev.scheduledPublishingDate} to ${updated.scheduledPublishingDate}`);
    }
    if (prev.responsiblePerson !== updated.responsiblePerson) {
      changes.push(`assigned person updated to "${updated.responsiblePerson}"`);
    }
    if (prev.brandId !== updated.brandId) {
      changes.push(`brand updated from "${prev.brandId}" to "${updated.brandId}"`);
    }
    if (prev.campaignId !== updated.campaignId) {
      changes.push(`campaign association updated`);
    }

    if (changes.length > 0) {
      this.db.activities.unshift({
        id: `act-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        workspaceId: updated.workspaceId,
        contentId: id,
        contentTopic: updated.topic,
        brandId: updated.brandId,
        action: changes.join('; '),
        previousValue: prev.status,
        newValue: updated.status,
        user: updated.responsiblePerson || 'Team Member',
        timestamp: new Date().toISOString(),
      });
    }

    this.db.content[idx] = updated;
    this.save(this.db);
    return updated;
  }

  public deleteContent(id: string): boolean {
    const idx = this.db.content.findIndex(c => c.id === id);
    if (idx === -1) return false;

    const deleted = this.db.content[idx];
    this.db.content.splice(idx, 1);

    this.db.activities.unshift({
      id: `act-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      workspaceId: deleted.workspaceId,
      contentId: id,
      contentTopic: deleted.topic,
      brandId: deleted.brandId,
      action: `Content item "${deleted.topic}" deleted`,
      user: 'Marketing Ops',
      timestamp: new Date().toISOString(),
    });

    this.save(this.db);
    return true;
  }

  // --- CAMPAIGNS ---
  public getCampaigns(workspaceId: string): Campaign[] {
    return this.db.campaigns.filter(c => c.workspaceId === workspaceId);
  }

  public createCampaign(camp: Campaign): Campaign {
    if (!camp.workspaceId) {
      throw new Error('Campaign must have a workspaceId');
    }
    const ws = this.getWorkspace(camp.workspaceId);
    if (!ws) {
      throw new Error(`Workspace ${camp.workspaceId} not found`);
    }

    if (!camp.brandId) {
      throw new Error('Campaign must be assigned to a valid brandId');
    }
    const brand = this.db.brands.find(b => b.id === camp.brandId);
    if (!brand) {
      throw new Error(`Brand ${camp.brandId} not found`);
    }
    if (brand.workspaceId !== camp.workspaceId) {
      throw new Error(`Brand ${camp.brandId} (${brand.name}) belongs to workspace ${brand.workspaceId}, not ${camp.workspaceId}`);
    }

    if (!camp.id) {
      camp.id = `cmp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    }
    const now = new Date().toISOString();
    camp.createdAt = camp.createdAt || now;
    camp.updatedAt = now;

    this.db.campaigns.unshift(camp);
    this.save(this.db);
    return camp;
  }

  public updateCampaign(id: string, updates: Partial<Campaign>): Campaign {
    const idx = this.db.campaigns.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new Error(`Campaign ${id} not found`);
    }

    const prev = this.db.campaigns[idx];

    // Validate brand belongs to same workspace if changing brand
    if (updates.brandId && updates.brandId !== prev.brandId) {
      const brand = this.db.brands.find(b => b.id === updates.brandId);
      if (!brand) {
        throw new Error(`Brand ${updates.brandId} not found`);
      }
      if (brand.workspaceId !== prev.workspaceId) {
        throw new Error(`Brand ${updates.brandId} does not belong to workspace ${prev.workspaceId}`);
      }

      // Re-align or uncouple content deliverables linked to this campaign if brand changed
      for (const item of this.db.content) {
        if (item.campaignId === id && item.brandId !== updates.brandId) {
          item.brandId = updates.brandId;
          item.updatedAt = new Date().toISOString();
        }
      }
    }

    const updated: Campaign = {
      ...prev,
      ...updates,
      id,
      workspaceId: prev.workspaceId, // enforce isolation
      updatedAt: new Date().toISOString(),
    };

    this.db.campaigns[idx] = updated;
    this.save(this.db);
    return updated;
  }

  public deleteCampaign(id: string): boolean {
    const idx = this.db.campaigns.findIndex(c => c.id === id);
    if (idx === -1) return false;

    // Uncouple content items linked to this campaign without deleting them
    for (const item of this.db.content) {
      if (item.campaignId === id) {
        delete item.campaignId;
        item.updatedAt = new Date().toISOString();
      }
    }

    this.db.campaigns.splice(idx, 1);
    this.save(this.db);
    return true;
  }

  // --- TEAM ---
  public createTeamMember(member: TeamMember): TeamMember {
    if (!member.workspaceId) {
      throw new Error('Team member must have a workspaceId');
    }
    const ws = this.getWorkspace(member.workspaceId);
    if (!ws) {
      throw new Error(`Workspace ${member.workspaceId} not found`);
    }

    if (!member.id) {
      member.id = `tm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    }
    this.db.team.push(member);
    this.save(this.db);
    return member;
  }

  // --- INTEGRITY AUDIT & REPAIR ---
  public runIntegrityAudit(): IntegrityDiagnosticReport {
    return checkDataIntegrity(this.db);
  }

  public safeAutoRepair(): { repaired: number; details: string[] } {
    const details: string[] = [];
    let repaired = 0;
    const defaultWsId = this.db.workspaces[0]?.id || DEFAULT_WORKSPACE_ID;
    const brandMap = new Map(this.db.brands.map(b => [b.id, b]));
    const campMap = new Map(this.db.campaigns.map(c => [c.id, c]));

    // 1. Fix missing workspaceId on brands
    for (const b of this.db.brands) {
      if (!b.workspaceId) {
        b.workspaceId = defaultWsId;
        details.push(`Repaired brand "${b.name}" (${b.id}) -> assigned to workspace ${defaultWsId}`);
        repaired++;
      }
    }

    // 2. Fix content orphan campaigns or cross-workspace mismatches
    for (const item of this.db.content) {
      if (item.campaignId && !campMap.has(item.campaignId)) {
        details.push(`Unlinked orphaned campaignId ${item.campaignId} from content "${item.topic}"`);
        delete item.campaignId;
        repaired++;
      }
    }

    if (repaired > 0) {
      this.save(this.db);
    }

    return { repaired, details };
  }

  // --- RESET DEMO DATA ---
  public resetData(): DatabaseSchema {
    this.db = this.getDefaultSchema();
    this.save(this.db);
    return this.db;
  }

  // Raw database for backup/export
  public getRawDatabase(): DatabaseSchema {
    return this.db;
  }

  // --- HEALTH & COMPATIBILITY METHODS ---
  public async ping(): Promise<void> {
    return Promise.resolve();
  }

  public async flush(): Promise<void> {
    return Promise.resolve();
  }

  public async close(): Promise<void> {
    return Promise.resolve();
  }

}
