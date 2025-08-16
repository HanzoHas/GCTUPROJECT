import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

export const fixSubchannelConversations = action({
  args: {},
  handler: async (ctx) => {
    console.log("🔧 Starting subchannel conversation fix...");

    try {
      // Get all subchannels that don't have conversations
      const subchannels = await ctx.runQuery(api.seedHelpers.getAllSubchannels, {});
      const conversations = await ctx.runQuery(api.seedHelpers.getAllConversations, {});
      
      console.log(`Found ${subchannels.length} subchannels and ${conversations.length} conversations`);
      
      // Get all users to add as members
      const users = await ctx.runQuery(api.seedHelpers.getAllUsers, {});
      const userIds = users.map((u: any) => u._id);
      
      let conversationsCreated = 0;
      
      for (const subchannel of subchannels) {
        // Get channel details for naming convention
        const channel = await ctx.runQuery(api.seedHelpers.getChannelById, { channelId: subchannel.channelId });
        if (!channel) {
          console.error(`Channel not found for subchannel: ${subchannel.name}`);
          continue;
        }
        
        // Use the expected naming convention: "${subchannelName} - ${channelName}"
        const expectedConversationName = `${subchannel.name} - ${channel.name}`;
        
        // Check if conversation already exists by name pattern
        const existingConversation = conversations.find((conv: any) => 
          conv.name === expectedConversationName
        );
        
        if (existingConversation) {
          console.log(`Conversation already exists for subchannel: ${subchannel.name}`);
          continue;
        }
        
        // Conversation doesn't exist, create it
        console.log(`Creating conversation for subchannel: ${subchannel.name}`);
        
        // Find admin user
        const adminUser = users.find((u: any) => u.email === "admin@university.edu");
        if (!adminUser) {
          console.error("Admin user not found");
          continue;
        }
        
        // Create conversation with proper naming convention
        const conversationId = await ctx.runMutation(api.seedHelpers.insertConversation, {
          name: expectedConversationName,
          isGroup: true,
          creatorId: adminUser._id,
          type: "group",
          isActive: true,
          members: userIds
        });
        
        conversationsCreated++;
        console.log(`✅ Created conversation for ${subchannel.name}: "${expectedConversationName}"`);
      }
      
      console.log(`🎉 Fixed ${conversationsCreated} subchannel conversations`);
      
      return {
        success: true,
        conversationsCreated,
        message: `Created ${conversationsCreated} missing subchannel conversations`
      };
      
    } catch (error) {
      console.error("Error fixing subchannel conversations:", error);
      throw error;
    }
  },
});
