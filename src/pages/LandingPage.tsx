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
  CalendarCheck, UserCheck, Radar, Crown, Gift,
  Rocket, BadgeCheck, HelpCircle, Award, PartyPopper
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

const FEATURES = [
  {
    icon: Radar,
    title: 'Live Radar Map',
    tagline: `See exactly who's nearby right now`,
    desc: `Real-time GPS map shows verified users around you. Filter by distance, vibe, and what they're into. No guessing — just real people, real close.`,
    color: 'from-[var(--accent)] to-[var(--accent-muted)]',
    accent: 'text-[var(--accent)]',
    badge: '📡 Live',
    preview: (
      <div className="relative h-44 bg-gray-950 rounded-2xl overflow-hidden border border-[rgba(212,168,67,0.16)]">
        {/* Fake map grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(212,168,67,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,67,0.22) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
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
    tagline: `Signal you're available — instantly`,
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
    tagline: `Find where everyone's actually hanging`,
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
    color: 'from-[var(--accent)] to-[var(--accent-muted)]',
    accent: 'text-[var(--accent)]',
    badge: '💬 Free',
    preview: (
      <div className="h-44 bg-gray-950 rounded-2xl border border-[rgba(212,168,67,0.16)] overflow-hidden p-3 flex flex-col justify-end gap-1.5">
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
    tagline: `Find exactly your type — not everyone's`,
    desc: `Filter by orientation, gender, body type, ethnicity, kinks, what they're looking for, distance, age, and online status. The most detailed search on any hookup platform.`,
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
    color: 'from-[var(--accent)] to-[var(--accent-muted)]',
    accent: 'text-[var(--accent-bright)]',
    badge: '🔔 Smart',
    preview: (
      <div className="h-44 bg-gray-950 rounded-2xl border border-[rgba(212,168,67,0.16)] overflow-hidden p-3 space-y-2">
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
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0" />
          </motion.div>
        ))}
      </div>
    ),
  },
];

const TESTIMONIALS = [
  { handle: '@anon_atl', text: 'Met 3 people in my first week. This thing actually works 😭', emoji: '🔥' },
  { handle: '@hustle_chi', text: 'SafeWord feature alone makes this worth it. Finally an app that gets safety.', emoji: '🛡️' },
  { handle: '@nocturnalnyc', text: `The Spots section is insane — found a whole scene I didn't know existed`, emoji: '⚡' },
  { handle: '@verified_vibes', text: 'Tired of fake profiles elsewhere. The trust ratings here are real.', emoji: '✅' },
  { handle: '@uptown_dan', text: 'Invite rewards are free Premium days. I have 2 months stacked and never paid.', emoji: '👑' },
  { handle: '@thursday_girl', text: 'Right Now mode is dangerous tbh — my phone has not stopped buzzing since I turned it on', emoji: '🔥' },
];

// Ways to earn Premium — free, forever.
const EARN_PREMIUM = [
  { icon: '💌', title: 'Each invite you send', reward: '+1 day', desc: 'Copy your link, share it anywhere. Up to 10 invites a day, each worth a free Premium day.' },
  { icon: '🤝', title: 'Friend joins with your code', reward: '+7 days to you, +7 to them', desc: 'The instant your friend signs up with your code, you both unlock a full week of Premium.' },
  { icon: '🏆', title: 'Friend sticks around 30 days', reward: '+30 days & the Rebel badge', desc: 'Friends who stay active a month cash you out with 30 more days plus a badge to flex.' },
  { icon: '🔥', title: 'Daily streaks', reward: 'Up to +7 days', desc: 'Open Surge daily — hit 3, 7, 14, and 30-day streaks to stack free Premium.' },
  { icon: '📧', title: 'Verify your email', reward: '+1 day', desc: 'Confirm your email once and pocket a free day. Takes 10 seconds.' },
  { icon: '📸', title: 'Complete your profile', reward: '+3 days', desc: 'Photo + bio + what you\'re looking for = 3 free days. Profiles with photos get 10× more views anyway.' },
];

const PREMIUM_PERKS = [
  { icon: Eye, title: 'See Who Viewed You', desc: 'Every profile view with names and photos. Never wonder again.' },
  { icon: Rocket, title: 'Profile Boosts', desc: 'Pin your profile to the top of every nearby feed for 12 hours.' },
  { icon: Crown, title: '5× Right Now activations', desc: 'Free users get one Right Now signal per day. Premium gets five.' },
  { icon: SlidersHorizontal, title: 'Deep Filters', desc: 'Unlock advanced search — body type, kinks, vibe, and more.' },
  { icon: Shield, title: 'Incognito Browsing', desc: 'See profiles without leaving your own footprint.' },
  { icon: Sparkles, title: 'Ad-Free', desc: 'No banners, no promoted cards. Just people.' },
];

const STATS = [
  { value: '4.2K+', label: 'Active members', icon: '🔥' },
  { value: '12K+', label: 'Meetups made', icon: '⚡' },
  { value: '94%', label: 'Show up', icon: '✅' },
  { value: '< 5 mi', label: 'Average distance', icon: '📍' },
  { value: '0', label: 'Fake profiles', icon: '🚫' },
  { value: '100%', label: 'Free to start', icon: '💸' },
];

const FAQS = [
  { q: 'Is Surge really free?', a: 'Yes. Signing up, browsing, matching, and chatting are 100% free. Premium exists as free streaks — you earn days by inviting friends, verifying your email, completing your profile, and opening the app daily.' },
  { q: 'How does the referral reward work?', a: 'Send your invite link, and every friend who creates an account through it credits you +1 day instantly. When they join with your code you both get +7 days. If they stick around 30 days, you bank +30 days and the Rebel badge.' },
  { q: 'How do you stop fake profiles?', a: 'Every profile is tied to a verified email, bots can\'t sign up, and the community rates real meetups. Reported profiles are removed by moderators, and there is no way to import or seed fake accounts.' },
  { q: 'What is Right Now mode?', a: 'A one-tap signal that pins your profile to the top of the feed for 2 hours. Free members get 1 activation a day; Premium members get 5.' },
  { q: 'How much of my location is shared?', a: 'Only a coarse area — never your exact address. You control distance sharing and can hide from the map completely in Settings.' },
  { q: 'Is it 18+?', a: 'Strictly. Age is verified at signup and explicit content stays behind adult-only filters. Underage accounts are banned on sight.' },
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
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [showRef, setShowRef]   = useState(false);
  const [refCode, setRefCode]   = useState('');

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
            className="w-full bg-gray-900 border border-white/20 text-white placeholder-gray-600 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-white/20 text-white placeholder-gray-600 rounded-2xl px-4 py-3.5 pr-12 focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <button type="button" onClick={() => setShowPw((p) => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {mode === 'signup' && (
            <div>
              <button type="button" onClick={() => setShowRef((p) => !p)} className="text-xs text-gray-500 hover:text-white transition-colors">
                {showRef ? '− Hide' : '+ Have an invite code? (optional)'}
              </button>
              {showRef && (
                <input
                  type="text" placeholder="Friend's invite code" value={refCode}
                  onChange={(e) => {
                    const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    setRefCode(v);
                    if (v) sessionStorage.setItem('surge_ref', v);
                    else sessionStorage.removeItem('surge_ref');
                  }}
                  className="mt-2 w-full bg-gray-900 border border-white/20 text-white placeholder-gray-600 rounded-2xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors uppercase"
                />
              )}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-[var(--accent)] text-[#050c1a] font-bold py-3.5 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
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
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const iv = setInterval(() => setTagIdx((i) => (i + 1) % TAGLINES.length), 3000);
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      clearInterval(iv);
      window.removeEventListener('scroll', onScroll);
    };
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

      {/* ── NAV (scroll-aware) ─────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-black/85 backdrop-blur-md border-b border-white/8 py-2.5' : 'bg-transparent py-4'}`}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-black text-lg tracking-tight">SURGE</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#rewards" className="hover:text-white transition-colors">Rewards</a>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => setMode('signin')} className="text-sm font-semibold px-3 py-1.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
              Sign In
            </button>
            <button onClick={() => setMode('signup')} className="text-sm font-bold px-4 py-1.5 rounded-xl active:scale-95 transition-transform" style={{ background: 'var(--accent)', color: '#050c1a' }}>
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-24 overflow-hidden">

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: 'rgba(212,168,67,0.10)' }} />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full blur-[100px]" style={{ background: 'rgba(212,168,67,0.06)' }} />
        </div>

        {/* Grid bg */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative z-10 w-full max-w-5xl md:grid md:grid-cols-2 md:gap-12 md:items-center">

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-center md:text-left max-w-lg mx-auto md:mx-0"
          >
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-6 md:justify-start">
              <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-lg">
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
                  className="text-2xl font-bold"
                  style={{ background: 'linear-gradient(90deg, var(--accent-bright), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  {TAGLINES[tagIdx]}
                </motion.p>
              </AnimatePresence>
            </div>

            <p className="text-gray-400 text-base mb-8 leading-relaxed">
              The hookup app built for real people who want real connections — tonight, nearby, on your terms.
            </p>

            {/* CTA buttons */}
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode('signup')}
                className="w-full bg-[var(--accent)] text-[#050c1a] font-bold py-4 rounded-2xl text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
              >
                <Zap className="w-5 h-5" /> Get Started Free
              </motion.button>
              <button onClick={() => setMode('signin')}
                className="w-full bg-gray-900/80 border border-white/10 text-white font-semibold py-3.5 rounded-2xl hover:border-[var(--border-strong)] transition-colors">
                Sign In
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 mt-6 text-gray-600 text-xs md:justify-start flex-wrap">
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> E2E Encrypted</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Moderated</span>
              <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> 18+ Only</span>
            </div>
          </motion.div>

          {/* Live feed mock panel (desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:block"
          >
            <div className="relative rounded-3xl border border-[rgba(212,168,67,0.22)] bg-[var(--bg-elevated)] p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-bold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live nearby
                </p>
                <span className="text-[10px] px-2 py-1 rounded-full border" style={{ borderColor: 'var(--border-strong)', color: 'var(--accent)' }}>3 min ago</span>
              </div>
              <div className="relative h-56 rounded-2xl overflow-hidden border border-white/8"
                style={{ background: 'radial-gradient(ellipse at 30% 25%, rgba(212,168,67,0.14), rgba(5,12,26,0.9) 70%)' }}>
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: 'linear-gradient(rgba(212,168,67,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,67,0.35) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                {/* Dots */}
                <div className="absolute left-[22%] top-[35%] w-3 h-3 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" />
                <div className="absolute left-[58%] top-[55%] w-3 h-3 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" />
                <div className="absolute left-[72%] top-[28%] w-3 h-3 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" />
                <div className="absolute left-[42%] top-[70%] w-3 h-3 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" />
                <div className="absolute left-[64%] top-[78%] w-3 h-3 rounded-full bg-red-500 shadow-[0_0_12px_red]" title="Right Now" />
                <div className="absolute left-[38%] top-[45%] w-3 h-3 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" />
                <div className="absolute left-[12%] top-[62%] w-3 h-3 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" />
                {/* You */}
                <div className="absolute left-[48%] top-[42%] w-4 h-4 rounded-full border-2 border-white bg-[var(--accent-bright)] shadow-[0_0_16px_var(--accent)]" />
                <span className="absolute left-[calc(48%+20px)] top-[40%] text-[10px] text-gray-300 font-semibold">You</span>
                {/* Distance chip */}
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] text-gray-300 border border-white/10">
                  8 people within 2 miles 🟢
                </div>
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] text-red-300 border border-white/10">
                  🔥 Right Now: 1
                </div>
              </div>
              {/* Fake profile strip */}
              <div className="flex gap-2 mt-4">
                {[
                  { emoji: '🎉', name: 'Marcus, 28', meta: '0.2 mi · Online' },
                  { emoji: '🔥', name: 'Drew, 31', meta: '0.5 mi · Right Now' },
                  { emoji: '😈', name: 'Alex, 26', meta: '1.1 mi · Online' },
                ].map((p) => (
                  <div key={p.name} className="flex-1 bg-gray-900 border border-white/8 rounded-2xl p-3 text-left">
                    <div className="text-lg mb-1">{p.emoji}</div>
                    <p className="text-white text-xs font-bold truncate">{p.name}</p>
                    <p className="text-gray-600 text-[10px] truncate">{p.meta}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-700 flex flex-col items-center gap-1"
          animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-[10px] uppercase tracking-widest">See features</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </section>

      {/* ── LAUNCH PROMO BAND ─────────────────────────────── */}
      <section className="px-4 pb-4 md:pb-10">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl border border-[rgba(212,168,67,0.35)]" style={{ background: 'linear-gradient(120deg, rgba(212,168,67,0.16), rgba(5,12,26,0.5) 60%)' }}>
              <div className="absolute inset-0 pointer-events-none opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle at 85% 20%, rgba(212,168,67,0.5), transparent 40%)' }} />
              <div className="relative p-5 md:p-7 flex flex-col md:flex-row items-center gap-4 md:gap-8">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                  <PartyPopper className="w-6 h-6 md:w-7 md:h-7 text-[#050c1a]" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-white font-black text-lg md:text-xl leading-tight">
                    Launch promo — first 500 members bank <span className="text-[var(--accent-bright)]">+3 free Premium days</span>
                  </p>
                  <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                    Claim an invite code from any member, enter it at signup, and you both get rewarded. Premium is free when it comes from your crew.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setMode('signup')}
                    className="md:flex-1 bg-[var(--accent)] text-[#050c1a] font-bold px-6 py-3 rounded-2xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Gift size={15} /> Claim free days
                  </motion.button>
                  <button onClick={() => setMode('signin')} className="text-gray-500 text-xs hover:text-white transition-colors">
                    Already have a code? Sign in
                  </button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FEATURES DEEP DIVE ─────────────────────────────── */}
      <section id="features" className="px-4 py-16 max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10">
            <span className="text-xs text-purple-400 font-semibold uppercase tracking-widest">What makes us different</span>
            <h2 className="text-white text-3xl font-black mt-2">Built for the real thing</h2>
            <p className="text-gray-500 text-sm mt-2">Every feature designed to get you from app to IRL, faster.</p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-5 md:gap-6">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={0.05}>
              <div className="bg-gray-950/60 border border-white/8 rounded-3xl overflow-hidden h-full flex flex-col">
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
                <div className="px-4 pb-4 pt-3 flex-1">
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── PREMIUM PERKS ─────────────────────────────────── */}
      <section id="premium" className="px-4 py-16 max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10">
            <span className="text-xs text-[var(--accent)] font-semibold uppercase tracking-widest">Premium — earned, not bought</span>
            <h2 className="text-white text-3xl font-black mt-2">Every perk, zero credit card</h2>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              There's no paywall. Invite friends, verify, and show up — Premium unlocks itself.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {PREMIUM_PERKS.map((perk, i) => (
            <FadeIn key={perk.title} delay={i * 0.06}>
              <div className="bg-gray-900/60 border border-white/8 rounded-2xl p-5 h-full hover:border-[var(--border-strong)] transition-colors">
                <div className="w-11 h-11 rounded-2xl bg-gray-800 flex items-center justify-center mb-3">
                  <perk.icon className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <p className="text-white font-bold text-sm">{perk.title}</p>
                <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{perk.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how" className="px-4 py-16 max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10">
            <span className="text-xs text-pink-400 font-semibold uppercase tracking-widest">Simple as that</span>
            <h2 className="text-white text-3xl font-black mt-2">From signup to meetup</h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {[
            { num: '01', icon: '⚡', title: 'Create your profile', desc: 'Sign up free, add your photos, and tell people what you\'re into. Takes 3 minutes.' },
            { num: '02', icon: '📡', title: `See who\'s nearby`, desc: 'Open the map or grid. Real people, real distance, right now.' },
            { num: '03', icon: '💬', title: 'Connect & meet', desc: 'Message freely, find a Spot, and make it happen. No paywalls.' },
          ].map((step, i) => (
            <FadeIn key={step.num} delay={i * 0.1}>
              <div className="bg-gray-950/50 border border-white/8 rounded-3xl p-6 h-full text-center md:text-left">
                <div className="w-14 h-14 rounded-2xl bg-gray-900 border border-white/10 flex items-center justify-center mb-4 text-2xl mx-auto md:mx-0">
                  {step.icon}
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <span className="text-xs text-gray-600 font-mono">{step.num}</span>
                  <h4 className="text-white font-black text-lg">{step.title}</h4>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── REFERRAL LADDER ────────────────────────────────── */}
      <section id="rewards" className="px-4 py-16 max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10">
            <span className="text-xs text-[var(--accent)] font-semibold uppercase tracking-widest">Free Premium, seriously</span>
            <h2 className="text-white text-3xl font-black mt-2">Invite friends. Earn days.</h2>
            <p className="text-gray-500 text-sm mt-2">Premium shouldn't cost you — it should come from your crew.</p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EARN_PREMIUM.map((tier, i) => (
            <FadeIn key={tier.title} delay={i * 0.06}>
              <div className="relative bg-gray-900/60 border border-white/8 rounded-2xl p-5 h-full flex flex-col hover:border-[var(--border-strong)] transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center text-2xl mb-3 flex-shrink-0">
                  {tier.icon}
                </div>
                <p className="text-white font-bold text-sm">{tier.title}</p>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed flex-1">{tier.desc}</p>
                <span className="mt-3 inline-flex self-start items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border" style={{ color: 'var(--accent-bright)', borderColor: 'var(--border-strong)' }}>
                  <Gift size={11} /> {tier.reward}
                </span>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.15}>
          <div className="mt-10 max-w-2xl mx-auto text-center">
            <p className="text-gray-600 text-sm leading-relaxed">
              Everything stacks. <span className="text-gray-400">Invite 10 friends, verify your email, finish your profile, and keep a 7-day streak — that's over a month of free Premium without spending a cent.</span>
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setMode('signup')}
              className="mt-5 inline-flex items-center gap-2 bg-[var(--accent)] text-[#050c1a] font-bold px-8 py-3.5 rounded-2xl text-sm hover:opacity-90 transition-opacity active:scale-95"
            >
              <Gift size={16} /> Start earning — Get Started Free
            </motion.button>
          </div>
        </FadeIn>
      </section>

      {/* ── STATS BAND ────────────────────────────────────── */}
      <section className="px-4 py-14 border-y border-white/5" style={{ background: 'rgba(212,168,67,0.03)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {STATS.map((s, i) => (
              <FadeIn key={s.label} delay={i * 0.05}>
                <div className="text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-white font-black text-xl">{s.value}</div>
                  <div className="text-gray-600 text-[11px] mt-0.5">{s.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────── */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10">
            <span className="text-xs text-cyan-400 font-semibold uppercase tracking-widest">Word on the street</span>
            <h2 className="text-white text-3xl font-black mt-2">People are surging</h2>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.handle} delay={i * 0.06}>
              <div className="bg-gray-900/60 border border-white/8 rounded-2xl px-4 py-4 h-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-base">
                    {t.emoji}
                  </div>
                  <p className="text-gray-600 text-xs">{t.handle}</p>
                </div>
                <p className="text-white text-sm leading-relaxed">"{t.text}"</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section id="faq" className="px-4 py-16 max-w-3xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Questions, answered</span>
            <h2 className="text-white text-3xl font-black mt-2">Everything you're wondering</h2>
          </div>
        </FadeIn>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <FadeIn key={faq.q} delay={i * 0.04}>
              <div className="bg-gray-900/50 border border-white/8 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="text-white font-semibold text-sm flex items-center gap-2">
                    <HelpCircle size={15} className="text-[var(--accent)] flex-shrink-0" /> {faq.q}
                  </span>
                  <ChevronDown size={16} className={`text-gray-500 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────────── */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <FadeIn>
          <div className="relative bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-3xl p-8 md:p-12 text-center overflow-hidden">
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(212,168,67,0.12), rgba(5,12,26,0.4))' }} />

            <div className="relative z-10">
              <div className="text-5xl mb-4">⚡</div>
              <h2 className="text-white text-3xl font-black mb-2">Ready to surge?</h2>
              <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">Free forever. No credit card. Just show up — and stack free Premium while you're at it.</p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMode('signup')}
                  className="w-full sm:w-auto bg-[var(--accent)] text-[#050c1a] font-bold px-10 py-4 rounded-2xl text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                >
                  <Zap size={18} /> Get Started Free
                </motion.button>
                <button onClick={() => setMode('signin')}
                  className="w-full sm:w-auto bg-gray-900 border border-white/10 text-white font-semibold px-10 py-4 rounded-2xl hover:border-[var(--border-strong)] transition-colors">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-4 py-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-black tracking-tight text-lg">SURGE</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-gray-500 text-sm">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#premium" className="hover:text-white transition-colors">Premium</a>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#rewards" className="hover:text-white transition-colors">Rewards</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center justify-center gap-4 text-gray-700 text-xs">
            <span>Privacy</span><span>Terms</span><span>Safety</span>
          </div>
        </div>
        <p className="text-center text-gray-700 text-xs mt-6">© 2025 Surge · 18+ Only · All rights reserved</p>
      </footer>

    </div>
  );
}
