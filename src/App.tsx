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
      <div className="min-h-screen bg-[#080010] flex items-center justify-center px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center animate-pulse">
            <span className="text-white text-2xl">⚡</span>
          </div>
          <p className="text-gray-600 text-sm">Loading Surge…</p>
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
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      <main className="flex-1 overflow-hidden">
        {view === 'map' && <MapPage />}
        {view === 'grid' && <GridPage />}
        {view === 'chat-list' && <ChatListPage />}
        {view === 'profile' && <ProfilePage />}
        {view === 'spots' && <SpotsPage />}
      </main>
      <BottomNav active={view} onChange={handleViewChange} unreadCount={unread} />
    </div>
  );
}

export default function App() {
  return (
    <ConvexAuthProvider client={convex}>
      <AuthProvider>
        <Toaster
          position="top-center"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#fff',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        />
        <AppInner />
      </AuthProvider>
    </ConvexAuthProvider>
  );
}
