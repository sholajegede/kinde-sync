import { httpActionGeneric } from "convex/server";
import type { ComponentApi } from "../component/_generated/component.js";
import { createRemoteJWKSet, jwtVerify } from "jose";

export type KindeSyncOptions = {
  /** Your Kinde issuer URL e.g. https://yourapp.kinde.com */
  KINDE_ISSUER_URL: string;
};

/**
 * Client wrapper for the KindeSync Convex component.
 *
 * @example
 * ```ts
 * // convex/kinde.ts
 * import { components } from "./_generated/api.js";
 * import { KindeSync } from "@sholajegede/kinde-sync";
 *
 * export const kindeSync = new KindeSync(components.kindeSync, {
 *   KINDE_DOMAIN: process.env.KINDE_DOMAIN!,
 * });
 *
 * // convex/http.ts
 * import { kindeSync } from "./kinde.js";
 * http.route({
 *   path: "/webhooks/kinde",
 *   method: "POST",
 *   handler: kindeSync.webhookHandler,
 * });
 * ```
 */
export class KindeSync {
  webhookHandler: ReturnType<typeof httpActionGeneric>;

  constructor(
    public component: ComponentApi,
    private options: KindeSyncOptions,
  ) {
    const domain = options.KINDE_ISSUER_URL;
    const component_ = component;

    this.webhookHandler = httpActionGeneric(async (ctx, request) => {
      // 1. Get the raw JWT from the body
      const token = await request.text();
      if (!token) {
        return new Response(JSON.stringify({ error: "Missing token" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 2. Verify JWT via Kinde JWKS
      const JWKS = createRemoteJWKSet(
        new URL(`${domain}/.well-known/jwks.json`),
      );
      let payload: Record<string, unknown>;
      try {
        const result = await jwtVerify(token, JWKS);
        payload = result.payload as Record<string, unknown>;
      } catch (err) {
        console.error("Kinde webhook JWT verification failed:", err);
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 3. Extract webhook ID for idempotency
      const webhookId =
        (payload["jti"] as string) ??
        `${payload["event_id"] ?? Date.now()}`;

      // 4. Parse event data
      const eventType = payload["type"] as string;
      const data = payload["data"] as Record<string, unknown>;
      const user = data?.["user"] as Record<string, unknown> | undefined;

      if (!eventType || !user) {
        return new Response(JSON.stringify({ error: "Invalid payload" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const organizations = (
        (user["organizations"] as unknown[]) ?? []
      ).map((org) => {
        const o = org as Record<string, unknown>;
        return {
          code: (o["code"] as string) ?? "",
          roles: o["roles"] as string | undefined,
          permissions: o["permissions"] as string | undefined,
        };
      });

      // 5. Run mutation in component
      await ctx.runMutation(component_.lib.handleWebhookEvent, {
        webhookId,
        type: eventType,
        kindeId: (user["id"] as string) ?? "",
        email: (user["email"] as string) ?? "",
        firstName: user["first_name"] as string | undefined,
        lastName: user["last_name"] as string | undefined,
        imageUrl: user["image_url"] as string | undefined,
        isSuspended: (user["is_suspended"] as boolean) ?? false,
        organizations,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
  }
}

export type { ComponentApi };