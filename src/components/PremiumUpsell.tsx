// PremiumGate — real premium gate + upsell.
// usePremiumGate gates an action: premium users run it, free users get a
// toast + the upsell panel is surfaced via an optional onUpsell callback.
import React from 'react';
import { usePremium } from '../hooks/usePremium';
import { Crown, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { ReactNode } from 'react';

export function usePremiumGate() {
  const premium = usePremium();

  return {
    ...premium,
    gate: (cb: () => void, upsell?: () => void) => {
      if (premium.isPremium) {
        cb();
        return true;
      }
      toast('Premium feature', {
        description: 'Invite friends to earn free Premium days — no card needed.',
      });
      upsell?.();
      return false;
    },
    UpsellModal: PremiumGate,
  };
}

/** Wrap premium-only content; free users see the upsell CTA instead. */
export function PremiumGate({ children, compact = false }: { children?: ReactNode; compact?: boolean }) {
  const premium = usePremium();

  if (premium.isPremium) {
    return <>{children}</>;
  }

  if (compact) {
    return (
      <div className="bg-[var(--bg-muted)] border border-[var(--border-strong)] rounded-2xl p-4">
        <p className="text-[var(--accent-bright)] font-bold flex items-center gap-2">
          <Crown size={16} /> Premium feature
        </p>
        <p className="text-[var(--text-secondary)] text-xs mt-1 leading-relaxed">
          Unlock with free Premium — invite a friend and you both get 7 days.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[rgba(212,168,67,0.14)] to-[rgba(212,168,67,0.05)] border border-[var(--border-strong)] rounded-2xl p-5 text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--accent)] flex items-center justify-center mb-3">
        <Crown size={22} className="text-[#050c1a]" />
      </div>
      <p className="text-white font-black">Unlock this Premium feature</p>
      <p className="text-[var(--text-secondary)] text-xs mt-1 mb-4 leading-relaxed">
        Invite friends to earn Premium days free — shared links credit you the
        moment a friend joins. No credit card.
      </p>
      <span className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl" style={{ background: 'var(--accent)', color: '#050c1a' }}>
        <Zap size={12} /> Earn Premium free
      </span>
    </div>
  );
}

export function PremiumUpsell() {
  return <PremiumGate compact />;
}