import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { identityMatches, profileId, requireSurgeUser } from "./security";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireSurgeUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireSurgeUser(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const saveMedia = mutation({
  args: {
    // Retained for client compatibility; ignored.
    user_id: v.string(),
    storage_id: v.id("_storage"),
    type: v.string(),
    filename: v.optional(v.string()),
    size: v.optional(v.number()),
    is_profile_photo: v.boolean(),
    album_id: v.optional(v.id("surge_albums")),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const userId = profileId(me);
    if (args.type !== "image" && args.type !== "video") {
      throw new Error("Unsupported media type");
    }
    if (args.size !== undefined && args.size < 0) throw new Error("Invalid media size");

    if (args.album_id) {
      const album = await ctx.db.get(args.album_id);
      if (!album || album.user_id !== userId) throw new Error("Not authorized");
    }

    const url = await ctx.storage.getUrl(args.storage_id);
    if (!url) throw new Error("Failed to get URL for uploaded file");

    if (args.is_profile_photo) {
      const existing = await ctx.db
        .query("surge_media")
        .withIndex("by_user_profile", (q) =>
          q.eq("user_id", userId).eq("is_profile_photo", true),
        )
        .collect();
      for (const media of existing) {
        await ctx.db.patch(media._id, { is_profile_photo: false });
      }
    }

    const existingCount = args.album_id
      ? (
          await ctx.db
            .query("surge_media")
            .withIndex("by_album", (q) => q.eq("album_id", args.album_id))
            .collect()
        ).length
      : 0;

    const mediaId = await ctx.db.insert("surge_media", {
      user_id: userId,
      storage_id: args.storage_id,
      url,
      type: args.type,
      filename: args.filename,
      size: args.size,
      is_profile_photo: args.is_profile_photo,
      album_id: args.album_id,
      sort_order: args.sort_order ?? existingCount,
      created_at: new Date().toISOString(),
    });

    if (args.is_profile_photo) {
      await ctx.db.patch(me._id, { photo_url: url });
    }

    if (args.album_id) {
      const album = await ctx.db.get(args.album_id);
      if (album) {
        const patch =
          args.type === "image"
            ? { photo_count: album.photo_count + 1 }
            : { video_count: album.video_count + 1 };
        await ctx.db.patch(args.album_id, patch);
        if (!album.cover_storage_id && args.type === "image") {
          await ctx.db.patch(args.album_id, { cover_storage_id: args.storage_id });
        }
      }
    }

    return { mediaId, storageId: args.storage_id, url };
  },
});

export const getByUser = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const media = await ctx.db
      .query("surge_media")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .collect();

    if (identityMatches(me, args.user_id)) return media;

    const publicMedia = [];
    for (const item of media) {
      if (!item.album_id) {
        publicMedia.push(item);
        continue;
      }
      const album = await ctx.db.get(item.album_id);
      if (album && !album.is_private) publicMedia.push(item);
    }
    return publicMedia;
  },
});

export const getByAlbum = query({
  args: { album_id: v.id("surge_albums") },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const album = await ctx.db.get(args.album_id);
    if (!album) return [];
    if (album.is_private && !identityMatches(me, album.user_id)) {
      throw new Error("Not authorized");
    }
    return await ctx.db
      .query("surge_media")
      .withIndex("by_album", (q) => q.eq("album_id", args.album_id))
      .collect();
  },
});

export const getProfilePhotos = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    await requireSurgeUser(ctx);
    const all = await ctx.db
      .query("surge_media")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .collect();
    return all.filter((media) => media.type === "image" && !media.album_id);
  },
});

export const deleteMedia = mutation({
  args: { media_id: v.id("surge_media") },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const media = await ctx.db.get(args.media_id);
    if (!media) throw new Error("Media not found");
    if (!identityMatches(me, media.user_id)) throw new Error("Not authorized");

    await ctx.storage.delete(media.storage_id);
    if (media.album_id) {
      const album = await ctx.db.get(media.album_id);
      if (album) {
        await ctx.db.patch(media.album_id, {
          ...(media.type === "image"
            ? { photo_count: Math.max(0, album.photo_count - 1) }
            : { video_count: Math.max(0, album.video_count - 1) }),
        });
      }
    }
    await ctx.db.delete(args.media_id);
  },
});

export const updateUserPhotoUrls = mutation({
  args: {
    // Retained for client compatibility; ignored.
    user_id: v.string(),
  },
  handler: async (ctx) => {
    const me = await requireSurgeUser(ctx);
    const userId = profileId(me);
    const media = await ctx.db
      .query("surge_media")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .collect();

    const photoUrls = media
      .filter((item) => item.type === "image" && !item.album_id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => item.url);

    await ctx.db.patch(me._id, {
      photo_urls: photoUrls,
      photo_url: photoUrls[0] ?? "",
    });
  },
});

export const createAlbum = mutation({
  args: {
    // Retained for client compatibility; ignored.
    user_id: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    is_private: v.boolean(),
  },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const name = args.name.trim();
    if (!name || name.length > 100) throw new Error("Invalid album name");
    return await ctx.db.insert("surge_albums", {
      user_id: profileId(me),
      name,
      description: args.description?.trim() || undefined,
      photo_count: 0,
      video_count: 0,
      is_private: args.is_private,
      created_at: new Date().toISOString(),
    });
  },
});

export const getAlbums = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    let albums = await ctx.db
      .query("surge_albums")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .collect();
    if (!identityMatches(me, args.user_id)) {
      albums = albums.filter((album) => !album.is_private);
    }

    const result = [];
    for (const album of albums) {
      const coverUrl = album.cover_storage_id
        ? await ctx.storage.getUrl(album.cover_storage_id)
        : null;
      result.push({ ...album, coverUrl });
    }
    return result;
  },
});

export const deleteAlbum = mutation({
  args: { album_id: v.id("surge_albums") },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const album = await ctx.db.get(args.album_id);
    if (!album) return;
    if (!identityMatches(me, album.user_id)) throw new Error("Not authorized");

    const media = await ctx.db
      .query("surge_media")
      .withIndex("by_album", (q) => q.eq("album_id", args.album_id))
      .collect();
    for (const item of media) {
      await ctx.storage.delete(item.storage_id);
      await ctx.db.delete(item._id);
    }
    await ctx.db.delete(args.album_id);
  },
});

export const sendMediaMessage = mutation({
  args: {
    conversation_id: v.string(),
    // Retained for client compatibility; ignored.
    sender_id: v.string(),
    receiver_id: v.string(),
    storage_id: v.id("_storage"),
    media_type: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const senderId = profileId(me);
    if (args.receiver_id === senderId) throw new Error("Invalid receiver");
    if (args.conversation_id !== [senderId, args.receiver_id].sort().join("_")) {
      throw new Error("Invalid conversation");
    }

    const ownedMedia = await ctx.db
      .query("surge_media")
      .withIndex("by_user", (q) => q.eq("user_id", senderId))
      .collect();
    if (!ownedMedia.some((media) => media.storage_id === args.storage_id)) {
      throw new Error("Not authorized");
    }

    const url = await ctx.storage.getUrl(args.storage_id);
    if (!url) throw new Error("Failed to get media URL");
    return await ctx.db.insert("surge_messages", {
      conversation_id: args.conversation_id,
      sender_id: senderId,
      receiver_id: args.receiver_id,
      text: args.media_type === "video" ? "Video" : "Photo",
      media_url: url,
      media_type: args.media_type,
      status: "sent",
      is_deleted: false,
      created_date: new Date().toISOString(),
    });
  },
});
