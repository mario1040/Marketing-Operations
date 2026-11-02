import React from 'react';
import { useMarketing } from '../context/MarketingContext';
import { Layers, Plus } from 'lucide-react';
import { BrandId } from '../types';

interface BrandSelectorProps {
  className?: string;
  onOpenCreateBrand?: () => void;
}

export const BrandSelector: React.FC<BrandSelectorProps> = ({
  className = '',
  onOpenCreateBrand,
}) => {
  const { activeBrandId, setActiveBrandId, brands, content } = useMarketing();

  const totalCount = content.length;

  return (
    <div className={`inline-flex items-center p-1 bg-slate-100/90 rounded-lg border border-slate-200/80 gap-1 overflow-x-auto max-w-full ${className}`}>
      {/* All Brands Tab */}
      <button
        type="button"
        onClick={() => setActiveBrandId('all')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
          activeBrandId === 'all'
            ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
      >
        <Layers size={13} className="shrink-0 text-slate-500" />
        <span>All Brands</span>
        <span
          className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
            activeBrandId === 'all' ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/60 text-slate-500'
          }`}
        >
          {totalCount}
        </span>
      </button>

      {/* Dynamic Brands in this Workspace */}
      {brands.map(b => {
        const isActive = activeBrandId === b.id;
        const brandCount = content.filter(c => c.brandId === b.id).length;

        return (
          <button
            key={b.id}
            type="button"
            onClick={() => setActiveBrandId(b.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: b.primaryColor }}
            />
            <span className="truncate max-w-[120px]">{b.name}</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                isActive ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/60 text-slate-500'
              }`}
            >
              {brandCount}
            </span>
          </button>
        );
      })}

      {onOpenCreateBrand && (
        <button
          type="button"
          onClick={onOpenCreateBrand}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md transition-colors cursor-pointer shrink-0"
          title="Add new brand to this workspace"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
};
