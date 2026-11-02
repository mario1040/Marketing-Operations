import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemTopic: string;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemTopic,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <AlertTriangle size={20} />
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X size={18} />
            </button>
          </div>

          <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-600 mb-3">
            Are you sure you want to permanently delete this content item? This action will remove it from all calendars, planning boards, and reporting.
          </p>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 line-clamp-2">
            "{itemTopic}"
          </div>
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            <span>{isDeleting ? 'Deleting...' : 'Delete Content'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
