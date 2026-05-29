import React from 'react';
import { useNearbyUsers } from '../hooks/useNearbyUsers';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from './ui/SurgeAvatar';
import { SurgeUser } from '../types';
import { MapPin, Zap } from 'lucide-react';

interface Props {
  onSelectUser?: (user: SurgeUser) => void;
}

export function RightNowFeed({ onSelectUser }: Props) {
  const { profile } = useAuth();
  const { users } = useNearbyUsers(profile?.lat ?? 0, profile?.lng ?? 0);

  const rightNowUsers = users.filter(u => u.looking_for?.includes('Right Now') && u.is_online);

  if (rightNowUsers.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={14} className="text-red-400" fill="currentColor" />
        <h3 className="text-white font-bold text-sm">Right Now</h3>
        <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold animate-pulse">
          {rightNowUsers.length}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {rightNowUsers.map(user => (
          <button
            key={user.id}
            onClick={() => onSelectUser?.(user)}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 w-16"
          >
            <div className="relative">
              <Avatar user={user} size="md" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse" />
            </div>
            <span className="text-gray-300 text-xs truncate w-full text-center">
              {user.display_name || user.username}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
