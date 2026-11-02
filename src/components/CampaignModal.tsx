import React, { useState, useEffect } from 'react';
import { useMarketing } from '../context/MarketingContext';
import { Campaign, BrandId, ContentObjective } from '../types';
import { Megaphone, X, Save, AlertCircle } from 'lucide-react';
import { BrandBadge } from './BrandBadge';

const OBJECTIVES: ContentObjective[] = [
  'Brand Awareness',
  'Engagement',
  'Lead Generation',
  'Sales / Conversion',
  'Education',
  'Community Building',
  'Traffic',
];

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignToEdit?: Campaign | null;
}

export const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  campaignToEdit,
}) => {
  const { brands, activeBrandId, createCampaign, updateCampaign, activeWorkspace } = useMarketing();

  const isEditing = Boolean(campaignToEdit && campaignToEdit.id);

  // Determine initial brand safely from active workspace
  const defaultBrandId =
    activeBrandId !== 'all' && brands.some(b => b.id === activeBrandId)
      ? activeBrandId
      : brands[0]?.id || '';

  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: '',
    brandId: defaultBrandId,
    objective: 'Lead Generation',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    description: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form on open or when campaignToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (campaignToEdit) {
        setFormData({
          ...campaignToEdit,
          brandId: campaignToEdit.brandId,
        });
      } else {
        setFormData({
          name: '',
          brandId: defaultBrandId,
          objective: 'Lead Generation',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          description: '',
          status: 'Active',
        });
      }
      setErrors({});
    }
  }, [isOpen, campaignToEdit, defaultBrandId]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name?.trim()) {
      errs.name = 'Campaign name is required';
    }
    if (!formData.brandId) {
      errs.brandId = 'A brand must be selected';
    } else if (!brands.some(b => b.id === formData.brandId)) {
      errs.brandId = 'Selected brand does not belong to active workspace';
    }
    if (!formData.startDate) {
      errs.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      errs.endDate = 'End date is required';
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      errs.endDate = 'End date cannot precede start date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEditing && campaignToEdit?.id) {
        await updateCampaign(campaignToEdit.id, formData);
      } else {
        await createCampaign(formData);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save campaign:', err);
      setErrors({ form: err instanceof Error ? err.message : 'Failed to save campaign' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Megaphone size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isEditing ? 'Edit Strategic Campaign' : 'Create New Campaign'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Workspace: <span className="font-semibold text-slate-700">{activeWorkspace?.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning if no brands */}
        {brands.length === 0 ? (
          <div className="p-6 text-center space-y-3">
            <AlertCircle size={32} className="mx-auto text-amber-500" />
            <h4 className="text-sm font-bold text-slate-800">No Brands Available in Workspace</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Campaigns must belong to an active brand. Please create a brand in this workspace before setting up campaigns.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {errors.form && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Brand Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Brand <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.brandId || ''}
                onChange={e => setFormData({ ...formData, brandId: e.target.value as BrandId })}
                className={`w-full text-xs p-2.5 border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-medium ${
                  errors.brandId ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                }`}
              >
                {brands.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
              {errors.brandId && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.brandId}
                </p>
              )}
            </div>

            {/* Campaign Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Q1 CFO Executive Playbook or Vision AI Product Launch"
                className={`w-full text-xs p-2.5 border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-medium ${
                  errors.name ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                }`}
              />
              {errors.name && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.name}
                </p>
              )}
            </div>

            {/* Objective & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Objective <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.objective || 'Brand Awareness'}
                  onChange={e => setFormData({ ...formData, objective: e.target.value as ContentObjective })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                >
                  {OBJECTIVES.map(obj => (
                    <option key={obj} value={obj}>
                      {obj}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campaign Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status || 'Active'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="Active">Active</option>
                  <option value="Planned">Planned</option>
                  <option value="Completed">Completed</option>
                  <option value="Paused">Paused</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className={`w-full text-xs p-2 border rounded-lg bg-white ${
                    errors.endDate ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                  }`}
                />
                {errors.endDate && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.endDate}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description &amp; Goals
              </label>
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Strategic rationale, key themes, target audience, conversion goals..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Save size={13} />
                <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Campaign' : 'Create Campaign'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
