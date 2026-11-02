export type WorkspaceType =
  | 'Company'
  | 'Agency'
  | 'Marketing Department'
  | 'Client Account'
  | 'Personal Workspace'
  | 'Custom';

export type WorkspaceRole = 'Owner' | 'Admin' | 'Editor' | 'Contributor' | 'Viewer';

export interface WorkspaceSettings {
  brandingPreference?: string;
  calendarStartDay: number; // 0 for Sunday, 1 for Monday
  timeFormat: '12h' | '24h';
  customType?: string;
  defaultTimezone?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  type: WorkspaceType | string;
  industry: string;
  timezone: string;
  defaultLanguage: string;
  defaultCurrency: string;
  status: 'Active' | 'Archived';
  settings: WorkspaceSettings;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  avatarBg?: string;
  joinedAt: string;
}

export type BrandId = string; // Fully dynamic string ID

export interface Brand {
  id: BrandId;
  workspaceId: string;
  name: string;
  code: string;
  tagline: string;
  primaryColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
  industry?: string;
  website?: string;
  defaultPlatforms?: ContentPlatform[];
  status: 'Active' | 'Archived';
  createdAt?: string;
  updatedAt?: string;
}

export type ContentStatus =
  | 'Planned'
  | 'In Production'
  | 'Editing'
  | 'Approved'
  | 'Scheduled'
  | 'Published';

export type ContentPlatform =
  | 'Facebook'
  | 'Instagram'
  | 'TikTok'
  | 'LinkedIn'
  | 'YouTube'
  | 'Website / Blog'
  | 'Other';

export type ContentType =
  | 'Static Post'
  | 'Carousel'
  | 'Reel'
  | 'Short Video'
  | 'Long-form Video'
  | 'Story'
  | 'Educational Content'
  | 'Promotional Content'
  | 'Testimonial'
  | 'Blog Article'
  | 'Other';

export type ContentObjective =
  | 'Brand Awareness'
  | 'Engagement'
  | 'Lead Generation'
  | 'Sales / Conversion'
  | 'Education'
  | 'Community Building'
  | 'Traffic';

export interface ContentItem {
  id: string;
  workspaceId: string;
  brandId: BrandId;
  contentDate: string; // YYYY-MM-DD Planning date
  scheduledPublishingDate: string; // YYYY-MM-DD Actual planned publishing date
  publishingTime?: string; // e.g. "10:00 AM"
  platform: ContentPlatform;
  contentType: ContentType;
  topic: string;
  campaignId?: string;
  objective: ContentObjective;
  responsiblePerson: string;
  status: ContentStatus;
  caption: string;
  cta: string;
  contentBrief?: string;
  creativeUrl?: string;
  internalNotes?: string;
  approvalNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  publishedAt?: string;
  actualPublishedUrl?: string;
}

export interface Campaign {
  id: string;
  workspaceId: string;
  brandId: BrandId;
  name: string;
  objective: ContentObjective | string;
  startDate: string;
  endDate: string;
  description: string;
  status: 'Active' | 'Planned' | 'Completed' | 'Paused';
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMember {
  id: string;
  workspaceId: string;
  name: string;
  role: string;
  email: string;
  avatarBg: string;
  brands: BrandId[];
}

export interface ActivityLog {
  id: string;
  workspaceId: string;
  contentId: string;
  contentTopic: string;
  brandId: BrandId;
  action: string;
  previousValue?: string;
  newValue?: string;
  user: string;
  timestamp: string;
}

export interface FilterState {
  brandId: BrandId | 'all';
  platform: ContentPlatform | 'all';
  contentType: ContentType | 'all';
  status: ContentStatus | 'all';
  responsiblePerson: string | 'all';
  campaignId: string | 'all';
  searchQuery: string;
  dateRange: 'all' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
}

export interface OperationalKPISummary {
  total: number;
  planned: number;
  inProduction: number;
  editing: number;
  approved: number;
  scheduled: number;
  published: number;
  overdue: number;
  executionRate: number; // percentage
}

export interface IntegrityIssue {
  severity: 'error' | 'warning';
  entityType: 'workspace' | 'brand' | 'campaign' | 'content' | 'team' | 'activity';
  entityId: string;
  field?: string;
  message: string;
  suggestedFix?: string;
}

export interface IntegrityDiagnosticReport {
  timestamp: string;
  totalRecordsChecked: {
    workspaces: number;
    brands: number;
    campaigns: number;
    content: number;
    team: number;
    activities: number;
  };
  healthy: boolean;
  issues: IntegrityIssue[];
  summary: string;
}
