// convex/surgeModeration.ts
// ─────────────────────────────────────────────────────────────
//  Admin moderation backend for Surge / Hookup-Radar
//  Handles report management, strikes, bans, and spot approvals.
//  All mutations require the caller to be an admin (is_verified check
//  or a dedicated admin role — extend as needed).
// ─────────────────────────────────────────────────────────────

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Helper: assert caller is admin ───────────────────────────
async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthenticated");
  const me = await ctx.db
    .query("surge_users")
    .withIndex("by_auth_id", (q: any) => q.eq("auth_id", userId))
    .first();
  // For now: admin = is_verified. Replace with a proper role check as needed.
  if (!me?.is_verified) throw new Error("Not authorized");
  return me;
}

// ════════════════════════════════════════════════════════════
//  REPORTS
// ════════════════════════════════════════════════════════════

// List all pending reports (admin only)
export const listReports = query({
  args: {
    status: v.optional(v.string()), // "pending" | "resolved" | "dismissed"
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const reports = await ctx.db.query("surge_reports").collect();
    const filtered = args.status
      ? reports.filter((r) => r.status === args.status)
      : reports;

    // Hydrate reporter and reported user info
    const hydrated = await Promise.all(
      filtered.map(async (r) => {
        const reporter = await ctx.db
          .query("surge_users")
          .withIndex("by_auth_id", (q: any) => q.eq("auth_id", r.reporter_id))
          .first();
        const reported = await ctx.db
          .query("surge_users")
          .withIndex("by_auth_id", (q: any) => q.eq("auth_id", r.reported_id))
          .first();
        return {
          ...r,
          id: r._id,
          reporter_name: reporter?.display_name ?? "Unknown",
          reporter_username: reporter?.username ?? "?",
          reported_name: reported?.display_name ?? "Unknown",
          reported_username: reported?.username ?? "?",
          reported_photo: reported?.photo_url ?? "",
        };
      })
    );

    // Newest first
    return hydrated.sort(
      (a, b) =>
        new Date(b._creationTime).getTime() - new Date(a._creationTime).getTime()
    );
  },
});

// Resolve a report (mark as resolved or dismissed)
export const resolveReport = mutation({
  args: {
    report_id: v.id("surge_reports"),
    status:    v.string(), // "resolved" | "dismissed"
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.report_id, { status: args.status });
  },
});

// ════════════════════════════════════════════════════════════
//  STRIKES & BANS
// ════════════════════════════════════════════════════════════

// Issue a strike or ban to a user
export const issueStrike = mutation({
  args: {
    user_id:   v.string(),              // surge_users auth_id
    reason:    v.string(),
    report_id: v.optional(v.id("surge_reports")),
    is_ban:    v.boolean(),
    expires_at: v.optional(v.string()), // ISO string or undefined = permanent
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    await ctx.db.insert("surge_strikes", {
      user_id:    args.user_id,
      issued_by:  admin._id.toString(),
      reason:     args.reason,
      report_id:  args.report_id,
      is_ban:     args.is_ban,
      expires_at: args.expires_at,
      created_at: new Date().toISOString(),
    });

    // If it's a ban, hide the user from map and grid immediately
    if (args.is_ban) {
      const target = await ctx.db
        .query("surge_users")
        .withIndex("by_auth_id", (q: any) => q.eq("auth_id", args.user_id))
        .first();
      if (target) {
        await ctx.db.patch(target._id, { show_on_map: false, is_online: false });
      }
    }

    // Notify the user
    const target = await ctx.db
      .query("surge_users")
      .withIndex("by_auth_id", (q: any) => q.eq("auth_id", args.user_id))
      .first();
    if (target) {
      await ctx.db.insert("surge_notifications", {
        user_id:    target._id.toString(),
        type:       args.is_ban ? "ban" : "strike",
        title:      args.is_ban ? "🚫 Account Suspended" : "⚠️ Account Warning",
        body:       args.is_ban
          ? `Your account has been suspended: ${args.reason}`
          : `You received a warning: ${args.reason}`,
        is_read:    false,
        created_at: new Date().toISOString(),
      });
    }
  },
});

// List strikes for a user
export const listStrikes = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const strikes = await ctx.db
      .query("surge_strikes")
      .withIndex("by_user", (q: any) => q.eq("user_id", args.user_id))
      .order("desc")
      .collect();
    return strikes.map((s) => ({ ...s, id: s._id }));
  },
});

// ════════════════════════════════════════════════════════════
//  SPOT APPROVALS
// ════════════════════════════════════════════════════════════

// List all pending spots awaiting approval
export const listPendingSpots = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const spots = await ctx.db
      .query("surge_spots")
      .withIndex("by_approved", (q: any) => q.eq("is_approved", false))
      .collect();
    return spots.map((s) => ({ ...s, id: s._id }));
  },
});

// Approve or reject a spot
export const reviewSpot = mutation({
  args: {
    spot_id:  v.id("surge_spots"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.approved) {
      await ctx.db.patch(args.spot_id, { is_approved: true });
    } else {
      await ctx.db.delete(args.spot_id);
    }
  },
});

// ════════════════════════════════════════════════════════════
//  STATS — admin dashboard overview
// ════════════════════════════════════════════════════════════

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [users, reports, spots, strikes] = await Promise.all([
      ctx.db.query("surge_users").collect(),
      ctx.db.query("surge_reports").collect(),
      ctx.db.query("surge_spots").collect(),
      ctx.db.query("surge_strikes").collect(),
    ]);

    const onlineUsers   = users.filter((u) => u.is_online).length;
    const pendingReports = reports.filter((r) => r.status === "pending").length;
    const pendingSpots  = spots.filter((s) => !s.is_approved).length;
    const activeBans    = strikes.filter((s) => s.is_ban).length;

    return {
      total_users:     users.length,
      online_users:    onlineUsers,
      pending_reports: pendingReports,
      pending_spots:   pendingSpots,
      active_bans:     activeBans,
      total_strikes:   strikes.length,
    };
  },
});
