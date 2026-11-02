import React from 'react';
import { useMarketing } from '../context/MarketingContext';
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Clock,
  User,
} from 'lucide-react';
import { STATUS_ORDER, STATUS_CONFIG } from '../utils/metrics';
import { StatusBadge } from '../components/StatusBadge';
import { BrandBadge } from '../components/BrandBadge';
import { PlatformIcon } from '../components/PlatformIcon';
import { ContentStatus, ContentItem } from '../types';

export const ProductionView: React.FC = () => {
  const {
    filteredContent,
    openEditModal,
    openCreateModal,
    updateContentStatus,
  } = useMarketing();

  const handleMoveForward = async (e: React.MouseEvent, item: ContentItem) => {
    e.stopPropagation();
    const currIdx = STATUS_ORDER.indexOf(item.status);
    if (currIdx < STATUS_ORDER.length - 1) {
      const nextStatus = STATUS_ORDER[currIdx + 1];
      await updateContentStatus(item.id, nextStatus);
    }
  };

  const handleMoveBackward = async (e: React.MouseEvent, item: ContentItem) => {
    e.stopPropagation();
    const currIdx = STATUS_ORDER.indexOf(item.status);
    if (currIdx > 0) {
      const prevStatus = STATUS_ORDER[currIdx - 1];
      await updateContentStatus(item.id, prevStatus);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Content Production Pipeline
          </h3>
          <p className="text-xs text-slate-500">
            Multi-stage workflow: Planned → In Production → Editing → Approved → Scheduled → Published
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>New Deliverable</span>
        </button>
      </div>

      {/* Kanban Board 6 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
        {STATUS_ORDER.map((status, colIdx) => {
          const config = STATUS_CONFIG[status];
          const colItems = filteredContent.filter(c => c.status === status);

          return (
            <div
              key={status}
              className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3 flex flex-col min-h-[540px] shadow-2xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: config.hex }}
                  />
                  <h4 className="text-xs font-bold text-slate-900">{status}</h4>
                </div>
                <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">
                  {colItems.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[640px] pr-0.5">
                {colItems.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No items in {status}
                  </div>
                ) : (
                  colItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => openEditModal(item)}
                      className="p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer group space-y-2"
                    >
                      {/* Brand & Platform */}
                      <div className="flex items-center justify-between gap-1">
                        <BrandBadge brandId={item.brandId} size="sm" />
                        <div className="flex items-center gap-1">
                          <PlatformIcon platform={item.platform} size={13} />
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.scheduledPublishingDate.slice(5)}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h5 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                        {item.topic}
                      </h5>

                      {/* Caption excerpt or Brief */}
                      {(item.caption || item.contentBrief) && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {item.caption || item.contentBrief}
                        </p>
                      )}

                      {/* Creative Link indicator */}
                      {item.creativeUrl && (
                        <a
                          href={item.creativeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:underline font-medium"
                        >
                          <ExternalLink size={10} />
                          <span>Asset Ref</span>
                        </a>
                      )}

                      {/* Footer: Assignee & Stage Transitions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate max-w-[90px] font-medium text-slate-600">
                          {item.responsiblePerson.split(' ')[0]}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Move Backward */}
                          {colIdx > 0 && (
                            <button
                              type="button"
                              onClick={e => handleMoveBackward(e, item)}
                              title={`Revise: Move back to ${STATUS_ORDER[colIdx - 1]}`}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              <ArrowLeft size={12} />
                            </button>
                          )}
                          {/* Move Forward */}
                          {colIdx < STATUS_ORDER.length - 1 && (
                            <button
                              type="button"
                              onClick={e => handleMoveForward(e, item)}
                              title={`Advance: Move to ${STATUS_ORDER[colIdx + 1]}`}
                              className="p-1 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Column Quick Add */}
              <button
                type="button"
                onClick={() => openCreateModal()}
                className="mt-2 w-full py-1.5 text-[11px] font-medium text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg border border-dashed border-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Plus size={12} />
                <span>Add Item</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
