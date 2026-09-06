import { useState, useEffect, useCallback } from 'react';
import { users } from '../lib/surgeApi';

// Location with sane defaults:
// * Seeds from the profile's stored coordinates (set at onboarding) so the
//   grid/map are correct instantly.
// * watchPosition only refreshes a *live* fix in memory.
// * Writes the fresh fix to the DB ONLY when the user opted in to the map
//   (show_on_map) — users who skipped location never get junk coords pushed.
// * No hardcoded fallback coordinates and no third-party IP geolocation: if
//   there is no fix, lat/lng stay null and callers skip the "nearby" query.
export function useLocation(profile?: { id?: string; lat?: number; lng?: number; show_on_map?: boolean } | null) {
  const seededLat = profile && typeof profile.lat === 'number' && profile.lat !== 0 ? profile.lat : null;
  const seededLng = profile && typeof profile.lng === 'number' && profile.lng !== 0 ? profile.lng : null;

  const [lat, setLat] = useState<number | null>(seededLat);
  const [lng, setLng] = useState<number | null>(seededLng);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const updateLocation = users.updateLocation;

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    const canWrite = profile?.show_on_map !== false && !!profile?.id;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Out-of-range readings are junk — ignore them.
        if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;
        setLat(latitude);
        setLng(longitude);
        setLoading(false);

        if (canWrite) {
          try {
            updateLocation({
              id: profile!.id as any,
              lat: latitude,
              lng: longitude,
            }).catch((e) => console.warn('Failed to update location:', e));
          } catch (e) {
            console.warn('Failed to update location:', e);
          }
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        // Keep the seeded coordinates; never fabricate a location.
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [profile?.id, profile?.show_on_map, updateLocation]);

  return { lat, lng, error, loading };
}