import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate an upload URL for the client to upload a file directly
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get a serving URL for a storage ID
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Store media metadata after upload
export const saveMedia = mutation({
  args: {
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
    // Get the URL for the stored file
    const url = await ctx.storage.getUrl(args.storage_id);
    if (!url) throw new Error("Failed to get URL for uploaded file");

    // If this is being set as profile photo, unset existing ones
    if (args.is_profile_photo) {
      const existing = await ctx.db
        .query("surge_media")
        .withIndex("by_user_profile", (q) =>
          q.eq("user_id", args.user_id).eq("is_profile_photo", true)
        )
        .collect();
      for (const media of existing) {
        await ctx.db.patch(media._id, { is_profile_photo: false });
      }
    }

    // Count existing media for sort order
    const existingCount = args.album_id
      ? (await ctx.db
          .query("surge_media")
          .withIndex("by_album", (q) => q.eq("album_id", args.album_id))
          .collect()).length
      : 0;

    const mediaId = await ctx.db.insert("surge_media", {
      user_id: args.user_id,
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

    // Update user's photo_url if profile photo
    if (args.is_profile_photo) {
      const user = await ctx.db
        .query("surge_users")
        .filter((q) => q.eq(q.field("_id"), args.user_id as any))
        .first();
      if (user) {
        await ctx.db.patch(user._id, { photo_url: url });
      }
    }

    // Update album counts
    if (args.album_id) {
      const album = await ctx.db.get(args.album_id);
      if (album) {
        if (args.type === "image") {
          await ctx.db.patch(args.album_id, { photo_count: album.photo_count + 1 });
        } else {
          await ctx.db.patch(args.album_id, { video_count: album.video_count + 1 });
        }
        if (!album.cover_storage_id && args.type === "image") {
          await ctx.db.patch(args.album_id, { cover_storage_id: args.storage_id });
        }
      }
    }

    return { mediaId, url };
  },
});

// Get all media for a user
export const getByUser = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("surge_media")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .collect();
  },
});

// Get media for an album
export const getByAlbum = query({
  args: { album_id: v.id("surge_albums") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("surge_media")
      .withIndex("by_album", (q) => q.eq("album_id", args.album_id))
      .collect();
  },
});

// Get user's profile photos
export const getProfilePhotos = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("surge_media")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .collect();
    return all.filter((m) => m.type === "image" && !m.album_id);
  },
});

// Delete media
export const deleteMedia = mutation({
  args: { media_id: v.id("surge_media") },
  handler: async (ctx, args) => {
    const media = await ctx.db.get(args.media_id);
    if (!media) throw new Error("Media not found");

    // Delete from storage
    await ctx.storage.delete(media.storage_id);

    // Update album counts
    if (media.album_id) {
      const album = await ctx.db.get(media.album_id);
      if (album) {
        if (media.type === "image") {
          await ctx.db.patch(media.album_id, {
            photo_count: Math.max(0, album.photo_count - 1),
          });
        } else {
          await ctx.db.patch(media.album_id, {
            video_count: Math.max(0, album.video_count - 1),
          });
        }
      }
    }

    await ctx.db.delete(args.media_id);
  },
});

// Update profile photo URLs array on user
export const updateUserPhotoUrls = mutation({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query("surge_media")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .collect();

    const photoUrls = media
      .filter((m) => m.type === "image" && !m.album_id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => m.url);

    const user = await ctx.db
      .query("surge_users")
      .filter((q) => q.eq(q.field("_id"), args.user_id as any))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        photo_urls: photoUrls,
        ...(photoUrls.length > 0 ? { photo_url: photoUrls[0] } : {}),
      });
    }
  },
});

// --- ALBUMS ---

export const createAlbum = mutation({
  args: {
    user_id: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    is_private: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("surge_albums", {
      user_id: args.user_id,
      name: args.name,
      description: args.description,
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
    const albums = await ctx.db
      .query("surge_albums")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .collect();

    // Attach cover URLs
    const result = [];
    for (const album of albums) {
      let coverUrl: string | null = null;
      if (album.cover_storage_id) {
        coverUrl = await ctx.storage.getUrl(album.cover_storage_id);
      }
      result.push({ ...album, coverUrl });
    }
    return result;
  },
});

export const deleteAlbum = mutation({
  args: { album_id: v.id("surge_albums") },
  handler: async (ctx, args) => {
    // Delete all media in album
    const media = await ctx.db
      .query("surge_media")
      .withIndex("by_album", (q) => q.eq("album_id", args.album_id))
      .collect();

    for (const m of media) {
      await ctx.storage.delete(m.storage_id);
      await ctx.db.delete(m._id);
    }

    await ctx.db.delete(args.album_id);
  },
});

// Send a media message in chat
export const sendMediaMessage = mutation({
  args: {
    conversation_id: v.string(),
    sender_id: v.string(),
    receiver_id: v.string(),
    storage_id: v.id("_storage"),
    media_type: v.string(),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storage_id);
    if (!url) throw new Error("Failed to get media URL");

    return await ctx.db.insert("surge_messages", {
      conversation_id: args.conversation_id,
      sender_id: args.sender_id,
      receiver_id: args.receiver_id,
      text: args.media_type === "video" ? "📹 Video" : "📷 Photo",
      media_url: url,
      media_type: args.media_type,
      status: "sent",
      is_deleted: false,
      created_date: new Date().toISOString(),
    });
  },
});
