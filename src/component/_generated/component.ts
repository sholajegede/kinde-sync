/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    lib: {
      getUser: FunctionReference<
        "query",
        "internal",
        { kindeId: string },
        null | {
          _creationTime: number;
          _id: string;
          email: string;
          firstName?: string;
          imageUrl?: string;
          isSuspended: boolean;
          kindeId: string;
          lastName?: string;
          lastSyncedAt: number;
          organizations: Array<{
            code: string;
            permissions?: string;
            roles?: string;
          }>;
        },
        Name
      >;
      getUserByEmail: FunctionReference<
        "query",
        "internal",
        { email: string },
        null | {
          _creationTime: number;
          _id: string;
          email: string;
          firstName?: string;
          imageUrl?: string;
          isSuspended: boolean;
          kindeId: string;
          lastName?: string;
          lastSyncedAt: number;
          organizations: Array<{
            code: string;
            permissions?: string;
            roles?: string;
          }>;
        },
        Name
      >;
      handleWebhookEvent: FunctionReference<
        "mutation",
        "internal",
        {
          email: string;
          firstName?: string;
          imageUrl?: string;
          isSuspended: boolean;
          kindeId: string;
          lastName?: string;
          organizations: Array<{
            code: string;
            permissions?: string;
            roles?: string;
          }>;
          type: string;
          webhookId: string;
        },
        null,
        Name
      >;
      listUsers: FunctionReference<
        "query",
        "internal",
        {},
        Array<{
          _creationTime: number;
          _id: string;
          email: string;
          firstName?: string;
          imageUrl?: string;
          isSuspended: boolean;
          kindeId: string;
          lastName?: string;
          lastSyncedAt: number;
          organizations: Array<{
            code: string;
            permissions?: string;
            roles?: string;
          }>;
        }>,
        Name
      >;
    };
  };
