/**
 * GhostBrowse — lets unauthed visitors browse a blurred preview
 * of the grid for up to 10 minutes before requiring signup.
 * Shown on landing page before auth form.
 */
import React, { useEffect, useState } from 'react';
import { Ghost, Zap, ArrowRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface FakeProfile {
  id: string;
  emoji: string;
  label: string;
  tag: string;
  distance: string;
  color: string;
}

const FAKE_PROFILES: FakeProfile[] = [
  { id: '1', emoji: '🔥', label: 'RightNow', tag: 'Top · 28', distance: '0.3 mi', color: 'from-orange-900/40 to-red-900/30' },
  { id: '2', emoji: '⚡', label: 'Available', tag: 'Vers · 32', distance: '0.6 mi', color: 'from-purple-900/40 to-pink-900/30' },
  { id: '3', emoji: '👻', label: 'Ghost Mode', tag: 'Bottom · 25', distance: '0.8 mi', color: 'from-cyan-900/40 to-blue-900/30' },
  { id: '4', emoji: '🌶️', label: 'Kinky', tag: 'Dom · 35', distance: '1.1 mi', color: 'from-rose-900/40 to-orange-900/30' },
  { id: '5', emoji: '💜', label: 'Couple', tag: 'MF · Open', distance: '1.4 mi', color: 'from-violet-900/40 to-purple-900/30' },
  { id: '6', emoji: '🦋', label: 'Bi & Curious', tag: 'Switch · 29', distance: '1.7 mi', color: 'from-pink-900/40 to-rose-900/30' },
];

const GHOST_MINUTES = 10;

interface Props {
  onSignup: () => void;
  onSignin: () => void;
}

export function GhostBrowse({ onSignup, onSignin }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(GHOST_MINUTES * 60);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { setExpired(true); clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="relative">
      {/* Timer bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-950 border-b border-white/5">
        <div className="flex items-center gap-2 text-gray-500 text-xs">
          <Ghost size={12} className="text-purple-400" />
          <span className="text-purple-400 font-semibold">Ghost Preview</span>
          <span>— create an account to see real profiles</span>
        </div>
        {!expired && (
          <span className="text-gray-600 text-xs font-mono">{mins}:{secs.toString().padStart(2, '0')}</span>
        )}
      </div>

      {/* Blurred grid */}
      <div className="relative px-4 py-4 grid grid-cols-2 gap-3">
        {FAKE_PROFILES.map((p, i) => (
          <motion.div key={p.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`bg-gradient-to-br ${p.color} border border-white/8 rounded-2xl p-4 relative overflow-hidden`}
          >
            {/* Blurred avatar */}
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center text-3xl mb-2 filter blur-sm select-none">
              {p.emoji}
            </div>
            <div className="filter blur-[3px] select-none">
              <p className="text-white font-bold text-sm">{p.label}</p>
              <p className="text-gray-400 text-xs">{p.tag}</p>
              <p className="text-gray-600 text-xs mt-1">📍 {p.distance}</p>
            </div>
            {/* Lock overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock size={16} className="text-white/30" />
            </div>
          </motion.div>
        ))}

        {/* Overlay when expired */}
        {expired && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 rounded-xl mx-1 my-1">
            <Ghost size={32} className="text-purple-400" />
            <p className="text-white font-black text-lg text-center">Ghost time's up!</p>
            <p className="text-gray-400 text-sm text-center max-w-xs">
              Create a free account to see who's really nearby
            </p>
            <button onClick={onSignup}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black px-6 py-3 rounded-2xl hover:opacity-90 active:scale-95 transition-all">
              Join Free <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
      </div>

      {/* Persistent CTA at bottom */}
      {!expired && (
        <div className="px-4 pb-5 flex gap-3">
          <button onClick={onSignup}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black py-3.5 rounded-2xl hover:opacity-90 active:scale-95 transition-all text-sm">
            <Zap size={15} fill="white" /> Join Free
          </button>
          <button onClick={onSignin}
            className="flex items-center justify-center gap-2 bg-white/6 border border-white/10 text-gray-400 font-semibold py-3.5 px-5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all text-sm">
            Sign In
          </button>
        </div>
      )}
    </div>
  );
}
