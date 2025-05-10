import { ConvexReactClient } from "convex/react";

// Create the Convex client
export const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string); 

// Create a minimal API structure with just the functions needed for the channels feature
export const api = {
  users: {
    isCurrentUserLecturer: "users:isCurrentUserLecturer",
    setUserAsLecturer: "users:setUserAsLecturer",
    getLecturers: "users:getLecturers"
  },
  channels: {
    createChannel: "channels:createChannel",
    getLecturerChannels: "channels:getLecturerChannels",
    getChannelById: "channels:getChannelById",
    updateChannel: "channels:updateChannel",
    deleteChannel: "channels:deleteChannel",
    getUserChannels: "channels:getUserChannels",
    addChannelMember: "channels:addChannelMember",
    removeChannelMember: "channels:removeChannelMember"
  },
  subchannels: {
    createSubchannel: "subchannels:createSubchannel",
    getChannelSubchannels: "subchannels:getChannelSubchannels",
    getSubchannelById: "subchannels:getSubchannelById",
    updateSubchannel: "subchannels:updateSubchannel",
    deleteSubchannel: "subchannels:deleteSubchannel",
    getUserSubchannels: "subchannels:getUserSubchannels"
  },
  channelAnnouncements: {
    createChannelAnnouncement: "channelAnnouncements:createChannelAnnouncement",
    getChannelAnnouncements: "channelAnnouncements:getChannelAnnouncements",
    deleteChannelAnnouncement: "channelAnnouncements:deleteChannelAnnouncement",
    updateChannelAnnouncement: "channelAnnouncements:updateChannelAnnouncement"
  },
  utils: {
    mediaWrapper: {
      uploadMediaSync: "utils/mediaWrapper:uploadMediaSync"
    }
  }
}; 