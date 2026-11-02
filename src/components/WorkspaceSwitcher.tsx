import React, { useState, useRef, useEffect } from 'react';
import { useMarketing } from '../context/MarketingContext';
import {
  ChevronsUpDown,
  Check,
  Plus,
  Building2,
  Briefcase,
  Search,
  Sparkles,
  Settings,
  Layers,
} from 'lucide-react';
import { Workspace } from '../types';

interface WorkspaceSwitcherProps {
  onOpenManagement?: () => void;
  onOpenCreate?: () => void;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  onOpenManagement,
  onOpenCreate,
}) => {
  const {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspaceId,
  } = useMarketing();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredWorkspaces = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(search.toLowerCase()) ||
    ws.type.toLowerCase().includes(search.toLowerCase()) ||
    ws.industry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Current Workspace Pill / Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 transition-all text-left shadow-2xs group cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {activeWorkspace?.logo || activeWorkspace?.name[0] || 'W'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-indigo-600 transition-colors">
                {activeWorkspace?.name || 'Select Workspace'}
              </h3>
            </div>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              {activeWorkspace?.type || 'Workspace'} • {activeWorkspace?.industry || 'Operations'}
            </p>
          </div>
        </div>

        <ChevronsUpDown size={14} className="text-slate-400 group-hover:text-slate-600 shrink-0 ml-1.5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Header & Search */}
          <div className="px-3 pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Workspace
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {workspaces.length} total
              </span>
            </div>

            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search workspaces..."
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                autoFocus
              />
            </div>
          </div>

          {/* Workspaces List */}
          <div className="max-h-56 overflow-y-auto px-1.5 py-1 space-y-0.5">
            {filteredWorkspaces.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No matching workspaces
              </p>
            ) : (
              filteredWorkspaces.map(ws => {
                const isActive = ws.id === activeWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      setActiveWorkspaceId(ws.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-950 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {ws.logo || ws.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate leading-tight">
                          {ws.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {ws.type}
                        </div>
                      </div>
                    </div>

                    {isActive && <Check size={14} className="text-indigo-600 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 mt-1 border-t border-slate-100 px-2 space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onOpenCreate) onOpenCreate();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Create New Workspace</span>
            </button>

            {onOpenManagement && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenManagement();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <Building2 size={14} className="text-slate-400" />
                <span>Manage All Workspaces</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
