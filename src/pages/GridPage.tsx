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
import { NotificationBell } from '../components/NotificationBell';
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
  const otherUsers = filteredUsers.filter(u => !u.looking_for?.includes('Right Now'));

  const insertAds = (arr: SurgeUser[], every = 8) => {
    const result: (SurgeUser | 'ad')[] = [];
    arr.forEach((u, i) => {
      result.push(u);
      if ((i + 1) % every === 0) result.push('ad');
    });
    return result;
  };

  const otherWithAds = insertAds(otherUsers, 8);

  return (
    <div className="h-full overflow-y-auto bg-[#080010]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-[#080010]/95 backdrop-blur-xl px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-900/50">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl leading-none tracking-wide">SURGE</h1>
              <p className="text-gray-600 text-[10px]">
                {loading ? 'Scanning…' : `${filteredUsers.length} nearby`}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* SafeWord panic button */}
            <button
              onClick={() => setShowSafeWord(true)}
              className="p-2 rounded-xl bg-green-950/60 border border-green-800/40 text-green-500 hover:bg-green-900/60 transition-colors"
              title="SafeWord Safety Check-In"
            >
              <Shield size={16} />
            </button>
            <NotificationBell />
            <button
              onClick={refetch}
              className="p-2 rounded-xl bg-gray-900/80 border border-white/8 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowFilters(true)}
              className="p-2 rounded-xl bg-gray-900/80 border border-white/8 text-gray-400 hover:text-white transition-colors"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Active filter pills */}
        {(filters.orientation?.length || filters.gender?.length || filters.looking_for?.length || filters.online_only) && (
          <div className="flex flex-wrap gap-1.5">
            {filters.online_only && (
              <span className="bg-green-900/50 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-700/50">🟢 Online</span>
            )}
            {filters.orientation?.map(o => (
              <span key={o} className="bg-purple-900/50 text-purple-400 text-xs px-2 py-0.5 rounded-full border border-purple-700/50">{o}</span>
            ))}
            {filters.gender?.map(g => (
              <span key={g} className="bg-pink-900/50 text-pink-400 text-xs px-2 py-0.5 rounded-full border border-pink-700/50">{g}</span>
            ))}
            {filters.looking_for?.map(lf => (
              <span key={lf} className="bg-orange-900/50 text-orange-400 text-xs px-2 py-0.5 rounded-full border border-orange-700/50">{lf}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="pb-24">
        {/* Banner ad (non-premium) */}
        {!profile?.is_premium && (
          <div className="px-4 pt-4">
            <AdCard type="banner" />
          </div>
        )}

        {/* Right Now live feed */}
        <div className="pt-4 border-b border-white/5 mb-2">
          <RightNowFeed onUserClick={setSelectedUser} />
        </div>

        <div className="px-4 pt-4 space-y-6">
          {/* All nearby users (Right Now highlighted) */}
          {rightNowUsers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-green-500" fill="currentColor" />
                <h2 className="text-white font-black text-sm uppercase tracking-widest">Available Now</h2>
                <span className="bg-green-900/40 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-800/50 font-bold">
                  {rightNowUsers.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
            <div>
              {rightNowUsers.length > 0 && (
                <h2 className="text-gray-600 font-bold text-xs uppercase tracking-widest mb-3">Others Nearby</h2>
              )}
              <div className="space-y-3">
                {(() => {
                  const rows: React.ReactNode[] = [];
                  let cardBuffer: SurgeUser[] = [];
                  const flushBuffer = () => {
                    if (cardBuffer.length > 0) {
                      rows.push(
                        <div key={`row-${rows.length}`} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                  otherWithAds.forEach((item, idx) => {
                    if (item === 'ad') {
                      flushBuffer();
                      if (!profile?.is_premium) rows.push(<AdCard key={`ad-${idx}`} type="card" />);
                    } else {
                      cardBuffer.push(item as SurgeUser);
                    }
                  });
                  flushBuffer();
                  return rows;
                })()}
              </div>
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-3xl flex items-center justify-center mb-4 border border-white/5">
                <span className="text-4xl">⚡</span>
              </div>
              <p className="text-white font-bold text-lg mb-2">No one nearby yet</p>
              <p className="text-gray-600 text-sm max-w-xs">
                Surge is growing — share your referral link to bring friends in, or expand your search area in filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedUser && (
        <UserProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
      {showFilters && (
        <FilterPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
      )}
      <AnimatePresence>
        {showSafeWord && (
          <SafeWord onClose={() => setShowSafeWord(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
