import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Mutation to create a call-notification instead of sending a chat link
export const sendCallInvite = mutation({
  args: {
    recipientId: v.id("users"),
    roomId: v.string(),
    callType: v.union(v.literal("audio"), v.literal("video")),
    callerName: v.string(),
  },
  handler: async (
    { db }: any,
    { recipientId, roomId, callType, callerName }: { recipientId: any; roomId: string; callType: "audio" | "video"; callerName: string }
  ) => {
    await db.insert("notifications", {
      userId: recipientId,
      type: "call",
      read: false,
      title: "Incoming Call",
      content: `${callerName} is calling you`,
      timestamp: Date.now(),
      sourceId: roomId,
      sourceType: "call",
      callData: {
        callType,
        roomId,
        callerName,
      },
    });
  },
});

export default sendCallInvite;
