import React from 'react';
import { useMarketing } from '../context/MarketingContext';
import { BrandSelector } from './BrandSelector';
import {
  Plus,
  Download,
  BookOpen,
  Menu,
  Building2,
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  openUserGuide: () => void;
  onOpenCreateBrand?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  openUserGuide,
  onOpenCreateBrand,
}) => {
  const {
    openCreateModal,
    exportToCsv,
    exportToJson,
    activeWorkspace,
    activeBrandId,
    brands,
  } = useMarketing();

  const selectedBrand = brands.find(b => b.id === activeBrandId);

  const brandTitle =
    activeBrandId === 'all'
      ? `${activeWorkspace?.name || 'Workspace'} (All Brands)`
      : selectedBrand?.name || 'Brand Workspace';

  const brandSubtitle =
    activeBrandId === 'all'
      ? `${activeWorkspace?.type || 'Workspace'} • ${activeWorkspace?.industry || 'Multi-channel marketing'}`
      : selectedBrand?.tagline || selectedBrand?.description || 'Operational execution workspace';

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={20} />
          </button>
        )}

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
              {brandTitle}
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block truncate max-w-md mt-0.5">
            {brandSubtitle}
          </p>
        </div>
      </div>

      {/* Brand Selector & Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Prominent Brand Switcher */}
        <div className="hidden lg:block">
          <BrandSelector onOpenCreateBrand={onOpenCreateBrand} />
        </div>

        {/* SOP Guide Button */}
        <button
          type="button"
          onClick={openUserGuide}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          title="Open Operating Procedure & User Guide"
        >
          <BookOpen size={14} className="text-indigo-600" />
          <span>SOP Guide</span>
        </button>

        {/* Export Dropdown / Buttons */}
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
          <button
            type="button"
            onClick={exportToCsv}
            title="Export filtered content to CSV"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-r border-slate-200"
          >
            <Download size={13} className="text-slate-500" />
            <span className="hidden md:inline">CSV</span>
          </button>
          <button
            type="button"
            onClick={exportToJson}
            title="Export filtered content to JSON"
            className="px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="hidden md:inline">JSON</span>
          </button>
        </div>

        {/* Primary New Content Action */}
        <button
          type="button"
          onClick={() => openCreateModal()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">New Content</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
    </header>
  );
};
