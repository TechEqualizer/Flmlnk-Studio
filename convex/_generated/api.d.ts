/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as capture from "../capture.js";
import type * as emails from "../emails.js";
import type * as forecasts from "../forecasts.js";
import type * as leads from "../leads.js";
import type * as lib_templates from "../lib/templates.js";
import type * as lib_validate from "../lib/validate.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  capture: typeof capture;
  emails: typeof emails;
  forecasts: typeof forecasts;
  leads: typeof leads;
  "lib/templates": typeof lib_templates;
  "lib/validate": typeof lib_validate;
}>;

export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
