// convex/surgeNotifications.ts
// ─────────────────────────────────────────────────────────────
//  Notification system for Surge / Hookup-Radar
//  Handles creating, reading, and marking notifications as read.
// ─────────────────────────────────────────────────────────────

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── List my notifications (newest first, max 50) ─────────────
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const me = await ctx.db
      .query("surge_users")
      .withIndex("by_auth_id", (q) => q.eq("auth_id", userId))
      .first();
    if (!me) return [];

    const notifications = await ctx.db
      .query("surge_notifications")
      .withIndex("by_user", (q) => q.eq("user_id", me._id.toString()))
      .order("desc")
      .take(args.limit ?? 50);

    return notifications.map((n) => ({ ...n, id: n._id }));
  },
});

// ── Unread count ─────────────────────────────────────────────
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const me = await ctx.db
      .query("surge_users")
      .withIndex("by_auth_id", (q) => q.eq("auth_id", userId))
      .first();
    if (!me) return 0;

    const unread = await ctx.db
      .query("surge_notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("user_id", me._id.toString()).eq("is_read", false)
      )
      .collect();

    return unread.length;
  },
});

// ── Mark a single notification as read ───────────────────────
export const markRead = mutation({
  args: { id: v.id("surge_notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { is_read: true });
  },
});

// ── Mark ALL my notifications as read ────────────────────────
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const me = await ctx.db
      .query("surge_users")
      .withIndex("by_auth_id", (q) => q.eq("auth_id", userId))
      .first();
    if (!me) return;

    const unread = await ctx.db
      .query("surge_notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("user_id", me._id.toString()).eq("is_read", false)
      )
      .collect();

    await Promise.all(unread.map((n) => ctx.db.patch(n._id, { is_read: true })));
  },
});

// ── Internal helper — create a notification (call from other mutations) ──
export const create = mutation({
  args: {
    user_id:      v.string(),
    type:         v.string(),
    title:        v.string(),
    body:         v.string(),
    from_user_id: v.optional(v.string()),
    entity_id:    v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("surge_notifications", {
      ...args,
      is_read:    false,
      created_at: new Date().toISOString(),
    });
  },
});

// ── Triggered when a message is sent — call this from surgeMessages.send ──
//    Usage: await ctx.runMutation(api.surgeNotifications.onNewMessage, { … })
export const onNewMessage = mutation({
  args: {
    receiver_id:   v.string(), // surge_users _id string
    sender_name:   v.string(),
    sender_id:     v.string(),
    conversation_id: v.string(),
    preview:       v.string(), // first 60 chars of message
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("surge_notifications", {
      user_id:      args.receiver_id,
      type:         "message",
      title:        `💬 ${args.sender_name}`,
      body:         args.preview.slice(0, 60),
      from_user_id: args.sender_id,
      entity_id:    args.conversation_id,
      is_read:      false,
      created_at:   new Date().toISOString(),
    });
  },
});

// ── Triggered when someone views a profile (call from incrementViews) ──
export const onProfileView = mutation({
  args: {
    profile_owner_id: v.string(),
    viewer_name:      v.string(),
    viewer_id:        v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("surge_notifications", {
      user_id:      args.profile_owner_id,
      type:         "profile_view",
      title:        "👀 Someone checked you out",
      body:         `${args.viewer_name} viewed your profile`,
      from_user_id: args.viewer_id,
      is_read:      false,
      created_at:   new Date().toISOString(),
    });
  },
});

// ── Triggered when a nearby user comes online ─────────────────
export const onNearbyUser = mutation({
  args: {
    recipient_id: v.string(),
    user_name:    v.string(),
    user_id:      v.string(),
    distance_ft:  v.number(),
  },
  handler: async (ctx, args) => {
    const miles = (args.distance_ft / 5280).toFixed(1);
    await ctx.db.insert("surge_notifications", {
      user_id:      args.recipient_id,
      type:         "nearby",
      title:        "⚡ Someone's nearby",
      body:         `${args.user_name} is ${miles} mi away and just came online`,
      from_user_id: args.user_id,
      is_read:      false,
      created_at:   new Date().toISOString(),
    });
  },
});

// ── Triggered when a Spot event is created near user ─────────
export const onNewSpotEvent = mutation({
  args: {
    recipient_id: v.string(),
    event_title:  v.string(),
    spot_name:    v.string(),
    event_id:     v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("surge_notifications", {
      user_id:    args.recipient_id,
      type:       "event",
      title:      `🎉 New event at ${args.spot_name}`,
      body:       args.event_title,
      entity_id:  args.event_id,
      is_read:    false,
      created_at: new Date().toISOString(),
    });
  },
});
