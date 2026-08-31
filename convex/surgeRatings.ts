import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { profileId, requireSurgeUser } from "./security";

export const upsert = mutation({
  args: {
    // Retained for client compatibility; ignored.
    rater_id: v.string(),
    rated_user_id: v.string(),
    meetup_happened: v.boolean(),
    reliability_score: v.number(),
    vibe_score: v.optional(v.number()),
    tags: v.array(v.string()),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const raterId = profileId(me);
    if (!args.rated_user_id || args.rated_user_id === raterId) {
      throw new Error("Invalid rated user");
    }
    if (args.reliability_score < 1 || args.reliability_score > 5) {
      throw new Error("Reliability score must be 1-5");
    }
    if (args.vibe_score !== undefined && (args.vibe_score < 1 || args.vibe_score > 5)) {
      throw new Error("Vibe score must be 1-5");
    }
    if (args.comment && args.comment.length > 2000) throw new Error("Comment is too long");

    const payload = {
      rater_id: raterId,
      rated_user_id: args.rated_user_id,
      meetup_happened: args.meetup_happened,
      reliability_score: args.reliability_score,
      vibe_score: args.vibe_score,
      tags: args.tags.slice(0, 20),
      comment: args.comment?.trim() || undefined,
    };

    const existing = await ctx.db
      .query("surge_ratings")
      .withIndex("by_rated_user", (q) => q.eq("rated_user_id", args.rated_user_id))
      .filter((q) => q.eq(q.field("rater_id"), raterId))
      .first();

    if (existing) await ctx.db.patch(existing._id, payload);
    else await ctx.db.insert("surge_ratings", payload);
  },
});

export const getStats = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    await requireSurgeUser(ctx);
    const ratings = await ctx.db
      .query("surge_ratings")
      .withIndex("by_rated_user", (q) => q.eq("rated_user_id", args.user_id))
      .collect();

    if (ratings.length === 0) {
      return { reliability_avg: 0, total_ratings: 0, showed_up_pct: 0 };
    }

    const reliabilitySum = ratings.reduce((sum, rating) => sum + rating.reliability_score, 0);
    const vibeRatings = ratings.filter((rating) => rating.vibe_score != null);
    const vibeSum = vibeRatings.reduce((sum, rating) => sum + (rating.vibe_score ?? 0), 0);
    const showedUp = ratings.filter((rating) => rating.tags.includes("showed_up")).length;
    const average = reliabilitySum / ratings.length;

    let badge: string | undefined;
    if (average >= 4.5) badge = "Solid";
    else if (average >= 3.5) badge = "Reliable";
    else if (average >= 2) badge = "Flaky";
    else badge = "Ghost";

    return {
      reliability_avg: Math.round(average * 10) / 10,
      vibe_avg: vibeRatings.length
        ? Math.round((vibeSum / vibeRatings.length) * 10) / 10
        : undefined,
      total_ratings: ratings.length,
      showed_up_pct: Math.round((showedUp / ratings.length) * 100),
      badge,
    };
  },
});
