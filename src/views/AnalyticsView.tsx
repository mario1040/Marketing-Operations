import React, { useState } from 'react';
import { useMarketing } from '../context/MarketingContext';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  PieChart,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react';
import { PlatformIcon } from '../components/PlatformIcon';
import { BrandBadge } from '../components/BrandBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ContentPlatform, ContentType, ContentStatus } from '../types';
import { calculateOperationalKPIs } from '../utils/metrics';

type ReportTab = 'brand' | 'status' | 'platform' | 'type' | 'team' | 'planned-vs-published';

export const AnalyticsView: React.FC = () => {
  const { content, exportToCsv, exportToJson, team, brands } = useMarketing();

  const [activeReport, setActiveReport] = useState<ReportTab>('brand');
  const [dateFilter, setDateFilter] = useState<'all' | 'this-month' | 'last-month'>('all');

  const filtered = content.filter(item => {
    if (dateFilter === 'this-month') {
      return item.scheduledPublishingDate.startsWith('2026-11');
    }
    if (dateFilter === 'last-month') {
      return item.scheduledPublishingDate.startsWith('2026-10');
    }
    return true;
  });

  const kpis = calculateOperationalKPIs(filtered);

  const platforms: ContentPlatform[] = [
    'LinkedIn',
    'YouTube',
    'Instagram',
    'TikTok',
    'Website / Blog',
  ];

  const types: ContentType[] = [
    'Static Post',
    'Carousel',
    'Reel',
    'Short Video',
    'Long-form Video',
    'Blog Article',
  ];

  const statuses: ContentStatus[] = [
    'Planned',
    'In Production',
    'Editing',
    'Approved',
    'Scheduled',
    'Published',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Operational Reporting &amp; Analytics
          </h3>
          <p className="text-xs text-slate-500">
            Multi-dimensional reporting across brands, channels, production bottlenecks, and publishing consistency
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Filter selector */}
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value as any)}
            className="text-xs py-1.5 px-3 border border-slate-200 rounded-lg bg-white font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Time Records</option>
            <option value="this-month">This Month (Nov 2026)</option>
            <option value="last-month">Last Month (Oct 2026)</option>
          </select>

          <button
            type="button"
            onClick={exportToCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
        {[
          { id: 'brand', label: 'Content by Brand', icon: <Layers size={13} /> },
          { id: 'status', label: 'Content by Status', icon: <PieChart size={13} /> },
          { id: 'platform', label: 'Content by Platform', icon: <BarChart3 size={13} /> },
          { id: 'type', label: 'Content by Type', icon: <TrendingUp size={13} /> },
          { id: 'team', label: 'Content by Assignee', icon: <Users size={13} /> },
          { id: 'planned-vs-published', label: 'Planned vs Published', icon: <CheckCircle2 size={13} /> },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveReport(tab.id as ReportTab)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
              activeReport === tab.id
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. CONTENT BY BRAND REPORT */}
      {activeReport === 'brand' && (
        brands.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            No active brands found in this workspace. Create a brand to view brand operational analytics.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brands.map(b => {
              const brandItems = filtered.filter(c => c.brandId === b.id);
              const pubCount = brandItems.filter(c => c.status === 'Published').length;
              const inProgCount = brandItems.filter(c => c.status === 'In Production' || c.status === 'Editing').length;
              const schedCount = brandItems.filter(c => c.status === 'Scheduled').length;
              const pct = brandItems.length > 0 ? Math.round((pubCount / brandItems.length) * 100) : 0;

              return (
                <div key={b.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: b.primaryColor || '#4F46E5' }}
                      />
                      <h4 className="text-sm font-bold text-slate-900">{b.name}</h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
                      {brandItems.length} items
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    {b.tagline || b.description || 'Dynamic brand operational reporting.'}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Published Deliverables</span>
                      <span className="font-bold text-slate-900">{pubCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>In Production &amp; Editing</span>
                      <span className="font-bold text-slate-900">{inProgCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Scheduled for Release</span>
                      <span className="font-bold text-slate-900">{schedCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-100">
                      <span>Publishing Velocity</span>
                      <span className="font-mono font-bold text-emerald-700">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* 2. CONTENT BY STATUS REPORT */}
      {activeReport === 'status' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Workflow Stage Allocation
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {statuses.map(st => {
              const count = filtered.filter(c => c.status === st).length;
              const pct = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0;
              return (
                <div key={st} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge status={st} size="sm" />
                    <span className="font-mono text-sm font-bold text-slate-900">{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block text-right font-mono">
                    {pct}% of pipeline
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. CONTENT BY PLATFORM REPORT */}
      {activeReport === 'platform' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Social Media Channel Distribution
          </h4>

          <div className="space-y-3">
            {platforms.map(p => {
              const items = filtered.filter(c => c.platform === p);
              const pct = filtered.length > 0 ? Math.round((items.length / filtered.length) * 100) : 0;
              return (
                <div key={p} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold text-slate-900">
                      <PlatformIcon platform={p} size={15} />
                      {p}
                    </span>
                    <span className="font-mono text-slate-700 font-bold">
                      {items.length} items ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. CONTENT BY TYPE REPORT */}
      {activeReport === 'type' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Creative Asset Format Distribution
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {types.map(t => {
              const count = filtered.filter(c => c.contentType === t).length;
              return (
                <div key={t} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-800">{t}</span>
                  <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. CONTENT BY TEAM REPORT */}
      {activeReport === 'team' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Team Member Workload &amp; Delivery Breakdown
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {team.map(member => {
              const memberItems = filtered.filter(c => c.responsiblePerson === member.name);
              const pubCount = memberItems.filter(c => c.status === 'Published').length;
              return (
                <div key={member.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{member.name}</h5>
                      <p className="text-[11px] text-slate-500">{member.role}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {memberItems.length} assigned
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 flex justify-between pt-1 border-t border-slate-200/60">
                    <span>Published: {pubCount}</span>
                    <span>In Progress: {memberItems.length - pubCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. PLANNED VS PUBLISHED REPORT */}
      {activeReport === 'planned-vs-published' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Planned vs Published Execution Target
              </h4>
              <p className="text-xs text-slate-500">
                Mathematical formula: Execution Rate = (Published Content / Planned Content) × 100
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Actual Execution Rate</span>
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {kpis.executionRate}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 block mb-1">Total Planned</span>
              <span className="text-2xl font-bold text-slate-800">{kpis.planned}</span>
            </div>
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <span className="text-xs text-emerald-800 block mb-1">Total Published</span>
              <span className="text-2xl font-bold text-emerald-900">{kpis.published}</span>
            </div>
            <div className="p-3.5 bg-cyan-50 rounded-xl border border-cyan-200 text-center">
              <span className="text-xs text-cyan-800 block mb-1">Scheduled for Imminent Release</span>
              <span className="text-2xl font-bold text-cyan-900">{kpis.scheduled}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
