import React from 'react';
import { useMarketing } from '../context/MarketingContext';
import { BrandId } from '../types';

interface BrandBadgeProps {
  brandId: BrandId;
  size?: 'sm' | 'md';
  variant?: 'badge' | 'indicator';
  compact?: boolean;
}

export const BrandBadge: React.FC<BrandBadgeProps> = ({
  brandId,
  size = 'md',
  variant = 'badge',
  compact = false,
}) => {
  const { brands } = useMarketing();
  const brand = brands.find(b => b.id === brandId);

  // Fallback defaults if brand not yet loaded or legacy id
  const name = brand?.name || (brandId === 'the-professor' ? 'The Professor' : brandId === 'profacto' ? 'Profacto' : brandId);
  const code = brand?.code || (brandId === 'the-professor' ? 'PROF' : brandId === 'profacto' ? 'PROFACTO' : brandId.substring(0, 4).toUpperCase());
  const primaryColor = brand?.primaryColor || (brandId === 'the-professor' ? '#059669' : '#4F46E5');

  if (variant === 'indicator') {
    return (
      <span
        title={name}
        className={`inline-block rounded-full shrink-0 ${size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'}`}
        style={{ backgroundColor: primaryColor }}
      />
    );
  }

  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] px-1.5 py-0.2 font-semibold'
      : 'text-xs px-2 py-0.5 font-medium';

  const displayText = compact || size === 'sm' ? code : name;

  return (
    <span
      title={name}
      className={`inline-flex items-center gap-1 rounded border shrink-0 bg-slate-50 text-slate-800 border-slate-200/90 ${sizeClasses}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: primaryColor }}
      />
      <span className="tracking-tight truncate max-w-[120px]">{displayText}</span>
    </span>
  );
};
