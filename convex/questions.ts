import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const seedQuestions = mutation({
  args: {},
  handler: async (ctx) => {
    const existingCount = await ctx.db.query("questions").collect();
    if (existingCount.length > 0) return;

    const sampleQuestions = [
      {
        category: "Science",
        difficulty: "medium" as const,
        questionText: "What is the only metal that is liquid at room temperature?",
        options: ["Mercury", "Gallium", "Cesium", "Francium"],
        correctIndex: 0,
        explanation: "Mercury is the only metal that remains liquid at standard room temperature (20°C).",
        funFact: "Mercury was used in thermometers for centuries before being phased out due to toxicity concerns.",
        tags: ["chemistry", "metals"],
      },
      {
        category: "History",
        difficulty: "hard" as const,
        questionText: "In what year did the Berlin Wall fall?",
        options: ["1987", "1989", "1991", "1993"],
        correctIndex: 1,
        explanation: "The Berlin Wall fell on November 9, 1989, marking a pivotal moment in the end of the Cold War.",
        funFact: "The wall stood for 28 years, dividing East and West Berlin.",
        tags: ["cold-war", "germany"],
      },
      {
        category: "Geography",
        difficulty: "easy" as const,
        questionText: "What is the capital of Australia?",
        options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
        correctIndex: 2,
        explanation: "Canberra is the capital of Australia, chosen as a compromise between Sydney and Melbourne.",
        funFact: "Canberra was purpose-built as the capital and its name means 'meeting place' in the local indigenous language.",
        tags: ["capitals", "oceania"],
      },
      {
        category: "Pop Culture",
        difficulty: "medium" as const,
        questionText: "Which artist has won the most Grammy Awards of all time?",
        options: ["Beyoncé", "Quincy Jones", "Alison Krauss", "Georg Solti"],
        correctIndex: 0,
        explanation: "Beyoncé holds the record with 32 Grammy wins as of 2023.",
        funFact: "She surpassed the previous record holder, Georg Solti, who had 31 wins.",
        tags: ["music", "awards"],
      },
      {
        category: "Science",
        difficulty: "hard" as const,
        questionText: "What is the speed of light in a vacuum?",
        options: ["299,792 km/s", "300,000 km/s", "299,792,458 m/s", "186,282 miles/s"],
        correctIndex: 2,
        explanation: "The exact speed of light in a vacuum is 299,792,458 meters per second.",
        funFact: "This speed is so fundamental that the meter is now defined based on it.",
        tags: ["physics", "constants"],
      },
      {
        category: "Sports",
        difficulty: "easy" as const,
        questionText: "How many players are on a basketball team on the court at once?",
        options: ["4", "5", "6", "7"],
        correctIndex: 1,
        explanation: "Each basketball team has 5 players on the court at a time.",
        funFact: "Basketball was invented by James Naismith in 1891 with just 13 basic rules.",
        tags: ["basketball", "rules"],
      },
      {
        category: "Food",
        difficulty: "medium" as const,
        questionText: "What is the main ingredient in traditional Japanese miso soup?",
        options: ["Soy sauce", "Fermented soybean paste", "Seaweed", "Fish stock"],
        correctIndex: 1,
        explanation: "Miso soup is made primarily from fermented soybean paste called miso.",
        funFact: "Miso can be aged from a few weeks to several years, affecting its flavor and color.",
        tags: ["japanese", "cuisine"],
      },
      {
        category: "Technology",
        difficulty: "hard" as const,
        questionText: "What does 'HTTP' stand for?",
        options: [
          "HyperText Transfer Protocol",
          "High Transfer Text Protocol",
          "HyperText Transmission Process",
          "High Tech Transfer Protocol"
        ],
        correctIndex: 0,
        explanation: "HTTP stands for HyperText Transfer Protocol, the foundation of data communication on the web.",
        funFact: "The 'S' in HTTPS stands for 'Secure', indicating encrypted communication.",
        tags: ["internet", "protocols"],
      },
    ];

    for (const q of sampleQuestions) {
      await ctx.db.insert("questions", q);
    }
  },
});

export const uploadQuestions = mutation({
  args: {
    questions: v.array(
      v.object({
        category: v.string(),
        difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
        questionText: v.string(),
        options: v.array(v.string()),
        correctIndex: v.number(),
        explanation: v.string(),
        funFact: v.optional(v.string()),
        tags: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    let successCount = 0;
    let errorCount = 0;

    for (const question of args.questions) {
      try {
        await ctx.db.insert("questions", question);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error("Failed to insert question:", error);
      }
    }

    return { successCount, errorCount };
  },
});

export const clearAllQuestions = mutation({
  args: {},
  handler: async (ctx) => {
    const allQuestions = await ctx.db.query("questions").collect();
    for (const question of allQuestions) {
      await ctx.db.delete(question._id);
    }
    return { deletedCount: allQuestions.length };
  },
});

export const getRandomQuestion = query({
  args: { excludeIds: v.optional(v.array(v.id("questions"))) },
  handler: async (ctx, args) => {
    const allQuestions = await ctx.db.query("questions").collect();
    const available = args.excludeIds
      ? allQuestions.filter((q) => !args.excludeIds!.includes(q._id))
      : allQuestions;

    if (available.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  },
});

export const getQuestion = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.questionId);
  },
});

export const getAllQuestions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("questions").collect();
  },
});
