import React, { useState, useEffect } from 'react';
import { useMarketing } from '../context/MarketingContext';
import {
  ContentItem,
  BrandId,
  ContentPlatform,
  ContentType,
  ContentObjective,
  ContentStatus,
} from '../types';
import {
  X,
  Save,
  Trash2,
  Copy,
  Clock,
  History,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { BrandBadge } from './BrandBadge';
import { PlatformIcon } from './PlatformIcon';
import { DeleteConfirmModal } from './DeleteConfirmModal';

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

const OBJECTIVES: ContentObjective[] = [
  'Brand Awareness',
  'Engagement',
  'Lead Generation',
  'Sales / Conversion',
  'Education',
  'Community Building',
  'Traffic',
];

const STATUSES: ContentStatus[] = [
  'Planned',
  'In Production',
  'Editing',
  'Approved',
  'Scheduled',
  'Published',
];

export const ContentModal: React.FC = () => {
  const {
    isModalOpen,
    setIsModalOpen,
    modalMode,
    selectedContentItem,
    saveContentItem,
    deleteContentItem,
    openDuplicateModal,
    brands,
    team,
    campaigns,
    activities,
  } = useMarketing();

  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [formData, setFormData] = useState<Partial<ContentItem>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (selectedContentItem) {
      setFormData({ ...selectedContentItem });
      setErrors({});
      setActiveTab('editor');
    }
  }, [selectedContentItem, isModalOpen]);

  if (!isModalOpen || !selectedContentItem) return null;

  const relevantCampaigns = campaigns.filter(c => c.brandId === formData.brandId);
  const relevantTeam = team.filter(t => formData.brandId && t.brands.includes(formData.brandId));

  const itemActivities = activities.filter(a => a.contentId === formData.id);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.topic || formData.topic.trim() === '') {
      newErrors.topic = 'Content topic / title is required';
    }
    if (!formData.contentDate) {
      newErrors.contentDate = 'Planning date is required';
    }
    if (!formData.scheduledPublishingDate) {
      newErrors.scheduledPublishingDate = 'Scheduled publishing date is required';
    }
    if (!formData.responsiblePerson) {
      newErrors.responsiblePerson = 'Responsible person must be assigned';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      await saveContentItem(formData);
    } catch (err) {
      console.error('Error saving content:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formData.id) return;
    setIsDeleting(true);
    try {
      await deleteContentItem(formData.id);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting content:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const title =
    modalMode === 'create'
      ? 'Create New Content Item'
      : modalMode === 'duplicate'
      ? 'Duplicate Content Item'
      : 'Edit Content Item';

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto flex flex-col max-h-[92vh]">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60 shrink-0">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Sparkles size={18} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{title}</h2>
                  {formData.id && (
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                      {formData.id}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Plan, schedule, and assign multi-channel marketing deliverables
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tab Selector */}
              {formData.id && (
                <div className="flex items-center p-0.5 bg-slate-200/60 rounded-lg text-xs mr-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className={`px-3 py-1 font-medium rounded-md transition-all ${
                      activeTab === 'editor'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-1.5 px-3 py-1 font-medium rounded-md transition-all ${
                      activeTab === 'history'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <History size={12} />
                    <span>History ({itemActivities.length})</span>
                  </button>
                </div>
              )}

              {modalMode === 'edit' && formData.id && (
                <>
                  <button
                    type="button"
                    onClick={() => openDuplicateModal(formData as ContentItem)}
                    title="Duplicate item"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    title="Delete item"
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'editor' ? (
              <form id="content-form" onSubmit={handleSave} className="space-y-6">
                {/* SECTION 1 — Basic Information */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/70 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Section 1: Basic Information
                    </span>
                    {formData.brandId && <BrandBadge brandId={formData.brandId} size="sm" />}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Brand */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Brand <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.brandId || (brands[0]?.id || '')}
                        onChange={e => {
                          const newBrandId = e.target.value as BrandId;
                          const isCampStillValid =
                            formData.campaignId &&
                            campaigns.find(c => c.id === formData.campaignId)?.brandId === newBrandId;
                          setFormData({
                            ...formData,
                            brandId: newBrandId,
                            campaignId: isCampStillValid ? formData.campaignId : undefined,
                          });
                        }}
                        className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-medium"
                      >
                        {brands.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Platform */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Platform <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={formData.platform || 'LinkedIn'}
                          onChange={e => setFormData({ ...formData, platform: e.target.value as ContentPlatform })}
                          className="w-full text-sm py-2 pl-9 pr-3 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-medium"
                        >
                          {PLATFORMS.map(p => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <PlatformIcon platform={formData.platform || 'LinkedIn'} size={15} />
                        </div>
                      </div>
                    </div>

                    {/* Content Date (Planning Date) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Content Date (Planning Cycle Date) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.contentDate || ''}
                        onChange={e => setFormData({ ...formData, contentDate: e.target.value })}
                        className={`w-full text-sm py-2 px-3 border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
                          errors.contentDate ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                        }`}
                      />
                      {errors.contentDate && (
                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={11} /> {errors.contentDate}
                        </p>
                      )}
                    </div>

                    {/* Content Type */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Content Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.contentType || 'Static Post'}
                        onChange={e => setFormData({ ...formData, contentType: e.target.value as ContentType })}
                        className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {CONTENT_TYPES.map(t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Topic / Content Title (Full Width) */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Topic / Content Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.topic || ''}
                        onChange={e => setFormData({ ...formData, topic: e.target.value })}
                        placeholder="e.g. WACC vs ROIC Breakdown or Automation Audit Rubric"
                        className={`w-full text-sm py-2 px-3 border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-medium ${
                          errors.topic ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                        }`}
                      />
                      {errors.topic && (
                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={11} /> {errors.topic}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 2 — Planning */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/70 space-y-4">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200/60">
                    Section 2: Planning & Ownership
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Campaign */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Campaign (Optional)
                      </label>
                      <select
                        value={formData.campaignId || ''}
                        onChange={e => setFormData({ ...formData, campaignId: e.target.value || undefined })}
                        className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">No Campaign (Standalone Content)</option>
                        {relevantCampaigns.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Objective */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Objective <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.objective || 'Brand Awareness'}
                        onChange={e => setFormData({ ...formData, objective: e.target.value as ContentObjective })}
                        className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {OBJECTIVES.map(obj => (
                          <option key={obj} value={obj}>
                            {obj}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Responsible Person */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Responsible Person <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.responsiblePerson || ''}
                        onChange={e => setFormData({ ...formData, responsiblePerson: e.target.value })}
                        className={`w-full text-sm py-2 px-3 border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
                          errors.responsiblePerson ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                        }`}
                      >
                        {relevantTeam.map(t => (
                          <option key={t.id} value={t.name}>
                            {t.name} — {t.role.split('&')[0].trim()}
                          </option>
                        ))}
                        {/* Fallback if team member not in filtered list */}
                        {formData.responsiblePerson &&
                          !relevantTeam.some(t => t.name === formData.responsiblePerson) && (
                            <option value={formData.responsiblePerson}>{formData.responsiblePerson}</option>
                          )}
                      </select>
                      {errors.responsiblePerson && (
                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={11} /> {errors.responsiblePerson}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Status <span className="text-red-500">*</span>
                        </label>
                        {formData.status && <StatusBadge status={formData.status} size="sm" />}
                      </div>
                      <select
                        value={formData.status || 'Planned'}
                        onChange={e => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                        className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-semibold"
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Workflow: Planned → In Production → Editing → Approved → Scheduled → Published
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION 3 — Publishing */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/70 space-y-4">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200/60">
                    Section 3: Publishing Schedule & Copy
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Scheduled Publishing Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Scheduled Publishing Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.scheduledPublishingDate || ''}
                        onChange={e => setFormData({ ...formData, scheduledPublishingDate: e.target.value })}
                        className={`w-full text-sm py-2 px-3 border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
                          errors.scheduledPublishingDate ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                        }`}
                      />
                      {errors.scheduledPublishingDate && (
                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={11} /> {errors.scheduledPublishingDate}
                        </p>
                      )}
                    </div>

                    {/* Publishing Time */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Publishing Time (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.publishingTime || ''}
                        onChange={e => setFormData({ ...formData, publishingTime: e.target.value })}
                        placeholder="e.g. 09:30 AM or 14:00"
                        className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    {/* Caption (Full Width) */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Caption / Post Copy
                      </label>
                      <textarea
                        rows={4}
                        value={formData.caption || ''}
                        onChange={e => setFormData({ ...formData, caption: e.target.value })}
                        placeholder="Draft post caption, hook, hashtags, and formatting..."
                        className="w-full text-sm p-3 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400"
                      />
                    </div>

                    {/* CTA (Full Width) */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Call to Action (CTA)
                      </label>
                      <input
                        type="text"
                        value={formData.cta || ''}
                        onChange={e => setFormData({ ...formData, cta: e.target.value })}
                        placeholder="e.g. Download the free financial model / Register for the live briefing"
                        className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4 — Production Details */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/70 space-y-4">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200/60">
                    Section 4: Production Details & Assets
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Content Brief */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Content Brief / Creative Directions
                      </label>
                      <textarea
                        rows={2}
                        value={formData.contentBrief || ''}
                        onChange={e => setFormData({ ...formData, contentBrief: e.target.value })}
                        placeholder="Key angles, visual assets needed, design guidelines..."
                        className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    {/* Creative URL */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Creative Reference / Asset URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={formData.creativeUrl || ''}
                          onChange={e => setFormData({ ...formData, creativeUrl: e.target.value })}
                          placeholder="https://figma.com/... or image link"
                          className="flex-1 text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                        />
                        {formData.creativeUrl && (
                          <a
                            href={formData.creativeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 flex items-center justify-center shrink-0"
                            title="Open link"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actual Published URL (if published) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Actual Published URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={formData.actualPublishedUrl || ''}
                          onChange={e => setFormData({ ...formData, actualPublishedUrl: e.target.value })}
                          placeholder="https://linkedin.com/posts/..."
                          className="flex-1 text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                        />
                        {formData.actualPublishedUrl && (
                          <a
                            href={formData.actualPublishedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-emerald-600 flex items-center justify-center shrink-0"
                            title="Open published post"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Internal Notes */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Internal Notes
                      </label>
                      <textarea
                        rows={2}
                        value={formData.internalNotes || ''}
                        onChange={e => setFormData({ ...formData, internalNotes: e.target.value })}
                        placeholder="Internal communication, blockers, reminders..."
                        className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    {/* Approval Notes */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Approval Notes
                      </label>
                      <textarea
                        rows={2}
                        value={formData.approvalNotes || ''}
                        onChange={e => setFormData({ ...formData, approvalNotes: e.target.value })}
                        placeholder="Reviewer feedback, sign-offs..."
                        className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              /* History Tab */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-800">Operational Activity Log</h3>
                  <span className="text-xs text-slate-500">Immutable audit trail of updates</span>
                </div>

                {itemActivities.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Clock size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">No activity recorded for this item yet.</p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 ml-4 space-y-4 py-2">
                    {itemActivities.map(act => (
                      <div key={act.id} className="relative pl-6">
                        <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white ring-2 ring-indigo-100" />
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                          <p className="text-xs font-semibold text-slate-900">{act.action}</p>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>by {act.user}</span>
                            <span>{new Date(act.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500">
              {formData.updatedAt && (
                <span>Last updated: {new Date(formData.updatedAt).toLocaleString()}</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="content-form"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Save size={14} />
                <span>{isSaving ? 'Saving...' : 'Save Content Item'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Content Item"
        itemTopic={formData.topic || 'Untitled'}
        isDeleting={isDeleting}
      />
    </>
  );
};
