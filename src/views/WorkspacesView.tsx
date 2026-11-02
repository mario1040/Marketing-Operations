import React, { useState } from 'react';
import { useMarketing } from '../context/MarketingContext';
import {
  Building2,
  Plus,
  ArrowRight,
  Settings,
  Layers,
  Calendar,
  Users,
  CheckCircle2,
  Trash2,
  X,
  Sparkles,
  Globe,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Workspace, WorkspaceType } from '../types';

interface WorkspacesViewProps {
  onSelectWorkspace?: (id: string) => void;
  onNavigateOverview?: () => void;
}

export const WorkspacesView: React.FC<WorkspacesViewProps> = ({
  onSelectWorkspace,
  onNavigateOverview,
}) => {
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    createWorkspace,
    updateWorkspace,
    archiveWorkspace,
    deleteWorkspace,
    brands,
    content,
    campaigns,
    team,
  } = useMarketing();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [cannotDeleteWarning, setCannotDeleteWarning] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState<'permanent' | 'archive'>('permanent');
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Workspace>>({
    name: '',
    type: 'Company',
    description: '',
    industry: 'Technology & Marketing',
    timezone: 'America/New_York',
    defaultLanguage: 'en',
    defaultCurrency: 'USD',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    const created = await createWorkspace(formData);
    setIsCreateOpen(false);
    setFormData({
      name: '',
      type: 'Company',
      description: '',
      industry: 'Technology & Marketing',
      timezone: 'America/New_York',
      defaultLanguage: 'en',
      defaultCurrency: 'USD',
    });
    setToastMessage(`Workspace "${created.name}" created successfully.`);
    setTimeout(() => setToastMessage(null), 4000);
    if (onSelectWorkspace) {
      onSelectWorkspace(created.id);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkspace || !editingWorkspace.name) return;
    await updateWorkspace(editingWorkspace.id, editingWorkspace);
    setToastMessage(`Workspace "${editingWorkspace.name}" updated successfully.`);
    setTimeout(() => setToastMessage(null), 4000);
    setEditingWorkspace(null);
  };

  const handleInitiateDelete = (ws: Workspace) => {
    if (workspaces.length <= 1) {
      setCannotDeleteWarning(
        `Cannot delete "${ws.name}". This is currently the only active workspace on the platform. A Marketing Operations platform requires at least one active workspace. Please create another workspace first before deleting this one.`
      );
      return;
    }
    setWorkspaceToDelete(ws);
  };

  const handleConfirmDelete = async () => {
    if (!workspaceToDelete) return;
    setIsDeleting(true);
    try {
      const targetName = workspaceToDelete.name;
      const targetId = workspaceToDelete.id;

      if (deleteMode === 'permanent') {
        await deleteWorkspace(targetId, true);
        setToastMessage(`Workspace "${targetName}" and its operational data were permanently deleted.`);
      } else {
        await archiveWorkspace(targetId);
        setToastMessage(`Workspace "${targetName}" was archived successfully.`);
      }

      setWorkspaceToDelete(null);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Delete workspace error:', err);
      setCannotDeleteWarning(err.message || 'Failed to delete workspace.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-indigo-50 text-indigo-600">
              <Building2 size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Multi-Tenant Architecture
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Workspace Management Center
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Create, configure, and isolate independent workspaces for distinct organizations, client accounts, or marketing departments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Create New Workspace</span>
        </button>
      </div>

      {/* Success Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 cursor-pointer p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workspaces.map(ws => {
          const isActive = ws.id === activeWorkspaceId;

          return (
            <div
              key={ws.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between transition-all ${
                isActive
                  ? 'border-indigo-400 ring-2 ring-indigo-500/10'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white font-black text-base flex items-center justify-center shrink-0 shadow-2xs">
                      {ws.logo || ws.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{ws.name}</h3>
                        {isActive && (
                          <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {ws.type} • {ws.industry}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingWorkspace(ws)}
                      title="Edit settings"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Settings size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInitiateDelete(ws)}
                      title="Delete or archive workspace"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {ws.description || 'No description provided.'}
                </p>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pb-3 border-b border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" />
                    <span>{ws.timezone}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe size={12} className="text-slate-400" />
                    <span>
                      {ws.defaultLanguage.toUpperCase()} / {ws.defaultCurrency}
                    </span>
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  ID: {ws.id}
                </span>

                {isActive ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateOverview) onNavigateOverview();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    <span>Open Dashboard</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveWorkspaceId(ws.id);
                      if (onSelectWorkspace) onSelectWorkspace(ws.id);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span>Switch to Workspace</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE WORKSPACE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Building2 size={18} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Workspace</h3>
                  <p className="text-xs text-slate-500">Configure independent marketing tenant</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Workspace Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Horizon Growth Agency or NorthStar Tech"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Workspace Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as WorkspaceType })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Company">Company</option>
                    <option value="Agency">Agency</option>
                    <option value="Marketing Department">Marketing Department</option>
                    <option value="Client Account">Client Account</option>
                    <option value="Personal Workspace">Personal Workspace</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={e => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g. B2B SaaS, HealthTech"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Primary mission, focus areas, and teams operating within this workspace..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Europe/Paris">Europe/Paris (CET)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={formData.defaultLanguage}
                    onChange={e => setFormData({ ...formData, defaultLanguage: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={formData.defaultCurrency}
                    onChange={e => setFormData({ ...formData, defaultCurrency: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT WORKSPACE MODAL */}
      {editingWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-base font-bold text-slate-900">Edit Workspace Settings</h3>
              <button
                type="button"
                onClick={() => setEditingWorkspace(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={editingWorkspace.name}
                  onChange={e => setEditingWorkspace({ ...editingWorkspace, name: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type
                  </label>
                  <input
                    type="text"
                    value={editingWorkspace.type}
                    onChange={e => setEditingWorkspace({ ...editingWorkspace, type: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={editingWorkspace.industry}
                    onChange={e => setEditingWorkspace({ ...editingWorkspace, industry: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingWorkspace.description}
                  onChange={e => setEditingWorkspace({ ...editingWorkspace, description: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const ws = editingWorkspace;
                    setEditingWorkspace(null);
                    handleInitiateDelete(ws);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete Workspace</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingWorkspace(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANNOT DELETE WARNING MODAL */}
      {cannotDeleteWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <AlertTriangle size={22} />
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Cannot Delete Workspace
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {cannotDeleteWarning}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCannotDeleteWarning(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setCannotDeleteWarning(null);
                  setIsCreateOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs cursor-pointer"
              >
                <Plus size={14} />
                <span>Create New Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE / ARCHIVE WORKSPACE CONFIRMATION MODAL */}
      {workspaceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-red-50/70">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-red-100 text-red-700">
                  <Trash2 size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Delete Workspace
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose how to remove "{workspaceToDelete.name}"
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setWorkspaceToDelete(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Workspace details preview */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  {workspaceToDelete.logo || workspaceToDelete.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {workspaceToDelete.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {workspaceToDelete.type} • {workspaceToDelete.industry} • ID: <span className="font-mono text-slate-600">{workspaceToDelete.id}</span>
                  </p>
                </div>
              </div>

              {/* Mode choice */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Select Action:
                </label>

                <div className="grid grid-cols-1 gap-2.5">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      deleteMode === 'permanent'
                        ? 'border-red-400 bg-red-50/40 ring-1 ring-red-400/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="wsDeleteMode"
                      value="permanent"
                      checked={deleteMode === 'permanent'}
                      onChange={() => setDeleteMode('permanent')}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Permanent Delete (حذف نهائي للمساحة وبياناتها)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Permanently removes this workspace and cleanly deletes its associated brands, campaigns, and content schedules.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      deleteMode === 'archive'
                        ? 'border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-400/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="wsDeleteMode"
                      value="archive"
                      checked={deleteMode === 'archive'}
                      onChange={() => setDeleteMode('archive')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Archive Workspace (أرشفة آمنة مع حفظ السجلات)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Hides the workspace from the switcher and dashboard while retaining historical campaign records and data safely.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Impact Notice */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>Session Continuity</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  {workspaceToDelete.id === activeWorkspaceId
                    ? 'This is currently your active workspace. Deleting it will smoothly switch your active session to the next available workspace without reloading.'
                    : 'This action will safely remove this workspace from your workspace selector.'}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setWorkspaceToDelete(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>
                        {deleteMode === 'permanent' ? 'Confirm Permanent Delete' : 'Confirm Archive'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
