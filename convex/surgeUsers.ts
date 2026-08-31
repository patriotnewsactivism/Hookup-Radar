import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  assertCoordinates,
  haversineFeet,
  profileId,
  requireProfileOwner,
  requireSurgeUser,
  toPublicProfile,
} from "./security";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db
      .query("surge_users")
      .withIndex("by_auth_id", (q) => q.eq("auth_id", userId))
      .first();
    if (!user) return null;
    return { ...user, id: user._id };
  },
});

export const getByAuthId = query({
  args: { auth_id: v.string() },
  handler: async (ctx, args) => {
    await requireSurgeUser(ctx);
    const user = await ctx.db
      .query("surge_users")
      .withIndex("by_auth_id", (q) => q.eq("auth_id", args.auth_id))
      .first();
    return user ? toPublicProfile(user) : null;
  },
});

export const getById = query({
  args: { id: v.id("surge_users") },
  handler: async (ctx, args) => {
    await requireSurgeUser(ctx);
    const user = await ctx.db.get(args.id);
    return user ? toPublicProfile(user) : null;
  },
});

export const getNearby = query({
  args: {
    // Retained temporarily for client compatibility. The server deliberately
    // ignores caller-provided coordinates and derives origin from the session.
    lat: v.number(),
    lng: v.number(),
    radius: v.optional(v.number()),
    onlineOnly: v.optional(v.boolean()),
    minAge: v.optional(v.number()),
    maxAge: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    assertCoordinates(me.lat, me.lng);

    const radius = Math.min(Math.max(args.radius ?? 0.15, 0.005), 1);
    const allUsers = await ctx.db
      .query("surge_users")
      .withIndex("by_location", (q) => q.eq("show_on_map", true))
      .collect();

    let filtered = allUsers.filter(
      (user) =>
        user._id !== me._id &&
        !me.blocked_users.includes(user._id.toString()) &&
        user.lat > me.lat - radius &&
        user.lat < me.lat + radius &&
        user.lng > me.lng - radius &&
        user.lng < me.lng + radius,
    );

    if (args.onlineOnly) filtered = filtered.filter((user) => user.is_online);
    if (args.minAge !== undefined) {
      filtered = filtered.filter((user) => user.age >= args.minAge!);
    }
    if (args.maxAge !== undefined) {
      filtered = filtered.filter((user) => user.age <= args.maxAge!);
    }

    return filtered.slice(0, 200).map((user) =>
      toPublicProfile(
        user,
        haversineFeet(me.lat, me.lng, user.lat, user.lng),
      ),
    );
  },
});

export const create = mutation({
  args: {
    // These two legacy fields are ignored. Identity is server-derived.
    auth_id: v.optional(v.string()),
    auth_email: v.optional(v.string()),
    username: v.string(),
    display_name: v.string(),
    age: v.number(),
    bio: v.string(),
    gender: v.string(),
    orientation: v.string(),
    lifestyle: v.string(),
    position: v.string(),
    height: v.string(),
    weight: v.string(),
    body_type: v.string(),
    ethnicity: v.string(),
    health_status: v.string(),
    looking_for: v.array(v.string()),
    kinks: v.array(v.string()),
    tags: v.array(v.string()),
    fantasies: v.string(),
    photo_url: v.string(),
    photo_urls: v.array(v.string()),
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Unauthenticated");

    const existingProfile = await ctx.db
      .query("surge_users")
      .withIndex("by_auth_id", (q) => q.eq("auth_id", authUserId))
      .first();
    if (existingProfile) throw new Error("Profile already exists");

    const username = args.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,32}$/.test(username)) {
      throw new Error("Invalid username");
    }
    if (args.age < 18 || args.age > 99) throw new Error("Invalid age");

    const usernameTaken = await ctx.db
      .query("surge_users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    if (usernameTaken) throw new Error("Username already in use");

    const authUser = await ctx.db.get(authUserId);
    const {
      auth_id: _ignoredAuthId,
      auth_email: _ignoredAuthEmail,
      lat: _ignoredLat,
      lng: _ignoredLng,
      ...profileFields
    } = args;

    const id = await ctx.db.insert("surge_users", {
      ...profileFields,
      username,
      auth_id: authUserId,
      auth_email: typeof authUser?.email === "string" ? authUser.email : undefined,
      lat: 0,
      lng: 0,
      last_seen: new Date().toISOString(),
      is_online: true,
      is_anonymous: false,
      is_verified: false,
      role: "user",
      is_premium: false,
      blocked_users: [],
      favorite_users: [],
      profile_views: 0,
      show_distance: true,
      show_on_map: false,
    });

    const user = await ctx.db.get(id);
    return { ...user!, id };
  },
});

export const update = mutation({
  args: {
    id: v.id("surge_users"),
    display_name: v.optional(v.string()),
    bio: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    orientation: v.optional(v.string()),
    lifestyle: v.optional(v.string()),
    position: v.optional(v.string()),
    height: v.optional(v.string()),
    weight: v.optional(v.string()),
    body_type: v.optional(v.string()),
    ethnicity: v.optional(v.string()),
    health_status: v.optional(v.string()),
    looking_for: v.optional(v.array(v.string())),
    kinks: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    fantasies: v.optional(v.string()),
    photo_url: v.optional(v.string()),
    photo_urls: v.optional(v.array(v.string())),
    show_on_map: v.optional(v.boolean()),
    show_distance: v.optional(v.boolean()),
    is_anonymous: v.optional(v.boolean()),
    is_online: v.optional(v.boolean()),
    blocked_users: v.optional(v.array(v.string())),
    favorite_users: v.optional(v.array(v.string())),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    requireProfileOwner(me, args.id);

    if (args.age !== undefined && (args.age < 18 || args.age > 99)) {
      throw new Error("Invalid age");
    }
    if (args.lat !== undefined || args.lng !== undefined) {
      assertCoordinates(args.lat ?? me.lat, args.lng ?? me.lng);
    }

    const { id, ...data } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) patch[key] = value;
    }
    if (Object.keys(patch).length > 0) await ctx.db.patch(id, patch);

    const user = await ctx.db.get(id);
    return { ...user!, id: user!._id };
  },
});

export const updateLocation = mutation({
  args: {
    id: v.id("surge_users"),
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    requireProfileOwner(me, args.id);
    assertCoordinates(args.lat, args.lng);

    await ctx.db.patch(args.id, {
      lat: args.lat,
      lng: args.lng,
      is_online: true,
      last_seen: new Date().toISOString(),
    });
  },
});

export const incrementViews = mutation({
  args: {
    id: v.id("surge_users"),
    // Legacy input retained for compatibility but never trusted.
    viewer_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireSurgeUser(ctx);
    const target = await ctx.db.get(args.id);
    if (!target || target._id === viewer._id) return;

    await ctx.db.patch(args.id, {
      profile_views: (target.profile_views ?? 0) + 1,
    });

    await ctx.db.insert("surge_notifications", {
      user_id: profileId(target),
      type: "profile_view",
      title: "Someone checked you out",
      body: `${viewer.display_name || viewer.username} viewed your profile`,
      from_user_id: profileId(viewer),
      is_read: false,
      created_at: new Date().toISOString(),
    });
  },
});
