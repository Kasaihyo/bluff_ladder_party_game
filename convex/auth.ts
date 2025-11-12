import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { query } from "./_generated/server";
import { v } from "convex/values";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Anonymous],
});

export const loggedInUser = query({
  args: {},
  returns: v.union(v.null(), v.any()),
  handler: async (ctx) => {
    // Debug: Check what the server sees
    const identity = await ctx.auth.getUserIdentity();
    console.log("🔍 Server identity:", identity);
    
    const userId = await getAuthUserId(ctx);
    console.log("🔍 Server userId:", userId);
    
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    console.log("🔍 Server user document:", user);
    
    if (!user) {
      return null;
    }
    return user;
  },
});
