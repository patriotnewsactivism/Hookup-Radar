import { getAuthUserId } from "@convex-dev/auth/server";

export async function requireSurgeUser(ctx: any) {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) throw new Error("Unauthenticated");

  const profile = await ctx.db
    .query("surge_users")
    .withIndex("by_auth_id", (q: any) => q.eq("auth_id", authUserId))
    .first();

  if (!profile) throw new Error("Profile required");
  return profile;
}

export async function optionalSurgeUser(ctx: any) {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) return null;
  return await ctx.db
    .query("surge_users")
    .withIndex("by_auth_id", (q: any) => q.eq("auth_id", authUserId))
    .first();
}

export function profileId(profile: any): string {
  return profile._id.toString();
}

export function identityMatches(profile: any, candidate: string): boolean {
  return candidate === profileId(profile) || candidate === profile.auth_id;
}

export function requireProfileOwner(profile: any, targetId: unknown) {
  if (String(targetId) !== profileId(profile)) {
    throw new Error("Not authorized");
  }
}

export async function requireModerator(ctx: any) {
  const profile = await requireSurgeUser(ctx);
  if (profile.role !== "moderator" && profile.role !== "admin") {
    throw new Error("Not authorized");
  }
  return profile;
}

export async function requireAdmin(ctx: any) {
  const profile = await requireSurgeUser(ctx);
  if (profile.role !== "admin") throw new Error("Not authorized");
  return profile;
}

export function assertCoordinates(lat: number, lng: number) {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error("Invalid latitude");
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error("Invalid longitude");
  }
}

export function haversineFeet(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const radiusFeet = 20_902_231;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(radiusFeet * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function coarseCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toPublicProfile(user: any, distanceFeet?: number) {
  const {
    auth_id: _authId,
    auth_email: _authEmail,
    safe_contact_name: _safeContactName,
    safe_contact_info: _safeContactInfo,
    blocked_users: _blockedUsers,
    favorite_users: _favoriteUsers,
    lat,
    lng,
    ...publicFields
  } = user;

  return {
    ...publicFields,
    id: user._id,
    lat: coarseCoordinate(lat),
    lng: coarseCoordinate(lng),
    ...(user.show_distance && distanceFeet !== undefined
      ? { distance: distanceFeet }
      : {}),
  };
}
