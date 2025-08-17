import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Mutation to send call notifications to all members of a subchannel
export const sendGroupCallInvite = mutation({
  args: {
    subchannelId: v.id("studySubchannels"),
    roomId: v.string(),
    callType: v.union(v.literal("audio"), v.literal("video")),
    callerName: v.string(),
    callerId: v.id("users"),
  },
  handler: async (
    { db }: any,
    { subchannelId, roomId, callType, callerName, callerId }: { 
      subchannelId: any; 
      roomId: string; 
      callType: "audio" | "video"; 
      callerName: string;
      callerId: any;
    }
  ) => {
    // Get the channel that contains this subchannel
    const subchannel = await db.get(subchannelId);
    if (!subchannel) {
      throw new Error("Subchannel not found");
    }

    const channel = await db.get(subchannel.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    // Get all members of the channel (excluding the caller)
    const members = channel.members || [];
    const recipientIds = members.filter((memberId: any) => memberId !== callerId);

    // Send notification to each member
    const notifications = recipientIds.map((recipientId: any) => ({
      userId: recipientId,
      type: "call",
      read: false,
      title: "Group Call Started",
      content: `${callerName} started a ${callType} call in ${subchannel.name}`,
      timestamp: Date.now(),
      sourceId: roomId,
      sourceType: "group_call",
      callData: {
        callType,
        roomId,
        callerName,
        channelName: subchannel.name,
        isGroupCall: true,
      },
    }));

    // Insert all notifications
    for (const notification of notifications) {
      await db.insert("notifications", notification);
    }

    return { notificationsSent: notifications.length };
  },
});

export default sendGroupCallInvite;
