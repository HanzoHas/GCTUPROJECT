import { convex, api } from './convex/convex';

// Mock data for fallback when API calls fail
const MOCK_DATA = {
  channels: [
    {
      _id: "mock-channel-1",
      name: "Course Discussions",
      description: "General discussions about the course",
      lecturerId: "mock-user-1",
      createdAt: Date.now(),
      type: "TEXT",
      position: 0,
      isPrivate: false,
      lecturer: {
        id: "mock-user-1",
        name: "Professor Smith",
      }
    },
    {
      _id: "mock-channel-2",
      name: "Assignments",
      description: "Assignment discussions and submissions",
      lecturerId: "mock-user-1",
      createdAt: Date.now() - 86400000, // 1 day ago
      type: "TEXT",
      position: 1,
      isPrivate: false,
      lecturer: {
        id: "mock-user-1",
        name: "Professor Smith",
      }
    },
    {
      _id: "mock-channel-3",
      name: "Study Groups",
      description: "Organize and join study groups",
      lecturerId: "mock-user-1",
      createdAt: Date.now() - 172800000, // 2 days ago
      type: "TEXT",
      position: 2,
      isPrivate: false,
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
      description: "Important course announcements",
      studentGroups: [],
      createdAt: Date.now(),
      type: "ANNOUNCEMENT",
      position: 0,
      isPrivate: false
    },
    {
      _id: "mock-subchannel-2",
      channelId: "mock-channel-1",
      name: "General Discussion",
      description: "General course discussions",
      studentGroups: [],
      createdAt: Date.now(),
      type: "TEXT",
      position: 1,
      isPrivate: false
    },
    {
      _id: "mock-subchannel-3",
      channelId: "mock-channel-2",
      name: "Assignment Help",
      description: "Get help with assignments",
      studentGroups: [],
      createdAt: Date.now(),
      type: "TEXT",
      position: 0,
      isPrivate: false
    },
    {
      _id: "mock-subchannel-4",
      channelId: "mock-channel-2",
      name: "Submission Guidelines",
      description: "Guidelines for assignment submissions",
      studentGroups: [],
      createdAt: Date.now(),
      type: "ANNOUNCEMENT",
      position: 1,
      isPrivate: false
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
      // Don't switch to fallback mode automatically
      // Just propagate the error
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
      console.error("Error fetching channels:", error);
      throw error;
    }
  },

  async getLecturerChannels(sessionToken: string) {
    try {
      return await this._callConvexFunction("channels:getLecturerChannels", { sessionToken });
    } catch (error) {
      console.error("Error fetching lecturer channels:", error);
      throw error;
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
      console.error("Error fetching subchannels:", error);
      throw error;
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
      console.error("Error fetching announcements:", error);
      throw error;
    }
  },

  // User
  async isUserLecturer(sessionToken: string) {
    try {
      return await this._callConvexFunction("users:isCurrentUserLecturer", { sessionToken });
    } catch (error) {
      console.error("Error checking lecturer status:", error);
      throw error;
    }
  },

  // Mutations - these will just "succeed" without making changes in fallback mode
  async createChannel(sessionToken: string, name: string, description?: string, type?: "CATEGORY" | "TEXT" | "ANNOUNCEMENT" | "CLASS", isPrivate?: boolean, allowedStudentGroups?: string[], createdByStudent?: boolean, members?: string[], level?: "100" | "200" | "300") {
    try {
      return await this._callConvexFunction("channels:createChannel", {
        sessionToken,
        name,
        description,
        type,
        isPrivate,
        allowedStudentGroups,
        createdByStudent,
        members,
        level
      }, true);
    } catch (error) {
      console.error("Error creating channel:", error);
      throw error;
    }
  },

  async updateChannel(sessionToken: string, channelId: string, data: { 
    name?: string; 
    description?: string; 
    type?: "CATEGORY" | "TEXT" | "ANNOUNCEMENT" | "CLASS"; 
    position?: number;
    isPrivate?: boolean;
    allowedStudentGroups?: string[];
    level?: "100" | "200" | "300";
    members?: string[];
  }) {
    try {
      return await this._callConvexFunction("channels:updateChannel", {
        sessionToken,
        channelId,
        ...data
      }, true);
    } catch (error) {
      console.error("Error updating channel:", error);
      throw error;
    }
  },

  async deleteChannel(sessionToken: string, channelId: string) {
    try {
      return await this._callConvexFunction("channels:deleteChannel", {
        sessionToken,
        channelId
      }, true);
    } catch (error) {
      console.error("Error deleting channel:", error);
      throw error;
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
      console.error("Error creating subchannel:", error);
      throw error; // Throw the error instead of returning mock data
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
      console.error("Error updating subchannel:", error);
      throw error; // Throw the error instead of returning mock data
    }
  },

  async deleteSubchannel(sessionToken: string, subchannelId: string) {
    try {
      return await this._callConvexFunction("subchannels:deleteSubchannel", {
        sessionToken,
        subchannelId
      }, true);
    } catch (error) {
      console.error("Error deleting subchannel:", error);
      throw error; // Throw the error instead of returning mock data
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
      console.error("Error creating announcement:", error);
      throw error; // Throw the error instead of returning mock data
    }
  },

  async deleteChannelAnnouncement(sessionToken: string, announcementId: string) {
    try {
      return await this._callConvexFunction("channelAnnouncements:deleteChannelAnnouncement", {
        sessionToken,
        announcementId
      }, true);
    } catch (error) {
      console.error("Error deleting announcement:", error);
      throw error; // Throw the error instead of returning mock data
    }
  }
};