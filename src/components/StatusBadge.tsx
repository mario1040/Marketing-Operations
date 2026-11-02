import React from 'react';
import { ContentStatus } from '../types';

interface StatusBadgeProps {
  status: ContentStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const STATUS_STYLES: Record<
  ContentStatus,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  Planned: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
    label: 'Planned',
  },
  'In Production': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-600',
    label: 'In Production',
  },
  Editing: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-600',
    label: 'Editing',
  },
  Approved: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-600',
    label: 'Approved',
  },
  Scheduled: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    dot: 'bg-cyan-600',
    label: 'Scheduled',
  },
  Published: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-700',
    label: 'Published',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
}) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Planned;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />}
      <span className="truncate">{style.label}</span>
    </span>
  );
};
