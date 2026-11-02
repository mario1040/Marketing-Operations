import React from 'react';
import { useMarketing } from '../context/MarketingContext';
import {
  FileText,
  Clock,
  Edit3,
  CheckCircle2,
  CalendarCheck,
  CheckCheck,
  AlertTriangle,
  TrendingUp,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Plus,
  Sparkles,
} from 'lucide-react';
import { calculateOperationalKPIs } from '../utils/metrics';
import { StatusBadge } from '../components/StatusBadge';
import { BrandBadge } from '../components/BrandBadge';
import { PlatformIcon } from '../components/PlatformIcon';
import { ContentPlatform } from '../types';

interface OverviewViewProps {
  onOpenCreateBrand?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onOpenCreateBrand }) => {
  const {
    content,
    brands,
    activeWorkspace,
    openEditModal,
    openCreateModal,
    setActiveBrandId,
  } = useMarketing();

  const referenceDateStr = '2026-11-02';
  const globalKpis = calculateOperationalKPIs(content, referenceDateStr);

  // Compute operational KPIs per brand in active workspace
  const brandStats = brands.map(b => {
    const items = content.filter(c => c.brandId === b.id);
    const kpi = calculateOperationalKPIs(items, referenceDateStr);
    return { brand: b, items, kpi };
  });

  // Sorted upcoming publishing items
  const upcomingItems = [...content]
    .filter(c => c.status !== 'Published')
    .sort((a, b) => a.scheduledPublishingDate.localeCompare(b.scheduledPublishingDate))
    .slice(0, 5);

  const platforms: ContentPlatform[] = [
    'LinkedIn',
    'YouTube',
    'Instagram',
    'TikTok',
    'Website / Blog',
  ];

  const kpiCards = [
    {
      label: 'Total Content',
      value: globalKpis.total,
      icon: <FileText size={16} className="text-slate-600" />,
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      textColor: 'text-slate-900',
    },
    {
      label: 'Planned',
      value: globalKpis.planned,
      icon: <Clock size={16} className="text-slate-500" />,
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      textColor: 'text-slate-700',
    },
    {
      label: 'In Production',
      value: globalKpis.inProduction,
      icon: <Edit3 size={16} className="text-blue-600" />,
      bg: 'bg-blue-50/50',
      border: 'border-blue-200',
      textColor: 'text-blue-700',
    },
    {
      label: 'Editing',
      value: globalKpis.editing,
      icon: <Edit3 size={16} className="text-purple-600" />,
      bg: 'bg-purple-50/50',
      border: 'border-purple-200',
      textColor: 'text-purple-700',
    },
    {
      label: 'Approved',
      value: globalKpis.approved,
      icon: <CheckCircle2 size={16} className="text-green-600" />,
      bg: 'bg-green-50/50',
      border: 'border-green-200',
      textColor: 'text-green-700',
    },
    {
      label: 'Scheduled',
      value: globalKpis.scheduled,
      icon: <CalendarCheck size={16} className="text-cyan-600" />,
      bg: 'bg-cyan-50/50',
      border: 'border-cyan-200',
      textColor: 'text-cyan-700',
    },
    {
      label: 'Published',
      value: globalKpis.published,
      icon: <CheckCheck size={16} className="text-emerald-700" />,
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-200',
      textColor: 'text-emerald-800',
    },
    {
      label: 'Overdue',
      value: globalKpis.overdue,
      icon: <AlertTriangle size={16} className="text-amber-600" />,
      bg: globalKpis.overdue > 0 ? 'bg-amber-50/60' : 'bg-slate-50',
      border: globalKpis.overdue > 0 ? 'border-amber-300' : 'border-slate-200',
      textColor: globalKpis.overdue > 0 ? 'text-amber-700 font-bold' : 'text-slate-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded">
              {activeWorkspace?.type || 'Workspace'}
            </span>
            <span className="text-xs text-slate-400">
              {activeWorkspace?.timezone} • {brands.length} {brands.length === 1 ? 'Brand' : 'Brands'}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {activeWorkspace?.name || 'Workspace'} Operations Dashboard
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            {activeWorkspace?.description || 'Real-time pipeline visibility and operational throughput metrics.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider block">
              Workspace Execution Rate
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {globalKpis.executionRate}%
            </span>
          </div>
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ Add Content</span>
          </button>
        </div>
      </div>

      {/* Global KPI Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Workspace Operations Status
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">
            Based on {content.length} live database records in this workspace
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {kpiCards.map((kpi, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border ${kpi.border} ${kpi.bg} shadow-2xs flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2 gap-1">
                <span className="text-[10px] xl:text-[11px] font-semibold text-slate-600 truncate" title={kpi.label}>
                  {kpi.label}
                </span>
                <span className="p-1 rounded-md bg-white/80 shadow-2xs shrink-0">
                  {kpi.icon}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-bold tracking-tight ${kpi.textColor}`}>
                  {kpi.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Comparison Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-indigo-600" />
              Brand Operations Comparison
            </h3>
            <p className="text-xs text-slate-500">
              Comparative execution metrics across brands in {activeWorkspace?.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {brandStats.map(bs => (
              <button
                key={bs.brand.id}
                onClick={() => setActiveBrandId(bs.brand.id)}
                className="text-[11px] font-medium px-2.5 py-1 rounded border hover:shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                style={{
                  backgroundColor: `${bs.brand.primaryColor}10`,
                  color: bs.brand.primaryColor,
                  borderColor: `${bs.brand.primaryColor}30`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bs.brand.primaryColor }} />
                <span>Open {bs.brand.name} →</span>
              </button>
            ))}
          </div>
        </div>

        {brandStats.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs text-slate-400">
              No brands created in this workspace yet.
            </p>
            {onOpenCreateBrand && (
              <button
                type="button"
                onClick={onOpenCreateBrand}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
              >
                + Create Brand
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/60">
                  <th className="py-2.5 px-3">Metric</th>
                  {brandStats.map(bs => (
                    <th key={bs.brand.id} className="py-2.5 px-3 font-bold" style={{ color: bs.brand.primaryColor }}>
                      {bs.brand.name}
                    </th>
                  ))}
                  <th className="py-2.5 px-3">Distribution Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Total Content</td>
                  {brandStats.map(bs => (
                    <td key={bs.brand.id} className="py-2.5 px-3 font-bold text-slate-800">
                      {bs.kpi.total} items
                    </td>
                  ))}
                  <td className="py-2.5 px-3">
                    <div className="w-40 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      {brandStats.map(bs => {
                        const pct = globalKpis.total ? (bs.kpi.total / globalKpis.total) * 100 : 0;
                        return (
                          <div
                            key={bs.brand.id}
                            className="h-full"
                            style={{ width: `${pct}%`, backgroundColor: bs.brand.primaryColor }}
                            title={`${bs.brand.name}: ${Math.round(pct)}%`}
                          />
                        );
                      })}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-700">Planned</td>
                  {brandStats.map(bs => (
                    <td key={bs.brand.id} className="py-2.5 px-3 text-slate-800">
                      {bs.kpi.planned}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {brandStats.map(bs => bs.kpi.planned).join(' vs ')}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-700">In Production</td>
                  {brandStats.map(bs => (
                    <td key={bs.brand.id} className="py-2.5 px-3 text-blue-700 font-medium">
                      {bs.kpi.inProduction}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {brandStats.map(bs => bs.kpi.inProduction).join(' vs ')}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-700">Editing</td>
                  {brandStats.map(bs => (
                    <td key={bs.brand.id} className="py-2.5 px-3 text-purple-700 font-medium">
                      {bs.kpi.editing}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {brandStats.map(bs => bs.kpi.editing).join(' vs ')}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-700">Approved</td>
                  {brandStats.map(bs => (
                    <td key={bs.brand.id} className="py-2.5 px-3 text-green-700 font-medium">
                      {bs.kpi.approved}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {brandStats.map(bs => bs.kpi.approved).join(' vs ')}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-700">Scheduled</td>
                  {brandStats.map(bs => (
                    <td key={bs.brand.id} className="py-2.5 px-3 text-cyan-700 font-medium">
                      {bs.kpi.scheduled}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {brandStats.map(bs => bs.kpi.scheduled).join(' vs ')}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Published</td>
                  {brandStats.map(bs => (
                    <td key={bs.brand.id} className="py-2.5 px-3 font-bold text-emerald-800">
                      {bs.kpi.published}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {brandStats.map(bs => bs.kpi.published).join(' vs ')}
                  </td>
                </tr>
                <tr className="bg-slate-50/70">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Execution Rate</td>
                  {brandStats.map(bs => (
                    <td key={bs.brand.id} className="py-2.5 px-3 font-bold font-mono text-emerald-700">
                      {bs.kpi.executionRate}%
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                    Formula: (Published / Planned) × 100
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visual Analytics & Upcoming Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Distribution Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Content by Platform</h3>
          <p className="text-xs text-slate-500 mb-4">Channel footprint across brands in {activeWorkspace?.name}</p>

          <div className="space-y-3">
            {platforms.map(platform => {
              const count = content.filter(c => c.platform === platform).length;
              const pct = content.length > 0 ? Math.round((count / content.length) * 100) : 0;
              return (
                <div key={platform} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <PlatformIcon platform={platform} size={14} />
                      {platform}
                    </span>
                    <span className="font-mono text-slate-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Status Pipeline</h3>
          <p className="text-xs text-slate-500 mb-4">Deliverables across the 6 workflow phases</p>

          <div className="space-y-2.5">
            {[
              { status: 'Planned', count: globalKpis.planned, color: 'bg-slate-400' },
              { status: 'In Production', count: globalKpis.inProduction, color: 'bg-blue-600' },
              { status: 'Editing', count: globalKpis.editing, color: 'bg-purple-600' },
              { status: 'Approved', count: globalKpis.approved, color: 'bg-green-600' },
              { status: 'Scheduled', count: globalKpis.scheduled, color: 'bg-cyan-600' },
              { status: 'Published', count: globalKpis.published, color: 'bg-emerald-600' },
            ].map(item => {
              const pct = globalKpis.total > 0 ? Math.round((item.count / globalKpis.total) * 100) : 0;
              return (
                <div key={item.status} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-2 font-medium text-slate-800">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    {item.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">{item.count}</span>
                    <span className="text-[11px] text-slate-400 font-mono w-8 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Publishing Schedule */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-slate-900">Upcoming Publishing</h3>
            <span className="text-[10px] text-slate-400 font-mono">Next deliverables</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Content pending release</p>

          <div className="space-y-2.5">
            {upcomingItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                All scheduled content has been published!
              </p>
            ) : (
              upcomingItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => openEditModal(item)}
                  className="p-2.5 rounded-lg border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <BrandBadge brandId={item.brandId} size="sm" />
                      <PlatformIcon platform={item.platform} size={12} />
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {item.scheduledPublishingDate}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {item.topic}
                  </h4>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                    <span className="truncate max-w-[140px]">{item.responsiblePerson}</span>
                    <StatusBadge status={item.status} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
