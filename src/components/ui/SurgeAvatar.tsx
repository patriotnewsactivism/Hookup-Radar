import React from 'react';
import { SurgeUser } from '../../types';
import clsx from 'clsx';

interface Props {
  user: SurgeUser;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizes = {
  xs: 'w-8 h-8',
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
};

const dotSizes = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
  xl: 'w-5 h-5',
};

export function Avatar({ user, size = 'md', showOnline = true, className, onClick }: Props) {
  const initials = (user.display_name || user.username || '?').slice(0, 2).toUpperCase();

  return (
    <div
      className={clsx('relative flex-shrink-0', sizes[size], className)}
      onClick={onClick}
    >
      {user.photo_url ? (
        <img
          src={user.photo_url}
          alt={user.display_name}
          className={clsx('w-full h-full object-cover rounded-full', onClick && 'cursor-pointer')}
        />
      ) : (
        <div className={clsx(
          'w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold',
          size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-2xl',
          onClick && 'cursor-pointer'
        )}>
          {initials}
        </div>
      )}
      {showOnline && (
        <span className={clsx(
          'absolute bottom-0 right-0 rounded-full border-2 border-gray-900',
          dotSizes[size],
          user.is_online ? 'bg-green-400' : 'bg-gray-500'
        )} />
      )}
    </div>
  );
}
