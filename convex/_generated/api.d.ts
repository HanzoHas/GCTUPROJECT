/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activities from "../activities.js";
import type * as announcements from "../announcements.js";
import type * as auth from "../auth.js";
import type * as channelAnnouncements from "../channelAnnouncements.js";
import type * as channels from "../channels.js";
import type * as conversations from "../conversations.js";
import type * as debug from "../debug.js";
import type * as fixConversationMembers from "../fixConversationMembers.js";
import type * as fixSubchannelConversations from "../fixSubchannelConversations.js";
import type * as messages from "../messages.js";
import type * as migrate from "../migrate.js";
import type * as notifications_sendCallInvite from "../notifications/sendCallInvite.js";
import type * as notifications from "../notifications.js";
import type * as seedAction from "../seedAction.js";
import type * as seedAnnouncements from "../seedAnnouncements.js";
import type * as seedHelpers from "../seedHelpers.js";
import type * as settings from "../settings.js";
import type * as subchannels from "../subchannels.js";
import type * as trending from "../trending.js";
import type * as updateChannels from "../updateChannels.js";
import type * as users from "../users.js";
import type * as utils_auth from "../utils/auth.js";
import type * as utils_emailVerification from "../utils/emailVerification.js";
import type * as utils_mediaService from "../utils/mediaService.js";
import type * as utils_mediaUpload from "../utils/mediaUpload.js";
import type * as utils_mediaWrapper from "../utils/mediaWrapper.js";
import type * as utils_password from "../utils/password.js";
import type * as utils_tempStorage from "../utils/tempStorage.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  announcements: typeof announcements;
  auth: typeof auth;
  channelAnnouncements: typeof channelAnnouncements;
  channels: typeof channels;
  conversations: typeof conversations;
  debug: typeof debug;
  fixConversationMembers: typeof fixConversationMembers;
  fixSubchannelConversations: typeof fixSubchannelConversations;
  messages: typeof messages;
  migrate: typeof migrate;
  "notifications/sendCallInvite": typeof notifications_sendCallInvite;
  notifications: typeof notifications;
  seedAction: typeof seedAction;
  seedAnnouncements: typeof seedAnnouncements;
  seedHelpers: typeof seedHelpers;
  settings: typeof settings;
  subchannels: typeof subchannels;
  trending: typeof trending;
  updateChannels: typeof updateChannels;
  users: typeof users;
  "utils/auth": typeof utils_auth;
  "utils/emailVerification": typeof utils_emailVerification;
  "utils/mediaService": typeof utils_mediaService;
  "utils/mediaUpload": typeof utils_mediaUpload;
  "utils/mediaWrapper": typeof utils_mediaWrapper;
  "utils/password": typeof utils_password;
  "utils/tempStorage": typeof utils_tempStorage;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
