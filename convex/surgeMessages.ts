import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { profileId, requireSurgeUser } from "./security";

function expectedConversationId(firstId: string, secondId: string) {
  return [firstId, secondId].sort().join("_");
}

export const getByConversation = query({
  args: {
    conversation_id: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const myId = profileId(me);
    const messages = await ctx.db
      .query("surge_messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversation_id", args.conversation_id),
      )
      .collect();

    const visible = messages.filter(
      (message) => message.sender_id === myId || message.receiver_id === myId,
    );
    return visible.slice(0, Math.min(args.limit ?? 200, 200)).map((message) => ({
      ...message,
      id: message._id,
    }));
  },
});

export const send = mutation({
  args: {
    conversation_id: v.string(),
    // Retained for client compatibility; ignored in favor of the session actor.
    sender_id: v.string(),
    receiver_id: v.string(),
    text: v.string(),
    media_url: v.optional(v.string()),
    media_type: v.optional(v.string()),
    reply_to_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const senderId = profileId(me);
    if (!args.receiver_id || args.receiver_id === senderId) {
      throw new Error("Invalid receiver");
    }
    if (
      args.conversation_id !==
      expectedConversationId(senderId, args.receiver_id)
    ) {
      throw new Error("Invalid conversation");
    }

    const text = args.text.trim();
    if (!text && !args.media_url) throw new Error("Message is empty");
    if (text.length > 5000) throw new Error("Message is too long");

    const id = await ctx.db.insert("surge_messages", {
      conversation_id: args.conversation_id,
      sender_id: senderId,
      receiver_id: args.receiver_id,
      text,
      media_url: args.media_url,
      media_type: args.media_type,
      status: "sent",
      is_deleted: false,
      reply_to_id: args.reply_to_id,
      created_date: new Date().toISOString(),
    });

    if (!args.receiver_id.startsWith("bot_")) {
      await ctx.db.insert("surge_notifications", {
        user_id: args.receiver_id,
        type: "message",
        title: `Message from ${me.display_name || me.username}`,
        body: args.media_url
          ? args.media_type === "video"
            ? "Sent a video"
            : "Sent a photo"
          : text.slice(0, 60),
        from_user_id: senderId,
        entity_id: args.conversation_id,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    const message = await ctx.db.get(id);
    return { ...message!, id };
  },
});

// Client-side demo bots may request a synthetic reply, but the authenticated
// user can only synthesize a bot as the sender to their own conversation.
export const sendBotReply = mutation({
  args: {
    conversation_id: v.string(),
    bot_id: v.string(),
    receiver_id: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const myId = profileId(me);
    if (!args.bot_id.startsWith("bot_")) throw new Error("Invalid bot");
    if (args.receiver_id !== myId) throw new Error("Not authorized");
    if (
      args.conversation_id !== expectedConversationId(args.bot_id, myId)
    ) {
      throw new Error("Invalid conversation");
    }

    const text = args.text.trim();
    if (!text || text.length > 5000) throw new Error("Invalid message");

    const id = await ctx.db.insert("surge_messages", {
      conversation_id: args.conversation_id,
      sender_id: args.bot_id,
      receiver_id: myId,
      text,
      status: "sent",
      is_deleted: false,
      created_date: new Date().toISOString(),
    });
    const message = await ctx.db.get(id);
    return { ...message!, id };
  },
});

export const markRead = mutation({
  args: { id: v.id("surge_messages") },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const message = await ctx.db.get(args.id);
    if (!message) return;
    if (message.receiver_id !== profileId(me)) throw new Error("Not authorized");
    await ctx.db.patch(args.id, { status: "read" });
  },
});

export const getUnreadCount = query({
  args: {
    // Legacy input retained but ignored.
    receiver_id: v.string(),
  },
  handler: async (ctx) => {
    const me = await requireSurgeUser(ctx);
    const unread = await ctx.db
      .query("surge_messages")
      .withIndex("by_receiver_status", (q) =>
        q.eq("receiver_id", profileId(me)).eq("status", "sent"),
      )
      .collect();
    return unread.length;
  },
});

export const getConversations = query({
  args: {
    // Legacy input retained but ignored.
    user_id: v.string(),
  },
  handler: async (ctx) => {
    const me = await requireSurgeUser(ctx);
    const myId = profileId(me);
    const allMessages = await ctx.db.query("surge_messages").collect();
    const userMessages = allMessages.filter(
      (message) =>
        message.sender_id === myId || message.receiver_id === myId,
    );

    const conversationMap = new Map<
      string,
      { lastMessage: (typeof userMessages)[0]; otherUserId: string; unread: number }
    >();

    for (const message of userMessages) {
      const otherId =
        message.sender_id === myId ? message.receiver_id : message.sender_id;
      const existing = conversationMap.get(message.conversation_id);
      const unreadIncrement =
        message.receiver_id === myId && message.status !== "read" ? 1 : 0;

      if (!existing) {
        conversationMap.set(message.conversation_id, {
          lastMessage: message,
          otherUserId: otherId,
          unread: unreadIncrement,
        });
        continue;
      }

      existing.unread += unreadIncrement;
      if (message.created_date > existing.lastMessage.created_date) {
        existing.lastMessage = message;
      }
    }

    return Array.from(conversationMap.entries()).map(([conversationId, data]) => ({
      id: conversationId,
      other_user_id: data.otherUserId,
      last_message: { ...data.lastMessage, id: data.lastMessage._id },
      unread_count: data.unread,
    }));
  },
});
