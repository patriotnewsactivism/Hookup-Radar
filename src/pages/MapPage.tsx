import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../contexts/AuthContext';
import { useNearbyUsers } from '../hooks/useNearbyUsers';
import { useLocation } from '../hooks/useLocation';
import { UserProfileModal } from '../components/UserProfileModal';
import { RightNowFeed } from '../components/RightNowFeed';
import { SurgeUser } from '../types';
import { Crosshair, Layers } from 'lucide-react';

const CARTO_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

function userIcon(user: SurgeUser, isMe: boolean) {
  const online = user.is_online;
  const rightNow = user.looking_for?.includes('Right Now');
  const border = isMe ? '#a855f7' : rightNow ? '#ef4444' : online ? '#22c55e' : '#6b7280';
  const bg = user.photo_url && !user.is_anonymous
    ? `url(${user.photo_url})`
    : `linear-gradient(135deg, #7c3aed, #ec4899)`;

  return L.divIcon({
    className: '',
    iconSize: [isMe ? 44 : 36, isMe ? 44 : 36],
    iconAnchor: [isMe ? 22 : 18, isMe ? 22 : 18],
    html: `<div style="
      width:${isMe ? 44 : 36}px;height:${isMe ? 44 : 36}px;
      border-radius:50%;border:3px solid ${border};
      background:${bg};background-size:cover;background-position:center;
      box-shadow:0 0 ${rightNow ? '12px rgba(239,68,68,0.6)' : '6px rgba(0,0,0,0.5)'};
      display:flex;align-items:center;justify-content:center;
      font-size:${isMe ? 16 : 12}px;color:white;font-weight:bold;
    ">${user.photo_url && !user.is_anonymous ? '' : (user.display_name || '?')[0]}</div>`,
  });
}

export function MapPage() {
  const { profile } = useAuth();
  const { lat, lng } = useLocation();
  const { users } = useNearbyUsers(lat, lng);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<SurgeUser | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [lat || 32.3, lng || -90.2],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer(CARTO_DARK, { maxZoom: 19 }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update map center when location changes
  useEffect(() => {
    if (mapRef.current && lat && lng) {
      mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    }
  }, [lat, lng]);

  // Update markers
  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();

    // Add "me" marker
    if (profile && lat && lng) {
      const me = { ...profile, lat, lng } as SurgeUser;
      L.marker([lat, lng], { icon: userIcon(me, true) }).addTo(markersRef.current);
    }

    // Add nearby users
    users.forEach(u => {
      if (!u.lat || !u.lng) return;
      if (u.id === profile?.id) return;
      const marker = L.marker([u.lat, u.lng], { icon: userIcon(u, false) });
      marker.on('click', () => setSelected(u));
      marker.addTo(markersRef.current!);
    });
  }, [users, profile, lat, lng]);

  const recenter = () => {
    if (mapRef.current && lat && lng) {
      mapRef.current.flyTo([lat, lng], 14, { duration: 0.5 });
    }
  };

  return (
    <div className="relative h-full">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Right Now strip */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
        <RightNowFeed onSelectUser={setSelected} />
      </div>

      {/* Recenter button */}
      <button onClick={recenter} className="absolute bottom-4 right-4 z-10 bg-gray-900/90 backdrop-blur border border-white/10 rounded-2xl p-3 hover:bg-purple-900/50 transition-colors">
        <Crosshair size={20} className="text-white" />
      </button>

      {/* Online count */}
      <div className="absolute top-3 right-3 z-10 bg-gray-900/80 backdrop-blur rounded-full px-3 py-1.5 text-xs text-purple-400 font-bold border border-white/10">
        {users.filter(u => u.is_online).length} online nearby
      </div>

      {/* Profile modal */}
      {selected && (
        <UserProfileModal user={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
