import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { profileId, requireSurgeUser } from "./security";

export const create = mutation({
  args: {
    // Retained for client compatibility; never trusted.
    reporter_id: v.string(),
    reported_id: v.string(),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const reporterId = profileId(me);
    if (!args.reported_id || args.reported_id === reporterId) {
      throw new Error("Invalid reported user");
    }

    const reason = args.reason.trim();
    if (!reason || reason.length > 500) throw new Error("Invalid reason");
    if (args.details && args.details.length > 5000) {
      throw new Error("Report details are too long");
    }

    await ctx.db.insert("surge_reports", {
      reporter_id: reporterId,
      reported_id: args.reported_id,
      reason,
      details: args.details?.trim() || undefined,
      status: "pending",
    });
  },
});
