/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ViktorSpacesEmail from "../ViktorSpacesEmail.js";
import type * as auth from "../auth.js";
import type * as constants from "../constants.js";
import type * as http from "../http.js";
import type * as seedTestUser from "../seedTestUser.js";
import type * as surgeMedia from "../surgeMedia.js";
import type * as surgeMessages from "../surgeMessages.js";
import type * as surgeModeration from "../surgeModeration.js";
import type * as surgeNotifications from "../surgeNotifications.js";
import type * as surgeRatings from "../surgeRatings.js";
import type * as surgeReports from "../surgeReports.js";
import type * as surgeSpots from "../surgeSpots.js";
import type * as surgeUsers from "../surgeUsers.js";
import type * as testAuth from "../testAuth.js";
import type * as users from "../users.js";
import type * as viktorTools from "../viktorTools.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ViktorSpacesEmail: typeof ViktorSpacesEmail;
  auth: typeof auth;
  constants: typeof constants;
  http: typeof http;
  seedTestUser: typeof seedTestUser;
  surgeMedia: typeof surgeMedia;
  surgeMessages: typeof surgeMessages;
  surgeModeration: typeof surgeModeration;
  surgeNotifications: typeof surgeNotifications;
  surgeRatings: typeof surgeRatings;
  surgeReports: typeof surgeReports;
  surgeSpots: typeof surgeSpots;
  surgeUsers: typeof surgeUsers;
  testAuth: typeof testAuth;
  users: typeof users;
  viktorTools: typeof viktorTools;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
