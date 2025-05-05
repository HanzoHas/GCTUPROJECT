import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// Helper mutation to store upload results in temp table
export const storeTempUploadResult = internalMutation({
  args: {
    taskId: v.string(),
    url: v.string(),
    publicId: v.string(),
    resourceType: v.string(),
    format: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"tempUploadResults">> => {
    const { taskId, url, publicId, resourceType, format } = args;
    
    return await ctx.db.insert("tempUploadResults", {
      taskId,
      url,
      publicId,
      resourceType,
      format,
      timestamp: Date.now(),
    });
  },
}); 