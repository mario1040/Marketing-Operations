import React from 'react';
import { ContentPlatform } from '../types';
import {
  Linkedin,
  Youtube,
  Instagram,
  Globe,
  Share2,
  Video,
  Facebook,
} from 'lucide-react';

interface PlatformIconProps {
  platform: ContentPlatform;
  className?: string;
  size?: number;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({
  platform,
  className = 'w-4 h-4',
  size = 16,
}) => {
  switch (platform) {
    case 'LinkedIn':
      return <Linkedin size={size} className={`text-[#0A66C2] ${className}`} />;
    case 'YouTube':
      return <Youtube size={size} className={`text-[#FF0000] ${className}`} />;
    case 'Instagram':
      return <Instagram size={size} className={`text-[#E4405F] ${className}`} />;
    case 'TikTok':
      // TikTok musical note style
      return (
        <span className={`inline-flex items-center justify-center font-bold text-[11px] text-[#000000] ${className}`}>
          <Video size={size} className="text-pink-600" />
        </span>
      );
    case 'Facebook':
      return <Facebook size={size} className={`text-[#1877F2] ${className}`} />;
    case 'Website / Blog':
      return <Globe size={size} className={`text-emerald-600 ${className}`} />;
    default:
      return <Share2 size={size} className={`text-slate-500 ${className}`} />;
  }
};
