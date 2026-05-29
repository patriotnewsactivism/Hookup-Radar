import React from 'react';
import { SurgeUser } from '../types';
import { Badge } from './ui/SurgeBadge';
import { MapPin, Zap } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  user: SurgeUser;
  onClick: () => void;
  isFavorite?: boolean;
}

function formatDistance(ft: number): string {
  if (ft < 528) return `${ft} ft`;
  const miles = ft / 5280;
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export function UserCard({ user, onClick, isFavorite }: Props) {
  const isRightNow = user.looking_for?.includes('Right Now');

  return (
    <div
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer group bg-gray-900 border border-white/10 hover:border-purple-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-900/30 aspect-[3/4]"
    >
      {/* Photo */}
      {user.photo_url ? (
        <img
          src={user.photo_url}
          alt={user.display_name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
          <span className="text-5xl font-bold text-white/30">
            {(user.display_name || user.username || '?').slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Top badges */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
        {user.is_online ? (
          <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Online</span>
        ) : <span />}
        {isFavorite && <span className="text-lg">❤️</span>}
      </div>

      {/* Right Now pulse */}
      {isRightNow && (
        <div className="absolute top-2 right-2">
          <span className="flex items-center gap-1 bg-red-600/90 backdrop-blur text-white text-xs font-bold px-2 py-0.5 rounded-full">
            <Zap size={10} fill="white" /> NOW
          </span>
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-white font-bold text-base leading-tight">
              {user.is_anonymous ? '🥷 Anonymous' : user.display_name || user.username}
              {user.is_verified && <span className="ml-1 text-blue-400 text-xs">✓</span>}
            </h3>
            <p className="text-gray-300 text-xs">
              {user.age} · {user.position !== 'N/A' ? user.position : user.orientation}
            </p>
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <MapPin size={10} />
            <span>{user.distance ? formatDistance(user.distance) : '—'}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {user.looking_for?.slice(0, 2).map(lf => (
            <Badge key={lf} label={lf} variant={lf === 'Right Now' ? 'pink' : 'purple'} size="sm" />
          ))}
          {user.kinks?.slice(0, 1).map(k => (
            <Badge key={k} label={k} variant="gray" size="sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
