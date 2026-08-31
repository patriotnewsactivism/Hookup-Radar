import { v } from "convex/values";
import { internalAction } from "./_generated/server";

// Kept as a compatibility stub so generated API imports remain valid until the
// next Convex codegen. Test identities must be provisioned out-of-band with
// runtime-only credentials and may not be seeded from committed source.
export const seedTestUser = internalAction({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async () => ({
    success: false,
    message: "Committed test-user seeding is disabled",
  }),
});
