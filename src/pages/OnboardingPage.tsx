import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { users, media as mediaApi } from '../lib/surgeApi';
import { GENDERS, ORIENTATIONS, POSITIONS, LOOKING_FOR, KINKS, BODY_TYPES, ETHNICITIES, HEALTH_STATUSES, LIFESTYLES } from '../types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronRight, ChevronLeft, Check, Zap, MapPin, CircleCheck } from 'lucide-react';

const STEPS = ['basics', 'body', 'identity', 'preferences', 'location', 'photo'];
const STEP_LABELS = ['The Basics', 'Your Body', 'Who You Are', 'What You Want', 'Your Location', 'Your Photo'];

function ChipSelect({ options, selected, onToggle, color = 'purple', single = false }: {
  options: string[];
  selected: string | string[];
  onToggle: (v: string) => void;
  color?: string;
  single?: boolean;
}) {
  const colors: Record<string, string> = {
    purple: 'bg-purple-600 border-purple-500',
    pink: 'bg-pink-600 border-pink-500',
    cyan: 'bg-cyan-700 border-cyan-500',
    orange: 'bg-orange-700 border-orange-500',
    green: 'bg-green-700 border-green-500',
    rose: 'bg-rose-700 border-rose-500',
  };
  const isSelected = (v: string) => Array.isArray(selected) ? selected.includes(v) : selected === v;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o}
          type="button"
          onClick={() => onToggle(o)}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all active:scale-95 ${
            isSelected(o)
              ? `${colors[color]} text-white shadow-lg`
              : 'bg-gray-900 border-white/10 text-gray-400 hover:border-white/30'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function OnboardingPage() {
  const { authUser, refreshProfile } = useAuth();
  const createUser = users.create;
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    username: '',
    display_name: '',
    age: 25,
    bio: '',
    gender: '' as string,
    orientation: '' as string,
    lifestyle: '' as string,
    position: 'Vers' as string,
    height: '',
    weight: '',
    body_type: 'Average',
    ethnicity: 'Prefer Not to Say',
    health_status: 'Ask Me',
    looking_for: [] as string[],
    kinks: [] as string[],
    fantasies: '',
    show_on_map: true,
    show_distance: true,
    is_anonymous: false,
    lat: null as number | null,
    lng: null as number | null,
  });

  const set = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));
  const toggle = (key: 'looking_for' | 'kinks', value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value]
    }));
  };

  // ── Username availability (inline typeahead check) ───────────────
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onUsernameChange = (raw: string) => {
    const value = raw.toLowerCase().replace(/[^a-z0-9_]/g, '');
    set('username', value);
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    if (value.length < 3) { setUsernameStatus('idle'); return; }
    if (!/^[a-z0-9_]{3,32}$/.test(value)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    usernameTimerRef.current = setTimeout(async () => {
      try {
        const res = await users.checkUsername({ username: value });
        setUsernameStatus(res.available ? 'available' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 400);
  };

  useEffect(() => () => {
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
  }, []);

  // ── Location (button-triggered geolocation, retry + skip) ────────
  const [locStatus, setLocStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this device');
      setLocStatus('error');
      return;
    }
    setLocStatus('loading');
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm(p => ({ ...p, lat: latitude, lng: longitude, show_on_map: true }));
        setLocStatus('ok');
        navigator.geolocation.clearWatch(watchId);
      },
      (err) => {
        setLocStatus('error');
        if (err.message) toast.error(err.message);
        navigator.geolocation.clearWatch(watchId);
      },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 }
    );
  };

  const skipLocation = () => {
    setForm(p => ({ ...p, lat: null, lng: null, show_on_map: false }));
    setLocStatus('idle');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Photo must be under 10MB'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.username.trim()) return toast.error('Username required') || false;
      if (form.username.length < 3) return toast.error('Username must be 3+ chars') || false;
      if (usernameStatus === 'taken') return toast.error('Username already taken — try another') || false;
      if (!form.display_name.trim()) return toast.error('Display name required') || false;
      if (form.age < 18 || form.age > 99) return toast.error('Must be 18+') || false;
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    if (!authUser?.id) {
      toast.error('Not signed in — please sign in again');
      return;
    }
    setLoading(true);
    try {
      // Real storage upload — the photo must survive a reload. The preview
      // blob URL is only used on screen, never saved.
      let uploaded: { path: string; url: string } | null = null;
      if (photoFile) {
        try {
          uploaded = await mediaApi.uploadFile(photoFile, authUser.id);
        } catch (e: any) {
          toast.error('Photo upload failed — try again, or skip the photo');
          setLoading(false);
          return;
        }
      }

      const hasLocation = typeof form.lat === 'number' && typeof form.lng === 'number';

      await createUser({
        username: form.username,
        display_name: form.display_name,
        age: form.age,
        bio: form.bio || '',
        gender: form.gender || 'Male',
        orientation: form.orientation || 'Gay',
        lifestyle: form.lifestyle || 'Single',
        position: form.position || 'Vers',
        height: form.height || '',
        weight: form.weight || '',
        body_type: form.body_type || 'Average',
        ethnicity: form.ethnicity || 'Prefer Not to Say',
        health_status: form.health_status || 'Ask Me',
        looking_for: form.looking_for,
        kinks: form.kinks,
        tags: [],
        fantasies: form.fantasies || '',
        photo_url: uploaded?.url ?? '',
        photo_urls: uploaded ? [uploaded.url] : [],
        lat: hasLocation ? form.lat : 0,
        lng: hasLocation ? form.lng : 0,
        show_on_map: hasLocation && form.show_on_map,
      });

      if (uploaded && photoFile) {
        try {
          await mediaApi.saveMedia({
            storage_id: uploaded.path,
            url: uploaded.url,
            type: 'image',
            filename: photoFile.name,
            size: photoFile.size,
            is_profile_photo: true,
          });
        } catch {
          // The profile is already live; the media row is best-effort.
        }
      }

      await refreshProfile();
      toast.success('Welcome to Surge 🔥');
    } catch (e: any) {
      toast.error(e.message || 'Failed to create profile');
      setLoading(false);
    }
  };

  const steps = [
    // STEP 0 — Basics
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-black text-white">Let's set you up</h2>
        <p className="text-gray-500 text-sm mt-1">Takes about 2 minutes</p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wider mb-1.5 block">Username</label>
          <input placeholder="e.g. hotdude42" value={form.username} autoComplete="off" autoCapitalize="none" onChange={e => onUsernameChange(e.target.value)} className="w-full bg-gray-900 border border-white/20 text-white placeholder-gray-600 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[var(--accent)] transition-colors" />
          {usernameStatus === 'checking' && (
            <p className="text-gray-600 text-xs mt-1">Checking availability…</p>
          )}
          {usernameStatus === 'available' && (
            <p className="text-green-500 text-xs mt-1 flex items-center gap-1"><CircleCheck size={12} /> Available</p>
          )}
          {usernameStatus === 'taken' && (
            <p className="text-red-500 text-xs mt-1">✗ Taken — try another</p>
          )}
          {usernameStatus === 'invalid' && (
            <p className="text-red-500 text-xs mt-1">Letters, numbers, underscores only (3–32)</p>
          )}
          {usernameStatus === 'idle' && (
            <p className="text-gray-600 text-xs mt-1">Letters, numbers, underscores only</p>
          )}
        </div>
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wider mb-1.5 block">Display Name</label>
          <input placeholder="What people see (can be a nickname)" value={form.display_name} onChange={e => set('display_name', e.target.value)} className="w-full bg-gray-900 border border-white/20 text-white placeholder-gray-600 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[var(--accent)] transition-colors" />
        </div>
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wider mb-1.5 block">Age</label>
          <input type="number" placeholder="Your age" value={form.age} min={18} max={99} onChange={e => set('age', parseInt(e.target.value) || 18)} className="w-28 bg-gray-900 border border-white/20 text-white placeholder-gray-600 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[var(--accent)] transition-colors" />
        </div>
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wider mb-1.5 block">Bio <span className="text-gray-600 normal-case">(optional)</span></label>
          <textarea placeholder="A little about you… keep it spicy 🌶️" value={form.bio} rows={3} maxLength={300} onChange={e => set('bio', e.target.value)} className="w-full bg-gray-900 border border-white/20 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors resize-none" />
          <p className="text-gray-600 text-xs text-right">{form.bio.length}/300</p>
        </div>
      </div>
    </div>,

    // STEP 1 — Body
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-black text-white">Your Stats</h2>
        <p className="text-gray-500 text-sm mt-1">All optional — fill what you're comfortable with</p>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-1.5 block">Height</label>
            <input placeholder="e.g. 5ft 10in" value={form.height} onChange={e => set('height', e.target.value)} className="w-full bg-gray-900 border border-white/20 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors" />
          </div>
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-1.5 block">Weight</label>
            <input placeholder="e.g. 180 lbs" value={form.weight} onChange={e => set('weight', e.target.value)} className="w-full bg-gray-900 border border-white/20 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors" />
          </div>
        </div>
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Body Type</label>
          <ChipSelect options={BODY_TYPES} selected={form.body_type} onToggle={v => set('body_type', v)} color="cyan" single />
        </div>
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Ethnicity</label>
          <ChipSelect options={ETHNICITIES} selected={form.ethnicity} onToggle={v => set('ethnicity', v)} color="orange" single />
        </div>
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Health Status</label>
          <ChipSelect options={HEALTH_STATUSES} selected={form.health_status} onToggle={v => set('health_status', v)} color="green" single />
        </div>
      </div>
    </div>,

    // STEP 2 — Identity
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-black text-white">Who are you?</h2>
        <p className="text-gray-500 text-sm mt-1">Pick all that fit</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Gender</label>
          <ChipSelect options={GENDERS} selected={form.gender} onToggle={v => set('gender', v)} color="purple" single />
        </div>
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Orientation</label>
          <ChipSelect options={ORIENTATIONS} selected={form.orientation} onToggle={v => set('orientation', v)} color="pink" single />
        </div>
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Position / Role</label>
          <ChipSelect options={POSITIONS} selected={form.position} onToggle={v => set('position', v)} color="cyan" single />
        </div>
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Lifestyle / Relationship Style</label>
          <ChipSelect options={LIFESTYLES} selected={form.lifestyle} onToggle={v => set('lifestyle', v)} color="orange" single />
        </div>
      </div>
    </div>,

    // STEP 3 — Preferences
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-black text-white">What you're into</h2>
        <p className="text-gray-500 text-sm mt-1">No judgment here 🔥</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Looking For</label>
          {/* "Right Now" is its own one-tap signal — set it from the app */}
          <ChipSelect options={LOOKING_FOR.filter(v => v !== 'Right Now')} selected={form.looking_for} onToggle={v => toggle('looking_for', v)} color="purple" />
        </div>
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Kinks & Interests</label>
          <ChipSelect options={KINKS} selected={form.kinks} onToggle={v => toggle('kinks', v)} color="pink" />
        </div>
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wider mb-1.5 block">Fantasies <span className="text-gray-600 normal-case">(private, optional)</span></label>
          <textarea placeholder="Describe what you're really looking for…" value={form.fantasies} rows={3} maxLength={500} onChange={e => set('fantasies', e.target.value)} className="w-full bg-gray-900 border border-white/20 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors resize-none" />
        </div>
        <div className="space-y-2">
          <label className="text-gray-400 text-xs uppercase tracking-wider block">Privacy</label>
          {[
            { key: 'show_on_map', label: 'Show me on the map', desc: 'Others can see your location on the map' },
            { key: 'show_distance', label: 'Show my distance', desc: 'Show how far away you are from others' },
            { key: 'is_anonymous', label: 'Anonymous mode', desc: 'Hide your photo until you match' },
          ].map(({ key, label, desc }) => (
            <label key={key} className="flex items-center gap-3 p-3 bg-gray-900 rounded-xl border border-white/10 cursor-pointer">
              <div onClick={() => set(key, !(form as any)[key])} className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${(form as any)[key] ? 'bg-purple-600' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${(form as any)[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-gray-500 text-xs">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>,

    // STEP 4 — Location + privacy
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-black text-white">Where are you?</h2>
        <p className="text-gray-500 text-sm mt-1">People nearby see a rough area — never your exact spot</p>
      </div>
      <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-4 space-y-3">
        {locStatus === 'ok' && typeof form.lat === 'number' ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl" style={{ background: 'rgba(212,168,67,0.12)' }}>
              <MapPin size={22} className="text-[var(--accent)] mx-auto" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-bold">Location set</p>
              <p className="text-gray-600 text-xs">Only a coarse area is shared with others</p>
            </div>
            <CircleCheck size={24} className="text-[var(--accent)]" />
          </div>
        ) : locStatus === 'error' ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-white font-semibold text-sm">Couldn't get your location</p>
            <p className="text-gray-500 text-xs">Check permissions, then try again — or skip and set it in Settings later</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(212,168,67,0.12)' }}>
              <MapPin size={28} className="text-[var(--accent)]" />
            </div>
            <p className="text-white font-semibold text-sm">Enable your location</p>
            <p className="text-gray-500 text-xs">You'll show up for people near you. Tap below to allow access.</p>
          </div>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={requestLocation} disabled={locStatus === 'loading'} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold active:scale-95 disabled:opacity-50" style={{ background: 'var(--accent)', color: '#050c1a' }}>
            {locStatus === 'loading'
              ? <><span className="w-4 h-4 border-2 border-[#050c1a]/30 border-t-[#050c1a] rounded-full animate-spin inline-block" />Locating…</>
              : <><Zap size={16} /> Use my location</>}
          </button>
          <button type="button" onClick={skipLocation} disabled={locStatus === 'loading'} className="flex-1 bg-gray-900 border border-white/10 text-gray-300 font-semibold py-3 rounded-xl hover:border-[var(--border-strong)] active:scale-95 disabled:opacity-50">
            Skip — set later
          </button>
        </div>
      </div>
      <div className="bg-gray-900/50 border border-white/10 rounded-xl p-3">
        <p className="text-gray-400 text-xs leading-relaxed">🔒 Privacy: your exact coordinates never leave your phone — only a coarse area is shared, and you can turn off "Show me on the map" anytime in Settings.</p>
      </div>
    </div>,

    // STEP 5 — Photo
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-black text-white">Add a photo</h2>
        <p className="text-gray-500 text-sm mt-1">Profiles with photos get 10× more views</p>
      </div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/heic" onChange={handlePhotoChange} className="hidden" capture="user" />
      <div className="flex flex-col items-center gap-4">
        {photoPreview ? (
          <div className="relative">
            <img src={photoPreview} alt="Preview" className="w-48 h-48 rounded-3xl object-cover border-2 border-purple-500 shadow-2xl" style={{ boxShadow: '0 0 24px rgba(212,168,67,0.25)' }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 bg-purple-600 rounded-full p-2 shadow-lg" style={{ color: '#050c1a' }}>
              <Camera size={16} className="text-white" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()} className="w-48 h-48 rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 hover:border-[var(--accent)] transition-colors bg-gray-900/50 active:scale-95">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(212,168,67,0.12)' }}>
              <Camera size={32} className="text-[var(--accent)]" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">Tap to add photo</p>
              <p className="text-gray-500 text-xs mt-0.5">JPG, PNG, HEIC up to 10MB</p>
            </div>
          </button>
        )}
        <div className="flex gap-3 w-full max-w-xs">
          <button type="button" onClick={() => { if (fileInputRef.current) { fileInputRef.current.removeAttribute('capture'); fileInputRef.current.click(); } }} className="flex-1 bg-gray-900 border border-white/20 text-white rounded-xl py-3 text-sm font-medium hover:border-[var(--accent)] transition-colors">📷 Gallery</button>
          <button type="button" onClick={() => { if (fileInputRef.current) { fileInputRef.current.setAttribute('capture', 'user'); fileInputRef.current.click(); } }} className="flex-1 bg-gray-900 border border-white/20 text-white rounded-xl py-3 text-sm font-medium hover:border-[var(--accent)] transition-colors">🤳 Selfie</button>
        </div>
      </div>
      <div className="bg-gray-900/50 border border-white/10 rounded-xl p-3">
        <p className="text-gray-400 text-xs text-center">💡 You can skip this and add photos later in your profile settings</p>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-gradient">
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <span className="text-white font-black text-lg">SURGE</span>
        </div>
        <div className="flex gap-1.5 mb-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full flex-1 transition-all duration-300 ${i <= step ? 'bg-brand-gradient' : 'bg-gray-800'}`} />
          ))}
        </div>
        <p className="text-gray-500 text-xs">{STEP_LABELS[step]} · Step {step + 1} of {STEPS.length}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.2 }}>
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="px-4 pb-8 pt-4 border-t border-white/5 bg-black">
        <div className="flex gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-5 py-4 bg-gray-900 border border-white/10 text-white rounded-2xl font-semibold">
              <ChevronLeft size={18} /> Back
            </button>
          )}
          <button type="button" onClick={next} disabled={loading} className="flex-1 flex items-center justify-center gap-2 font-bold py-4 rounded-2xl text-base hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-95" style={{ background: 'var(--accent)', color: '#050c1a' }}>
            {loading ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />Creating your profile…</span>
            ) : step === STEPS.length - 1 ? (
              photoFile ? <><Check size={18} /> Finish & Enter Surge ⚡</> : <><Zap size={18} fill="currentColor" /> Skip Photo & Enter ⚡</>
            ) : (
              <>Next <ChevronRight size={18} /></>
            )}
          </button>
        </div>
        {step === STEPS.length - 1 && !loading && (
          <button type="button" onClick={handleSubmit} className="w-full mt-2 text-gray-600 text-sm py-2">Skip photo for now →</button>
        )}
      </div>
    </div>
  );
}