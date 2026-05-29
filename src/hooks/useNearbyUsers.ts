import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { SurgeUser, Orientation } from '../types';
import { getBotsForArea, BOT_IDS_PREFIX } from '../lib/bots';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 20902231; // feet
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export interface Filters {
  orientation?: string[];
  looking_for?: string[];
  kinks?: string[];
  gender?: string[];
  max_distance?: number; // feet
  min_age?: number;
  max_age?: number;
  online_only?: boolean;
}

export function useNearbyUsers(
  myLat: number | null,
  myLng: number | null,
  filters?: Filters,
  myOrientation?: Orientation
) {
  // Convex reactive query for nearby users
  const rawUsers = useQuery(
    api.surgeUsers.getNearby,
    myLat && myLng
      ? {
          lat: myLat,
          lng: myLng,
          radius: 0.15,
          onlineOnly: filters?.online_only,
          minAge: filters?.min_age,
          maxAge: filters?.max_age,
        }
      : "skip"
  );

  const loading = rawUsers === undefined;

  const users = useMemo(() => {
    if (!rawUsers || !myLat || !myLng) return [];

    let results = (rawUsers as SurgeUser[]).map(u => ({
      ...u,
      distance: haversineDistance(myLat, myLng, u.lat, u.lng)
    }));

    // Apply client-side filters
    if (filters?.max_distance) {
      results = results.filter(u => (u.distance ?? 0) <= filters.max_distance!);
    }
    if (filters?.orientation?.length) {
      results = results.filter(u => filters.orientation!.includes(u.orientation));
    }
    if (filters?.gender?.length) {
      results = results.filter(u => filters.gender!.includes(u.gender));
    }
    if (filters?.looking_for?.length) {
      results = results.filter(u => u.looking_for?.some(lf => filters.looking_for!.includes(lf)));
    }
    if (filters?.kinks?.length) {
      results = results.filter(u => u.kinks?.some(k => filters.kinks!.includes(k)));
    }

    // Inject orientation-matched bots
    const bots = getBotsForArea(myLat, myLng, myOrientation).map(bot => ({
      ...bot,
      distance: haversineDistance(myLat, myLng, bot.lat, bot.lng),
    })) as SurgeUser[];

    const combined = interleave(results, bots, results.length < 5 ? 1 : 4);
    combined.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

    return combined;
  }, [rawUsers, myLat, myLng, filters, myOrientation]);

  return { users, loading, refetch: () => {} };
}

function interleave(real: SurgeUser[], bots: SurgeUser[], every: number): SurgeUser[] {
  if (bots.length === 0) return real;
  const result: SurgeUser[] = [];
  let botIdx = 0;
  real.forEach((u, i) => {
    result.push(u);
    if ((i + 1) % every === 0 && botIdx < bots.length) {
      result.push(bots[botIdx++]);
    }
  });
  while (botIdx < bots.length) result.push(bots[botIdx++]);
  return result;
}
