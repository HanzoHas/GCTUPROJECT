import { v } from "convex/values";
import { MutationCtx, QueryCtx } from "../_generated/server";
import { ConvexError } from "convex/values";
import { Id } from "../_generated/dataModel";

// Simple but stronger hash function for development
export function hashPassword(password: string): string {
  // Improved hash function that works in any JS environment
  let hash = 0;
  const salt = "chatter-school-connect-salt-123";
  const peppered = salt + password + salt;
  
  // djb2 algorithm
  for (let i = 0; i < peppered.length; i++) {
    const char = peppered.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Add some complexity with multiple iterations
  let result = hash.toString(16);
  for (let i = 0; i < 3; i++) {
    let iterationHash = 0;
    const iterationInput = result + i + peppered;
    
    for (let j = 0; j < iterationInput.length; j++) {
      const char = iterationInput.charCodeAt(j);
      iterationHash = ((iterationHash << 5) - iterationHash) + char;
      iterationHash = iterationHash & iterationHash;
    }
    
    result += iterationHash.toString(16);
  }
  
  return result;
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Session duration in milliseconds (7 days)
export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

// Validates if the email has a school domain
export function validateSchoolEmail(email: string): boolean {
  // For development: Allow all email domains
  return true;

  // For production: Uncomment this to restrict to school domains
  /*
  const validDomains = ["edu", "ac.uk", "edu.au", "myschool.edu"];
  const domain = email.split("@")[1]?.toLowerCase();
  
  if (!domain) return false;
  
  // Check for valid TLDs or specific domains
  return validDomains.some(validDomain => 
    domain.endsWith(validDomain)
  );
  */
}

// Get authenticated user from session token
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx,
  sessionToken?: string
) {
  if (!sessionToken) {
    throw new ConvexError("Unauthorized: No session token provided");
  }
  
  // Find session
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", sessionToken))
    .first();
    
  if (!session || session.expiresAt < Date.now()) {
    throw new ConvexError("Unauthorized: Invalid or expired session");
  }
  
  // Get user
  const user = await ctx.db.get(session.userId);
  if (!user) {
    throw new ConvexError("Unauthorized: User not found");
  }
  
  // Update presence - only in mutation contexts
  if ('patch' in ctx.db) {
    await ctx.db.patch(user._id, {
      status: "Available",
    });
    
    await updatePresence(ctx, user._id);
  }
  
  return { user, userId: user._id };
}

// Update user presence
export async function updatePresence(
  ctx: MutationCtx | QueryCtx,
  userId: Id<"users">
) {
  const now = Date.now();
  
  // Only perform database operations if we're in a mutation context
  if (!('patch' in ctx.db && 'insert' in ctx.db)) {
    return;
  }
  
  // Find existing presence record
  const existingPresence = await ctx.db
    .query("presence")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
    
  if (existingPresence) {
    await ctx.db.patch(existingPresence._id, {
      lastSeen: now,
      isOnline: true,
    });
  } else {
    await ctx.db.insert("presence", {
      userId,
      lastSeen: now,
      isOnline: true,
    });
  }
}

// Type for authenticated session
export const sessionTokenValidator = v.string(); 