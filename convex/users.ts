import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { betterAuthComponent } from "./auth";

// Get current user preferences
export const getCurrentUserPreferences = query({
  args: {},
  handler: async ctx => {
    const user = await betterAuthComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id", q => q.eq("userId", (user as any).id))
      .first();

    return {
      user,
      preferences,
    };
  },
});

// Update user preferences
export const updateUserPreferences = mutation({
  args: {
    theme: v.optional(v.string()),
    notifications: v.optional(v.boolean()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await betterAuthComponent.getAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const existingPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id", q => q.eq("userId", (user as any).id))
      .first();

    if (existingPreferences) {
      await ctx.db.patch(existingPreferences._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existingPreferences._id;
    } else {
      // Create new preferences if they don't exist
      const preferencesId = await ctx.db.insert("userPreferences", {
        userId: (user as any).id,
        theme: args.theme || "system",
        notifications: args.notifications ?? true,
        language: args.language || "en",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return preferencesId;
    }
  },
});

// Get user tasks
export const getUserTasks = query({
  args: {},
  handler: async ctx => {
    const user = await betterAuthComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }

    return await ctx.db
      .query("tasks")
      .withIndex("by_user", q => q.eq("userId", (user as any).id))
      .collect();
  },
});

// Create a new task
export const createTask = mutation({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await betterAuthComponent.getAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const taskId = await ctx.db.insert("tasks", {
      text: args.text,
      isCompleted: false,
      userId: (user as any).id,
      createdAt: Date.now(),
    });

    return taskId;
  },
});
