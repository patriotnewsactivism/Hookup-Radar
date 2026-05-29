import React from 'react';
import { Map, Grid, MessageCircle, User, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { AppView } from '../types';

interface Props {
  active: AppView;
  onChange: (v: AppView) => void;
  unreadCount?: number;
}

const tabs = [
  { id: 'map' as AppView, icon: Map, label: 'Map' },
  { id: 'grid' as AppView, icon: Grid, label: 'Explore' },
  { id: 'spots' as AppView, icon: MapPin, label: 'Spots' },
  { id: 'chat-list' as AppView, icon: MessageCircle, label: 'Chats' },
  { id: 'profile' as AppView, icon: User, label: 'Me' },
];

export function BottomNav({ active, onChange, unreadCount = 0 }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-md border-t border-white/10 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = active === id || (id === 'chat-list' && active === 'chat');
          const hasUnread = id === 'chat-list' && unreadCount > 0;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-5 py-2 rounded-2xl transition-all duration-200',
                isActive
                  ? 'text-purple-400 bg-purple-950/50'
                  : 'text-gray-600 hover:text-gray-400'
              )}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {hasUnread && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={clsx('text-xs', isActive ? 'font-bold' : 'font-medium')}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
