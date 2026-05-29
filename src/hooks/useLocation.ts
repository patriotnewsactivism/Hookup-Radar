import { useState, useEffect, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function useLocation(profileId?: string) {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const updateLocation = useMutation(api.surgeUsers.updateLocation);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        setLoading(false);

        // Update location in Convex
        if (profileId) {
          try {
            await updateLocation({
              id: profileId as any,
              lat: latitude,
              lng: longitude,
            });
          } catch (e) {
            console.warn('Failed to update location:', e);
          }
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        // Fallback to IP geolocation
        fetch('https://ipapi.co/json/')
          .then(r => r.json())
          .then(d => {
            setLat(d.latitude);
            setLng(d.longitude);
          })
          .catch(() => {
            // Default coordinates
            setLat(32.3);
            setLng(-90.2);
          });
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [profileId]);

  return { lat, lng, error, loading };
}
