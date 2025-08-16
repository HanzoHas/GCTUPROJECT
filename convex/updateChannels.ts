import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Action to update existing channels to be hidden
export const updateExistingChannels = action({
  args: {},
  handler: async (ctx): Promise<{success: boolean, channelsUpdated: number, totalChannels: number, message: string}> => {
    console.log("🔧 Starting to update existing channels to be hidden...");

    try {
      // Get all existing channels
      const channels: any[] = await ctx.runQuery(api.seedHelpers.getAllChannels, {});
      console.log(`Found ${channels.length} existing channels`);
      
      let channelsUpdated = 0;
      
      for (const channel of channels) {
        // Skip if already has isHidden field set to true
        if (channel.isHidden === true) {
          console.log(`Channel "${channel.name}" already hidden, skipping`);
          continue;
        }
        
        // Update channel to be hidden
        await ctx.runMutation(api.seedHelpers.updateChannelVisibility, {
          channelId: channel._id,
          isHidden: true
        });
        
        channelsUpdated++;
        console.log(`✅ Updated channel "${channel.name}" to be hidden`);
      }
      
      console.log(`🎉 Updated ${channelsUpdated} channels to be hidden`);
      
      return {
        success: true,
        channelsUpdated,
        totalChannels: channels.length,
        message: `Updated ${channelsUpdated} existing channels to be hidden`
      };
      
    } catch (error) {
      console.error("Error updating existing channels:", error);
      throw error;
    }
  },
});
