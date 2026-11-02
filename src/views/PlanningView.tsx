import React, { useState } from 'react';
import { useMarketing } from '../context/MarketingContext';
import {
  CalendarRange,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCheck,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { getWeekRange, getDaysOfWeek, calculateOperationalKPIs } from '../utils/metrics';
import { StatusBadge } from '../components/StatusBadge';
import { BrandBadge } from '../components/BrandBadge';
import { PlatformIcon } from '../components/PlatformIcon';
import { ContentItem } from '../types';

export const PlanningView: React.FC = () => {
  const {
    content,
    activeBrandId,
    openEditModal,
    openCreateModal,
    updateContentStatus,
  } = useMarketing();

  const [planningMode, setPlanningMode] = useState<'weekly' | 'monthly'>('weekly');
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 10, 2)); // 2026-11-02

  // Brand-scoped content
  const brandScopedItems =
    activeBrandId === 'all' ? content : content.filter(c => c.brandId === activeBrandId);

  // --- WEEKLY CALCULATIONS ---
  const weekRange = getWeekRange(currentDate);
  const weekDays = getDaysOfWeek(weekRange.start);

  const weeklyItems = brandScopedItems.filter(
    item =>
      item.scheduledPublishingDate >= weekRange.start &&
      item.scheduledPublishingDate <= weekRange.end
  );

  const weeklyKpis = calculateOperationalKPIs(weeklyItems, '2026-11-02');

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  // --- MONTHLY CALCULATIONS ---
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const monthStartStr = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const monthEndStr = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

  const monthlyItems = brandScopedItems.filter(
    item =>
      item.scheduledPublishingDate >= monthStartStr &&
      item.scheduledPublishingDate <= monthEndStr
  );

  const monthlyKpis = calculateOperationalKPIs(monthlyItems, '2026-11-02');

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPlanningMode('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                planningMode === 'weekly'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarRange size={14} />
              <span>Weekly Plan</span>
            </button>
            <button
              type="button"
              onClick={() => setPlanningMode('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                planningMode === 'monthly'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays size={14} />
              <span>Monthly Plan</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={planningMode === 'weekly' ? handlePrevWeek : handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={planningMode === 'weekly' ? handleNextWeek : handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            {planningMode === 'weekly'
              ? `Week: ${weekRange.start} — ${weekRange.end}`
              : monthName}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500 font-medium">
            Execution Rate:
            <span className="font-bold text-emerald-700 font-mono ml-1.5">
              {planningMode === 'weekly' ? weeklyKpis.executionRate : monthlyKpis.executionRate}%
            </span>
          </div>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            + Add Plan Item
          </button>
        </div>
      </div>

      {/* =========================================================================
          WEEKLY CONTENT PLANNING VIEW (Section 10)
         ========================================================================= */}
      {planningMode === 'weekly' && (
        <div className="space-y-6">
          {/* Weekly Overview KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500 block mb-1">
                Planned Content
              </span>
              <span className="text-xl font-bold text-slate-800">{weeklyKpis.planned}</span>
            </div>
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 shadow-2xs">
              <span className="text-[11px] font-medium text-blue-700 block mb-1">
                In Production
              </span>
              <span className="text-xl font-bold text-blue-800">{weeklyKpis.inProduction}</span>
            </div>
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 shadow-2xs">
              <span className="text-[11px] font-medium text-purple-700 block mb-1">
                In Editing
              </span>
              <span className="text-xl font-bold text-purple-800">{weeklyKpis.editing}</span>
            </div>
            <div className="p-3 bg-green-50/50 rounded-xl border border-green-200 shadow-2xs">
              <span className="text-[11px] font-medium text-green-700 block mb-1">
                Awaiting Approval
              </span>
              <span className="text-xl font-bold text-green-800">{weeklyKpis.approved}</span>
            </div>
            <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-200 shadow-2xs">
              <span className="text-[11px] font-medium text-cyan-700 block mb-1">
                Scheduled
              </span>
              <span className="text-xl font-bold text-cyan-800">{weeklyKpis.scheduled}</span>
            </div>
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[11px] font-medium text-emerald-800 block mb-1">
                Published
              </span>
              <span className="text-xl font-bold text-emerald-900">{weeklyKpis.published}</span>
            </div>
            <div
              className={`p-3 rounded-xl border shadow-2xs ${
                weeklyKpis.overdue > 0 ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span
                className={`text-[11px] font-medium block mb-1 ${
                  weeklyKpis.overdue > 0 ? 'text-amber-700 font-bold' : 'text-slate-500'
                }`}
              >
                Overdue
              </span>
              <span
                className={`text-xl font-bold ${
                  weeklyKpis.overdue > 0 ? 'text-amber-700' : 'text-slate-700'
                }`}
              >
                {weeklyKpis.overdue}
              </span>
            </div>
          </div>

          {/* Weekly Execution Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Weekly Execution Table
                </h4>
                <p className="text-[11px] text-slate-500">
                  Deliverables scheduled between {weekRange.start} and {weekRange.end}
                </p>
              </div>
              <span className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-700">
                {weeklyItems.length} items queued
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/30">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Brand</th>
                    <th className="py-2.5 px-4">Platform</th>
                    <th className="py-2.5 px-4">Topic / Title</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Responsible</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weeklyItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No content scheduled for this week.
                      </td>
                    </tr>
                  ) : (
                    weeklyItems.map(item => (
                      <tr
                        key={item.id}
                        onClick={() => openEditModal(item)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                          {item.scheduledPublishingDate}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <BrandBadge brandId={item.brandId} size="sm" />
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <PlatformIcon platform={item.platform} size={13} />
                            <span>{item.platform}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {item.topic}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px]">
                            {item.contentType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                          {item.responsiblePerson}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusBadge status={item.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="text-indigo-600 font-medium hover:underline text-[11px]">
                            Edit →
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekly Review & Retrospective Panel */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCheck size={16} className="text-emerald-600" />
                  Weekly Operating Review &amp; Retrospective
                </h4>
                <p className="text-xs text-slate-500">
                  Assess completion velocity and outstanding bottlenecks for this cycle
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium">Completion Rate: </span>
                <span className="text-sm font-bold text-emerald-700 font-mono">
                  {weeklyKpis.published} / {weeklyKpis.total} items (
                  {weeklyKpis.total > 0
                    ? Math.round((weeklyKpis.published / weeklyKpis.total) * 100)
                    : 0}
                  %)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Checklist 1: Outstanding Tasks */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock size={13} className="text-blue-600" />
                  Active Deliverables
                </h5>
                <p className="text-xs text-slate-600">
                  {weeklyKpis.inProduction + weeklyKpis.editing} items currently in drafting or editorial review.
                </p>
                <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                  <div>• Production: {weeklyKpis.inProduction}</div>
                  <div>• Editing: {weeklyKpis.editing}</div>
                </div>
              </div>

              {/* Checklist 2: Approvals & Scheduling */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCheck size={13} className="text-green-600" />
                  Pending Sign-off &amp; Queue
                </h5>
                <p className="text-xs text-slate-600">
                  {weeklyKpis.approved} approved items ready to schedule. {weeklyKpis.scheduled} queued for publish.
                </p>
                <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                  <div>• Approved: {weeklyKpis.approved}</div>
                  <div>• Scheduled: {weeklyKpis.scheduled}</div>
                </div>
              </div>

              {/* Checklist 3: Triage & Overdue */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-amber-600" />
                  Overdue &amp; Blockers
                </h5>
                <p className="text-xs text-slate-600">
                  {weeklyKpis.overdue > 0
                    ? `${weeklyKpis.overdue} scheduled dates have passed without published URL confirmation.`
                    : 'Zero overdue deliverables. Publishing velocity on schedule.'}
                </p>
                <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                  <div>• Overdue items: {weeklyKpis.overdue}</div>
                  <div>• Target execution rate: 100%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MONTHLY CONTENT PLANNING VIEW (Section 11)
         ========================================================================= */}
      {planningMode === 'monthly' && (
        <div className="space-y-6">
          {/* Monthly Performance KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 block mb-1">Monthly Planned</span>
              <span className="text-2xl font-bold text-slate-900">{monthlyKpis.planned}</span>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-xs text-emerald-800 block mb-1">Monthly Published</span>
              <span className="text-2xl font-bold text-emerald-900">{monthlyKpis.published}</span>
            </div>
            <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200 shadow-2xs">
              <span className="text-xs text-cyan-800 block mb-1">Monthly Scheduled</span>
              <span className="text-2xl font-bold text-cyan-900">{monthlyKpis.scheduled}</span>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 shadow-2xs">
              <span className="text-xs text-indigo-800 block mb-1">Total Month Scope</span>
              <span className="text-2xl font-bold text-indigo-900">{monthlyKpis.total}</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 block mb-1">In Pipeline</span>
              <span className="text-2xl font-bold text-blue-700">
                {monthlyKpis.inProduction + monthlyKpis.editing + monthlyKpis.approved}
              </span>
            </div>
            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-xs text-emerald-800 block mb-1 font-semibold">
                Execution Rate
              </span>
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {monthlyKpis.executionRate}%
              </span>
            </div>
          </div>

          {/* Monthly Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Monthly Status Breakdown
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Formula: Execution Rate = (Published Content / Planned Content) × 100
              </p>

              <div className="space-y-3">
                {[
                  { label: 'Planned', val: monthlyKpis.planned, color: 'bg-slate-400' },
                  { label: 'In Production', val: monthlyKpis.inProduction, color: 'bg-blue-600' },
                  { label: 'Editing', val: monthlyKpis.editing, color: 'bg-purple-600' },
                  { label: 'Approved', val: monthlyKpis.approved, color: 'bg-green-600' },
                  { label: 'Scheduled', val: monthlyKpis.scheduled, color: 'bg-cyan-600' },
                  { label: 'Published', val: monthlyKpis.published, color: 'bg-emerald-600' },
                ].map(s => {
                  const pct = monthlyKpis.total > 0 ? Math.round((s.val / monthlyKpis.total) * 100) : 0;
                  return (
                    <div key={s.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${s.color}`} />
                          {s.label}
                        </span>
                        <span className="font-mono text-slate-600">
                          {s.val} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${s.color} transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Deliverables List */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Scheduled Deliverables for {monthName}
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Click any deliverable to edit or reschedule
                </p>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {monthlyItems.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center">
                      No deliverables scheduled for {monthName}.
                    </p>
                  ) : (
                    monthlyItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => openEditModal(item)}
                        className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <BrandBadge brandId={item.brandId} size="sm" />
                            <PlatformIcon platform={item.platform} size={11} />
                            <span className="text-[10px] font-mono text-slate-400">
                              {item.scheduledPublishingDate}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {item.topic}
                          </p>
                        </div>
                        <StatusBadge status={item.status} size="sm" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-2">
                <span>Total Month Output: {monthlyItems.length} items</span>
                <span className="text-emerald-700 font-semibold font-mono">
                  {monthlyKpis.executionRate}% achieved
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
