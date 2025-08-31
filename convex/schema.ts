import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // App-specific tables
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
    createdAt: v.number(),
    // Link to Better Auth user via userId string
    userId: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // App-specific user preferences (extends Better Auth user table)
  userPreferences: defineTable({
    userId: v.string(), // References Better Auth user.userId
    theme: v.optional(v.string()),
    notifications: v.optional(v.boolean()),
    language: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  posts: defineTable({
    title: v.string(),
    content: v.string(),
    authorUserId: v.string(), // References Better Auth user.userId
    published: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorUserId"])
    .index("by_published", ["published"]),
});
