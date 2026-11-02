import React, { useState } from 'react';
import { useMarketing } from '../context/MarketingContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  List,
  Grid,
  CalendarRange,
  Clock,
  User,
  Copy,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { FilterBar } from '../components/FilterBar';
import { StatusBadge } from '../components/StatusBadge';
import { BrandBadge } from '../components/BrandBadge';
import { PlatformIcon } from '../components/PlatformIcon';
import { ContentItem } from '../types';
import { getWeekRange, getDaysOfWeek } from '../utils/metrics';

type CalendarMode = 'month' | 'week' | 'list';

export const CalendarView: React.FC = () => {
  const {
    filteredContent,
    openCreateModal,
    openEditModal,
    openDuplicateModal,
    updateContentStatus,
  } = useMarketing();

  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');

  // Currently viewed year and month (Default to November 2026 based on mock context)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 10, 1)); // Nov 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 10, 2)); // 2026-11-02
  };

  // Month calculations
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  // Adjust so Monday is column 0 (0 = Mon, 6 = Sun)
  const startingCol = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid cells for month view
  const daysArray: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = startingCol - 1; i >= 0; i--) {
    const d = prevMonthLastDate - i;
    const prevDate = new Date(year, month - 1, d);
    daysArray.push({
      dateStr: prevDate.toISOString().split('T')[0],
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    const dateStr = dt.toISOString().split('T')[0];
    daysArray.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete full weeks
  const totalCells = Math.ceil(daysArray.length / 7) * 7;
  const remaining = totalCells - daysArray.length;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d);
    daysArray.push({
      dateStr: nextDate.toISOString().split('T')[0],
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  // Week View calculation
  const weekRange = getWeekRange(currentDate);
  const weekDays = getDaysOfWeek(weekRange.start);

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

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <FilterBar />

      {/* Calendar Navigation & Mode Switcher */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Navigation & Header */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={calendarMode === 'week' ? handlePrevWeek : handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={calendarMode === 'week' ? handleNextWeek : handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            {calendarMode === 'week'
              ? `Week of ${weekRange.start} – ${weekRange.end}`
              : monthName}
          </h3>

          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* View Mode Toggle & Add Button */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/70 text-xs">
            <button
              type="button"
              onClick={() => setCalendarMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-all cursor-pointer ${
                calendarMode === 'month'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid size={13} />
              <span>Month</span>
            </button>
            <button
              type="button"
              onClick={() => setCalendarMode('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-all cursor-pointer ${
                calendarMode === 'week'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarRange size={13} />
              <span>Week</span>
            </button>
            <button
              type="button"
              onClick={() => setCalendarMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-all cursor-pointer ${
                calendarMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List size={13} />
              <span>List</span>
            </button>
          </div>

          {/* New Content Action */}
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Add Content</span>
          </button>
        </div>
      </div>

      {/* 1. MONTH VIEW */}
      {calendarMode === 'month' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Day Headers (Mon - Sun) */}
          <div className="grid grid-cols-7 border-b border-slate-200 text-center bg-slate-50/70 text-slate-600 font-semibold text-xs py-2.5">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* Month Day Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
            {daysArray.map((cell, idx) => {
              const cellItems = filteredContent.filter(
                c => c.scheduledPublishingDate === cell.dateStr
              );
              const isToday = cell.dateStr === '2026-11-02';

              return (
                <div
                  key={idx}
                  className={`min-h-[125px] p-2 flex flex-col justify-between transition-colors group relative ${
                    cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-400'
                  } ${isToday ? 'bg-indigo-50/20' : ''}`}
                >
                  {/* Cell Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : cell.isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Quick Add Content on this Day */}
                    <button
                      type="button"
                      onClick={() => openCreateModal(cell.dateStr)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                      title={`Add content on ${cell.dateStr}`}
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Content Cards for this day */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px]">
                    {cellItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer text-left group/card"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1 truncate">
                            <PlatformIcon platform={item.platform} size={11} />
                            <BrandBadge brandId={item.brandId} size="sm" />
                          </div>
                          <StatusBadge status={item.status} size="sm" showDot={false} />
                        </div>
                        <p className="text-[11px] font-semibold text-slate-900 line-clamp-2 leading-tight group-hover/card:text-indigo-600">
                          {item.topic}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-600 mt-1">
                          <span className="truncate max-w-[80px]">{item.responsiblePerson.split(' ')[0]}</span>
                          {item.publishingTime && (
                            <span className="font-mono">{item.publishingTime}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Day Footer item count if > 0 */}
                  {cellItems.length > 0 && (
                    <div className="text-[10px] text-slate-600 text-right font-mono mt-1 pt-1 border-t border-slate-100">
                      {cellItems.length} {cellItems.length === 1 ? 'post' : 'posts'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. WEEK VIEW */}
      {calendarMode === 'week' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 text-center bg-slate-50/70 text-slate-700 font-semibold text-xs py-2.5 divide-x divide-slate-200">
            {weekDays.map(dayStr => {
              const dt = new Date(`${dayStr}T12:00:00Z`);
              const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
              const isToday = dayStr === '2026-11-02';
              return (
                <div key={dayStr} className={`px-2 ${isToday ? 'bg-indigo-50/50' : ''}`}>
                  <div className="text-slate-500 text-[11px]">{dayName}</div>
                  <div className={`font-mono text-sm ${isToday ? 'text-indigo-600 font-bold' : ''}`}>
                    {dayStr.split('-')[2]}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7 divide-x divide-slate-200 min-h-[460px]">
            {weekDays.map(dayStr => {
              const dayItems = filteredContent.filter(c => c.scheduledPublishingDate === dayStr);
              const isToday = dayStr === '2026-11-02';

              return (
                <div
                  key={dayStr}
                  className={`p-2.5 flex flex-col justify-between ${
                    isToday ? 'bg-indigo-50/15' : 'bg-white'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    {dayItems.length === 0 ? (
                      <div className="text-center py-10 text-[11px] text-slate-400">
                        No scheduled content
                      </div>
                    ) : (
                      dayItems.map(item => (
                        <div
                          key={item.id}
                          onClick={() => openEditModal(item)}
                          className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer space-y-1.5 text-left group"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <BrandBadge brandId={item.brandId} size="sm" />
                            <PlatformIcon platform={item.platform} size={13} />
                          </div>
                          <h4 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 leading-snug line-clamp-2">
                            {item.topic}
                          </h4>
                          <div className="flex items-center justify-between">
                            <StatusBadge status={item.status} size="sm" />
                            {item.publishingTime && (
                              <span className="text-[10px] font-mono text-slate-500">
                                {item.publishingTime}
                              </span>
                            )}
                          </div>
                          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="truncate">{item.responsiblePerson}</span>
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                              {item.contentType}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openCreateModal(dayStr)}
                    className="mt-3 w-full py-1.5 text-[11px] font-medium text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-md border border-dashed border-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Add Item</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. LIST VIEW */}
      {calendarMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50/70">
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Topic / Content Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Responsible</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContent.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No content items match the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredContent.map(item => (
                    <tr
                      key={item.id}
                      onClick={() => openEditModal(item)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                        {item.scheduledPublishingDate}
                        {item.publishingTime && (
                          <span className="block text-[10px] text-slate-400">
                            {item.publishingTime}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <BrandBadge brandId={item.brandId} size="sm" />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <PlatformIcon platform={item.platform} size={14} />
                          <span>{item.platform}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {item.topic}
                        </div>
                        {item.caption && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.caption}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                          {item.contentType}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {item.responsiblePerson}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => openDuplicateModal(item)}
                            title="Duplicate"
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          >
                            <Copy size={13} />
                          </button>
                          {item.actualPublishedUrl && (
                            <a
                              href={item.actualPublishedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                              title="View Live Post"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
