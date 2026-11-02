import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOperationalKPIs, filterContentItems, getWeekRange, getDaysOfWeek } from './metrics';
import { ContentItem, FilterState, Workspace, Brand } from '../types';

const mockItems: ContentItem[] = [
  {
    id: 'cnt-1',
    workspaceId: 'ws-default',
    brandId: 'the-professor',
    contentDate: '2026-11-01',
    scheduledPublishingDate: '2026-11-01',
    platform: 'LinkedIn',
    contentType: 'Carousel',
    topic: 'Q3 Financial Insights & Market Multiples',
    objective: 'Brand Awareness',
    responsiblePerson: 'Marcus Vance',
    status: 'Published',
    caption: 'Key multiples across B2B SaaS in 2026.',
    cta: 'Download the report',
    createdAt: '2026-10-25T10:00:00Z',
    updatedAt: '2026-11-01T15:00:00Z',
    createdBy: 'Marcus Vance',
  },
  {
    id: 'cnt-2',
    workspaceId: 'ws-default',
    brandId: 'the-professor',
    contentDate: '2026-11-02',
    scheduledPublishingDate: '2026-11-02',
    platform: 'YouTube',
    contentType: 'Long-form Video',
    topic: 'How to Read a Balance Sheet in 10 Minutes',
    objective: 'Education',
    responsiblePerson: 'Elena Rostova',
    status: 'In Production',
    caption: 'Deep dive into solvency and liquidity.',
    cta: 'Subscribe for weekly teardowns',
    createdAt: '2026-10-26T10:00:00Z',
    updatedAt: '2026-11-01T15:00:00Z',
    createdBy: 'Elena Rostova',
  },
  {
    id: 'cnt-3',
    workspaceId: 'ws-default',
    brandId: 'profacto',
    contentDate: '2026-10-28',
    scheduledPublishingDate: '2026-10-29', // past date, not published -> overdue
    platform: 'LinkedIn',
    contentType: 'Static Post',
    topic: 'Supply Chain Automation Bottlenecks',
    objective: 'Lead Generation',
    responsiblePerson: 'Sarah Chen',
    status: 'Editing',
    caption: 'Why 70% of ERP integrations stall at stage 3.',
    cta: 'Book an audit',
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-28T15:00:00Z',
    createdBy: 'Sarah Chen',
  },
  {
    id: 'cnt-4',
    workspaceId: 'ws-default',
    brandId: 'profacto',
    contentDate: '2026-11-03',
    scheduledPublishingDate: '2026-11-05',
    platform: 'Instagram',
    contentType: 'Reel',
    topic: 'Warehouse Robotic Dispatch Teaser',
    objective: 'Engagement',
    responsiblePerson: 'Alex Rivera',
    status: 'Planned',
    caption: 'Behind the scenes at our robotics lab.',
    cta: 'Follow for more',
    createdAt: '2026-10-27T10:00:00Z',
    updatedAt: '2026-10-27T10:00:00Z',
    createdBy: 'Alex Rivera',
  },
  // Item belonging to another workspace (ws-2)
  {
    id: 'cnt-5',
    workspaceId: 'ws-client-pulse',
    brandId: 'cloudscale-io',
    contentDate: '2026-11-02',
    scheduledPublishingDate: '2026-11-03',
    platform: 'LinkedIn',
    contentType: 'Static Post',
    topic: 'Kubernetes Pod Disruption Budgets Guide',
    objective: 'Lead Generation',
    responsiblePerson: 'Jordan Hayes',
    status: 'Scheduled',
    caption: 'Handling spot node terminations.',
    cta: 'Read the guide',
    createdAt: '2026-10-29T10:00:00Z',
    updatedAt: '2026-11-01T12:00:00Z',
    createdBy: 'Jordan Hayes',
  },
];

test('calculateOperationalKPIs counts statuses accurately and detects overdue items', () => {
  const ws1Items = mockItems.filter(i => i.workspaceId === 'ws-default');
  const kpis = calculateOperationalKPIs(ws1Items, '2026-11-02');
  assert.equal(kpis.total, 4);
  assert.equal(kpis.published, 1);
  assert.equal(kpis.inProduction, 1);
  assert.equal(kpis.editing, 1);
  assert.equal(kpis.planned, 1);
  assert.equal(kpis.approved, 0);
  assert.equal(kpis.scheduled, 0);
  assert.equal(kpis.overdue, 1);
  assert.equal(kpis.executionRate, 100);
});

test('calculateOperationalKPIs handles zero planned content gracefully without division by zero', () => {
  const zeroPlannedItems = mockItems.filter(i => i.status !== 'Planned' && i.workspaceId === 'ws-default');
  const kpis = calculateOperationalKPIs(zeroPlannedItems, '2026-11-02');
  assert.equal(kpis.planned, 0);
  assert.equal(kpis.executionRate, 100);
});

test('workspace data isolation strictly isolates items across workspaces', () => {
  const ws1Items = mockItems.filter(i => i.workspaceId === 'ws-default');
  const ws2Items = mockItems.filter(i => i.workspaceId === 'ws-client-pulse');

  assert.equal(ws1Items.length, 4);
  assert.equal(ws2Items.length, 1);
  assert.ok(ws1Items.every(i => i.workspaceId === 'ws-default'));
  assert.ok(ws2Items.every(i => i.workspaceId === 'ws-client-pulse'));
  assert.equal(ws2Items[0].brandId, 'cloudscale-io');
});

test('filterContentItems filters accurately by dynamic brand', () => {
  const defaultFilter: FilterState = {
    brandId: 'profacto',
    platform: 'all',
    contentType: 'all',
    status: 'all',
    responsiblePerson: 'all',
    campaignId: 'all',
    searchQuery: '',
    dateRange: 'all',
  };
  const profactoOnly = filterContentItems(mockItems, defaultFilter);
  assert.equal(profactoOnly.length, 2);
  assert.ok(profactoOnly.every(i => i.brandId === 'profacto'));
});

test('filterContentItems searches text across topic, caption, and person', () => {
  const searchFilter: FilterState = {
    brandId: 'all',
    platform: 'all',
    contentType: 'all',
    status: 'all',
    responsiblePerson: 'all',
    campaignId: 'all',
    searchQuery: 'Balance Sheet',
    dateRange: 'all',
  };
  const results = filterContentItems(mockItems, searchFilter);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'cnt-2');
});

test('getWeekRange accurately identifies Monday to Sunday', () => {
  const range = getWeekRange(new Date(2026, 10, 2));
  assert.equal(range.start, '2026-11-02');
  assert.equal(range.end, '2026-11-08');

  const days = getDaysOfWeek('2026-11-02');
  assert.equal(days.length, 7);
  assert.equal(days[0], '2026-11-02');
  assert.equal(days[6], '2026-11-08');
});
