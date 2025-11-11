import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createRoom = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create a room");
    }

    let code = generateRoomCode();
    let existing = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    while (existing) {
      code = generateRoomCode();
      existing = await ctx.db
        .query("rooms")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
    }

    const roomId = await ctx.db.insert("rooms", {
      code,
      hostId: userId,
      state: "LOBBY",
      settings: {
        answerTime: 20,
        storyTime: 40,
        voteTime: 15,
        safeHavens: [3, 6, 8],
        ladder: [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000],
        soundEnabled: true,
      },
    });

    return { roomId, code };
  },
});

export const getRoomByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    return room;
  },
});

export const getRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roomId);
  },
});

export const updateRoomState = mutation({
  args: {
    roomId: v.id("rooms"),
    state: v.union(
      v.literal("LOBBY"),
      v.literal("ROLE_ASSIGN"),
      v.literal("QUESTION"),
      v.literal("PRIVATE_REVEAL"),
      v.literal("STORY"),
      v.literal("VOTE"),
      v.literal("REVEAL"),
      v.literal("LADDER_UPDATE"),
      v.literal("ELIMINATION"),
      v.literal("GAME_END")
    ),
    stateStartTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      state: args.state,
      stateStartTime: args.stateStartTime ?? Date.now(),
    });
  },
});

export const setHotSeat = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      hotSeatPlayerId: args.playerId,
    });
  },
});

export const setCurrentQuestion = mutation({
  args: {
    roomId: v.id("rooms"),
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      currentQuestionId: args.questionId,
    });
  },
});

export const isHost = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    
    const room = await ctx.db.get(args.roomId);
    return room?.hostId === userId;
  },
});
