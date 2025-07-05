"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { AccessToken } from "@livekit/server-sdk";

export const getToken = action({
  args: {
    roomId: v.string(),
    userId: v.string(),
    userName: v.string(),
    audio: v.boolean(),
    video: v.boolean(),
  },
  handler: async (_ctx, args) => {
    const { roomId, userId, userName, audio, video } = args;
    const apiKey = process.env.LIVEKIT_API_KEY as string;
    const apiSecret = process.env.LIVEKIT_API_SECRET as string;

    if (!apiKey || !apiSecret) {
      throw new Error("LiveKit credentials not set");
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userName,
    });

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canPublishData: true,
      canPublishAudio: audio,
      canPublishVideo: video,
      canSubscribe: true,
    });

    return at.toJwt();
  },
});
