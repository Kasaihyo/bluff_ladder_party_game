import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const clearAllAuthData = internalMutation({
  args: {},
  returns: v.object({
    sessions: v.number(),
    tokens: v.number(),
  }),
  handler: async (ctx) => {
    // Clear auth sessions (limit to first 1000)
    const sessions = await ctx.db.query("authSessions").take(1000);
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Clear refresh tokens (limit to first 1000)
    const tokens = await ctx.db.query("authRefreshTokens").take(1000);
    for (const token of tokens) {
      await ctx.db.delete(token._id);
    }

    return {
      sessions: sessions.length,
      tokens: tokens.length,
    };
  },
});

