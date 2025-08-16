import { query } from "./_generated/server";
import { v } from "convex/values";

// Debug function to check conversations and memberships
export const debugConversations = query({
  args: {},
  handler: async (ctx) => {
    const { db } = ctx;
    
    // Get all conversations
    const conversations = await db.query("conversations").collect();
    console.log(`Found ${conversations.length} conversations`);
    
    // Get all conversation members
    const members = await db.query("conversationMembers").collect();
    console.log(`Found ${members.length} conversation members`);
    
    // Get all users
    const users = await db.query("users").collect();
    console.log(`Found ${users.length} users`);
    
    // Get all subchannels
    const subchannels = await db.query("studySubchannels").collect();
    console.log(`Found ${subchannels.length} subchannels`);
    
    const result = {
      conversations: conversations.map(c => ({
        id: c._id,
        name: c.name,
        type: c.type,
        isGroup: c.isGroup
      })),
      members: members.map(m => ({
        conversationId: m.conversationId,
        userId: m.userId,
        isAdmin: m.isAdmin
      })),
      users: users.map(u => ({
        id: u._id,
        username: u.username,
        email: u.email
      })),
      subchannels: subchannels.map(s => ({
        id: s._id,
        name: s.name,
        channelId: s.channelId
      })),
      summary: {
        totalConversations: conversations.length,
        totalMembers: members.length,
        totalUsers: users.length,
        totalSubchannels: subchannels.length
      }
    };
    
    return result;
  },
});
