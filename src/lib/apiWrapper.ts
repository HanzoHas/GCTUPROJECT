import { convex, api } from './convex/convex';

// Mock data for fallback when API calls fail
const MOCK_DATA = {
  channels: [
    {
      _id: "mock-channel-1",
      name: "General",
      description: "General channel",
      lecturerId: "mock-user-1",
      createdAt: Date.now(),
      lecturer: {
        id: "mock-user-1",
        name: "Professor Smith",
      }
    }
  ],
  subchannels: [
    {
      _id: "mock-subchannel-1",
      channelId: "mock-channel-1",
      name: "Announcements",
      description: "Important announcements",
      studentGroups: [],
      createdAt: Date.now(),
    }
  ],
  announcements: []
};

// Flag to use mock data when Convex API is unavailable
let useFallbackMode = false;

// Mapping between function names and API references
const functionMap: Record<string, any> = {
  // Channels
  "channels:getUserChannels": api.channels.getUserChannels,
  "channels:getLecturerChannels": api.channels.getLecturerChannels,
  "channels:createChannel": api.channels.createChannel,
  "channels:updateChannel": api.channels.updateChannel,
  "channels:deleteChannel": api.channels.deleteChannel,
  
  // Subchannels
  "subchannels:getChannelSubchannels": api.subchannels.getChannelSubchannels,
  "subchannels:createSubchannel": api.subchannels.createSubchannel,
  "subchannels:updateSubchannel": api.subchannels.updateSubchannel,
  "subchannels:deleteSubchannel": api.subchannels.deleteSubchannel,
  
  // Users
  "users:isCurrentUserLecturer": api.users.isCurrentUserLecturer,
  
  // Announcements
  "channelAnnouncements:getChannelAnnouncements": api.channelAnnouncements.getChannelAnnouncements,
  "channelAnnouncements:createChannelAnnouncement": api.channelAnnouncements.createChannelAnnouncement,
  "channelAnnouncements:deleteChannelAnnouncement": api.channelAnnouncements.deleteChannelAnnouncement
};

export const directApi = {
  // Attempt to use the Convex client directly with API reference
  async _callConvexFunction(fnName: string, args: any, isMutation = false) {
    try {
      if (useFallbackMode) {
        throw new Error("Using fallback mode");
      }

      // Get the API reference from our mapping
      const apiRef = functionMap[fnName];
      if (!apiRef) {
        console.error(`No API reference found for ${fnName}`);
        throw new Error(`Function ${fnName} not available`);
      }

      if (isMutation) {
        return await convex.mutation(apiRef, args);
      } else {
        return await convex.query(apiRef, args);
      }
    } catch (error) {
      console.error(`Error calling ${fnName}:`, error);
      
      // If this is our first error, set fallback mode
      if (!useFallbackMode) {
        console.warn("API calls failing, switching to fallback mode");
        useFallbackMode = true;
      }
      
      throw error;
    }
  },

  // Return mock data based on the function being called
  _getMockData(fnName: string) {
    if (fnName.includes('getLecturerChannels') || fnName.includes('getUserChannels')) {
      return MOCK_DATA.channels;
    } else if (fnName.includes('getChannelSubchannels')) {
      return MOCK_DATA.subchannels;
    } else if (fnName.includes('getChannelAnnouncements')) {
      return MOCK_DATA.announcements;
    } else if (fnName.includes('isCurrentUserLecturer')) {
      return true;
    }
    return null;
  },

  // Channels
  async getChannels(sessionToken: string) {
    try {
      return await this._callConvexFunction("channels:getUserChannels", { sessionToken });
    } catch (error) {
      console.log("Falling back to mock data for channels");
      return this._getMockData("getUserChannels");
    }
  },

  async getLecturerChannels(sessionToken: string) {
    try {
      return await this._callConvexFunction("channels:getLecturerChannels", { sessionToken });
    } catch (error) {
      console.log("Falling back to mock data for lecturer channels");
      return this._getMockData("getLecturerChannels");
    }
  },

  // Subchannels
  async getSubchannels(sessionToken: string, channelId: string) {
    try { 
      return await this._callConvexFunction("subchannels:getChannelSubchannels", { 
        sessionToken, 
        channelId 
      });
    } catch (error) {
      console.log("Falling back to mock data for subchannels");
      return this._getMockData("getChannelSubchannels");
    }
  },

  // Announcements
  async getAnnouncements(sessionToken: string, channelId: string, subchannelId?: string) {
    try {
      return await this._callConvexFunction("channelAnnouncements:getChannelAnnouncements", { 
        sessionToken, 
        channelId,
        subchannelId
      });
    } catch (error) {
      console.log("Falling back to mock data for announcements");
      return this._getMockData("getChannelAnnouncements");
    }
  },

  // User
  async isUserLecturer(sessionToken: string) {
    try {
      return await this._callConvexFunction("users:isCurrentUserLecturer", { sessionToken });
    } catch (error) {
      console.log("Falling back to mock data for user role");
      return this._getMockData("isCurrentUserLecturer");
    }
  },

  // Mutations - these will just "succeed" without making changes in fallback mode
  async createChannel(sessionToken: string, name: string, description?: string, type?: "CATEGORY" | "TEXT" | "ANNOUNCEMENT" | "CLASS", isPrivate?: boolean, allowedStudentGroups?: string[], createdByStudent?: boolean, members?: string[]) {
    try {
      return await this._callConvexFunction("channels:createChannel", {
        sessionToken,
        name,
        description,
        type,
        isPrivate,
        allowedStudentGroups,
        createdByStudent,
        members
      }, true);
    } catch (error) {
      console.log("Mock channel creation");
      return { success: true, channelId: "mock-channel-" + Date.now() };
    }
  },

  async updateChannel(sessionToken: string, channelId: string, data: { 
    name?: string; 
    description?: string; 
    type?: "CATEGORY" | "TEXT" | "ANNOUNCEMENT" | "CLASS"; 
    position?: number;
    isPrivate?: boolean;
    allowedStudentGroups?: string[];
    members?: string[];
  }) {
    try {
      return await this._callConvexFunction("channels:updateChannel", {
        sessionToken,
        channelId,
        ...data
      }, true);
    } catch (error) {
      console.log("Mock channel update");
      return { success: true };
    }
  },

  async deleteChannel(sessionToken: string, channelId: string) {
    try {
      return await this._callConvexFunction("channels:deleteChannel", {
        sessionToken,
        channelId
      }, true);
    } catch (error) {
      console.log("Mock channel deletion");
      return { success: true };
    }
  },

  async createSubchannel(
    sessionToken: string, 
    channelId: string, 
    name: string, 
    description?: string, 
    studentGroups?: string[]
  ) {
    try {
      return await this._callConvexFunction("subchannels:createSubchannel", {
        sessionToken,
        channelId,
        name,
        description,
        studentGroups
      }, true);
    } catch (error) {
      console.log("Mock subchannel creation");
      return { success: true, subchannelId: "mock-subchannel-" + Date.now() };
    }
  },

  async updateSubchannel(
    sessionToken: string,
    subchannelId: string,
    data: { name?: string; description?: string; studentGroups?: string[] }
  ) {
    try {
      return await this._callConvexFunction("subchannels:updateSubchannel", {
        sessionToken,
        subchannelId,
        ...data
      }, true);
    } catch (error) {
      console.log("Mock subchannel update");
      return { success: true };
    }
  },

  async deleteSubchannel(sessionToken: string, subchannelId: string) {
    try {
      return await this._callConvexFunction("subchannels:deleteSubchannel", {
        sessionToken,
        subchannelId
      }, true);
    } catch (error) {
      console.log("Mock subchannel deletion");
      return { success: true };
    }
  },

  async createChannelAnnouncement(
    sessionToken: string,
    channelId: string,
    subchannelId: string | undefined,
    title: string,
    content: string,
    type: "text" | "image" | "video" | "audio"
  ) {
    try {
      return await this._callConvexFunction("channelAnnouncements:createChannelAnnouncement", {
        sessionToken,
        channelId,
        subchannelId,
        title,
        content,
        type
      }, true);
    } catch (error) {
      console.log("Mock announcement creation");
      return { success: true, announcementId: "mock-announcement-" + Date.now() };
    }
  },

  async deleteChannelAnnouncement(sessionToken: string, announcementId: string) {
    try {
      return await this._callConvexFunction("channelAnnouncements:deleteChannelAnnouncement", {
        sessionToken,
        announcementId
      }, true);
    } catch (error) {
      console.log("Mock announcement deletion");
      return { success: true };
    }
  }
}; 