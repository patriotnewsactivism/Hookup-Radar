import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { profileId, requireModerator } from "./security";

async function findProfileByIdentity(ctx: any, identity: string) {
  const byAuthId = await ctx.db
    .query("surge_users")
    .withIndex("by_auth_id", (q: any) => q.eq("auth_id", identity))
    .first();
  if (byAuthId) return byAuthId;

  const profiles = await ctx.db.query("surge_users").collect();
  return profiles.find((profile: any) => profile._id.toString() === identity) ?? null;
}

export const listReports = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireModerator(ctx);
    const reports = await ctx.db.query("surge_reports").collect();
    const filtered = args.status
      ? reports.filter((report) => report.status === args.status)
      : reports;

    const hydrated = await Promise.all(
      filtered.map(async (report) => {
        const reporter = await findProfileByIdentity(ctx, report.reporter_id);
        const reported = await findProfileByIdentity(ctx, report.reported_id);
        return {
          ...report,
          id: report._id,
          reporter_name: reporter?.display_name ?? "Unknown",
          reporter_username: reporter?.username ?? "?",
          reported_name: reported?.display_name ?? "Unknown",
          reported_username: reported?.username ?? "?",
          reported_photo: reported?.photo_url ?? "",
        };
      }),
    );

    return hydrated.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const resolveReport = mutation({
  args: {
    report_id: v.id("surge_reports"),
    status: v.union(v.literal("resolved"), v.literal("dismissed")),
  },
  handler: async (ctx, args) => {
    await requireModerator(ctx);
    await ctx.db.patch(args.report_id, { status: args.status });
  },
});

export const issueStrike = mutation({
  args: {
    user_id: v.string(),
    reason: v.string(),
    report_id: v.optional(v.id("surge_reports")),
    is_ban: v.boolean(),
    expires_at: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const moderator = await requireModerator(ctx);
    const target = await findProfileByIdentity(ctx, args.user_id);
    if (!target) throw new Error("User not found");
    if (target.role === "admin") throw new Error("Administrators cannot be moderated here");

    const reason = args.reason.trim();
    if (!reason || reason.length > 1000) throw new Error("Invalid reason");

    await ctx.db.insert("surge_strikes", {
      user_id: target.auth_id,
      issued_by: profileId(moderator),
      reason,
      report_id: args.report_id,
      is_ban: args.is_ban,
      expires_at: args.expires_at,
      created_at: new Date().toISOString(),
    });

    if (args.is_ban) {
      await ctx.db.patch(target._id, { show_on_map: false, is_online: false });
    }

    await ctx.db.insert("surge_notifications", {
      user_id: profileId(target),
      type: args.is_ban ? "ban" : "strike",
      title: args.is_ban ? "Account suspended" : "Account warning",
      body: args.is_ban
        ? `Your account has been suspended: ${reason}`
        : `You received a warning: ${reason}`,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  },
});

export const listStrikes = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    await requireModerator(ctx);
    const target = await findProfileByIdentity(ctx, args.user_id);
    if (!target) return [];
    const strikes = await ctx.db
      .query("surge_strikes")
      .withIndex("by_user", (q: any) => q.eq("user_id", target.auth_id))
      .order("desc")
      .collect();
    return strikes.map((strike) => ({ ...strike, id: strike._id }));
  },
});

export const listPendingSpots = query({
  args: {},
  handler: async (ctx) => {
    await requireModerator(ctx);
    const spots = await ctx.db
      .query("surge_spots")
      .withIndex("by_approved", (q: any) => q.eq("is_approved", false))
      .collect();
    return spots.map((spot) => ({ ...spot, id: spot._id }));
  },
});

export const reviewSpot = mutation({
  args: {
    spot_id: v.id("surge_spots"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireModerator(ctx);
    if (args.approved) {
      await ctx.db.patch(args.spot_id, { is_approved: true });
    } else {
      await ctx.db.delete(args.spot_id);
    }
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireModerator(ctx);
    const [users, reports, spots, strikes] = await Promise.all([
      ctx.db.query("surge_users").collect(),
      ctx.db.query("surge_reports").collect(),
      ctx.db.query("surge_spots").collect(),
      ctx.db.query("surge_strikes").collect(),
    ]);

    return {
      total_users: users.length,
      online_users: users.filter((user) => user.is_online).length,
      pending_reports: reports.filter((report) => report.status === "pending").length,
      pending_spots: spots.filter((spot) => !spot.is_approved).length,
      active_bans: strikes.filter((strike) => strike.is_ban).length,
      total_strikes: strikes.length,
    };
  },
});
