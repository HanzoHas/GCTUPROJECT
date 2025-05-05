import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  validateSchoolEmail,
  SESSION_DURATION,
  getAuthenticatedUser,
  sessionTokenValidator
} from "./utils/auth";

// Register a new user with school email domain validation
export const register = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    password: v.string(),
    confirmPassword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { username, email, password, confirmPassword } = args;

    // Validate email domain
    if (!validateSchoolEmail(email)) {
      throw new ConvexError("Registration requires a school domain email");
    }

    // Check if passwords match
    if (confirmPassword && password !== confirmPassword) {
      throw new ConvexError("Passwords do not match");
    }

    // Check if user with this email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (existingUser) {
      throw new ConvexError("A user with this email already exists");
    }

    // Check if username is taken
    const existingUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (existingUsername) {
      throw new ConvexError("This username is already taken");
    }

    // Hash the password
    const passwordHash = hashPassword(password);

    // Create the user
    const userId = await ctx.db.insert("users", {
      email: email.toLowerCase(),
      username,
      passwordHash,
      status: "Available",
      isAdmin: false, // By default users aren't admins
      blockedUsers: [],
      isHidden: false,
    });

    // Create a session
    const token = generateSessionToken();
    const expiresAt = Date.now() + SESSION_DURATION;

    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt,
    });

    // Create presence record
    await ctx.db.insert("presence", {
      userId,
      lastSeen: Date.now(),
      isOnline: true,
    });

    return { token, userId };
  },
});

// Login with email and password
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, password } = args;

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (!user) {
      throw new ConvexError("Invalid email or password");
    }

    // Verify password
    if (!verifyPassword(password, user.passwordHash)) {
      throw new ConvexError("Invalid email or password");
    }

    // Create a session
    const token = generateSessionToken();
    const expiresAt = Date.now() + SESSION_DURATION;

    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt,
    });

    // Update user status and presence
    await ctx.db.patch(user._id, {
      status: "Available",
    });

    await ctx.db.insert("presence", {
      userId: user._id,
      lastSeen: Date.now(),
      isOnline: true,
    });

    return { token, userId: user._id };
  },
});

// Logout - invalidate the current session
export const logout = mutation({
  args: {
    sessionToken: sessionTokenValidator,
  },
  handler: async (ctx, args) => {
    const { sessionToken } = args;

    // Find and delete the session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", sessionToken))
      .first();

    if (session) {
      // Update user status
      const user = await ctx.db.get(session.userId);
      if (user) {
        await ctx.db.patch(user._id, {
          status: "Offline",
        });

        // Update presence
        const presence = await ctx.db
          .query("presence")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        if (presence) {
          await ctx.db.patch(presence._id, {
            isOnline: false,
            lastSeen: Date.now(),
          });
        }
      }

      // Delete the session
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Get current user info
export const me = query({
  args: {
    sessionToken: sessionTokenValidator,
  },
  handler: async (ctx, args) => {
    try {
      const { user } = await getAuthenticatedUser(ctx, args.sessionToken);
      
      // Return user without sensitive info
      return {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        status: user.status,
        isAdmin: user.isAdmin,
      };
    } catch (error) {
      return null;
    }
  },
});

// Check if a user is authenticated
export const isAuthenticated = query({
  args: {
    sessionToken: sessionTokenValidator,
  },
  handler: async (ctx, args) => {
    try {
      await getAuthenticatedUser(ctx, args.sessionToken);
      return true;
    } catch (error) {
      return false;
    }
  },
}); 