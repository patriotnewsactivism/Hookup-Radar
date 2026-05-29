import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const create = mutation({
  args: {
    reporter_id: v.string(),
    reported_id: v.string(),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("surge_reports", {
      ...args,
      status: "pending",
    });
  },
});
