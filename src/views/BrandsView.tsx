import React, { useState } from 'react';
import { useMarketing } from '../context/MarketingContext';
import {
  Layers,
  Plus,
  Settings,
  Trash2,
  Globe,
  X,
  ExternalLink,
  Sparkles,
  FileText,
  Calendar,
} from 'lucide-react';
import { BrandBadge } from '../components/BrandBadge';
import { PlatformIcon } from '../components/PlatformIcon';
import { Brand, ContentPlatform } from '../types';

interface BrandsViewProps {
  onOpenCreateBrandModal?: () => void;
}

const PRESET_COLORS = [
  '#059669', // Emerald
  '#4F46E5', // Indigo
  '#2563EB', // Blue
  '#9333EA', // Purple
  '#D97706', // Amber
  '#DC2626', // Red
  '#0D9488', // Teal
  '#0284C7', // Sky
];

export const BrandsView: React.FC<BrandsViewProps> = () => {
  const {
    brands,
    activeWorkspace,
    createBrand,
    updateBrand,
    archiveBrand,
    content,
    setActiveBrandId,
  } = useMarketing();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandToArchive, setBrandToArchive] = useState<Brand | null>(null);

  const [formData, setFormData] = useState<Partial<Brand>>({
    name: '',
    code: '',
    tagline: '',
    primaryColor: '#4F46E5',
    description: '',
    industry: '',
    website: '',
    defaultPlatforms: ['LinkedIn', 'YouTube'],
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    await createBrand(formData);
    setIsCreateOpen(false);
    setFormData({
      name: '',
      code: '',
      tagline: '',
      primaryColor: '#4F46E5',
      description: '',
      industry: '',
      website: '',
      defaultPlatforms: ['LinkedIn', 'YouTube'],
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editingBrand.name) return;
    await updateBrand(editingBrand.id, editingBrand);
    setEditingBrand(null);
  };

  const handleArchive = (brand: Brand) => {
    setBrandToArchive(brand);
  };

  const confirmArchiveBrand = async () => {
    if (!brandToArchive) return;
    await archiveBrand(brandToArchive.id);
    setBrandToArchive(null);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-indigo-50 text-indigo-600">
              <Layers size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              {activeWorkspace?.name}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Brand Management
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Configure dynamic brand identities, content channels, and visual branding tokens for this workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add New Brand</span>
        </button>
      </div>

      {/* Empty State when workspace has 0 brands */}
      {brands.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Your workspace is ready</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Start by creating your first brand inside <strong>{activeWorkspace?.name}</strong> to begin scheduling content, launching campaigns, and tracking operational execution.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Create First Brand</span>
          </button>
        </div>
      ) : (
        /* Brands Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brands.map(brand => {
            const brandContent = content.filter(c => c.brandId === brand.id);
            const publishedCount = brandContent.filter(c => c.status === 'Published').length;

            return (
              <div
                key={brand.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-2xs shrink-0"
                        style={{ backgroundColor: brand.primaryColor }}
                      >
                        {brand.code.substring(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{brand.name}</h3>
                          <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-bold">
                            {brand.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {brand.industry || 'General Industry'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingBrand(brand)}
                        title="Edit brand"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Settings size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchive(brand)}
                        title="Archive brand"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                    {brand.description || brand.tagline || 'No description provided.'}
                  </p>

                  {/* Brand Tagline & Channels */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                    {brand.tagline && (
                      <div className="text-[11px] text-slate-600 font-medium italic">
                        "{brand.tagline}"
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Total Deliverables:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {brandContent.length} items ({publishedCount} published)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-2 flex items-center justify-between">
                  {brand.website ? (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Globe size={13} />
                      <span className="truncate max-w-[150px]">{brand.website}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 font-mono">ID: {brand.id}</span>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveBrandId(brand.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Filter Calendar →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE BRAND MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-base font-bold text-slate-900">Create New Brand</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => {
                      const name = e.target.value;
                      const code = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
                      setFormData({ ...formData, name, code: formData.code || code });
                    }}
                    placeholder="e.g. NextEra Solar or QuantFund"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code / Abbrev <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. NEXT"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white uppercase font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tagline / Core Proposition
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Clean Energy Grid Analytics for Commercial Fleets"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({ ...formData, primaryColor: c })}
                        className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                          formData.primaryColor === c ? 'scale-110 border-slate-900 shadow-2xs' : 'border-white'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-24 text-xs p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Target audience, editorial tone, and value proposition..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={e => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g. CleanTech, Fintech"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://brand.com"
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
                  Create Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BRAND MODAL */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-base font-bold text-slate-900">Edit Brand Details</h3>
              <button
                type="button"
                onClick={() => setEditingBrand(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={editingBrand.name}
                  onChange={e => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBrand.code}
                    onChange={e => setEditingBrand({ ...editingBrand, code: e.target.value.toUpperCase() })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Color
                  </label>
                  <input
                    type="text"
                    value={editingBrand.primaryColor}
                    onChange={e => setEditingBrand({ ...editingBrand, primaryColor: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={editingBrand.tagline}
                  onChange={e => setEditingBrand({ ...editingBrand, tagline: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingBrand.description}
                  onChange={e => setEditingBrand({ ...editingBrand, description: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARCHIVE BRAND CONFIRMATION MODAL */}
      {brandToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <Trash2 size={20} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Archive Brand</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to archive brand <span className="font-bold text-slate-900">"{brandToArchive.name}"</span>?
                  Historical content items will be retained in this workspace.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBrandToArchive(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmArchiveBrand}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs cursor-pointer"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
