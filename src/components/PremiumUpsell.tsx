import React from 'react';
import { Crown, Zap } from 'lucide-react';

// Simplified: no actual payment flow, just show premium features
export function usePremiumGate() {
  return {
    gate: (cb: () => void) => cb(), // all features unlocked for now
    UpsellModal: null,
  };
}

export function PremiumUpsell() {
  return (
    <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-700/50 rounded-2xl p-4">
      <p className="text-yellow-400 font-bold flex items-center gap-2">
        <Crown size={16} /> Premium Coming Soon
      </p>
      <p className="text-gray-400 text-sm mt-1">All features are currently free!</p>
    </div>
  );
}
