import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { profileId, requireSurgeUser } from "./security";

function referencesIdentity(value: string | undefined, id: string, authId: string) {
  return value === id || value === authId;
}

async function relatedData(ctx: any, profile: any) {
  const id = profileId(profile);
  const authId = profile.auth_id;
  const [
    messages,
    reports,
    ratings,
    spots,
    events,
    rsvps,
    spotMessages,
    media,
    albums,
    referrals,
    notifications,
    strikes,
  ] = await Promise.all([
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
    messages: messages.filter(
      (item: any) =>
        referencesIdentity(item.sender_id, id, authId) ||
        referencesIdentity(item.receiver_id, id, authId),
    ),
    reports: reports.filter(
      (item: any) =>
        referencesIdentity(item.reporter_id, id, authId) ||
        referencesIdentity(item.reported_id, id, authId),
    ),
    ratings: ratings.filter(
      (item: any) =>
        referencesIdentity(item.rater_id, id, authId) ||
        referencesIdentity(item.rated_user_id, id, authId),
    ),
    spots: spots.filter((item: any) =>
      referencesIdentity(item.submitted_by, id, authId),
    ),
    events: events.filter((item: any) =>
      referencesIdentity(item.host_id, id, authId),
    ),
    rsvps: rsvps.filter((item: any) =>
      referencesIdentity(item.user_id, id, authId),
    ),
    spotMessages: spotMessages.filter((item: any) =>
      referencesIdentity(item.user_id, id, authId),
    ),
    media: media.filter((item: any) =>
      referencesIdentity(item.user_id, id, authId),
    ),
    albums: albums.filter((item: any) =>
      referencesIdentity(item.user_id, id, authId),
    ),
    referrals: referrals.filter((item: any) =>
      referencesIdentity(item.user_id, id, authId),
    ),
    notifications: notifications.filter(
      (item: any) =>
        referencesIdentity(item.user_id, id, authId) ||
        referencesIdentity(item.from_user_id, id, authId),
    ),
    strikes: strikes.filter((item: any) =>
      referencesIdentity(item.user_id, id, authId),
    ),
  };
}

function exportMedia(item: any) {
  const { storage_id: _storageId, ...safe } = item;
  return safe;
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
      reports_referencing_account: data.reports,
      ratings_referencing_account: data.ratings,
      spots_submitted: data.spots,
      events_hosted: data.events,
      rsvps: data.rsvps,
      spot_messages: data.spotMessages,
      media: data.media.map(exportMedia),
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

async function deleteEventWithRsvps(ctx: any, eventId: any) {
  const eventRsvps = await ctx.db
    .query("surge_spot_rsvps")
    .withIndex("by_event", (q: any) => q.eq("event_id", eventId))
    .collect();
  for (const rsvp of eventRsvps) await ctx.db.delete(rsvp._id);
  const event = await ctx.db.get(eventId);
  if (event) await ctx.db.delete(eventId);
}

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");
    const profile = await requireSurgeUser(ctx);
    const data = await relatedData(ctx, profile);

    for (const item of data.media) {
      try {
        await ctx.storage.delete(item.storage_id);
      } catch {
        // Continue graph cleanup if a blob was already absent.
      }
    }

    // Hosted events own RSVP children, including rows created by other users.
    for (const event of data.events) {
      await deleteEventWithRsvps(ctx, event._id);
    }

    // User-submitted spots own event/chat children.
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
        await deleteEventWithRsvps(ctx, event._id);
      }
      for (const message of childMessages) {
        const current = await ctx.db.get(message._id);
        if (current) await ctx.db.delete(message._id);
      }
      const currentSpot = await ctx.db.get(spot._id);
      if (currentSpot) await ctx.db.delete(spot._id);
    }

    const directDeletes = [
      ...data.messages,
      ...data.reports,
      ...data.ratings,
      ...data.rsvps,
      ...data.spotMessages,
      ...data.media,
      ...data.albums,
      ...data.referrals,
      ...data.notifications,
      ...data.strikes,
    ];
    const deleted = new Set<string>();
    for (const item of directDeletes) {
      const key = item._id.toString();
      if (deleted.has(key)) continue;
      const current = await ctx.db.get(item._id);
      if (current) await ctx.db.delete(item._id);
      deleted.add(key);
    }

    const allProfiles = await ctx.db.query("surge_users").collect();
    for (const other of allProfiles) {
      if (other._id === profile._id) continue;
      const blocked = other.blocked_users.filter(
        (value: string) => value !== data.id && value !== data.authId,
      );
      const favorites = other.favorite_users.filter(
        (value: string) => value !== data.id && value !== data.authId,
      );
      if (
        blocked.length !== other.blocked_users.length ||
        favorites.length !== other.favorite_users.length
      ) {
        await ctx.db.patch(other._id, {
          blocked_users: blocked,
          favorite_users: favorites,
        });
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
