import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const submitAnswer = mutation({
  args: {
    roomId: v.id("rooms"),
    questionId: v.id("questions"),
    playerId: v.id("players"),
    choiceIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("Question not found");

    const isCorrect = args.choiceIndex === question.correctIndex;

    await ctx.db.insert("answers", {
      roomId: args.roomId,
      questionId: args.questionId,
      playerId: args.playerId,
      choiceIndex: args.choiceIndex,
      isCorrect,
      timestamp: Date.now(),
    });

    return { isCorrect };
  },
});

export const getAnswer = query({
  args: {
    roomId: v.id("rooms"),
    questionId: v.id("questions"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("answers")
      .withIndex("by_room_and_question", (q) =>
        q.eq("roomId", args.roomId).eq("questionId", args.questionId)
      )
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .first();
  },
});

export const submitVote = mutation({
  args: {
    roomId: v.id("rooms"),
    questionId: v.id("questions"),
    judgeId: v.id("players"),
    vote: v.union(v.literal("believe"), v.literal("bullshit")),
  },
  handler: async (ctx, args) => {
    const answer = await ctx.db
      .query("answers")
      .withIndex("by_room_and_question", (q) =>
        q.eq("roomId", args.roomId).eq("questionId", args.questionId)
      )
      .first();

    if (!answer) throw new Error("No answer found for this question");

    const correctRead =
      (args.vote === "bullshit" && !answer.isCorrect) ||
      (args.vote === "believe" && answer.isCorrect);

    await ctx.db.insert("votes", {
      roomId: args.roomId,
      questionId: args.questionId,
      judgeId: args.judgeId,
      vote: args.vote,
      correctRead,
      timestamp: Date.now(),
    });

    return { correctRead };
  },
});

export const getVotes = query({
  args: {
    roomId: v.id("rooms"),
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("votes")
      .withIndex("by_room_and_question", (q) =>
        q.eq("roomId", args.roomId).eq("questionId", args.questionId)
      )
      .collect();
  },
});

export const calculateRoundResult = query({
  args: {
    roomId: v.id("rooms"),
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const answer = await ctx.db
      .query("answers")
      .withIndex("by_room_and_question", (q) =>
        q.eq("roomId", args.roomId).eq("questionId", args.questionId)
      )
      .first();

    if (!answer) return null;

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_room_and_question", (q) =>
        q.eq("roomId", args.roomId).eq("questionId", args.questionId)
      )
      .collect();

    const believeCount = votes.filter((v) => v.vote === "believe").length;
    const allCalledBullshit = votes.length > 0 && believeCount === 0;

    const shouldAdvance = answer.isCorrect || (!answer.isCorrect && believeCount > 0);
    const shouldEliminate = !answer.isCorrect && allCalledBullshit;

    return {
      answer,
      votes,
      shouldAdvance,
      shouldEliminate,
      believeCount,
    };
  },
});
