// ProfileViewsList — "who viewed you".
// Free: last 3 view timestamps with identities masked + upsell.
// Premium: full list with viewer names/avatars.
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { referrals } from '../lib/surgeApi';
import { usePremium } from '../hooks/usePremium';
import { supabase } from '../lib/supabaseClient';
import { Avatar } from './ui/SurgeAvatar';
import { SurgeUser } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { EyeOff } from 'lucide-react';

interface Entry {
  viewed_at: string;
  viewer_id: string;
  viewer?: SurgeUser | null;
}

export function ProfileViewsList({ limit = 30 }: { limit?: number }) {
  const { profile } = useAuth();
  const premium = usePremium();
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const views = await referrals.getMyViewers(limit);
        if (!active) return;

        if (premium.isPremium) {
          const ids = views.map((v) => v.viewer_id);
          const { data: profiles } = await supabase
            .from('surge_users')
            .select('id, display_name, username, photo_url, is_anonymous')
            .in('id', ids);
          const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
          setEntries(views.map((v) => ({ ...v, viewer: byId.get(v.viewer_id) ?? null })));
        } else {
          setEntries(views.map((v) => ({ ...v })));
        }
      } catch {
        setEntries([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [limit, premium.isPremium, profile?.id]);

  if (!entries) {
    return (
      <div className="mt-3 bg-gray-900 rounded-2xl border border-white/5 p-4">
        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="mt-3 bg-gray-900 rounded-2xl border border-white/5 p-4 text-center">
        <p className="text-gray-500 text-sm">No views yet — get out there ⚡</p>
      </div>
    );
  }

  const shown = premium.isPremium ? entries : entries.slice(0, 3);

  return (
    <div className="mt-3 bg-gray-900 rounded-2xl border border-white/5 p-4">
      <p className="text-white text-sm font-bold mb-2">Who's been looking</p>
      <div className="space-y-2">
        {shown.map((e) => (
          <div key={e.viewer_id + e.viewed_at} className="flex items-center gap-3">
            {premium.isPremium && e.viewer ? (
              <>
                <Avatar user={e.viewer as SurgeUser} size="sm" showOnline={false} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">
                    {e.viewer.is_anonymous ? '🥷 Anonymous' : e.viewer.display_name || e.viewer.username}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {formatDistanceToNow(new Date(e.viewed_at), { addSuffix: true })}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <EyeOff size={14} className="text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-sm font-semibold blur-[3px] select-none">viewed you</p>
                  <p className="text-gray-600 text-xs">
                    {formatDistanceToNow(new Date(e.viewed_at), { addSuffix: true })}
                  </p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3">
        {!premium.isPremium && (
          <div className="bg-[var(--bg-muted)] border border-[var(--border-strong)] rounded-xl p-3 text-center">
            <p className="text-[var(--accent-bright)] text-xs font-bold">Unlock identities — free with Premium</p>
            <p className="text-[var(--text-secondary)] text-xs mt-1">Invite a friend and you both get 7 free days.</p>
          </div>
        )}
      </div>
    </div>
  );
}