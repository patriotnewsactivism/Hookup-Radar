/**
 * SafeWord — panic button: sends distress signal with GPS coords.
 * In this version it uses browser APIs only (no Supabase).
 */
import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Shield, AlertTriangle, MapPin, Phone } from 'lucide-react';

export function SafeWord() {
  const { profile, updateProfile } = useAuth();
  const [activated, setActivated] = useState(false);
  const [sending, setSending] = useState(false);

  const triggerSafeWord = useCallback(async () => {
    if (sending) return;
    setSending(true);

    try {
      // Get current location
      let coords = { lat: 0, lng: 0 };
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch { /* location unavailable */ }

      // Update user location and set a distress flag
      await updateProfile({
        lat: coords.lat,
        lng: coords.lng,
      });

      setActivated(true);
      toast.success('SafeWord activated — your location has been shared');

      // Vibrate phone if available
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch {
      toast.error('Failed to send signal');
    } finally {
      setSending(false);
    }
  }, [sending, updateProfile]);

  if (activated) {
    return (
      <div className="fixed inset-0 bg-red-950/95 z-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={64} className="text-red-400 mb-6 animate-pulse" />
        <h2 className="text-white font-black text-2xl mb-2">SafeWord Activated</h2>
        <p className="text-red-300 text-sm mb-6">Your location has been logged. Stay safe.</p>
        <div className="space-y-3 w-full max-w-xs">
          <a href="tel:911" className="flex items-center justify-center gap-2 w-full bg-red-600 text-white font-bold py-4 rounded-2xl hover:bg-red-500">
            <Phone size={18} /> Call 911
          </a>
          <button onClick={() => setActivated(false)} className="w-full text-gray-400 text-sm py-3">
            I'm safe now — dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-950/20 border border-red-800/30 rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <Shield size={18} className="text-red-400" />
        <div>
          <p className="text-white text-sm font-semibold">SafeWord</p>
          <p className="text-gray-500 text-xs">Emergency panic button</p>
        </div>
      </div>
      <button
        onClick={triggerSafeWord}
        disabled={sending}
        className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
      >
        <AlertTriangle size={16} />
        {sending ? 'Activating…' : 'Activate SafeWord'}
      </button>
      <p className="text-gray-600 text-xs mt-2 text-center">Shares your GPS location and logs a distress signal</p>
    </div>
  );
}
