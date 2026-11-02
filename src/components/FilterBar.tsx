import React, { useState } from 'react';
import { useMarketing } from '../context/MarketingContext';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { ContentPlatform, ContentStatus, ContentType } from '../types';

const PLATFORMS: ContentPlatform[] = [
  'LinkedIn',
  'YouTube',
  'Instagram',
  'TikTok',
  'Facebook',
  'Website / Blog',
  'Other',
];

const CONTENT_TYPES: ContentType[] = [
  'Static Post',
  'Carousel',
  'Reel',
  'Short Video',
  'Long-form Video',
  'Story',
  'Educational Content',
  'Promotional Content',
  'Testimonial',
  'Blog Article',
  'Other',
];

const STATUSES: ContentStatus[] = [
  'Planned',
  'In Production',
  'Editing',
  'Approved',
  'Scheduled',
  'Published',
];

export const FilterBar: React.FC = () => {
  const {
    filters,
    setFilters,
    resetFilters,
    filteredContent,
    team,
    campaigns,
    activeBrandId,
  } = useMarketing();

  const [isExpanded, setIsExpanded] = useState(false);

  // Check if any filter besides default brand is active
  const hasActiveFilters =
    filters.platform !== 'all' ||
    filters.contentType !== 'all' ||
    filters.status !== 'all' ||
    filters.responsiblePerson !== 'all' ||
    filters.campaignId !== 'all' ||
    filters.searchQuery !== '' ||
    filters.customStartDate !== undefined ||
    filters.customEndDate !== undefined;

  const relevantCampaigns =
    activeBrandId === 'all'
      ? campaigns
      : campaigns.filter(c => c.brandId === activeBrandId);

  const relevantTeam =
    activeBrandId === 'all'
      ? team
      : team.filter(t => t.brands.includes(activeBrandId));

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs space-y-3">
      {/* Top Search & Quick Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Search topic, title, caption, assignee, or campaign..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Quick Filter dropdowns */}
        <div className="flex items-center gap-2">
          {/* Status Quick Select */}
          <select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
            className={`text-xs py-2 px-2.5 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 bg-white font-medium cursor-pointer ${
              filters.status !== 'all'
                ? 'border-indigo-400 bg-indigo-50/50 text-indigo-800'
                : 'border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <option value="all">All Statuses</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Platform Quick Select */}
          <select
            value={filters.platform}
            onChange={e => setFilters(prev => ({ ...prev, platform: e.target.value as any }))}
            className={`text-xs py-2 px-2.5 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 bg-white font-medium cursor-pointer ${
              filters.platform !== 'all'
                ? 'border-indigo-400 bg-indigo-50/50 text-indigo-800'
                : 'border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <option value="all">All Platforms</option>
            {PLATFORMS.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Toggle Advanced Filters */}
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-colors cursor-pointer ${
              isExpanded || hasActiveFilters
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>Filters</span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors cursor-pointer"
            >
              <X size={13} />
              <span>Clear</span>
            </button>
          )}

          {/* Match counter badge */}
          <div className="text-xs text-slate-500 font-mono px-2 py-1 bg-slate-100 rounded-md shrink-0">
            <span className="font-semibold text-slate-800">{filteredContent.length}</span> items
          </div>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Content Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Content Type
            </label>
            <select
              value={filters.contentType}
              onChange={e => setFilters(prev => ({ ...prev, contentType: e.target.value as any }))}
              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Types</option>
              {CONTENT_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Responsible Person */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Responsible Person
            </label>
            <select
              value={filters.responsiblePerson}
              onChange={e => setFilters(prev => ({ ...prev, responsiblePerson: e.target.value }))}
              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Team Members</option>
              {relevantTeam.map(t => (
                <option key={t.id} value={t.name}>
                  {t.name} ({t.role.split('&')[0].trim()})
                </option>
              ))}
            </select>
          </div>

          {/* Campaign */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Campaign
            </label>
            <select
              value={filters.campaignId}
              onChange={e => setFilters(prev => ({ ...prev, campaignId: e.target.value }))}
              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Campaigns</option>
              {relevantCampaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Start & End */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Publishing Date Range
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="date"
                value={filters.customStartDate || ''}
                onChange={e => setFilters(prev => ({ ...prev, customStartDate: e.target.value || undefined }))}
                className="w-full text-[11px] p-1.5 border border-slate-200 rounded-md bg-white focus:outline-hidden"
              />
              <input
                type="date"
                value={filters.customEndDate || ''}
                onChange={e => setFilters(prev => ({ ...prev, customEndDate: e.target.value || undefined }))}
                className="w-full text-[11px] p-1.5 border border-slate-200 rounded-md bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
