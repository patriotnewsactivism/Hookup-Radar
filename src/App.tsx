// v2.1 — navy/midnight theme + TS fixes
import React, { useState } from 'react';
import { Toaster } from 'sonner';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ConvexReactClient } from 'convex/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { MapPage } from './pages/MapPage';
import { GridPage } from './pages/GridPage';
import { ChatListPage } from './pages/ChatListPage';
import { ProfilePage } from './pages/ProfilePage';
import { SpotsPage } from './pages/SpotsPage';
import { BottomNav } from './components/BottomNav';
import { AppView } from './types';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function AppInner() {
  const { authUser, profile, loading } = useAuth();
  const [view, setView] = useState<AppView>('grid');
  const [unread, setUnread] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8"
        style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: 'linear-gradient(135deg, #d4a843, #8a6a22)' }}
          >
            <span className="text-white text-2xl">⚡</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading Surge…</p>
        </div>
      </div>
    );
  }

  if (!authUser) return <LandingPage />;
  if (!profile) return <OnboardingPage />;

  const handleViewChange = (v: AppView) => {
    setView(v);
    if (v === 'chat-list') setUnread(0);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden"
      style={{ background: 'var(--bg-base)' }}>
      <main className="flex-1 overflow-hidden">
        {view === 'map'       && <MapPage />}
        {view === 'grid'      && <GridPage />}
        {view === 'chat-list' && <ChatListPage />}
        {view === 'profile'   && <ProfilePage />}
        {view === 'spots'     && <SpotsPage />}
      </main>
      <BottomNav active={view} onChange={handleViewChange} unreadCount={unread} />
    </div>
  );
}

function AppWithAuth() {
  return (
    <AuthProvider>
      <AppInner />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          },
        }}
      />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <ConvexAuthProvider client={convex}>
      <AppWithAuth />
    </ConvexAuthProvider>
  );
}
