import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const joinRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    name: v.string(),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const existing = await ctx.db
      .query("players")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", userId ?? undefined)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        connected: true,
        name: args.name,
        emoji: args.emoji,
      });
      return existing._id;
    }

    const playerId = await ctx.db.insert("players", {
      roomId: args.roomId,
      userId: userId ?? undefined,
      name: args.name,
      emoji: args.emoji,
      ready: false,
      connected: true,
      currentRung: 0,
      lastSafeHaven: 0,
      correctReads: 0,
      totalVotes: 0,
      eliminated: false,
    });

    return playerId;
  },
});

export const getPlayers = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("eliminated"), false))
      .collect();
  },
});

export const getPlayer = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.playerId);
  },
});

export const toggleReady = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    await ctx.db.patch(args.playerId, {
      ready: !player.ready,
    });
  },
});

export const updatePlayerRung = mutation({
  args: {
    playerId: v.id("players"),
    newRung: v.number(),
    isSafeHaven: v.boolean(),
  },
  handler: async (ctx, args) => {
    const updates: any = { currentRung: args.newRung };
    if (args.isSafeHaven) {
      updates.lastSafeHaven = args.newRung;
    }
    await ctx.db.patch(args.playerId, updates);
  },
});

export const eliminatePlayer = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.playerId, {
      eliminated: true,
    });
  },
});

export const removePlayer = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.playerId);
  },
});

export const updateJudgeStats = mutation({
  args: {
    playerId: v.id("players"),
    correctRead: v.boolean(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    await ctx.db.patch(args.playerId, {
      correctReads: player.correctReads + (args.correctRead ? 1 : 0),
      totalVotes: player.totalVotes + 1,
    });
  },
});
