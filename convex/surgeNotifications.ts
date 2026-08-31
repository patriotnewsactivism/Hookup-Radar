import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { profileId, requireSurgeUser } from "./security";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const notifications = await ctx.db
      .query("surge_notifications")
      .withIndex("by_user", (q) => q.eq("user_id", profileId(me)))
      .order("desc")
      .take(Math.min(args.limit ?? 50, 100));
    return notifications.map((notification) => ({
      ...notification,
      id: notification._id,
    }));
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireSurgeUser(ctx);
    const unread = await ctx.db
      .query("surge_notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("user_id", profileId(me)).eq("is_read", false),
      )
      .collect();
    return unread.length;
  },
});

export const markRead = mutation({
  args: { id: v.id("surge_notifications") },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const notification = await ctx.db.get(args.id);
    if (!notification) return;
    if (notification.user_id !== profileId(me)) throw new Error("Not authorized");
    await ctx.db.patch(args.id, { is_read: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await requireSurgeUser(ctx);
    const unread = await ctx.db
      .query("surge_notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("user_id", profileId(me)).eq("is_read", false),
      )
      .collect();
    await Promise.all(
      unread.map((notification) =>
        ctx.db.patch(notification._id, { is_read: true }),
      ),
    );
  },
});

// Notification production is server-internal. Browser clients cannot forge
// arbitrary messages, profile views, proximity alerts, strikes, or event alerts.
export const create = internalMutation({
  args: {
    user_id: v.string(),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    from_user_id: v.optional(v.string()),
    entity_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("surge_notifications", {
      ...args,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  },
});

export const onNewMessage = internalMutation({
  args: {
    receiver_id: v.string(),
    sender_name: v.string(),
    sender_id: v.string(),
    conversation_id: v.string(),
    preview: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("surge_notifications", {
      user_id: args.receiver_id,
      type: "message",
      title: `Message from ${args.sender_name}`,
      body: args.preview.slice(0, 60),
      from_user_id: args.sender_id,
      entity_id: args.conversation_id,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  },
});

export const onProfileView = internalMutation({
  args: {
    profile_owner_id: v.string(),
    viewer_name: v.string(),
    viewer_id: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("surge_notifications", {
      user_id: args.profile_owner_id,
      type: "profile_view",
      title: "Someone checked you out",
      body: `${args.viewer_name} viewed your profile`,
      from_user_id: args.viewer_id,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  },
});

export const onNearbyUser = internalMutation({
  args: {
    recipient_id: v.string(),
    user_name: v.string(),
    user_id: v.string(),
    distance_ft: v.number(),
  },
  handler: async (ctx, args) => {
    const miles = (args.distance_ft / 5280).toFixed(1);
    await ctx.db.insert("surge_notifications", {
      user_id: args.recipient_id,
      type: "nearby",
      title: "Someone is nearby",
      body: `${args.user_name} is ${miles} mi away and just came online`,
      from_user_id: args.user_id,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  },
});

export const onNewSpotEvent = internalMutation({
  args: {
    recipient_id: v.string(),
    event_title: v.string(),
    spot_name: v.string(),
    event_id: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("surge_notifications", {
      user_id: args.recipient_id,
      type: "event",
      title: `New event at ${args.spot_name}`,
      body: args.event_title,
      entity_id: args.event_id,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  },
});
