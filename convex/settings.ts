import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Default settings
export const defaultSettings = {
  // Appearance
  theme: 'light' as const,
  fontSize: 'medium' as const,
  chatBackground: 'default' as const,
  
  // Notifications
  notificationsEnabled: true,
  soundEnabled: true,
  notificationSettings: {
    newMessages: true,
    mentions: true,
    groupInvites: true,
    announcements: true,
  },
  
  // Privacy
  readReceipts: true,
  typingIndicators: true,
  onlineStatus: true,
  contactPreference: 'everyone' as const,
  
  // Language
  language: 'english',
  timeFormat: '12h' as const,
};

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const settings = await ctx.db
      .query('settings')
      .filter((q) => q.eq(q.field('userId'), identity.subject))
      .first();

    return settings || defaultSettings;
  },
});

export const updateSettings = mutation({
  args: {
    settings: v.object({
      // Appearance
      theme: v.union(v.literal('light'), v.literal('dark')),
      fontSize: v.union(v.literal('small'), v.literal('medium'), v.literal('large')),
      chatBackground: v.union(v.literal('default'), v.literal('gradient1'), v.literal('gradient2')),
      
      // Notifications
      notificationsEnabled: v.boolean(),
      soundEnabled: v.boolean(),
      notificationSettings: v.object({
        newMessages: v.boolean(),
        mentions: v.boolean(),
        groupInvites: v.boolean(),
        announcements: v.boolean(),
      }),
      
      // Privacy
      readReceipts: v.boolean(),
      typingIndicators: v.boolean(),
      onlineStatus: v.boolean(),
      contactPreference: v.union(v.literal('everyone'), v.literal('friends'), v.literal('nobody')),
      
      // Language
      language: v.string(),
      timeFormat: v.union(v.literal('12h'), v.literal('24h')),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const existingSettings = await ctx.db
      .query('settings')
      .filter((q) => q.eq(q.field('userId'), identity.subject))
      .first();

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        ...args.settings,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await ctx.db.insert('settings', {
        userId: ctx.db.normalizeId('users', identity.subject) as Id<"users">,
        ...args.settings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  },
}); 