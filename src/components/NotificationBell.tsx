import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import { Bell } from 'lucide-react';

interface Props {
  onClick?: () => void;
}

export function NotificationBell({ onClick }: Props) {
  const { profile } = useAuth();
  const unreadCount = useQuery(
    api.surgeMessages.getUnreadCount,
    profile?.id ? { user_id: profile.id } : "skip"
  );

  const count = unreadCount ?? 0;

  return (
    <button onClick={onClick} className="relative text-gray-400 hover:text-white transition-colors p-2">
      <Bell size={20} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-purple-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
