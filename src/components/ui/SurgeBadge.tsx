import React from 'react';
import clsx from 'clsx';

interface Props {
  label: string;
  variant?: 'purple' | 'pink' | 'cyan' | 'green' | 'orange' | 'gray';
  size?: 'sm' | 'md';
  onClick?: () => void;
  active?: boolean;
}

const variants = {
  purple: 'bg-purple-900/60 text-purple-300 border-purple-700',
  pink: 'bg-pink-900/60 text-pink-300 border-pink-700',
  cyan: 'bg-cyan-900/60 text-cyan-300 border-cyan-700',
  green: 'bg-green-900/60 text-green-300 border-green-700',
  orange: 'bg-orange-900/60 text-orange-300 border-orange-700',
  gray: 'bg-gray-800 text-gray-400 border-gray-700',
};

export function Badge({ label, variant = 'purple', size = 'sm', onClick, active }: Props) {
  return (
    <span
      onClick={onClick}
      className={clsx(
        'inline-flex items-center rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variants[variant],
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        active && 'ring-2 ring-white/30'
      )}
    >
      {label}
    </span>
  );
}
