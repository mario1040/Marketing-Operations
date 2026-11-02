import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Workspace,
  Brand,
  BrandId,
  Campaign,
  ContentItem,
  ContentStatus,
  FilterState,
  TeamMember,
  ActivityLog,
  OperationalKPISummary,
  IntegrityDiagnosticReport,
} from '../types';
import {
  DEFAULT_WORKSPACE_ID,
  INITIAL_WORKSPACES,
  INITIAL_BRANDS,
  INITIAL_CAMPAIGNS,
  INITIAL_CONTENT,
  INITIAL_TEAM,
  INITIAL_ACTIVITIES,
} from '../data/initialData';
import { calculateOperationalKPIs, filterContentItems } from '../utils/metrics';
import { checkDataIntegrity } from '../utils/dataDiagnostics';

interface MarketingContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeWorkspace: Workspace | null;
  setActiveWorkspaceId: (id: string) => void;
  createWorkspace: (data: Partial<Workspace>) => Promise<Workspace>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<Workspace>;
  archiveWorkspace: (id: string) => Promise<boolean>;
  deleteWorkspace: (id: string, cascade?: boolean) => Promise<boolean>;

  brands: Brand[];
  createBrand: (data: Partial<Brand>) => Promise<Brand>;
  updateBrand: (id: string, data: Partial<Brand>) => Promise<Brand>;
  archiveBrand: (id: string) => Promise<boolean>;

  content: ContentItem[];
  campaigns: Campaign[];
  team: TeamMember[];
  activities: ActivityLog[];

  activeBrandId: BrandId | 'all';
  setActiveBrandId: (brandId: BrandId | 'all') => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  filteredContent: ContentItem[];
  kpis: OperationalKPISummary;

  selectedContentItem: ContentItem | null;
  setSelectedContentItem: (item: ContentItem | null) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  modalMode: 'create' | 'edit' | 'duplicate';
  setModalMode: (mode: 'create' | 'edit' | 'duplicate') => void;
  openCreateModal: (defaultDate?: string, defaultBrand?: BrandId) => void;
  openEditModal: (item: ContentItem) => void;
  openDuplicateModal: (item: ContentItem) => void;
  saveContentItem: (item: Partial<ContentItem>) => Promise<ContentItem>;
  deleteContentItem: (id: string) => Promise<boolean>;
  updateContentStatus: (id: string, newStatus: ContentStatus) => Promise<void>;
  updateContentDate: (id: string, newDate: string) => Promise<void>;

  createCampaign: (campaign: Partial<Campaign>) => Promise<Campaign>;
  updateCampaign: (id: string, campaign: Partial<Campaign>) => Promise<Campaign>;
  deleteCampaign: (id: string) => Promise<boolean>;
  createTeamMember: (member: Partial<TeamMember>) => Promise<TeamMember>;
  resetToInitialData: () => Promise<void>;
  runIntegrityAudit: () => Promise<IntegrityDiagnosticReport>;

  isLoading: boolean;
  isOffline: boolean;
  lastSavedAt: string | null;
  exportToCsv: () => void;
  exportToJson: () => void;
}

const LOCAL_STORAGE_DB_KEY = 'marketing_ops_db_v2';
const LOCAL_STORAGE_ACTIVE_WS_KEY = 'marketing_ops_active_ws_v2';
const LOCAL_STORAGE_API_TOKEN_KEY = 'marketing_ops_api_token_v1';
const API_BASE_URL = (import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL || '';

async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  let token = localStorage.getItem(LOCAL_STORAGE_API_TOKEN_KEY);
  if (!token) {
    token = window.prompt('Enter your Marketing API access token');
    if (!token?.trim()) throw new Error('Marketing API access token is required');
    token = token.trim();
    localStorage.setItem(LOCAL_STORAGE_API_TOKEN_KEY, token);
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const requestUrl = typeof input === 'string' && input.startsWith('/api/')
    ? `${API_BASE_URL}${input}`
    : input;
  const response = await fetch(requestUrl, { ...init, headers });
  if (!response.ok) {
    const details = await response.json().catch(() => null) as { error?: string } | null;
    if (response.status === 401) localStorage.removeItem(LOCAL_STORAGE_API_TOKEN_KEY);
    throw new Error(details?.error || `Marketing API request failed (${response.status})`);
  }
  return response;
}

const defaultFilters: FilterState = {
  brandId: 'all',
  platform: 'all',
  contentType: 'all',
  status: 'all',
  responsiblePerson: 'all',
  campaignId: 'all',
  searchQuery: '',
  dateRange: 'all',
};

const MarketingContext = createContext<MarketingContextType | undefined>(undefined);

export const MarketingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // All Database Collections
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [allBrands, setAllBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [allContent, setAllContent] = useState<ContentItem[]>(INITIAL_CONTENT);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [allTeam, setAllTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [allActivities, setAllActivities] = useState<ActivityLog[]>(INITIAL_ACTIVITIES);

  // Active Workspace & Brand state
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_ACTIVE_WS_KEY) || DEFAULT_WORKSPACE_ID;
    } catch {
      return DEFAULT_WORKSPACE_ID;
    }
  });

  const [activeBrandId, setActiveBrandId] = useState<BrandId | 'all'>('all');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedContentItem, setSelectedContentItem] = useState<ContentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const setActiveWorkspaceId = useCallback((id: string) => {
    setActiveWorkspaceIdState(id);
    setActiveBrandId('all');
    setFilters({ ...defaultFilters, brandId: 'all' });
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_WS_KEY, id);
    } catch (e) {
      console.warn('Could not persist active workspace ID:', e);
    }
  }, []);

  // Sync activeBrandId with filters
  useEffect(() => {
    setFilters(prev => ({ ...prev, brandId: activeBrandId }));
  }, [activeBrandId]);

  // Initial load from API or fallback localStorage
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await apiFetch('/api/data');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.workspaces) && Array.isArray(data.content)) {
            setAllWorkspaces(data.workspaces || INITIAL_WORKSPACES);
            setAllBrands(data.brands || INITIAL_BRANDS);
            setAllContent(data.content || INITIAL_CONTENT);
            setAllCampaigns(data.campaigns || INITIAL_CAMPAIGNS);
            setAllTeam(data.team || INITIAL_TEAM);
            setAllActivities(data.activities || INITIAL_ACTIVITIES);
            setIsOffline(false);
            setLastSavedAt(new Date().toLocaleTimeString());
            localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(data));
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Backend API unavailable, falling back to cache:', err);
      }

      // Fallback cache
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.workspaces)) {
            setAllWorkspaces(parsed.workspaces);
            setAllBrands(parsed.brands || INITIAL_BRANDS);
            setAllContent(parsed.content || INITIAL_CONTENT);
            setAllCampaigns(parsed.campaigns || INITIAL_CAMPAIGNS);
            setAllTeam(parsed.team || INITIAL_TEAM);
            setAllActivities(parsed.activities || INITIAL_ACTIVITIES);
            setIsOffline(true);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('LocalStorage read error:', e);
      }

      // Default seeds
      setAllWorkspaces(INITIAL_WORKSPACES);
      setAllBrands(INITIAL_BRANDS);
      setAllContent(INITIAL_CONTENT);
      setAllCampaigns(INITIAL_CAMPAIGNS);
      setAllTeam(INITIAL_TEAM);
      setAllActivities(INITIAL_ACTIVITIES);
      setIsLoading(false);
    }

    loadData();
  }, []);

  // Persist state to localStorage
  const persistState = useCallback(
    (
      newWorkspaces = allWorkspaces,
      newBrands = allBrands,
      newContent = allContent,
      newCampaigns = allCampaigns,
      newTeam = allTeam,
      newActivities = allActivities
    ) => {
      const payload = {
        workspaces: newWorkspaces,
        brands: newBrands,
        content: newContent,
        campaigns: newCampaigns,
        team: newTeam,
        activities: newActivities,
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(payload));
      } catch (e) {
        console.error('Failed to sync to localStorage:', e);
      }
      setLastSavedAt(new Date().toLocaleTimeString());
    },
    [allWorkspaces, allBrands, allContent, allCampaigns, allTeam, allActivities]
  );

  // Active workspace object
  const activeWorkspace =
    allWorkspaces.find(ws => ws.id === activeWorkspaceId && ws.status !== 'Archived') ||
    allWorkspaces[0] ||
    null;

  // Scoped collections for current active workspace
  const currentWsId = activeWorkspace?.id || DEFAULT_WORKSPACE_ID;
  const brands = allBrands.filter(b => b.workspaceId === currentWsId && b.status !== 'Archived');
  const content = allContent.filter(c => c.workspaceId === currentWsId);
  const campaigns = allCampaigns.filter(c => c.workspaceId === currentWsId);
  const team = allTeam.filter(t => t.workspaceId === currentWsId);
  const activities = allActivities.filter(a => a.workspaceId === currentWsId);

  const resetFilters = useCallback(() => {
    setFilters({ ...defaultFilters, brandId: activeBrandId });
  }, [activeBrandId]);

  // --- WORKSPACE ACTIONS ---
  const createWorkspace = useCallback(
    async (data: Partial<Workspace>): Promise<Workspace> => {
      const now = new Date().toISOString();
      const id = `ws-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const slug = (data.name || 'new-workspace')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const newWs: Workspace = {
        id,
        name: data.name || 'New Workspace',
        slug,
        description: data.description || '',
        logo: data.logo || (data.name ? data.name[0].toUpperCase() : 'W'),
        type: data.type || 'Company',
        industry: data.industry || 'General Operations',
        timezone: data.timezone || 'America/New_York',
        defaultLanguage: data.defaultLanguage || 'en',
        defaultCurrency: data.defaultCurrency || 'USD',
        status: 'Active',
        settings: {
          calendarStartDay: data.settings?.calendarStartDay ?? 1,
          timeFormat: data.settings?.timeFormat ?? '12h',
          customType: data.settings?.customType,
        },
        createdAt: now,
        updatedAt: now,
        createdBy: 'Workspace Owner',
      };

      const updated = [newWs, ...allWorkspaces];
      setAllWorkspaces(updated);
      persistState(updated);

      try {
        await apiFetch('/api/workspaces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWs),
        });
      } catch (e) {
        console.warn('API workspace create failed, saved locally:', e);
        setIsOffline(true);
        throw e;
      }

      // Switch to newly created workspace
      setActiveWorkspaceId(newWs.id);
      return newWs;
    },
    [allWorkspaces, persistState, setActiveWorkspaceId]
  );

  const updateWorkspace = useCallback(
    async (id: string, data: Partial<Workspace>): Promise<Workspace> => {
      const idx = allWorkspaces.findIndex(ws => ws.id === id);
      if (idx === -1) throw new Error('Workspace not found');

      const updatedWs: Workspace = {
        ...allWorkspaces[idx],
        ...data,
        id,
        updatedAt: new Date().toISOString(),
      };

      const updated = [...allWorkspaces];
      updated[idx] = updatedWs;
      setAllWorkspaces(updated);
      persistState(updated);

      try {
        await apiFetch(`/api/workspaces/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedWs),
        });
      } catch (e) {
        console.warn('API workspace update failed, saved locally:', e);
        setIsOffline(true);
        throw e;
      }

      return updatedWs;
    },
    [allWorkspaces, persistState]
  );

  const archiveWorkspace = useCallback(
    async (id: string): Promise<boolean> => {
      const activeWorkspaces = allWorkspaces.filter(ws => ws.status !== 'Archived');
      if (activeWorkspaces.length <= 1) {
        throw new Error('Cannot archive the only remaining active workspace');
      }

      const updated = allWorkspaces.map(ws =>
        ws.id === id ? { ...ws, status: 'Archived' as const, updatedAt: new Date().toISOString() } : ws
      );
      setAllWorkspaces(updated);
      persistState(updated);

      // If active workspace was archived, switch to first remaining
      if (activeWorkspaceId === id) {
        const remaining = updated.find(ws => ws.id !== id && ws.status !== 'Archived');
        if (remaining) {
          setActiveWorkspaceId(remaining.id);
        }
      }

      try {
        await apiFetch(`/api/workspaces/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('API workspace archive failed, saved locally:', e);
        setIsOffline(true);
        throw e;
      }

      return true;
    },
    [allWorkspaces, activeWorkspaceId, persistState, setActiveWorkspaceId]
  );

  const deleteWorkspace = useCallback(
    async (id: string, cascade: boolean = true): Promise<boolean> => {
      const activeWorkspaces = allWorkspaces.filter(ws => ws.status !== 'Archived');
      if (activeWorkspaces.length <= 1) {
        throw new Error('Cannot delete the only remaining active workspace');
      }

      const updatedWorkspaces = allWorkspaces.filter(ws => ws.id !== id);
      let updatedBrands = allBrands;
      let updatedContent = allContent;
      let updatedCampaigns = allCampaigns;
      let updatedTeam = allTeam;
      let updatedActivities = allActivities;

      if (cascade) {
        updatedBrands = allBrands.filter(b => b.workspaceId !== id);
        updatedContent = allContent.filter(c => c.workspaceId !== id);
        updatedCampaigns = allCampaigns.filter(c => c.workspaceId !== id);
        updatedTeam = allTeam.filter(t => t.workspaceId !== id);
        updatedActivities = allActivities.filter(a => a.workspaceId !== id);
      }

      setAllWorkspaces(updatedWorkspaces);
      setAllBrands(updatedBrands);
      setAllContent(updatedContent);
      setAllCampaigns(updatedCampaigns);
      setAllTeam(updatedTeam);
      setAllActivities(updatedActivities);

      // If active workspace was deleted, switch to first remaining
      if (activeWorkspaceId === id) {
        const remaining = updatedWorkspaces.find(ws => ws.status !== 'Archived') || updatedWorkspaces[0];
        if (remaining) {
          setActiveWorkspaceId(remaining.id);
        }
      }

      persistState(
        updatedWorkspaces,
        updatedBrands,
        updatedContent,
        updatedCampaigns,
        updatedTeam,
        updatedActivities
      );

      try {
        await apiFetch(`/api/workspaces/${id}?permanent=true&cascade=${cascade}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('API workspace delete failed, saved locally:', e);
        setIsOffline(true);
        throw e;
      }

      return true;
    },
    [allWorkspaces, allBrands, allContent, allCampaigns, allTeam, allActivities, activeWorkspaceId, persistState, setActiveWorkspaceId]
  );

  // --- BRAND ACTIONS ---
  const createBrand = useCallback(
    async (brandData: Partial<Brand>): Promise<Brand> => {
      const now = new Date().toISOString();
      const id = brandData.id || `brd-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const code = (brandData.code || brandData.name?.substring(0, 4) || 'BRD').toUpperCase();

      const newBrand: Brand = {
        id,
        workspaceId: currentWsId,
        name: brandData.name || 'New Brand',
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

      const updated = [...allBrands, newBrand];
      setAllBrands(updated);
      persistState(allWorkspaces, updated);

      try {
        await apiFetch(`/api/workspaces/${currentWsId}/brands`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBrand),
        });
      } catch (e) {
        console.warn('API brand create failed, saved locally:', e);
        setIsOffline(true);
        throw e;
      }

      return newBrand;
    },
    [currentWsId, allBrands, allWorkspaces, persistState]
  );

  const updateBrand = useCallback(
    async (id: string, data: Partial<Brand>): Promise<Brand> => {
      const idx = allBrands.findIndex(b => b.id === id);
      if (idx === -1) throw new Error('Brand not found');

      const updatedBrand: Brand = {
        ...allBrands[idx],
        ...data,
        id,
        workspaceId: allBrands[idx].workspaceId,
        updatedAt: new Date().toISOString(),
      };

      const updated = [...allBrands];
      updated[idx] = updatedBrand;
      setAllBrands(updated);
      persistState(allWorkspaces, updated);

      try {
        await apiFetch(`/api/brands/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedBrand),
        });
      } catch (e) {
        console.warn('API brand update failed, saved locally:', e);
        setIsOffline(true);
        throw e;
      }

      return updatedBrand;
    },
    [allBrands, allWorkspaces, persistState]
  );

  const archiveBrand = useCallback(
    async (id: string): Promise<boolean> => {
      const updated = allBrands.map(b =>
        b.id === id ? { ...b, status: 'Archived' as const, updatedAt: new Date().toISOString() } : b
      );
      setAllBrands(updated);
      persistState(allWorkspaces, updated);

      if (activeBrandId === id) {
        setActiveBrandId('all');
      }

      try {
        await apiFetch(`/api/brands/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Archived' }),
        });
      } catch (e) {
        console.warn('API brand archive failed, saved locally:', e);
        setIsOffline(true);
        throw e;
      }

      return true;
    },
    [allBrands, allWorkspaces, activeBrandId, persistState]
  );

  // --- CONTENT MODAL & CRUD ---
  const openCreateModal = useCallback(
    (defaultDate?: string, defaultBrand?: BrandId) => {
      const now = new Date();
      const dateStr = defaultDate || now.toISOString().split('T')[0];
      const targetBrand: BrandId =
        defaultBrand ||
        (activeBrandId !== 'all' ? activeBrandId : brands[0]?.id || 'the-professor');

      const newItem: ContentItem = {
        id: '',
        workspaceId: currentWsId,
        brandId: targetBrand,
        contentDate: dateStr,
        scheduledPublishingDate: dateStr,
        publishingTime: '10:00 AM',
        platform: 'LinkedIn',
        contentType: 'Static Post',
        topic: '',
        objective: 'Brand Awareness',
        responsiblePerson: team[0]?.name || 'Marketing Lead',
        status: 'Planned',
        caption: '',
        cta: '',
        contentBrief: '',
        creativeUrl: '',
        internalNotes: '',
        approvalNotes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: team[0]?.name || 'Marketing Ops',
      };

      setSelectedContentItem(newItem);
      setModalMode('create');
      setIsModalOpen(true);
    },
    [currentWsId, activeBrandId, brands, team]
  );

  const openEditModal = useCallback((item: ContentItem) => {
    setSelectedContentItem(item);
    setModalMode('edit');
    setIsModalOpen(true);
  }, []);

  const openDuplicateModal = useCallback(
    (item: ContentItem) => {
      const duplicated: ContentItem = {
        ...item,
        id: '',
        workspaceId: currentWsId,
        topic: `${item.topic} (Copy)`,
        status: 'Planned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        actualPublishedUrl: undefined,
        publishedAt: undefined,
      };
      setSelectedContentItem(duplicated);
      setModalMode('duplicate');
      setIsModalOpen(true);
    },
    [currentWsId]
  );

  const saveContentItem = useCallback(
    async (itemData: Partial<ContentItem>): Promise<ContentItem> => {
      const now = new Date().toISOString();
      let savedItem: ContentItem;

      if (modalMode === 'edit' && itemData.id) {
        const index = allContent.findIndex(c => c.id === itemData.id);
        const prev = index >= 0 ? allContent[index] : itemData;
        savedItem = {
          ...(prev as ContentItem),
          ...itemData,
          workspaceId: currentWsId,
          updatedAt: now,
        } as ContentItem;

        const updatedList = [...allContent];
        if (index >= 0) {
          updatedList[index] = savedItem;
        } else {
          updatedList.unshift(savedItem);
        }

        const changes: string[] = [];
        if (prev && (prev as ContentItem).status !== savedItem.status) {
          changes.push(`status updated to ${savedItem.status}`);
        }
        if (prev && (prev as ContentItem).scheduledPublishingDate !== savedItem.scheduledPublishingDate) {
          changes.push(`scheduled date moved to ${savedItem.scheduledPublishingDate}`);
        }

        const newLog: ActivityLog = {
          id: `act-${Date.now().toString(36)}`,
          workspaceId: currentWsId,
          contentId: savedItem.id,
          contentTopic: savedItem.topic,
          brandId: savedItem.brandId,
          action: changes.length > 0 ? changes.join(', ') : 'Content details updated',
          user: savedItem.responsiblePerson || 'Team Member',
          timestamp: now,
        };

        const updatedActivities = [newLog, ...allActivities];
        setAllContent(updatedList);
        setAllActivities(updatedActivities);
        persistState(allWorkspaces, allBrands, updatedList, allCampaigns, allTeam, updatedActivities);

        try {
          await apiFetch(`/api/content/${savedItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(savedItem),
          });
        } catch (e) {
          console.warn('API update failed, state persisted locally:', e);
        setIsOffline(true);
        throw e;
        }
      } else {
        const newId = `cnt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        savedItem = {
          ...itemData,
          id: newId,
          workspaceId: currentWsId,
          createdAt: now,
          updatedAt: now,
        } as ContentItem;

        const updatedList = [savedItem, ...allContent];
        const newLog: ActivityLog = {
          id: `act-${Date.now().toString(36)}`,
          workspaceId: currentWsId,
          contentId: savedItem.id,
          contentTopic: savedItem.topic,
          brandId: savedItem.brandId,
          action: `Content created with status "${savedItem.status}"`,
          user: savedItem.responsiblePerson || 'Marketing Ops',
          timestamp: now,
        };

        const updatedActivities = [newLog, ...allActivities];
        setAllContent(updatedList);
        setAllActivities(updatedActivities);
        persistState(allWorkspaces, allBrands, updatedList, allCampaigns, allTeam, updatedActivities);

        try {
          await apiFetch(`/api/workspaces/${currentWsId}/content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(savedItem),
          });
        } catch (e) {
          console.warn('API create failed, state persisted locally:', e);
        setIsOffline(true);
        throw e;
        }
      }

      setIsModalOpen(false);
      return savedItem;
    },
    [modalMode, currentWsId, allContent, allActivities, allWorkspaces, allBrands, allCampaigns, allTeam, persistState]
  );

  const deleteContentItem = useCallback(
    async (id: string): Promise<boolean> => {
      const itemToDelete = allContent.find(c => c.id === id);
      if (!itemToDelete) return false;

      const updatedList = allContent.filter(c => c.id !== id);
      const newLog: ActivityLog = {
        id: `act-${Date.now().toString(36)}`,
        workspaceId: currentWsId,
        contentId: id,
        contentTopic: itemToDelete.topic,
        brandId: itemToDelete.brandId,
        action: `Content item "${itemToDelete.topic}" deleted`,
        user: 'Marketing Ops',
        timestamp: new Date().toISOString(),
      };

      const updatedActivities = [newLog, ...allActivities];
      setAllContent(updatedList);
      setAllActivities(updatedActivities);
      persistState(allWorkspaces, allBrands, updatedList, allCampaigns, allTeam, updatedActivities);

      try {
        await apiFetch(`/api/content/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('API delete failed, synced locally:', e);
        setIsOffline(true);
        throw e;
      }

      setIsModalOpen(false);
      return true;
    },
    [allContent, allActivities, currentWsId, allWorkspaces, allBrands, allCampaigns, allTeam, persistState]
  );

  const updateContentStatus = useCallback(
    async (id: string, newStatus: ContentStatus) => {
      const item = allContent.find(c => c.id === id);
      if (!item || item.status === newStatus) return;

      const prevStatus = item.status;
      const now = new Date().toISOString();
      const updatedItem: ContentItem = {
        ...item,
        status: newStatus,
        updatedAt: now,
        publishedAt: newStatus === 'Published' && !item.publishedAt ? now : item.publishedAt,
      };

      const updatedList = allContent.map(c => (c.id === id ? updatedItem : c));
      const newLog: ActivityLog = {
        id: `act-${Date.now().toString(36)}`,
        workspaceId: item.workspaceId,
        contentId: id,
        contentTopic: item.topic,
        brandId: item.brandId,
        action: `Status transitioned from ${prevStatus} to ${newStatus}`,
        previousValue: prevStatus,
        newValue: newStatus,
        user: item.responsiblePerson || 'Team Member',
        timestamp: now,
      };

      const updatedActivities = [newLog, ...allActivities];
      setAllContent(updatedList);
      setAllActivities(updatedActivities);
      persistState(allWorkspaces, allBrands, updatedList, allCampaigns, allTeam, updatedActivities);

      try {
        await apiFetch(`/api/content/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItem),
        });
      } catch (e) {
        console.warn('API status update failed, synced locally:', e);
        setIsOffline(true);
        throw e;
      }
    },
    [allContent, allActivities, allWorkspaces, allBrands, allCampaigns, allTeam, persistState]
  );

  const updateContentDate = useCallback(
    async (id: string, newDate: string) => {
      const item = allContent.find(c => c.id === id);
      if (!item || item.scheduledPublishingDate === newDate) return;

      const prevDate = item.scheduledPublishingDate;
      const now = new Date().toISOString();
      const updatedItem: ContentItem = {
        ...item,
        scheduledPublishingDate: newDate,
        updatedAt: now,
      };

      const updatedList = allContent.map(c => (c.id === id ? updatedItem : c));
      const newLog: ActivityLog = {
        id: `act-${Date.now().toString(36)}`,
        workspaceId: item.workspaceId,
        contentId: id,
        contentTopic: item.topic,
        brandId: item.brandId,
        action: `Rescheduled from ${prevDate} to ${newDate}`,
        previousValue: prevDate,
        newValue: newDate,
        user: item.responsiblePerson || 'Team Member',
        timestamp: now,
      };

      const updatedActivities = [newLog, ...allActivities];
      setAllContent(updatedList);
      setAllActivities(updatedActivities);
      persistState(allWorkspaces, allBrands, updatedList, allCampaigns, allTeam, updatedActivities);

      try {
        await apiFetch(`/api/content/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItem),
        });
      } catch (e) {
        console.warn('API date update failed, synced locally:', e);
        setIsOffline(true);
        throw e;
      }
    },
    [allContent, allActivities, allWorkspaces, allBrands, allCampaigns, allTeam, persistState]
  );

  const createCampaign = useCallback(
    async (campaignData: Partial<Campaign>): Promise<Campaign> => {
      // Validate brand belongs to current workspace
      const targetBrandId = campaignData.brandId && brands.some(b => b.id === campaignData.brandId)
        ? campaignData.brandId
        : (brands[0]?.id || 'the-professor');

      const newCamp: Campaign = {
        id: `cmp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        workspaceId: currentWsId,
        brandId: targetBrandId,
        name: campaignData.name || 'Untitled Campaign',
        objective: campaignData.objective || 'Brand Awareness',
        startDate: campaignData.startDate || new Date().toISOString().split('T')[0],
        endDate: campaignData.endDate || new Date().toISOString().split('T')[0],
        description: campaignData.description || '',
        status: campaignData.status || 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [newCamp, ...allCampaigns];
      setAllCampaigns(updated);
      persistState(allWorkspaces, allBrands, allContent, updated);

      try {
        await apiFetch(`/api/workspaces/${currentWsId}/campaigns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCamp),
        });
      } catch (e) {
        console.warn('API campaign creation failed, saved locally:', e);
        setIsOffline(true);
        throw e;
      }

      return newCamp;
    },
    [currentWsId, brands, allCampaigns, allWorkspaces, allBrands, allContent, persistState]
  );

  const updateCampaign = useCallback(
    async (id: string, campaignData: Partial<Campaign>): Promise<Campaign> => {
      const idx = allCampaigns.findIndex(c => c.id === id);
      if (idx === -1) throw new Error(`Campaign ${id} not found`);

      const prev = allCampaigns[idx];
      const updatedCamp: Campaign = {
        ...prev,
        ...campaignData,
        id,
        workspaceId: prev.workspaceId,
        updatedAt: new Date().toISOString(),
      };

      const updatedCampaigns = [...allCampaigns];
      updatedCampaigns[idx] = updatedCamp;

      // If campaign brand changed, re-align any existing content items referencing this campaign
      let updatedContent = allContent;
      if (campaignData.brandId && campaignData.brandId !== prev.brandId) {
        updatedContent = allContent.map(item =>
          item.campaignId === id ? { ...item, brandId: campaignData.brandId!, updatedAt: new Date().toISOString() } : item
        );
        setAllContent(updatedContent);
      }

      setAllCampaigns(updatedCampaigns);
      persistState(allWorkspaces, allBrands, updatedContent, updatedCampaigns);

      try {
        await apiFetch(`/api/campaigns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCamp),
        });
      } catch (e) {
        console.warn('API campaign update failed, saved locally:', e);
        setIsOffline(true);
        throw e;
      }

      return updatedCamp;
    },
    [allCampaigns, allContent, allWorkspaces, allBrands, persistState]
  );

  const deleteCampaign = useCallback(
    async (id: string): Promise<boolean> => {
      const updatedCampaigns = allCampaigns.filter(c => c.id !== id);
      const updatedContent = allContent.map(item =>
        item.campaignId === id ? { ...item, campaignId: undefined, updatedAt: new Date().toISOString() } : item
      );

      setAllCampaigns(updatedCampaigns);
      setAllContent(updatedContent);
      persistState(allWorkspaces, allBrands, updatedContent, updatedCampaigns);

      try {
        await apiFetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('API campaign delete failed, saved locally:', e);
        setIsOffline(true);
        throw e;
      }

      return true;
    },
    [allCampaigns, allContent, allWorkspaces, allBrands, persistState]
  );

  const runIntegrityAudit = useCallback(async (): Promise<IntegrityDiagnosticReport> => {
    try {
      const res = await apiFetch('/api/diagnostics/integrity');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API diagnostics failed, checking local state:', e);
    }

    return checkDataIntegrity({
      workspaces: allWorkspaces,
      brands: allBrands,
      content: allContent,
      campaigns: allCampaigns,
      team: allTeam,
      activities: allActivities,
    });
  }, [allWorkspaces, allBrands, allContent, allCampaigns, allTeam, allActivities]);

  const createTeamMember = useCallback(
    async (memberData: Partial<TeamMember>): Promise<TeamMember> => {
      const newMember: TeamMember = {
        id: `tm-${Date.now().toString(36)}`,
        workspaceId: currentWsId,
        name: memberData.name || 'New Member',
        role: memberData.role || 'Content Contributor',
        email: memberData.email || 'contributor@brand.io',
        avatarBg: memberData.avatarBg || 'bg-slate-600',
        brands: memberData.brands || (brands.length > 0 ? [brands[0].id] : []),
      };

      const updated = [...allTeam, newMember];
      setAllTeam(updated);
      persistState(allWorkspaces, allBrands, allContent, allCampaigns, updated);

      try {
        await apiFetch(`/api/workspaces/${currentWsId}/team`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMember),
        });
      } catch (e) {
        console.warn('API team creation failed, saved locally:', e);
        setIsOffline(true);
        throw e;
      }

      return newMember;
    },
    [currentWsId, brands, allTeam, allWorkspaces, allBrands, allContent, allCampaigns, persistState]
  );

  const resetToInitialData = useCallback(async () => {
    setAllWorkspaces(INITIAL_WORKSPACES);
    setAllBrands(INITIAL_BRANDS);
    setAllContent(INITIAL_CONTENT);
    setAllCampaigns(INITIAL_CAMPAIGNS);
    setAllTeam(INITIAL_TEAM);
    setAllActivities(INITIAL_ACTIVITIES);
    setActiveWorkspaceId(DEFAULT_WORKSPACE_ID);
    localStorage.removeItem(LOCAL_STORAGE_DB_KEY);

    try {
      await apiFetch('/api/reset-data', { method: 'POST' });
    } catch (e) {
      console.warn('API reset failed:', e);
      setIsOffline(true);
      throw e;
    }
  }, [setActiveWorkspaceId]);

  // Filtered items based on active filters in current workspace
  const filteredContent = filterContentItems(content, filters);

  // Overall KPIs for current brand selection in workspace
  const brandScopeItems = activeBrandId === 'all' ? content : content.filter(c => c.brandId === activeBrandId);
  const kpis = calculateOperationalKPIs(brandScopeItems);

  // Export to CSV
  const exportToCsv = useCallback(() => {
    const headers = [
      'Workspace',
      'Content ID',
      'Brand',
      'Scheduled Date',
      'Publishing Time',
      'Platform',
      'Content Type',
      'Topic / Title',
      'Status',
      'Responsible Person',
      'Objective',
      'Campaign',
      'CTA',
      'Published URL',
    ];

    const rows = filteredContent.map(item => {
      const itemBrand = brands.find(b => b.id === item.brandId);
      return [
        `"${activeWorkspace?.name || 'Workspace'}"`,
        `"${item.id}"`,
        `"${itemBrand ? itemBrand.name : item.brandId}"`,
        `"${item.scheduledPublishingDate}"`,
        `"${item.publishingTime || ''}"`,
        `"${item.platform}"`,
        `"${item.contentType}"`,
        `"${(item.topic || '').replace(/"/g, '""')}"`,
        `"${item.status}"`,
        `"${item.responsiblePerson}"`,
        `"${item.objective}"`,
        `"${item.campaignId || ''}"`,
        `"${(item.cta || '').replace(/"/g, '""')}"`,
        `"${item.actualPublishedUrl || ''}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeWorkspace?.slug || 'workspace'}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredContent, brands, activeWorkspace]);

  // Export to JSON
  const exportToJson = useCallback(() => {
    const payload = {
      workspace: activeWorkspace,
      brands,
      content: filteredContent,
      campaigns,
      team,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `${activeWorkspace?.slug || 'workspace'}_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [activeWorkspace, brands, filteredContent, campaigns, team]);

  return (
    <MarketingContext.Provider
      value={{
        workspaces: allWorkspaces.filter(ws => ws.status !== 'Archived'),
        activeWorkspaceId: currentWsId,
        activeWorkspace,
        setActiveWorkspaceId,
        createWorkspace,
        updateWorkspace,
        archiveWorkspace,
        deleteWorkspace,

        brands,
        createBrand,
        updateBrand,
        archiveBrand,

        content,
        campaigns,
        team,
        activities,

        activeBrandId,
        setActiveBrandId,
        filters,
        setFilters,
        resetFilters,
        filteredContent,
        kpis,

        selectedContentItem,
        setSelectedContentItem,
        isModalOpen,
        setIsModalOpen,
        modalMode,
        setModalMode,
        openCreateModal,
        openEditModal,
        openDuplicateModal,
        saveContentItem,
        deleteContentItem,
        updateContentStatus,
        updateContentDate,

        createCampaign,
        updateCampaign,
        deleteCampaign,
        createTeamMember,
        resetToInitialData,
        runIntegrityAudit,

        isLoading,
        isOffline,
        lastSavedAt,
        exportToCsv,
        exportToJson,
      }}
    >
      {children}
    </MarketingContext.Provider>
  );
};

export const useMarketing = () => {
  const context = useContext(MarketingContext);
  if (!context) {
    throw new Error('useMarketing must be used within a MarketingProvider');
  }
  return context;
};
