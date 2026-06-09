// src/pages/LandingPage.tsx  —  Surge premium landing page
// Snazzy showcase of every unique feature with animations,
// social proof, feature deep-dives, and a compelling CTA flow.

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Zap, MapPin, Shield, Lock, Eye, EyeOff, Check,
  Map, MessageCircle, Star, Users, Flame, Heart,
  ShieldCheck, ArrowRight, ChevronDown, Sparkles,
  Bell, SlidersHorizontal, Trophy, ImageIcon,
  CalendarCheck, UserCheck, Radar
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence, useInView } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────
type Mode = 'landing' | 'signin' | 'signup';

// ── Data ──────────────────────────────────────────────────────
const TAGLINES = [
  'No games. Just now.',
  'Your fantasy. Tonight.',
  'Real people. Real close.',
  'Less swiping. More doing.',
  'All welcome. No judgment.',
];

const STATS = [
  { value: '4.2K', label: 'Active Users',  icon: '🔥' },
  { value: '12K+', label: 'Meetups Made',  icon: '⚡' },
  { value: '94%',  label: 'Real Profiles', icon: '✅' },
  { value: '< 5mi',label: 'Avg Distance',  icon: '📍' },
];

const FEATURES = [
  {
    icon: Radar,
    title: 'Live Radar Map',
    tagline: 'See exactly who's nearby right now',
    desc: 'Real-time GPS map shows verified users around you. Filter by distance, vibe, and what they're into. No guessing — just real people, real close.',
    color: 'from-purple-600 to-violet-800',
    accent: 'text-purple-400',
    badge: '📡 Live',
    preview: (
      <div className="relative h-44 bg-gray-950 rounded-2xl overflow-hidden border border-purple-500/20">
        {/* Fake map grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(#7c3aed22 1px, transparent 1px), linear-gradient(90deg, #7c3aed22 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Pulse rings */}
        {[1,2,3].map(i => (
          <motion.div key={i}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-500"
            initial={{ width: 20, height: 20, opacity: 0.8 }}
            animate={{ width: 20 + i * 50, height: 20 + i * 50, opacity: 0 }}
            transition={{ duration: 2.5, delay: i * 0.7, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50 z-10" />
        {/* User dots */}
        {[
          { top: '25%', left: '30%', color: 'bg-pink-500',   delay: 0 },
          { top: '60%', left: '65%', color: 'bg-cyan-500',   delay: 0.3 },
          { top: '35%', left: '70%', color: 'bg-orange-500', delay: 0.6 },
          { top: '70%', left: '25%', color: 'bg-green-500',  delay: 0.9 },
        ].map((d, i) => (
          <motion.div key={i}
            className={`absolute w-3 h-3 rounded-full ${d.color} shadow-md`}
            style={{ top: d.top, left: d.left }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, delay: d.delay, repeat: Infinity }}
          />
        ))}
        <div className="absolute bottom-3 left-3 text-[10px] text-purple-400 font-mono">
          ⚡ 47 nearby
        </div>
      </div>
    ),
  },
  {
    icon: Flame,
    title: 'Right Now Mode',
    tagline: 'Signal you're available — instantly',
    desc: 'Tap once and your profile pulses at the top of every nearby grid. No awkward waiting. People who are ready now find people who are ready now.',
    color: 'from-red-600 to-orange-700',
    accent: 'text-red-400',
    badge: '🔥 Hot',
    preview: (
      <div className="h-44 bg-gray-950 rounded-2xl border border-red-500/20 overflow-hidden flex items-center justify-center gap-3 px-4">
        {['Alex, 28', 'Jordan, 31', 'Sam, 25'].map((name, i) => (
          <motion.div key={i}
            className="flex-1 bg-gray-900 rounded-xl p-2 border border-red-500/40 text-center"
            animate={{ borderColor: ['rgba(239,68,68,0.4)', 'rgba(239,68,68,0.9)', 'rgba(239,68,68,0.4)'] }}
            transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-800 to-orange-700 mx-auto mb-1 flex items-center justify-center text-lg">
              {['🔥','⚡','💫'][i]}
            </div>
            <p className="text-white text-[10px] font-semibold truncate">{name}</p>
            <p className="text-red-400 text-[9px] mt-0.5">Right Now</p>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    icon: MapPin,
    title: 'Community Spots',
    tagline: 'Find where everyone's actually hanging',
    desc: 'User-submitted venues, parks, bars, and more. Each Spot has its own group chat, event board, and live attendee count. Discover the scene before you go.',
    color: 'from-orange-600 to-amber-700',
    accent: 'text-orange-400',
    badge: '📍 Local',
    preview: (
      <div className="h-44 bg-gray-950 rounded-2xl border border-orange-500/20 overflow-hidden p-3 space-y-2">
        {[
          { name: 'The Eagle', cat: 'Bar', count: 12, hot: true },
          { name: 'Riverside Park', cat: 'Outdoor', count: 7, hot: false },
          { name: 'Club Onyx', cat: 'Club', count: 23, hot: true },
        ].map((spot, i) => (
          <motion.div key={i}
            className="flex items-center gap-2 bg-gray-900 rounded-xl px-3 py-2 border border-white/5"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
          >
            <div className="w-7 h-7 rounded-lg bg-orange-900/50 flex items-center justify-center text-sm flex-shrink-0">
              {['🍺','🌿','🎵'][i]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{spot.name}</p>
              <p className="text-gray-500 text-[10px]">{spot.cat}</p>
            </div>
            <div className="flex items-center gap-1">
              {spot.hot && <span className="text-[9px] bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded-full">hot</span>}
              <span className="text-orange-400 text-[10px] font-bold">{spot.count} here</span>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    icon: MessageCircle,
    title: 'Unrestricted Chat',
    tagline: 'Talk freely — no paywall, no censorship',
    desc: 'Send messages, photos, and videos with no limits. Reply to specific messages, see read receipts, and keep your conversations private with optional auto-delete.',
    color: 'from-pink-600 to-rose-700',
    accent: 'text-pink-400',
    badge: '💬 Free',
    preview: (
      <div className="h-44 bg-gray-950 rounded-2xl border border-pink-500/20 overflow-hidden p-3 flex flex-col justify-end gap-1.5">
        {[
          { text: 'hey, you nearby?', mine: false, delay: 0 },
          { text: 'yeah like 0.8mi away 👀', mine: true, delay: 0.3 },
          { text: 'omw to the spot on maple', mine: false, delay: 0.6 },
          { text: '⚡ see you in 10', mine: true, delay: 0.9 },
        ].map((msg, i) => (
          <motion.div key={i}
            className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: msg.delay }}
          >
            <span className={`text-[11px] px-3 py-1.5 rounded-2xl max-w-[75%] ${
              msg.mine
                ? 'bg-purple-700 text-white rounded-br-sm'
                : 'bg-gray-800 text-gray-200 rounded-bl-sm'
            }`}>
              {msg.text}
            </span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    icon: ShieldCheck,
    title: 'SafeWord System',
    tagline: 'Your safety net, always one tap away',
    desc: 'Set a trusted contact before you meet up. If anything feels off, one tap sends them your location and a discreet alert. Built-in, not bolted on.',
    color: 'from-green-600 to-emerald-700',
    accent: 'text-green-400',
    badge: '🛡️ Safe',
    preview: (
      <div className="h-44 bg-gray-950 rounded-2xl border border-green-500/20 overflow-hidden flex flex-col items-center justify-center gap-3 px-6">
        <motion.div
          className="w-16 h-16 rounded-2xl bg-green-950/60 border-2 border-green-600/60 flex items-center justify-center"
          animate={{ boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 20px rgba(34,197,94,0.4)', '0 0 0px rgba(34,197,94,0)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ShieldCheck className="w-8 h-8 text-green-400" />
        </motion.div>
        <div className="text-center">
          <p className="text-white text-sm font-semibold">SafeWord Active</p>
          <p className="text-gray-500 text-xs mt-0.5">Safe contact: Taylor ✓</p>
        </div>
        <div className="w-full bg-green-950/40 border border-green-700/30 rounded-xl px-3 py-2 text-[10px] text-green-400 text-center">
          🟢 Check-in sent at 11:42 PM
        </div>
      </div>
    ),
  },
  {
    icon: Star,
    title: 'Trust Ratings',
    tagline: 'Real scores from real meetups',
    desc: 'After meeting, rate reliability and vibe. Verified profiles earn badges. Flakes get weeded out. The community polices itself — so you know who to trust.',
    color: 'from-yellow-600 to-amber-600',
    accent: 'text-yellow-400',
    badge: '⭐ Verified',
    preview: (
      <div className="h-44 bg-gray-950 rounded-2xl border border-yellow-500/20 overflow-hidden p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-700 to-orange-800 flex items-center justify-center text-lg">😎</div>
          <div>
            <p className="text-white text-sm font-semibold">Marcus, 29</p>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => (
                <motion.span key={s} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: s * 0.1 }}>
                  <Star className={`w-3 h-3 ${s <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                </motion.span>
              ))}
              <span className="text-gray-500 text-[10px] ml-1">4.2</span>
            </div>
          </div>
          <div className="ml-auto">
            <span className="text-[10px] bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full border border-blue-700/30">✓ Verified</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {[{ label: 'Reliability', val: 90 }, { label: 'Vibe', val: 82 }].map(m => (
            <div key={m.label}>
              <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                <span>{m.label}</span><span className="text-yellow-400">{m.val}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${m.val}%` }} transition={{ duration: 1, delay: 0.5 }} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          {['showed up', 'chill vibes', 'as advertised'].map(t => (
            <span key={t} className="text-[9px] bg-yellow-950/40 text-yellow-500 border border-yellow-800/30 px-1.5 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: SlidersHorizontal,
    title: 'Deep Filters',
    tagline: 'Find exactly your type — not everyone's',
    desc: 'Filter by orientation, gender, body type, ethnicity, kinks, what they're looking for, distance, age, and online status. The most detailed search on any hookup platform.',
    color: 'from-cyan-600 to-sky-700',
    accent: 'text-cyan-400',
    badge: '🎛️ Smart',
    preview: (
      <div className="h-44 bg-gray-950 rounded-2xl border border-cyan-500/20 overflow-hidden p-3 space-y-2">
        {[
          { label: 'Online Only', active: true, color: 'bg-green-700 border-green-500 text-white' },
          { label: 'Distance: 2.0 mi', active: true, color: 'bg-cyan-800 border-cyan-500 text-white' },
          { label: 'Age: 25–40', active: true, color: 'bg-cyan-800 border-cyan-500 text-white' },
        ].map((f, i) => (
          <motion.div key={i}
            className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${f.color}`}
            initial={{ x: -15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.12 }}
          >
            <span>{f.label}</span>
            <Check className="w-3.5 h-3.5" />
          </motion.div>
        ))}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {['Athletic', 'Masc', 'Right Now', 'Verified ✓'].map((tag, i) => (
            <motion.span key={tag}
              className="text-[10px] bg-purple-900/50 border border-purple-600/40 text-purple-300 px-2 py-0.5 rounded-full"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.1 }}
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    tagline: 'Know when it matters, not every second',
    desc: 'Get pinged when someone views your profile, when a match comes online nearby, or when a new event drops at your favorite Spot. Intelligent, not spammy.',
    color: 'from-violet-600 to-purple-800',
    accent: 'text-violet-400',
    badge: '🔔 Smart',
    preview: (
      <div className="h-44 bg-gray-950 rounded-2xl border border-violet-500/20 overflow-hidden p-3 space-y-2">
        {[
          { icon: '👀', title: 'Someone checked you out', time: 'just now', color: 'text-cyan-400' },
          { icon: '⚡', title: 'Alex is 0.4mi away now', time: '2m ago', color: 'text-green-400' },
          { icon: '🎉', title: 'New event at The Eagle', time: '5m ago', color: 'text-orange-400' },
        ].map((n, i) => (
          <motion.div key={i}
            className="flex items-center gap-2.5 bg-gray-900 rounded-xl px-3 py-2 border border-white/5"
            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.2 }}
          >
            <span className="text-base flex-shrink-0">{n.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium truncate ${n.color}`}>{n.title}</p>
              <p className="text-[10px] text-gray-600">{n.time}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
          </motion.div>
        ))}
      </div>
    ),
  },
];

const TESTIMONIALS = [
  { handle: '@anon_atl', text: 'Met 3 people in my first week. This thing actually works 😭', emoji: '🔥' },
  { handle: '@hustle_chi', text: 'SafeWord feature alone makes this worth it. Finally an app that gets safety.', emoji: '🛡️' },
  { handle: '@nocturnalnyc', text: 'The Spots section is insane — found a whole scene I didn't know existed', emoji: '⚡' },
  { handle: '@verified_vibes', text: 'Tired of fake profiles elsewhere. The trust ratings here are real.', emoji: '✅' },
];

// ── Fade-in section wrapper ───────────────────────────────────
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

// ── Auth Form ─────────────────────────────────────────────────
function AuthForm({ mode, onModeChange }: { mode: 'signin' | 'signup'; onModeChange: (m: Mode) => void }) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        toast.success('Welcome back ⚡');
      } else {
        if (password.length < 6) { toast.error('Password must be 6+ chars'); setLoading(false); return; }
        await signUp(email, password);
        toast.success('Account created! ⚡');
      }
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="bg-gray-950/80 backdrop-blur border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl">
        <div className="text-center">
          <h2 className="text-white text-2xl font-black">{mode === 'signup' ? 'Join Surge' : 'Sign In'}</h2>
          <p className="text-gray-500 text-sm mt-1">{mode === 'signup' ? 'Free. No credit card.' : 'Good to see you ⚡'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email" placeholder="Email address" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-900 border border-white/20 text-white placeholder-gray-600 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-white/20 text-white placeholder-gray-600 rounded-2xl px-4 py-3.5 pr-12 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button type="button" onClick={() => setShowPw((p) => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3.5 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
            {loading
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <>{mode === 'signup' ? 'Create Account' : 'Sign In'} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="text-center space-y-2">
          {mode === 'signin' ? (
            <button onClick={() => onModeChange('signup')} className="text-purple-400 text-sm hover:underline">
              Don't have an account? <span className="font-semibold">Sign up free</span>
            </button>
          ) : (
            <button onClick={() => onModeChange('signin')} className="text-gray-500 text-sm hover:text-white">
              Already have an account? Sign in
            </button>
          )}
          <button onClick={() => onModeChange('landing')} className="text-gray-700 text-xs block w-full hover:text-gray-500 transition-colors">
            ← Back to home
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────
export function LandingPage() {
  const [mode, setMode]     = useState<Mode>('landing');
  const [tagIdx, setTagIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTagIdx((i) => (i + 1) % TAGLINES.length), 3000);
    return () => clearInterval(iv);
  }, []);

  if (mode !== 'landing') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-8">
        <div className="mb-8 flex items-center gap-2 cursor-pointer" onClick={() => setMode('landing')}>
          <Zap className="w-6 h-6 text-purple-400" />
          <span className="text-white font-black text-2xl tracking-tight">SURGE</span>
        </div>
        <AuthForm mode={mode} onModeChange={setMode} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 overflow-hidden">

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-pink-900/15 rounded-full blur-[100px]" />
        </div>

        {/* Grid bg */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="relative z-10 text-center max-w-lg w-full"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <span className="text-white font-black text-4xl tracking-tight">SURGE</span>
          </div>

          {/* Rotating tagline */}
          <div className="h-10 mb-4 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p key={tagIdx}
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
              >
                {TAGLINES[tagIdx]}
              </motion.p>
            </AnimatePresence>
          </div>

          <p className="text-gray-400 text-base mb-8 leading-relaxed">
            The hookup app built for real people who want real connections — tonight, nearby, on your terms.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mb-8">
            {STATS.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-gray-900/60 border border-white/8 rounded-2xl p-2 text-center"
              >
                <div className="text-lg">{s.icon}</div>
                <div className="text-white font-black text-sm">{s.value}</div>
                <div className="text-gray-600 text-[9px] leading-tight">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="space-y-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setMode('signup')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-2xl text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40"
            >
              <Zap className="w-5 h-5" /> Get Started Free
            </motion.button>
            <button onClick={() => setMode('signin')}
              className="w-full bg-gray-900/80 border border-white/10 text-white font-semibold py-3.5 rounded-2xl hover:border-purple-500/60 transition-colors">
              Sign In
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-6 text-gray-600 text-xs">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> E2E Encrypted</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> No Data Selling</span>
            <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> 18+ Only</span>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-700 flex flex-col items-center gap-1"
          animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-[10px] uppercase tracking-widest">See features</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </section>

      {/* ── FEATURES DEEP DIVE ─────────────────────────────── */}
      <section className="px-4 py-16 max-w-lg mx-auto space-y-6">
        <FadeIn>
          <div className="text-center mb-10">
            <span className="text-xs text-purple-400 font-semibold uppercase tracking-widest">What makes us different</span>
            <h2 className="text-white text-3xl font-black mt-2">Built for the real thing</h2>
            <p className="text-gray-500 text-sm mt-2">Every feature designed to get you from app to IRL, faster.</p>
          </div>
        </FadeIn>

        {FEATURES.map((f, i) => (
          <FadeIn key={f.title} delay={0.05}>
            <div className="bg-gray-950/60 border border-white/8 rounded-3xl overflow-hidden">
              {/* Feature header */}
              <div className={`bg-gradient-to-r ${f.color} p-5`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <f.icon className="w-5 h-5 text-white" />
                    <h3 className="text-white font-black text-lg">{f.title}</h3>
                  </div>
                  <span className="text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-full font-semibold">
                    {f.badge}
                  </span>
                </div>
                <p className="text-white/80 text-sm font-medium">{f.tagline}</p>
              </div>

              {/* Live preview */}
              <div className="px-4 pt-4">
                {f.preview}
              </div>

              {/* Description */}
              <div className="px-4 pb-4 pt-3">
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section className="px-4 py-16 max-w-lg mx-auto">
        <FadeIn>
          <div className="text-center mb-10">
            <span className="text-xs text-pink-400 font-semibold uppercase tracking-widest">Simple as that</span>
            <h2 className="text-white text-3xl font-black mt-2">From signup to meetup</h2>
          </div>
        </FadeIn>

        <div className="space-y-4">
          {[
            { num: '01', icon: '⚡', title: 'Create your profile', desc: 'Sign up free, add your photos, and tell people what you\'re into. Takes 3 minutes.' },
            { num: '02', icon: '📡', title: 'See who\'s nearby', desc: 'Open the map or grid. Real people, real distance, right now.' },
            { num: '03', icon: '💬', title: 'Connect & meet', desc: 'Message freely, find a Spot, and make it happen. No paywalls.' },
          ].map((step, i) => (
            <FadeIn key={step.num} delay={i * 0.1}>
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-white/10 flex items-center justify-center flex-shrink-0 text-xl">
                  {step.icon}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-gray-600 font-mono">{step.num}</span>
                    <h4 className="text-white font-bold">{step.title}</h4>
                  </div>
                  <p className="text-gray-500 text-sm">{step.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────── */}
      <section className="px-4 py-16 max-w-lg mx-auto">
        <FadeIn>
          <div className="text-center mb-8">
            <span className="text-xs text-cyan-400 font-semibold uppercase tracking-widest">Word on the street</span>
            <h2 className="text-white text-3xl font-black mt-2">People are surging</h2>
          </div>
        </FadeIn>

        <div className="space-y-3">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.handle} delay={i * 0.08}>
              <div className="bg-gray-900/60 border border-white/8 rounded-2xl px-4 py-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-lg flex-shrink-0">
                  {t.emoji}
                </div>
                <div>
                  <p className="text-white text-sm leading-relaxed">"{t.text}"</p>
                  <p className="text-gray-600 text-xs mt-1">{t.handle}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────────── */}
      <section className="px-4 py-16 max-w-lg mx-auto">
        <FadeIn>
          <div className="relative bg-gradient-to-br from-purple-950/80 to-pink-950/60 border border-purple-500/20 rounded-3xl p-8 text-center overflow-hidden">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 pointer-events-none" />

            <div className="relative z-10">
              <div className="text-4xl mb-4">⚡</div>
              <h2 className="text-white text-2xl font-black mb-2">Ready to surge?</h2>
              <p className="text-gray-400 text-sm mb-6">Free forever. No credit card. Just show up.</p>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode('signup')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-2xl text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50 mb-3"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </motion.button>

              <button onClick={() => setMode('signin')}
                className="text-gray-500 text-sm hover:text-white transition-colors">
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-purple-400" />
          <span className="text-white font-black tracking-tight">SURGE</span>
        </div>
        <p className="text-gray-700 text-xs">© 2025 Surge · 18+ Only · All rights reserved</p>
        <div className="flex items-center justify-center gap-4 mt-3 text-gray-700 text-xs">
          <span>Privacy</span><span>Terms</span><span>Safety</span>
        </div>
      </footer>

    </div>
  );
}
