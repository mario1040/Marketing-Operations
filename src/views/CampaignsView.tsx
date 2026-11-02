import React, { useState } from 'react';
import { useMarketing } from '../context/MarketingContext';
import {
  Megaphone,
  Plus,
  Calendar,
  Target,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { BrandBadge } from '../components/BrandBadge';
import { Campaign, BrandId } from '../types';
import { CampaignModal } from '../components/CampaignModal';

export const CampaignsView: React.FC = () => {
  const {
    campaigns,
    content,
    brands,
    activeBrandId,
    setActiveBrandId,
    deleteCampaign,
    openEditModal,
  } = useMarketing();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

  // Scoped campaigns by selected brand or all brands in current workspace
  const relevantCampaigns =
    activeBrandId === 'all'
      ? campaigns
      : campaigns.filter(c => c.brandId === activeBrandId);

  const handleOpenCreate = () => {
    setCampaignToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (camp: Campaign) => {
    setCampaignToEdit(camp);
    setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, camp: Campaign) => {
    e.stopPropagation();
    setCampaignToDelete(camp);
  };

  const confirmDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    await deleteCampaign(campaignToDelete.id);
    setCampaignToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Campaign Operations Management
          </h3>
          <p className="text-xs text-slate-500">
            Strategic campaign groupings, milestone date tracking, and associated content deliverables
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Brand Filters Bar */}
      {brands.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveBrandId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeBrandId === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Brands ({campaigns.length})
          </button>
          {brands.map(b => {
            const count = campaigns.filter(c => c.brandId === b.id).length;
            const isSelected = activeBrandId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setActiveBrandId(b.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isSelected ? '#FFFFFF' : b.primaryColor }}
                />
                <span>{b.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Campaign Cards Grid */}
      {relevantCampaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Megaphone size={28} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-base font-bold text-slate-900">No campaigns found</h4>
            <p className="text-xs text-slate-500">
              {brands.length === 0
                ? 'Your workspace has no brands yet. Create a brand first to launch strategic marketing campaigns.'
                : activeBrandId !== 'all'
                ? 'No campaigns exist for the selected brand. Create one or switch brand filter.'
                : 'Launch cross-channel marketing campaigns to organize and schedule your deliverables.'}
            </p>
          </div>
          {brands.length > 0 && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Create First Campaign</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relevantCampaigns.map(camp => {
            const associatedItems = content.filter(c => c.campaignId === camp.id);
            const publishedCount = associatedItems.filter(c => c.status === 'Published').length;
            const progressPct =
              associatedItems.length > 0
                ? Math.round((publishedCount / associatedItems.length) * 100)
                : 0;

            return (
              <div
                key={camp.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <BrandBadge brandId={camp.brandId} size="sm" />
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          camp.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : camp.status === 'Planned'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : camp.status === 'Completed'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {camp.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(camp)}
                        title="Edit Campaign"
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={e => handleDelete(e, camp)}
                        title="Delete Campaign"
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1">{camp.name}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                    {camp.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>
                        {camp.startDate} — {camp.endDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target size={13} className="text-indigo-500" />
                      <span>{camp.objective}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="pt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">
                        Execution Velocity: {publishedCount} / {associatedItems.length} published
                      </span>
                      <span className="font-mono text-emerald-700 font-bold">{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Associated Content Items */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Associated Deliverables ({associatedItems.length})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {camp.id}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {associatedItems.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No content items linked to this campaign yet.
                      </p>
                    ) : (
                      associatedItems.map(item => (
                        <div
                          key={item.id}
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50/40 border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-slate-800 truncate mr-2">
                            {item.topic}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {item.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modular Campaign Modal */}
      <CampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaignToEdit={campaignToEdit}
      />

      {/* Delete Campaign Confirmation Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="p-2.5 rounded-xl bg-red-50 text-red-600 shrink-0">
                <Trash2 size={20} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Campaign</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to delete campaign <span className="font-bold text-slate-900">"{campaignToDelete.name}"</span>?
                  Content items linked to this campaign will be preserved, but their campaign association will be cleared.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCampaignToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCampaign}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
