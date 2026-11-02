import { ContentItem, OperationalKPISummary, FilterState, ContentStatus } from '../types';

/**
 * Calculates operational KPIs for a list of content items.
 * Adheres strictly to the requested formula:
 * Execution Rate = (Published Content / Planned Content) * 100
 * Handles division by zero gracefully.
 */
export function calculateOperationalKPIs(
  items: ContentItem[],
  referenceDateStr: string = '2026-11-02'
): OperationalKPISummary {
  let total = items.length;
  let planned = 0;
  let inProduction = 0;
  let editing = 0;
  let approved = 0;
  let scheduled = 0;
  let published = 0;
  let overdue = 0;

  for (const item of items) {
    switch (item.status) {
      case 'Planned':
        planned++;
        break;
      case 'In Production':
        inProduction++;
        break;
      case 'Editing':
        editing++;
        break;
      case 'Approved':
        approved++;
        break;
      case 'Scheduled':
        scheduled++;
        break;
      case 'Published':
        published++;
        break;
    }

    // Overdue check: scheduled date is before reference date and not yet published
    if (item.scheduledPublishingDate && item.scheduledPublishingDate < referenceDateStr && item.status !== 'Published') {
      overdue++;
    }
  }

  // Execution Rate formula: (Published Content / Planned Content) * 100
  // Note: If planned is 0, execution rate is 0. If there are published items but 0 remaining planned,
  // we check total planned pool (planned + in production + editing + approved + scheduled + published) or planned field.
  // The prompt states: "Execution Rate = (Published Content / Planned Content) * 100"
  // When planned == 0, avoid NaN / Infinity.
  const executionRate = planned > 0 ? Math.round((published / planned) * 100) : (published > 0 ? 100 : 0);

  return {
    total,
    planned,
    inProduction,
    editing,
    approved,
    scheduled,
    published,
    overdue,
    executionRate,
  };
}

/**
 * Filter items according to active FilterState
 */
export function filterContentItems(items: ContentItem[], filter: FilterState): ContentItem[] {
  return items.filter((item) => {
    // Brand filter
    if (filter.brandId !== 'all' && item.brandId !== filter.brandId) {
      return false;
    }

    // Platform filter
    if (filter.platform !== 'all' && item.platform !== filter.platform) {
      return false;
    }

    // Content Type filter
    if (filter.contentType !== 'all' && item.contentType !== filter.contentType) {
      return false;
    }

    // Status filter
    if (filter.status !== 'all' && item.status !== filter.status) {
      return false;
    }

    // Responsible Person filter
    if (filter.responsiblePerson !== 'all' && item.responsiblePerson !== filter.responsiblePerson) {
      return false;
    }

    // Campaign filter
    if (filter.campaignId !== 'all' && item.campaignId !== filter.campaignId) {
      return false;
    }

    // Search query: topic, caption, campaign, assigned person
    if (filter.searchQuery.trim() !== '') {
      const q = filter.searchQuery.toLowerCase();
      const topicMatch = item.topic?.toLowerCase().includes(q);
      const captionMatch = item.caption?.toLowerCase().includes(q);
      const campaignMatch = item.campaignId?.toLowerCase().includes(q);
      const personMatch = item.responsiblePerson?.toLowerCase().includes(q);
      if (!topicMatch && !captionMatch && !campaignMatch && !personMatch) {
        return false;
      }
    }

    // Custom date range
    if (filter.customStartDate && item.scheduledPublishingDate < filter.customStartDate) {
      return false;
    }
    if (filter.customEndDate && item.scheduledPublishingDate > filter.customEndDate) {
      return false;
    }

    return true;
  });
}

/**
 * Workflow status order and verification
 */
export const STATUS_ORDER: ContentStatus[] = [
  'Planned',
  'In Production',
  'Editing',
  'Approved',
  'Scheduled',
  'Published',
];

export const STATUS_CONFIG: Record<
  ContentStatus,
  { label: string; bg: string; text: string; border: string; hex: string; desc: string }
> = {
  Planned: {
    label: 'Planned',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    hex: '#64748B',
    desc: 'Idea logged in calendar',
  },
  'In Production': {
    label: 'In Production',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    hex: '#2563EB',
    desc: 'Copywriting & visual creation',
  },
  Editing: {
    label: 'Editing',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    hex: '#9333EA',
    desc: 'Reviewing drafts & assets',
  },
  Approved: {
    label: 'Approved',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    hex: '#16A34A',
    desc: 'Passed QA, ready for schedule',
  },
  Scheduled: {
    label: 'Scheduled',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    hex: '#0891B2',
    desc: 'Queued on publishing platform',
  },
  Published: {
    label: 'Published',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    hex: '#15803D',
    desc: 'Live on channels',
  },
};

/**
 * Returns whether moving between two statuses is permitted.
 * Forward and backward revision transitions are supported.
 */
export function isValidStatusTransition(current: ContentStatus, next: ContentStatus): boolean {
  return STATUS_ORDER.includes(current) && STATUS_ORDER.includes(next);
}

/**
 * Computes the start of the week (Monday) and end of the week (Sunday) for a given date
 */
export function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  // day 0 is Sunday, 1 is Monday ... 6 is Saturday
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diffToMonday));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (dt: Date) => dt.toISOString().split('T')[0];
  return { start: format(monday), end: format(sunday) };
}

/**
 * Returns formatted date strings for all 7 days of the specified week
 */
export function getDaysOfWeek(mondayStr: string): string[] {
  const [y, m, d] = mondayStr.split('-').map(Number);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(y, m - 1, d + i);
    days.push(dt.toISOString().split('T')[0]);
  }
  return days;
}
