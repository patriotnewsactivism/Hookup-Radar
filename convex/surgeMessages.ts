// convex/surgeMessages.ts
// Updated: notification triggered on every new message send

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const getByConversation = query({
  args: {
    conversation_id: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("surge_messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversation_id", args.conversation_id)
      )
      .collect();
    const limited = messages.slice(0, args.limit ?? 200);
    return limited.map((m) => ({ ...m, id: m._id }));
  },
});

export const send = mutation({
  args: {
    conversation_id: v.string(),
    sender_id:       v.string(),
    receiver_id:     v.string(),
    text:            v.string(),
    media_url:       v.optional(v.string()),
    media_type:      v.optional(v.string()),
    reply_to_id:     v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Insert the message
    const id = await ctx.db.insert("surge_messages", {
      conversation_id: args.conversation_id,
      sender_id:       args.sender_id,
      receiver_id:     args.receiver_id,
      text:            args.text,
      media_url:       args.media_url,
      media_type:      args.media_type,
      status:          "sent",
      is_deleted:      false,
      reply_to_id:     args.reply_to_id,
      created_date:    new Date().toISOString(),
    });

    // Look up sender display name for the notification
    const sender = await ctx.db
      .query("surge_users")
      .withIndex("by_auth_id", (q) => q.eq("auth_id", args.sender_id))
      .first();

    // Also try by _id string in case sender_id is the surge_users _id
    const senderById = !sender
      ? await ctx.db.query("surge_users").collect().then(
          (all) => all.find((u) => u._id.toString() === args.sender_id) ?? null
        )
      : null;

    const senderUser = sender ?? senderById;
    const senderName = senderUser?.display_name ?? senderUser?.username ?? "Someone";

    // Create notification for receiver (skip bots — IDs starting with "bot_")
    if (!args.receiver_id.startsWith("bot_")) {
      const preview = args.media_url
        ? args.media_type === "video" ? "🎥 sent a video" : "📷 sent a photo"
        : args.text.slice(0, 60);

      await ctx.db.insert("surge_notifications", {
        user_id:      args.receiver_id,
        type:         "message",
        title:        `💬 ${senderName}`,
        body:         preview,
        from_user_id: args.sender_id,
        entity_id:    args.conversation_id,
        is_read:      false,
        created_at:   new Date().toISOString(),
      });
    }

    const msg = await ctx.db.get(id);
    return { ...msg!, id };
  },
});

export const markRead = mutation({
  args: { id: v.id("surge_messages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "read" });
  },
});

export const getUnreadCount = query({
  args: { receiver_id: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("surge_messages")
      .withIndex("by_receiver_status", (q) =>
        q.eq("receiver_id", args.receiver_id).eq("status", "sent")
      )
      .collect();
    return unread.length;
  },
});

export const getConversations = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    const allMessages = await ctx.db.query("surge_messages").collect();
    const userMessages = allMessages.filter(
      (m) => m.sender_id === args.user_id || m.receiver_id === args.user_id
    );

    const convMap = new Map<
      string,
      { lastMessage: (typeof userMessages)[0]; otherUserId: string; unread: number }
    >();

    for (const m of userMessages) {
      const otherId =
        m.sender_id === args.user_id ? m.receiver_id : m.sender_id;
      const existing = convMap.get(m.conversation_id);
      if (!existing || m.created_date > existing.lastMessage.created_date) {
        convMap.set(m.conversation_id, {
          lastMessage: m,
          otherUserId: otherId,
          unread: existing
            ? existing.unread +
              (m.receiver_id === args.user_id && m.status !== "read" ? 1 : 0)
            : m.receiver_id === args.user_id && m.status !== "read"
            ? 1
            : 0,
        });
      }
    }

    return Array.from(convMap.entries()).map(([convId, data]) => ({
      id: convId,
      other_user_id: data.otherUserId,
      last_message: { ...data.lastMessage, id: data.lastMessage._id },
      unread_count: data.unread,
    }));
  },
});
