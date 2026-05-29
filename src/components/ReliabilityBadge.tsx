import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Shield } from 'lucide-react';

interface Props {
  userId: string;
  compact?: boolean;
}

export function ReliabilityBadge({ userId, compact = false }: Props) {
  const stats = useQuery(api.surgeRatings.getStats, { user_id: userId });

  if (!stats || stats.total_ratings === 0) return null;

  const score = stats.reliability_avg;
  const color = score >= 4 ? 'text-green-400' : score >= 3 ? 'text-yellow-400' : 'text-red-400';
  const bgColor = score >= 4 ? 'bg-green-900/30 border-green-700/50' : score >= 3 ? 'bg-yellow-900/30 border-yellow-700/50' : 'bg-red-900/30 border-red-700/50';

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
        <Shield size={12} /> {score.toFixed(1)}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${bgColor}`}>
      <Shield size={16} className={color} />
      <div>
        <p className={`text-sm font-semibold ${color}`}>{score.toFixed(1)} / 5</p>
        <p className="text-gray-500 text-xs">{stats.total_ratings} rating{stats.total_ratings !== 1 ? 's' : ''}</p>
      </div>
    </div>
  );
}
