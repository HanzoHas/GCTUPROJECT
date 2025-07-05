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
import { generateVerificationCode, getExpirationTime, sendVerificationEmail } from "./utils/emailVerification";
import { api } from "./_generated/api";

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

    // Verify that the email has been verified
    const verificationRecord = await ctx.db
      .query("verificationCodes")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (!verificationRecord || !verificationRecord.verified) {
      throw new ConvexError("Email verification required");
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

// Login with email and password (2-step: password check → email code → verifyEmailCode)
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

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new ConvexError("Invalid email or password");
    }

    // Generate a fresh verification code for this login attempt
    const code = generateVerificationCode();
    const expiresAt = getExpirationTime();

    const existingCode = await ctx.db
      .query("verificationCodes")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (existingCode) {
      await ctx.db.patch(existingCode._id, {
        code,
        expiresAt,
        verified: false,
      });
    } else {
      await ctx.db.insert("verificationCodes", {
        email: email.toLowerCase(),
        username: user.username,
        passwordHash: user.passwordHash,
        code,
        expiresAt,
        verified: false,
      });
    }

    // The client should now call sendVerificationEmail action with { email, code, username }
    return { success: true, codeSent: true };
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

// Generate and send verification code
export const sendVerificationCode = mutation({
  args: {
    email: v.string(),
    username: v.string(),
    password: v.optional(v.string()),
    confirmPassword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { email, username, password, confirmPassword } = args;
    let passwordHash: string | undefined = undefined;

    // Validate email domain
    if (!validateSchoolEmail(email)) {
      throw new ConvexError("Registration requires a school domain email");
    }

    if (password) {
      // Validate password confirmation (if field provided)
      if (confirmPassword && password !== confirmPassword) {
        throw new ConvexError("Passwords do not match");
      }
      // Hash password for temporary storage
      passwordHash = hashPassword(password);
    }

    // Generate a verification code
    const code = generateVerificationCode();
    const expiresAt = getExpirationTime();

    // Check if there's an existing code for this email and update it
    const existingCode = await ctx.db
      .query("verificationCodes")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (existingCode) {
      await ctx.db.patch(existingCode._id, {
        code,
        expiresAt,
        verified: false,
        username,
        ...(passwordHash ? { passwordHash } : {}),
      });
    } else {
      // Create a new verification code record
      await ctx.db.insert("verificationCodes", {
        email: email.toLowerCase(),
        username,
        ...(passwordHash ? { passwordHash } : {}),
        code,
        expiresAt,
        verified: false,
      });
    }

    // Return success and let the client call the email sending action
    return { success: true, code };
  },
});

// Verify email with code
export const verifyEmailCode = mutation({
  args: {
    email: v.string(),
    code: v.string(),
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, code, username: providedUsername, password } = args;

    // Find the verification code
    const verificationRecord = await ctx.db
      .query("verificationCodes")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (!verificationRecord) {
      throw new ConvexError("No verification code found for this email");
    }

    // Check if code is expired
    if (verificationRecord.expiresAt < Date.now()) {
      throw new ConvexError("Verification code has expired");
    }

    // Check if code matches
    if (verificationRecord.code !== code) {
      throw new ConvexError("Invalid verification code");
    }

    // Mark as verified
    await ctx.db.patch(verificationRecord._id, {
      verified: true,
    });

    // Create user account if it doesn't exist yet
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (!user) {
      // Determine username and passwordHash – may come from the verification record or from the client args
      const finalUsername = providedUsername;
      const finalPasswordHash = hashPassword(password);

      const userId = await ctx.db.insert("users", {
        email: email.toLowerCase(),
        username: finalUsername,
        passwordHash: finalPasswordHash,
        status: "Available",
        isAdmin: false,
        blockedUsers: [],
        isHidden: false,
      });

      user = await ctx.db.get(userId);
      if (!user) {
        throw new ConvexError("Failed to create user after verification");
      }

      // Create presence record
      await ctx.db.insert("presence", {
        userId,
        lastSeen: Date.now(),
        isOnline: true,
      });
    }

    // Create session token
    const token = generateSessionToken();
    const expiresAt = Date.now() + SESSION_DURATION;

    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt,
    });

    return { success: true, verified: true, token, userId: user._id };
  },
}); 