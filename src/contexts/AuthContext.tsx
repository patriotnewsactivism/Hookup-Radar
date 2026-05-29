import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useConvexAuth, useQuery, useMutation } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../convex/_generated/api';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn: convexSignIn, signOut: convexSignOut } = useAuthActions();

  // Query the viewer to get the Convex user identity
  const viewer = useQuery(api.surgeUsers.viewer);
  const updateMutation = useMutation(api.surgeUsers.update);

  // Build authUser from the Convex identity
  const authUser = isAuthenticated && viewer
    ? { id: viewer.auth_id || viewer._id, email: viewer.auth_email || '' }
    : isAuthenticated
      ? { id: 'pending', email: '' }
      : null;

  // Map Convex doc to SurgeUser
  const profile: SurgeUser | null = viewer
    ? {
        id: viewer._id,
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
      }
    : null;

  const signUp = useCallback(async (email: string, password: string) => {
    await convexSignIn('password', { email, password, flow: 'signUp' });
  }, [convexSignIn]);

  const signIn = useCallback(async (email: string, password: string) => {
    await convexSignIn('password', { email, password, flow: 'signIn' });
  }, [convexSignIn]);

  const signOut = useCallback(async () => {
    await convexSignOut();
  }, [convexSignOut]);

  const updateProfile = useCallback(async (data: Partial<SurgeUser>) => {
    if (!viewer?._id) return;
    await updateMutation({ id: viewer._id, ...data } as any);
  }, [viewer?._id, updateMutation]);

  const refreshProfile = useCallback(async () => {
    // Convex queries are reactive, so this is a no-op
  }, []);

  return (
    <AuthContext.Provider value={{
      authUser,
      profile,
      loading: isLoading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
