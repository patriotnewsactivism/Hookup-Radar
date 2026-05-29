import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Zap, MapPin, Shield, Lock, Eye, EyeOff, Check,
  Map, MessageCircle, Star, Users, Flame, Heart,
  ShieldCheck, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type Mode = 'landing' | 'signin' | 'signup';

const TAGLINES = [
  'No games. Just now.',
  'Your fantasy. Tonight.',
  'Real people. Real close.',
  'Less swiping. More doing.',
  'All welcome. No judgment.',
];

const STATS = [
  { value: '4.2K', label: 'Active Users', icon: '🔥' },
  { value: '12K+', label: 'Meetups Made', icon: '⚡' },
  { value: '94%', label: 'Real Profiles', icon: '✅' },
  { value: '< 5mi', label: 'Avg Distance', icon: '📍' },
];

const FEATURES = [
  { icon: Map, title: 'Live Map', desc: 'See who\'s nearby right now', color: 'text-purple-400' },
  { icon: MessageCircle, title: 'Real-Time Chat', desc: 'No limits. No paywalls.', color: 'text-pink-400' },
  { icon: Flame, title: 'Right Now Mode', desc: 'Signal you\'re looking NOW', color: 'text-red-400' },
  { icon: MapPin, title: 'Hot Spots', desc: 'Find community hangouts', color: 'text-orange-400' },
  { icon: ShieldCheck, title: 'SafeWord', desc: 'Emergency panic button', color: 'text-green-400' },
  { icon: Star, title: 'Rate & Verify', desc: 'Trust scores & selfie verify', color: 'text-yellow-400' },
];

function AuthForm({ mode, onModeChange }: { mode: 'signin' | 'signup'; onModeChange: (m: Mode) => void }) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white">{mode === 'signup' ? 'Join Surge' : 'Sign In'}</h2>
        <p className="text-gray-500 text-sm mt-1">{mode === 'signup' ? 'Free. No credit card.' : 'Good to see you ⚡'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-gray-900 border border-white/20 text-white placeholder-gray-600 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-purple-500"
        />
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-900 border border-white/20 text-white placeholder-gray-600 rounded-2xl px-4 py-3.5 pr-12 focus:outline-none focus:border-purple-500"
          />
          <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-2xl text-base hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>{mode === 'signup' ? 'Create Account' : 'Sign In'} <ArrowRight size={18} /></>
          )}
        </button>
      </form>

      <div className="mt-4 text-center space-y-2">
        {mode === 'signin' ? (
          <button onClick={() => onModeChange('signup')} className="text-purple-400 text-sm hover:underline">Don't have an account? Sign up</button>
        ) : (
          <button onClick={() => onModeChange('signin')} className="text-gray-500 text-sm hover:text-white">Already have an account? Sign in</button>
        )}
        <button onClick={() => onModeChange('landing')} className="text-gray-600 text-sm block w-full">← Back</button>
      </div>
    </motion.div>
  );
}

export function LandingPage() {
  const [mode, setMode] = useState<Mode>('landing');
  const [tagIdx, setTagIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTagIdx(i => (i + 1) % TAGLINES.length), 3000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-screen bg-[#080010] flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {mode === 'landing' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center w-full max-w-lg">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-900/50">
                <Zap size={28} className="text-white" fill="white" />
              </div>
              <span className="text-white font-black text-3xl tracking-tight">SURGE</span>
            </div>

            {/* Rotating taglines */}
            <div className="h-10 mb-6 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p key={tagIdx} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="text-gray-400 text-lg">
                  {TAGLINES[tagIdx]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-8">
              {STATS.map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-xl">{s.icon}</p>
                  <p className="text-white font-bold text-sm">{s.value}</p>
                  <p className="text-gray-600 text-xs">{s.label}</p>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="space-y-3 mb-8">
              <button onClick={() => setMode('signup')} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-2xl text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 active:scale-95">
                <Zap size={18} fill="white" /> Get Started Free
              </button>
              <button onClick={() => setMode('signin')} className="w-full bg-gray-900 border border-white/10 text-white font-semibold py-4 rounded-2xl hover:border-purple-500 transition-colors">
                Sign In
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(f => (
                <div key={f.title} className="bg-gray-900/60 border border-white/5 rounded-2xl p-3 text-left">
                  <f.icon size={20} className={f.color + ' mb-2'} />
                  <p className="text-white text-sm font-bold">{f.title}</p>
                  <p className="text-gray-500 text-xs">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 mt-8 text-gray-600 text-xs">
              <span className="flex items-center gap-1"><Lock size={10} /> End-to-End Encrypted</span>
              <span className="flex items-center gap-1"><Shield size={10} /> No Data Selling</span>
              <span className="flex items-center gap-1"><Check size={10} /> 18+ Only</span>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <AuthForm key={mode} mode={mode as 'signin' | 'signup'} onModeChange={setMode} />
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-6 px-4">
        <p className="text-gray-700 text-xs">© 2024 Surge · 18+ · All rights reserved</p>
      </div>
    </div>
  );
}
