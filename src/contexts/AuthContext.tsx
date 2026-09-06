import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { users } from '../lib/surgeApi';
import { SurgeUser } from '../types';

interface AuthContextType {
  authUser: { id: string; email: string } | null;
  profile: SurgeUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<SurgeUser>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapProfile(viewer: any): SurgeUser | null {
  if (!viewer) return null;
  return {
    id: viewer.id,
    auth_id: viewer.auth_id,
    auth_email: viewer.auth_email,
    username: viewer.username,
    display_name: viewer.display_name,
    age: viewer.age,
    bio: viewer.bio,
    gender: viewer.gender,
    orientation: viewer.orientation,
    lifestyle: viewer.lifestyle || '',
    position: viewer.position,
    height: viewer.height || '',
    weight: viewer.weight || '',
    body_type: viewer.body_type,
    ethnicity: viewer.ethnicity || '',
    health_status: viewer.health_status || '',
    looking_for: viewer.looking_for || [],
    kinks: viewer.kinks || [],
    tags: viewer.tags || [],
    fantasies: viewer.fantasies || '',
    photo_url: viewer.photo_url || '',
    photo_urls: viewer.photo_urls || [],
    is_online: viewer.is_online ?? true,
    is_anonymous: viewer.is_anonymous ?? false,
    is_premium: viewer.is_premium ?? false,
    is_verified: viewer.is_verified ?? false,
    show_on_map: viewer.show_on_map ?? true,
    show_distance: viewer.show_distance ?? true,
    profile_views: viewer.profile_views ?? 0,
    blocked_users: viewer.blocked_users || [],
    favorite_users: viewer.favorite_users || [],
    free_trial_until: viewer.free_trial_until || '',
    last_seen: viewer.last_seen || new Date().toISOString(),
    lat: viewer.lat ?? 0,
    lng: viewer.lng ?? 0,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<SurgeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const viewer = await users.viewer();
      setProfile(mapProfile(viewer));
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const session = data.session;
      if (session?.user) {
        setAuthUser({ id: session.user.id, email: session.user.email || '' });
        await loadProfile();
      } else {
        setAuthUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session?.user) {
        setAuthUser({ id: session.user.id, email: session.user.email || '' });
        await loadProfile();
      } else {
        setAuthUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(async (data: Partial<SurgeUser>) => {
    if (!profile?.id) return;
    const updated = await users.update({ id: profile.id, ...data });
    setProfile(mapProfile(updated));
  }, [profile?.id]);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{ authUser, profile, loading, signUp, signIn, signOut, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
