import React from 'react';
import { useMarketing } from '../context/MarketingContext';
import {
  LayoutDashboard,
  Calendar,
  CalendarRange,
  KanbanSquare,
  Megaphone,
  BarChart3,
  Users,
  Settings,
  Plus,
  HelpCircle,
  Database,
  CheckCircle,
  Building2,
  Layers,
} from 'lucide-react';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { BrandId } from '../types';

export type NavigationTab =
  | 'overview'
  | 'brands'
  | 'calendar'
  | 'planning'
  | 'production'
  | 'campaigns'
  | 'analytics'
  | 'team'
  | 'workspaces'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  openUserGuide: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  openUserGuide,
}) => {
  const {
    activeWorkspace,
    brands,
    activeBrandId,
    setActiveBrandId,
    openCreateModal,
    isOffline,
    lastSavedAt,
    content,
  } = useMarketing();

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'brands',
      label: 'Brands',
      icon: <Layers size={18} />,
      badge: brands.length,
    },
    {
      id: 'calendar',
      label: 'Content Calendar',
      icon: <Calendar size={18} />,
      badge: content.length,
    },
    {
      id: 'planning',
      label: 'Content Planning',
      icon: <CalendarRange size={18} />,
    },
    {
      id: 'production',
      label: 'Content Production',
      icon: <KanbanSquare size={18} />,
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      icon: <Megaphone size={18} />,
    },
    {
      id: 'analytics',
      label: 'Reports & Analytics',
      icon: <BarChart3 size={18} />,
    },
    {
      id: 'team',
      label: 'Team & Workload',
      icon: <Users size={18} />,
    },
    {
      id: 'workspaces',
      label: 'Workspaces',
      icon: <Building2 size={18} />,
    },
    {
      id: 'settings',
      label: 'Settings & SOP',
      icon: <Settings size={18} />,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 select-none">
      {/* Dynamic Workspace Switcher Header */}
      <div className="p-3 border-b border-slate-100">
        <WorkspaceSwitcher
          onOpenManagement={() => onSelectTab('workspaces')}
          onOpenCreate={() => onSelectTab('workspaces')}
        />
      </div>

      {/* Brand Context Filter inside active workspace */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Brand Context
          </label>
          <button
            type="button"
            onClick={() => onSelectTab('brands')}
            className="text-[10px] text-indigo-600 hover:underline font-semibold"
          >
            Manage
          </button>
        </div>

        <div className="space-y-1 max-h-36 overflow-y-auto">
          {/* All Brands in this workspace */}
          <button
            type="button"
            onClick={() => setActiveBrandId('all')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeBrandId === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              <span className="truncate">All Brands</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono ml-1">
              {content.length}
            </span>
          </button>

          {/* Dynamic Brands in this workspace */}
          {brands.map(b => {
            const isSelected = activeBrandId === b.id;
            const brandCount = content.filter(c => c.brandId === b.id).length;

            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setActiveBrandId(b.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: b.primaryColor }}
                  />
                  <span className="truncate">{b.name}</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono ml-1">
                  {brandCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={() => openCreateModal()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>New Content Item</span>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Operations
        </p>
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-indigo-600' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-indigo-200/60 text-indigo-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Persistence & Guide Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        <button
          type="button"
          onClick={openUserGuide}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
        >
          <HelpCircle size={15} className="text-indigo-500" />
          <span className="font-medium">User Guide &amp; SOP</span>
        </button>

        <div className="px-2 py-1 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Database size={12} className="text-slate-400" />
            <span>Workspace Sync:</span>
          </div>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <CheckCircle size={11} /> {isOffline ? 'Cached' : 'Isolated'}
          </span>
        </div>
        {lastSavedAt && (
          <p className="px-2 text-[10px] text-slate-400 font-mono">
            Last saved {lastSavedAt}
          </p>
        )}
      </div>
    </aside>
  );
};
