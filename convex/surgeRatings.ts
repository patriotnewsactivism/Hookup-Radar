import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const upsert = mutation({
  args: {
    rater_id: v.string(),
    rated_user_id: v.string(),
    meetup_happened: v.boolean(),
    reliability_score: v.number(),
    vibe_score: v.optional(v.number()),
    tags: v.array(v.string()),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if rating already exists
    const existing = await ctx.db
      .query("surge_ratings")
      .withIndex("by_rated_user", (q) =>
        q.eq("rated_user_id", args.rated_user_id)
      )
      .filter((q) => q.eq(q.field("rater_id"), args.rater_id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("surge_ratings", args);
    }
  },
});

export const getStats = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("surge_ratings")
      .withIndex("by_rated_user", (q) =>
        q.eq("rated_user_id", args.user_id)
      )
      .collect();

    if (ratings.length === 0) {
      return { reliability_avg: 0, total_ratings: 0, showed_up_pct: 0 };
    }

    const reliabilitySum = ratings.reduce(
      (sum, r) => sum + r.reliability_score,
      0
    );
    const vibeRatings = ratings.filter((r) => r.vibe_score != null);
    const vibeSum = vibeRatings.reduce((sum, r) => sum + (r.vibe_score ?? 0), 0);
    const showedUp = ratings.filter((r) => r.tags.includes("showed_up")).length;

    const avg = reliabilitySum / ratings.length;
    let badge: string | undefined;
    if (avg >= 4.5) badge = "Solid";
    else if (avg >= 3.5) badge = "Reliable";
    else if (avg >= 2) badge = "Flaky";
    else badge = "Ghost";

    return {
      reliability_avg: Math.round(avg * 10) / 10,
      vibe_avg: vibeRatings.length > 0
        ? Math.round((vibeSum / vibeRatings.length) * 10) / 10
        : undefined,
      total_ratings: ratings.length,
      showed_up_pct: Math.round((showedUp / ratings.length) * 100),
      badge,
    };
  },
});
