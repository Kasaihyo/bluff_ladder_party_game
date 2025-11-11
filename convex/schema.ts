import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  rooms: defineTable({
    code: v.string(),
    hostId: v.id("users"),
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
    settings: v.object({
      answerTime: v.number(),
      storyTime: v.number(),
      voteTime: v.number(),
      safeHavens: v.array(v.number()),
      ladder: v.array(v.number()),
      soundEnabled: v.boolean(),
    }),
    currentQuestionId: v.optional(v.id("questions")),
    hotSeatPlayerId: v.optional(v.id("players")),
    stateStartTime: v.optional(v.number()),
  })
    .index("by_code", ["code"]),

  players: defineTable({
    roomId: v.id("rooms"),
    userId: v.optional(v.id("users")),
    name: v.string(),
    emoji: v.optional(v.string()),
    ready: v.boolean(),
    connected: v.boolean(),
    currentRung: v.number(),
    lastSafeHaven: v.number(),
    correctReads: v.number(),
    totalVotes: v.number(),
    eliminated: v.boolean(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_user", ["roomId", "userId"]),

  questions: defineTable({
    category: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    questionText: v.string(),
    options: v.array(v.string()),
    correctIndex: v.number(),
    explanation: v.string(),
    funFact: v.optional(v.string()),
    tags: v.array(v.string()),
  })
    .index("by_category", ["category"])
    .index("by_difficulty", ["difficulty"]),

  answers: defineTable({
    roomId: v.id("rooms"),
    questionId: v.id("questions"),
    playerId: v.id("players"),
    choiceIndex: v.number(),
    isCorrect: v.boolean(),
    timestamp: v.number(),
  })
    .index("by_room_and_question", ["roomId", "questionId"])
    .index("by_player", ["playerId"]),

  votes: defineTable({
    roomId: v.id("rooms"),
    questionId: v.id("questions"),
    judgeId: v.id("players"),
    vote: v.union(v.literal("believe"), v.literal("bullshit")),
    correctRead: v.boolean(),
    timestamp: v.number(),
  })
    .index("by_room_and_question", ["roomId", "questionId"])
    .index("by_judge", ["judgeId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
