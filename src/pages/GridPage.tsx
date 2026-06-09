// src/pages/GridPage.tsx
// Updated: replaced NotificationBell with NotificationPanel

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNearbyUsers, Filters } from '../hooks/useNearbyUsers';
import { useLocation } from '../hooks/useLocation';
import { UserCard } from '../components/UserCard';
import { UserProfileModal } from '../components/UserProfileModal';
import { FilterPanel } from '../components/FilterPanel';
import { AdCard } from '../components/AdCard';
import { RightNowFeed } from '../components/RightNowFeed';
import { SafeWord } from '../components/SafeWord';
import { NotificationPanel } from '../components/NotificationPanel'; // ← swapped in
import { SurgeUser } from '../types';
import { SlidersHorizontal, RefreshCw, Zap, Shield } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export function GridPage() {
  const { profile } = useAuth();
  const { lat, lng } = useLocation(profile?.id);
  const [filters, setFilters] = useState<Filters>({});
  const { users, loading, refetch } = useNearbyUsers(lat, lng, filters, profile?.orientation);
  const [selectedUser, setSelectedUser] = useState<SurgeUser | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSafeWord, setShowSafeWord] = useState(false);

  const filteredUsers = users.filter(u => {
    if (profile?.blocked_users?.includes(u.id)) return false;
    if (u.id === profile?.id) return false;
    return true;
  });

  const rightNowUsers = filteredUsers.filter(u => u.looking_for?.includes('Right Now'));
  const otherUsers    = filteredUsers.filter(u => !u.looking_for?.includes('Right Now'));

  const insertAds = (arr: SurgeUser[], every = 8) => {
    const result: (SurgeUser | 'ad')[] = [];
    arr.forEach((u, i) => {
      result.push(u);
      if ((i + 1) % every === 0) result.push('ad');
    });
    return result;
  };

  const otherWithAds = insertAds(otherUsers, 8);

  // Count active filters for the badge
  const activeFilterCount = [
    filters.online_only,
    filters.verified_only,
    filters.max_distance,
    filters.min_age || filters.max_age,
    filters.orientation?.length,
    filters.gender?.length,
    filters.looking_for?.length,
    filters.kinks?.length,
    filters.body_type?.length,
    filters.ethnicity?.length,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">

        {/* Brand */}
        <div className="flex items-center gap-1.5 flex-1">
          <Zap className="w-5 h-5 text-purple-400" />
          <span className="text-white font-black text-lg tracking-tight">SURGE</span>
          <span className="text-gray-600 text-xs ml-1">
            {loading ? 'Scanning…' : `${filteredUsers.length} nearby`}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">

          {/* SafeWord panic button */}
          <button
            onClick={() => setShowSafeWord(true)}
            className="p-2 rounded-xl bg-green-950/60 border border-green-800/40 text-green-500 hover:bg-green-900/60 transition-colors"
            title="SafeWord Safety Check-In"
          >
            <Shield className="w-5 h-5" />
          </button>

          {/* Notification panel (replaces NotificationBell) */}
          <NotificationPanel />

          {/* Filters button with active badge */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(true)}
              className={`p-2 rounded-xl border transition-colors ${
                activeFilterCount > 0
                  ? 'bg-purple-900/60 border-purple-500/50 text-purple-300'
                  : 'bg-gray-900/80 border-white/8 text-gray-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
                {activeFilterCount}
              </span>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={refetch}
            className="p-2 rounded-xl bg-gray-900/80 border border-white/8 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Active filter pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 py-2 border-b border-white/5">
          {filters.online_only && (
            <span className="text-xs bg-green-900/40 border border-green-700/40 text-green-400 px-2 py-0.5 rounded-full">🟢 Online</span>
          )}
          {filters.verified_only && (
            <span className="text-xs bg-blue-900/40 border border-blue-700/40 text-blue-400 px-2 py-0.5 rounded-full">✓ Verified</span>
          )}
          {filters.max_distance && (
            <span className="text-xs bg-gray-800 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">
              📍 {(filters.max_distance / 5280).toFixed(1)} mi
            </span>
          )}
          {filters.orientation?.map(o => (
            <span key={o} className="text-xs bg-purple-900/40 border border-purple-700/40 text-purple-300 px-2 py-0.5 rounded-full">{o}</span>
          ))}
          {filters.gender?.map(g => (
            <span key={g} className="text-xs bg-pink-900/40 border border-pink-700/40 text-pink-300 px-2 py-0.5 rounded-full">{g}</span>
          ))}
          {filters.looking_for?.map(lf => (
            <span key={lf} className="text-xs bg-orange-900/40 border border-orange-700/40 text-orange-300 px-2 py-0.5 rounded-full">{lf}</span>
          ))}
          {filters.body_type?.map(bt => (
            <span key={bt} className="text-xs bg-teal-900/40 border border-teal-700/40 text-teal-300 px-2 py-0.5 rounded-full">{bt}</span>
          ))}
          {filters.ethnicity?.map(e => (
            <span key={e} className="text-xs bg-rose-900/40 border border-rose-700/40 text-rose-300 px-2 py-0.5 rounded-full">{e}</span>
          ))}
          {/* Clear all */}
          <button
            onClick={() => setFilters({})}
            className="text-xs text-gray-600 hover:text-gray-400 px-1 transition-colors"
          >
            Clear ×
          </button>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Banner ad (non-premium) */}
        {!profile?.is_premium && <AdCard type="banner" />}

        {/* Right Now live feed */}
        <RightNowFeed users={rightNowUsers} onSelect={setSelectedUser} />

        {/* Right Now section */}
        {rightNowUsers.length > 0 && (
          <div className="px-4 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white font-bold text-sm">Available Now</span>
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{rightNowUsers.length}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {rightNowUsers.map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  onClick={() => setSelectedUser(user)}
                  isFavorite={profile?.favorite_users?.includes(user.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Others nearby */}
        {otherWithAds.length > 0 && (
          <div className="px-4 pt-4 pb-24">
            {rightNowUsers.length > 0 && (
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Others Nearby</p>
            )}
            {(() => {
              const rows: React.ReactNode[] = [];
              let cardBuffer: SurgeUser[] = [];

              const flushBuffer = () => {
                if (cardBuffer.length > 0) {
                  rows.push(
                    <div key={rows.length} className="grid grid-cols-3 gap-2 mb-2">
                      {cardBuffer.map(user => (
                        <UserCard
                          key={user.id}
                          user={user}
                          onClick={() => setSelectedUser(user)}
                          isFavorite={profile?.favorite_users?.includes(user.id)}
                        />
                      ))}
                    </div>
                  );
                  cardBuffer = [];
                }
              };

              otherWithAds.forEach((item) => {
                if (item === 'ad') {
                  flushBuffer();
                  if (!profile?.is_premium) rows.push(<AdCard key={`ad-${rows.length}`} type="inline" />);
                } else {
                  cardBuffer.push(item as SurgeUser);
                }
              });
              flushBuffer();
              return rows;
            })()}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <p className="text-white font-bold mb-2">No one nearby yet</p>
            <p className="text-gray-600 text-sm">
              Surge is growing — share your referral link to bring friends in, or expand your search area in filters
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilters({})}
                className="mt-4 text-purple-400 text-sm underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {selectedUser && (
          <UserProfileModal
            key="profile-modal"
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
        {showFilters && (
          <FilterPanel
            key="filter-panel"
            filters={filters}
            onChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        )}
        {showSafeWord && (
          <SafeWord
            key="safeword"
            onClose={() => setShowSafeWord(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
