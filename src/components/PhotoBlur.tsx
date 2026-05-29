/**
 * PhotoBlur — wraps any photo with a "18+ blur" overlay.
 * Tap to reveal. Shows a warning badge on explicit content.
 */
import React, { useState } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface Props {
  src: string;
  alt?: string;
  className?: string;
  isExplicit?: boolean;
  alwaysShow?: boolean; // for profile owner's own photos
}

export function PhotoBlur({ src, alt = 'Photo', className = '', isExplicit = false, alwaysShow = false }: Props) {
  const [revealed, setRevealed] = useState(alwaysShow || !isExplicit);

  if (!isExplicit || alwaysShow) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ display: 'inline-block' }}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-300 ${revealed ? '' : 'blur-xl scale-105'}`}
      />
      {!revealed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 cursor-pointer"
          onClick={() => setRevealed(true)}>
          <div className="bg-black/70 rounded-2xl px-4 py-3 flex flex-col items-center gap-2">
            <AlertTriangle size={20} className="text-orange-400" />
            <p className="text-white text-xs font-bold text-center">18+ Content</p>
            <div className="flex items-center gap-1 text-purple-300 text-xs font-semibold">
              <Eye size={12} /> Tap to reveal
            </div>
          </div>
        </div>
      )}
      {revealed && (
        <button
          onClick={() => setRevealed(false)}
          className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5 hover:bg-black/80 transition-colors"
        >
          <EyeOff size={12} className="text-white" />
        </button>
      )}
    </div>
  );
}
