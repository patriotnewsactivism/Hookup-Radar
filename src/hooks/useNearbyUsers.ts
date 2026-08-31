import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { SurgeUser, Orientation } from '../types';
import { getBotsForArea } from '../lib/bots';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 20902231;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export interface Filters {
  orientation?: string[];
  looking_for?: string[];
  kinks?: string[];
  gender?: string[];
  body_type?: string[];
  ethnicity?: string[];
  max_distance?: number;
  min_age?: number;
  max_age?: number;
  online_only?: boolean;
  verified_only?: boolean;
}

export function useNearbyUsers(
  myLat: number | null,
  myLng: number | null,
  filters?: Filters,
  myOrientation?: Orientation
) {
  const rawUsers = useQuery(
    api.surgeUsers.getNearby,
    myLat !== null && myLng !== null
      ? {
          // Kept for the compatibility validator. The backend ignores these
          // coordinates and derives the origin from the authenticated profile.
          lat: myLat,
          lng: myLng,
          radius: 0.15,
          onlineOnly: filters?.online_only,
          minAge: filters?.min_age,
          maxAge: filters?.max_age,
        }
      : 'skip'
  );

  const loading = rawUsers === undefined;

  const users = useMemo(() => {
    if (!rawUsers || myLat === null || myLng === null) return [];

    let results = (rawUsers as SurgeUser[]).map((user) => ({
      ...user,
      // Prefer the distance calculated from exact coordinates on the server.
      // Public coordinates are intentionally coarse and must not be used to
      // reconstruct a user's precise position.
      distance:
        typeof user.distance === 'number'
          ? user.distance
          : haversineDistance(myLat, myLng, user.lat, user.lng),
    }));

    if (filters?.max_distance) {
      results = results.filter((user) => (user.distance ?? 0) <= filters.max_distance!);
    }
    if (filters?.orientation?.length) {
      results = results.filter((user) => filters.orientation!.includes(user.orientation));
    }
    if (filters?.gender?.length) {
      results = results.filter((user) => filters.gender!.includes(user.gender));
    }
    if (filters?.looking_for?.length) {
      results = results.filter((user) =>
        user.looking_for?.some((value) => filters.looking_for!.includes(value))
      );
    }
    if (filters?.kinks?.length) {
      results = results.filter((user) =>
        user.kinks?.some((value) => filters.kinks!.includes(value))
      );
    }
    if (filters?.body_type?.length) {
      results = results.filter((user) => filters.body_type!.includes(user.body_type));
    }
    if (filters?.ethnicity?.length) {
      results = results.filter((user) => filters.ethnicity!.includes(user.ethnicity));
    }
    if (filters?.verified_only) {
      results = results.filter((user) => user.is_verified);
    }

    const bots = getBotsForArea(myLat, myLng, myOrientation).map((bot) => ({
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
  real.forEach((user, index) => {
    result.push(user);
    if ((index + 1) % every === 0 && botIdx < bots.length) result.push(bots[botIdx++]);
  });
  while (botIdx < bots.length) result.push(bots[botIdx++]);
  return result;
}
