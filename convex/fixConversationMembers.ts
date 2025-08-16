import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

export const fixConversationMembers = action({
  args: {},
  handler: async (ctx) => {
    console.log("🔧 Starting conversation members fix...");

    try {
      // Get all users and conversations
      const users = await ctx.runQuery(api.seedHelpers.getAllUsers, {});
      const conversations = await ctx.runQuery(api.seedHelpers.getAllConversations, {});
      const subchannels = await ctx.runQuery(api.seedHelpers.getAllSubchannels, {});
      
      console.log(`Found ${users.length} users, ${conversations.length} conversations, ${subchannels.length} subchannels`);
      
      let membershipsCreated = 0;
      
      // Get existing conversation members to avoid duplicates
      const existingMembers = await ctx.runQuery(api.seedHelpers.getAllConversationMembers, {});
      const existingMembershipSet = new Set(
        existingMembers.map((m: any) => `${m.conversationId}-${m.userId}`)
      );
      
      for (const conversation of conversations) {
        // Check if this is a subchannel conversation (contains " - " pattern)
        const isSubchannelConversation = conversation.name && conversation.name.includes(" - ");
        
        if (isSubchannelConversation) {
          console.log(`Processing subchannel conversation: ${conversation.name}`);
          
          for (const user of users) {
            const membershipKey = `${conversation._id}-${user._id}`;
            
            // Skip if membership already exists
            if (existingMembershipSet.has(membershipKey)) {
              continue;
            }
            
            // Add user as member of this conversation
            await ctx.runMutation(api.seedHelpers.insertConversationMember, {
              conversationId: conversation._id,
              userId: user._id,
              isAdmin: user.isAdmin || false,
              isMuted: false,
              joinedAt: Date.now(),
              isActive: true,
              lastReadAt: Date.now()
            });
            
            membershipsCreated++;
            console.log(`✅ Added ${user.username} to conversation: ${conversation.name}`);
          }
        }
      }
      
      console.log(`🎉 Created ${membershipsCreated} conversation memberships`);
      
      return {
        success: true,
        membershipsCreated,
        message: `Added ${membershipsCreated} users to subchannel conversations`
      };
      
    } catch (error) {
      console.error("Error fixing conversation members:", error);
      throw error;
    }
  },
});
