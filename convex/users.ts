import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { profileId, requireSurgeUser } from "./security";

async function relatedData(ctx: any, profile: any) {
  const id = profileId(profile);
  const authId = profile.auth_id;
  const [messages, reports, ratings, spots, events, rsvps, spotMessages, media, albums, referrals, notifications, strikes] = await Promise.all([
    ctx.db.query("surge_messages").collect(),
    ctx.db.query("surge_reports").collect(),
    ctx.db.query("surge_ratings").collect(),
    ctx.db.query("surge_spots").collect(),
    ctx.db.query("surge_spot_events").collect(),
    ctx.db.query("surge_spot_rsvps").collect(),
    ctx.db.query("surge_spot_messages").collect(),
    ctx.db.query("surge_media").collect(),
    ctx.db.query("surge_albums").collect(),
    ctx.db.query("surge_referral_codes").collect(),
    ctx.db.query("surge_notifications").collect(),
    ctx.db.query("surge_strikes").collect(),
  ]);

  return {
    id,
    authId,
    messages: messages.filter((item: any) => item.sender_id === id || item.receiver_id === id),
    createdReports: reports.filter((item: any) => item.reporter_id === id || item.reporter_id === authId),
    ratingsGiven: ratings.filter((item: any) => item.rater_id === id || item.rater_id === authId),
    spots: spots.filter((item: any) => item.submitted_by === id || item.submitted_by === authId),
    events: events.filter((item: any) => item.host_id === id || item.host_id === authId),
    rsvps: rsvps.filter((item: any) => item.user_id === id || item.user_id === authId),
    spotMessages: spotMessages.filter((item: any) => item.user_id === id || item.user_id === authId),
    media: media.filter((item: any) => item.user_id === id || item.user_id === authId),
    albums: albums.filter((item: any) => item.user_id === id || item.user_id === authId),
    referrals: referrals.filter((item: any) => item.user_id === id || item.user_id === authId),
    notifications: notifications.filter((item: any) => item.user_id === id),
    strikes: strikes.filter((item: any) => item.user_id === authId),
  };
}

export const exportAccountData = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireSurgeUser(ctx);
    const data = await relatedData(ctx, profile);
    return {
      exported_at: new Date().toISOString(),
      profile,
      messages: data.messages,
      reports_created: data.createdReports,
      ratings_given: data.ratingsGiven,
      spots_submitted: data.spots,
      events_hosted: data.events,
      rsvps: data.rsvps,
      spot_messages: data.spotMessages,
      media: data.media.map((item: any) => ({ ...item, storage_id: undefined })),
      albums: data.albums,
      referrals: data.referrals,
      notifications: data.notifications,
      moderation_actions: data.strikes.map((item: any) => ({
        reason: item.reason,
        is_ban: item.is_ban,
        expires_at: item.expires_at,
        created_at: item.created_at,
      })),
    };
  },
});

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");
    const profile = await requireSurgeUser(ctx);
    const data = await relatedData(ctx, profile);

    // Delete owned storage objects before metadata.
    for (const item of data.media) {
      try {
        await ctx.storage.delete(item.storage_id);
      } catch {
        // Continue graph cleanup even if the blob was already absent.
      }
    }

    // Remove direct user-owned graph nodes.
    const directDeletes = [
      ...data.messages,
      ...data.createdReports,
      ...data.ratingsGiven,
      ...data.events,
      ...data.rsvps,
      ...data.spotMessages,
      ...data.media,
      ...data.albums,
      ...data.referrals,
      ...data.notifications,
      ...data.strikes,
    ];
    for (const item of directDeletes) await ctx.db.delete(item._id);

    // Delete user-submitted spots and cascade their event/chat/RSVP children.
    for (const spot of data.spots) {
      const childEvents = await ctx.db
        .query("surge_spot_events")
        .withIndex("by_spot", (q: any) => q.eq("spot_id", spot._id))
        .collect();
      const childMessages = await ctx.db
        .query("surge_spot_messages")
        .withIndex("by_spot", (q: any) => q.eq("spot_id", spot._id))
        .collect();
      for (const event of childEvents) {
        const eventRsvps = await ctx.db
          .query("surge_spot_rsvps")
          .withIndex("by_event", (q: any) => q.eq("event_id", event._id))
          .collect();
        for (const rsvp of eventRsvps) await ctx.db.delete(rsvp._id);
        await ctx.db.delete(event._id);
      }
      for (const message of childMessages) await ctx.db.delete(message._id);
      await ctx.db.delete(spot._id);
    }

    // Remove references to the deleted identity from remaining records.
    const allProfiles = await ctx.db.query("surge_users").collect();
    for (const other of allProfiles) {
      if (other._id === profile._id) continue;
      const blocked = other.blocked_users.filter((value: string) => value !== data.id && value !== data.authId);
      const favorites = other.favorite_users.filter((value: string) => value !== data.id && value !== data.authId);
      if (blocked.length !== other.blocked_users.length || favorites.length !== other.favorite_users.length) {
        await ctx.db.patch(other._id, { blocked_users: blocked, favorite_users: favorites });
      }
    }

    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter((q: any) => q.eq(q.field("userId"), authUserId))
      .collect();
    for (const account of authAccounts) await ctx.db.delete(account._id);

    const authSessions = await ctx.db
      .query("authSessions")
      .filter((q: any) => q.eq(q.field("userId"), authUserId))
      .collect();
    for (const session of authSessions) await ctx.db.delete(session._id);

    await ctx.db.delete(profile._id);
    await ctx.db.delete(authUserId);
    return { success: true };
  },
});
