import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get the current authenticated user's profile
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    // The auth_id stored in surge_users matches the Convex user ID
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
    const user = await ctx.db
      .query("surge_users")
      .withIndex("by_auth_id", (q) => q.eq("auth_id", args.auth_id))
      .first();
    if (!user) return null;
    return { ...user, id: user._id };
  },
});

export const getById = query({
  args: { id: v.id("surge_users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    return { ...user, id: user._id };
  },
});

export const getNearby = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radius: v.optional(v.number()),
    onlineOnly: v.optional(v.boolean()),
    minAge: v.optional(v.number()),
    maxAge: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const r = args.radius ?? 0.15;
    const allUsers = await ctx.db
      .query("surge_users")
      .withIndex("by_location", (q) => q.eq("show_on_map", true))
      .collect();

    let filtered = allUsers.filter(
      (u) =>
        u.lat > args.lat - r &&
        u.lat < args.lat + r &&
        u.lng > args.lng - r &&
        u.lng < args.lng + r
    );

    if (args.onlineOnly) filtered = filtered.filter((u) => u.is_online);
    if (args.minAge) filtered = filtered.filter((u) => u.age >= args.minAge!);
    if (args.maxAge) filtered = filtered.filter((u) => u.age <= args.maxAge!);

    return filtered.slice(0, 200).map((u) => ({ ...u, id: u._id }));
  },
});

export const create = mutation({
  args: {
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
    // Use authenticated user's ID if auth_id not explicitly provided
    const userId = await getAuthUserId(ctx);
    const authId = args.auth_id || userId || "anonymous";
    const id = await ctx.db.insert("surge_users", {
      ...args,
      auth_id: authId,
      last_seen: new Date().toISOString(),
      is_online: true,
      is_anonymous: false,
      is_verified: false,
      is_premium: false,
      blocked_users: [],
      favorite_users: [],
      profile_views: 0,
      show_distance: true,
      show_on_map: true,
    });
    const user = await ctx.db.get(id);
    return { ...user!, id };
  },
});

export const update = mutation({
  args: {
    id: v.id("surge_users"),
    // Accept any partial user fields
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
    const { id, ...data } = args;
    // Remove undefined values
    const patch: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) patch[k] = v;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(id, patch);
    }
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
    await ctx.db.patch(args.id, {
      lat: args.lat,
      lng: args.lng,
      is_online: true,
      last_seen: new Date().toISOString(),
    });
  },
});

export const incrementViews = mutation({
  args: { id: v.id("surge_users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (user) {
      await ctx.db.patch(args.id, {
        profile_views: (user.profile_views ?? 0) + 1,
      });
    }
  },
});
