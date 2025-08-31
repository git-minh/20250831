import { BetterAuth, type AuthFunctions, type PublicAuthFunctions } from "@convex-dev/better-auth";
import { api, components, internal } from "./_generated/api";
import { query } from "./_generated/server";
import type { Id, DataModel } from "./_generated/dataModel";

// Typesafe way to pass Convex functions defined in this file
const authFunctions: AuthFunctions = internal.auth;
const publicAuthFunctions: PublicAuthFunctions = api.auth;

// Initialize the component
export const betterAuthComponent = new BetterAuth(components.betterAuth, {
  authFunctions,
  publicAuthFunctions,
});

// These are required named exports
export const { createUser, updateUser, deleteUser, createSession, isAuthenticated } =
  betterAuthComponent.createAuthFunctions<DataModel>({
    // Must create a user and return the user id
    onCreateUser: async (ctx, user) => {
      // Create user preferences for the new user
      // Note: Better Auth manages user IDs internally, we just need to return something
      const userId = await ctx.db.insert("userPreferences", {
        userId: (user as any).id || "",
        theme: "system",
        notifications: true,
        language: "en",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Return a dummy user ID since we're not using a traditional users table
      // The Better Auth component manages users in its own tables
      return userId;
    },

    // Delete user preferences when they are deleted from Better Auth
    onDeleteUser: async (ctx, userId) => {
      // Find and delete user preferences
      const userPrefs = await ctx.db
        .query("userPreferences")
        .filter(q => q.eq(q.field("userId"), userId))
        .first();

      if (userPrefs) {
        await ctx.db.delete(userPrefs._id);
      }

      // Also clean up any user-specific tasks
      const userTasks = await ctx.db
        .query("tasks")
        .filter(q => q.eq(q.field("userId"), userId))
        .collect();

      for (const task of userTasks) {
        await ctx.db.delete(task._id);
      }
    },
  });

// Example function for getting the current user
export const getCurrentUser = query({
  args: {},
  handler: async ctx => {
    // Get user data from Better Auth - email, name, image, etc.
    const userMetadata = await betterAuthComponent.getAuthUser(ctx);
    if (!userMetadata) {
      return null;
    }

    // Get user preferences from your application's database
    const userPrefs = await ctx.db
      .query("userPreferences")
      .filter(q => q.eq(q.field("userId"), userMetadata.userId))
      .first();

    return {
      ...userMetadata,
      preferences: userPrefs
        ? {
            theme: userPrefs.theme,
            notifications: userPrefs.notifications,
            language: userPrefs.language,
          }
        : null,
    };
  },
});
