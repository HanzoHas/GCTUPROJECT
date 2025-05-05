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
import type * as conversations from "../conversations.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as settings from "../settings.js";
import type * as users from "../users.js";
import type * as utils_auth from "../utils/auth.js";
import type * as utils_mediaService from "../utils/mediaService.js";
import type * as utils_mediaUpload from "../utils/mediaUpload.js";
import type * as utils_mediaWrapper from "../utils/mediaWrapper.js";
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
  conversations: typeof conversations;
  messages: typeof messages;
  notifications: typeof notifications;
  settings: typeof settings;
  users: typeof users;
  "utils/auth": typeof utils_auth;
  "utils/mediaService": typeof utils_mediaService;
  "utils/mediaUpload": typeof utils_mediaUpload;
  "utils/mediaWrapper": typeof utils_mediaWrapper;
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
