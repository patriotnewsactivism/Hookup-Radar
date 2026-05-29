import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/SurgeAvatar';
import { Badge } from '../components/ui/SurgeBadge';
import { GENDERS, ORIENTATIONS, POSITIONS, LOOKING_FOR, KINKS } from '../types';
import { Eye, Crown, LogOut, Shield, Zap, EyeOff, Camera } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { PhotoUpload } from '../components/PhotoUpload';
import { AlbumManager } from '../components/AlbumManager';

type Tab = 'profile' | 'photos' | 'settings' | 'premium';

export function ProfilePage() {
  const { profile, updateProfile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...profile });

  if (!profile) return null;

  const id = (profile as any)._id || (profile as any).id || '';

  const saveProfile = async () => {
    try {
      await updateProfile(form as any);
      setEditing(false);
      toast.success('Profile saved!');
    } catch { toast.error('Save failed'); }
  };

  const toggleField = (key: 'looking_for' | 'kinks', val: string) => {
    setForm(p => {
      const arr = (p as any)[key] as string[] || [];
      const updated = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
      return { ...p, [key]: updated };
    });
  };

  const inFreeTrial = profile.free_trial_until && new Date(profile.free_trial_until) > new Date();
  const isPremiumActive = profile.is_premium || inFreeTrial;

  return (
    <div className="h-full overflow-y-auto bg-black">
      {/* Profile header */}
      <div className="relative">
        <div className="h-28 bg-gradient-to-r from-purple-900 to-pink-900" />
        <div className="px-5 pb-4">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <Avatar user={profile} size="xl" showOnline={false} />
              {/* Camera overlay for profile pic change */}
              <button
                onClick={() => setTab('photos')}
                className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 border-2 border-black rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors"
              >
                <Camera size={14} className="text-white" />
              </button>
            </div>
            <div className="flex gap-2">
              {isPremiumActive && (
                <span className="flex items-center gap-1 bg-yellow-900/50 text-yellow-400 border border-yellow-700 text-xs font-bold px-3 py-1.5 rounded-full">
                  <Crown size={12} /> {inFreeTrial ? 'Free Trial' : 'Premium'}
                </span>
              )}
              <button
                onClick={() => setEditing(p => !p)}
                className={clsx('text-sm font-semibold px-4 py-1.5 rounded-full border transition-colors', editing
                  ? 'bg-purple-700 border-purple-500 text-white'
                  : 'bg-gray-900 border-white/10 text-gray-300 hover:border-purple-500'
                )}
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>
          <h1 className="text-white font-black text-2xl">{profile.display_name || profile.username}</h1>
          <p className="text-gray-400 text-sm">{profile.age} · {profile.gender} · {profile.orientation}</p>
          <div className="flex items-center gap-2 mt-1 text-gray-500 text-xs">
            <Eye size={12} /> <span>{profile.profile_views || 0} profile views</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 px-5">
        {(['profile', 'photos', 'settings', 'premium'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx('flex-1 py-3 text-sm font-semibold capitalize transition-colors', tab === t ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-600 hover:text-gray-400')}
          >
            {t === 'premium' ? '⚡' : t === 'photos' ? '📸' : t}
          </button>
        ))}
      </div>

      <div className="px-5 py-5 pb-24 space-y-5">
        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <>
            {editing ? (
              <div className="space-y-4">
                <input value={form.display_name || ''} onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))} placeholder="Display Name" className="w-full bg-gray-900 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500" />
                <textarea value={form.bio || ''} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Bio" rows={3} className="w-full bg-gray-900 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={form.age || 25} min={18} onChange={e => setForm(p => ({ ...p, age: parseInt(e.target.value) }))} placeholder="Age" className="bg-gray-900 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500" />
                  <input value={form.height || ''} onChange={e => setForm(p => ({ ...p, height: e.target.value }))} placeholder="Height" className="bg-gray-900 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-gray-500 text-xs uppercase mb-2 block">Gender</label>
                  <div className="flex flex-wrap gap-2">
                    {GENDERS.map(g => (
                      <button key={g} onClick={() => setForm(p => ({ ...p, gender: g }))} className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${form.gender === g ? 'bg-purple-700 border-purple-500 text-white' : 'bg-gray-900 border-white/10 text-gray-400'}`}>{g}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-gray-500 text-xs uppercase mb-2 block">Orientation</label>
                  <div className="flex flex-wrap gap-2">
                    {ORIENTATIONS.map(o => (
                      <button key={o} onClick={() => setForm(p => ({ ...p, orientation: o }))} className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${form.orientation === o ? 'bg-pink-700 border-pink-500 text-white' : 'bg-gray-900 border-white/10 text-gray-400'}`}>{o}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-gray-500 text-xs uppercase mb-2 block">Looking For</label>
                  <div className="flex flex-wrap gap-2">
                    {LOOKING_FOR.map(lf => (
                      <button key={lf} onClick={() => toggleField('looking_for', lf)} className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${(form.looking_for as string[] || []).includes(lf) ? 'bg-orange-700 border-orange-500 text-white' : 'bg-gray-900 border-white/10 text-gray-400'}`}>{lf}</button>
                    ))}
                  </div>
                </div>
                <button onClick={saveProfile} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity">
                  Save Profile
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.bio && <p className="text-gray-300 text-sm leading-relaxed">{profile.bio}</p>}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Position', value: profile.position },
                    { label: 'Body', value: profile.body_type },
                    { label: 'Lifestyle', value: profile.lifestyle },
                    { label: 'Height', value: profile.height || '—' },
                    { label: 'Weight', value: profile.weight || '—' },
                    { label: 'Health', value: profile.health_status || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-900 rounded-xl p-2.5 text-center">
                      <p className="text-gray-600 text-xs">{label}</p>
                      <p className="text-white text-xs font-semibold truncate">{value}</p>
                    </div>
                  ))}
                </div>
                {profile.looking_for?.length > 0 && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-2">Looking For</p>
                    <div className="flex flex-wrap gap-1.5">{profile.looking_for.map(lf => <Badge key={lf} label={lf} variant="purple" />)}</div>
                  </div>
                )}
                {profile.kinks?.length > 0 && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-2">Into</p>
                    <div className="flex flex-wrap gap-1.5">{profile.kinks.map(k => <Badge key={k} label={k} variant="gray" />)}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* PHOTOS TAB */}
        {tab === 'photos' && (
          <div className="space-y-6">
            {/* Profile photos */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3">Profile Photo</h3>
              <PhotoUpload
                userId={id}
                maxPhotos={1}
                isProfilePhoto={true}
                allowVideo={false}
                existingUrls={profile.photo_url ? [profile.photo_url] : []}
                onUploadComplete={(urls) => {
                  if (urls.length > 0) {
                    updateProfile({ photo_url: urls[0] } as any);
                  }
                }}
              />
            </div>

            {/* Additional photos */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3">Additional Photos</h3>
              <PhotoUpload
                userId={id}
                maxPhotos={15}
                allowVideo={true}
                existingUrls={profile.photo_urls || []}
                onUploadComplete={(urls) => {
                  updateProfile({ photo_urls: urls } as any);
                }}
              />
            </div>

            {/* Albums */}
            <div className="border-t border-white/5 pt-6">
              <AlbumManager userId={id} />
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div className="space-y-4">
            {[
              { label: 'Show on Map', desc: 'Let others see your dot on the live map', key: 'show_on_map' as const, icon: <Eye size={18} className="text-purple-400" /> },
              { label: 'Show Distance', desc: 'Display your distance from others', key: 'show_distance' as const, icon: <Shield size={18} className="text-blue-400" /> },
              { label: 'Anonymous Mode', desc: 'Hide your name and photo', key: 'is_anonymous' as const, icon: <EyeOff size={18} className="text-pink-400" /> },
            ].map(({ label, desc, key, icon }) => (
              <div key={key} className="flex items-center justify-between bg-gray-900 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center gap-3">
                  {icon}
                  <div>
                    <p className="text-white text-sm font-semibold">{label}</p>
                    <p className="text-gray-500 text-xs">{desc}</p>
                  </div>
                </div>
                <button onClick={() => updateProfile({ [key]: !profile[key] })} className={clsx('w-12 h-6 rounded-full transition-colors flex-shrink-0', profile[key] ? 'bg-purple-600' : 'bg-gray-700')}>
                  <div className={clsx('w-5 h-5 bg-white rounded-full transition-transform mx-0.5', profile[key] ? 'translate-x-6' : 'translate-x-0')} />
                </button>
              </div>
            ))}
            <button onClick={async () => { await signOut(); }} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-900 border border-white/10 text-red-400 font-semibold hover:bg-red-950/30 transition-colors">
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        )}

        {/* PREMIUM TAB */}
        {tab === 'premium' && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">Premium features coming soon!</p>
            <div className="space-y-2">
              {[
                { icon: '👁️', label: 'See Who Viewed You' },
                { icon: '🥷', label: 'Incognito Browsing' },
                { icon: '🎛️', label: 'Advanced Filters' },
                { icon: '🚀', label: 'Profile Boost' },
                { icon: '🚫', label: 'Ad-Free' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3 bg-gray-900 rounded-2xl p-4 border border-white/5">
                  <span className="text-2xl">{icon}</span>
                  <p className="text-white text-sm font-semibold">{label}</p>
                  <Zap size={14} className="text-yellow-500 ml-auto flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
