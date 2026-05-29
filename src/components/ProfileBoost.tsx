import React from 'react';
import { Rocket } from 'lucide-react';

export function ProfileBoost() {
  return (
    <div className="bg-gray-900 border border-white/8 rounded-2xl p-4 flex items-center gap-3">
      <Rocket size={18} className="text-purple-400" />
      <div>
        <p className="text-white text-sm font-semibold">Profile Boost</p>
        <p className="text-gray-500 text-xs">Coming soon — boost your visibility</p>
      </div>
    </div>
  );
}
