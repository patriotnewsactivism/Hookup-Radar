// usePremium — premium status, streak, boost state and Right Now limits.
// Lightweight: backed by the `surge_premium_status` RPC plus the profile
// snapshot; callers use `refresh()` after actions that change state.
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { premium as premiumApi } from '../lib/surgeApi';

export interface PremiumStatus {
  isPremium: boolean;
  premiumUntil?: string;
  currentStreak: number;
  boostExpiresAt?: string;
  boostAvailable: boolean;
  profileComplete: boolean;
  rightNowUsed: number;
  rightNowLimit: number;
}

const EMPTY: PremiumStatus = {
  isPremium: false,
  currentStreak: 0,
  boostAvailable: false,
  profileComplete: false,
  rightNowUsed: 0,
  rightNowLimit: 1,
};

export function usePremium() {
  const { profile } = useAuth();
  const [status, setStatus] = useState<PremiumStatus>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await premiumApi.status();
      setStatus({
        isPremium: result.is_premium,
        premiumUntil: result.premium_until,
        currentStreak: result.current_streak,
        boostExpiresAt: result.boost_expires_at,
        boostAvailable: result.boost_available,
        profileComplete: result.profile_complete,
        rightNowUsed: result.right_now_used,
        rightNowLimit: result.right_now_limit,
      });
    } catch {
      // Fall back to the profile snapshot; RPC will be re-fetched on refresh.
      setStatus({
        isPremium: !!profile?.is_premium,
        currentStreak: profile?.current_streak ?? 0,
        boostExpiresAt: profile?.boost_expires_at || undefined,
        boostAvailable: false,
        profileComplete: false,
        rightNowUsed: 0,
        rightNowLimit: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.is_premium, profile?.current_streak, profile?.boost_expires_at]);

  useEffect(() => {
    if (!profile?.id) return;
    void refresh();
  }, [profile?.id, refresh]);

  return { ...status, loading, refresh };
}