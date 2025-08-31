import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";

// Get all tasks for the authenticated user
export const getTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []; // Return empty array for unauthenticated users
    }

    // For demo purposes, return all tasks
    // In a real app, you'd filter by user ID
    return await ctx.db.query("tasks").collect();
  },
});

// Add a new task (authenticated users only)
export const addTask = mutation({
  args: { 
    text: v.string(),
    isCompleted: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const taskId = await ctx.db.insert("tasks", {
      text: args.text,
      isCompleted: args.isCompleted ?? false,
      createdAt: Date.now(),
    });
    return taskId;
  },
});

// Toggle task completion (authenticated users only)
export const toggleTask = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const task = await ctx.db.get(args.id);
    if (task === null) {
      throw new ConvexError("Task not found");
    }
    
    await ctx.db.patch(args.id, {
      isCompleted: !task.isCompleted,
    });
  },
});