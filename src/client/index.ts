import { httpActionGeneric } from "convex/server";
import type { ComponentApi } from "../component/_generated/component.js";
import { createRemoteJWKSet, jwtVerify } from "jose";

export type KindeSyncOptions = {
  /** Your Kinde issuer URL e.g. https://yourapp.kinde.com */
  KINDE_ISSUER_URL: string;
};

export class KindeSync {
  webhookHandler: ReturnType<typeof httpActionGeneric>;

  constructor(
    public component: ComponentApi,
    private options: KindeSyncOptions,
  ) {
    const domain = options.KINDE_ISSUER_URL;
    const component_ = component;

    this.webhookHandler = httpActionGeneric(async (ctx, request) => {
      const token = await request.text();
      if (!token) {
        return new Response(JSON.stringify({ error: "Missing token" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

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

      const webhookId =
        (payload["jti"] as string) ??
        `${payload["event_id"] ?? Date.now()}`;

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
          roles: normalizeClaim(o["roles"]),
          permissions: normalizeClaim(o["permissions"]),
        };
      });

      await ctx.runMutation(component_.lib.handleWebhookEvent, {
        webhookId,
        type: eventType,
        kindeId: (user["id"] as string) ?? "",
        email: (user["email"] as string) ?? "",
        firstName: (user["first_name"] as string) || undefined,
        lastName: (user["last_name"] as string) || undefined,
        imageUrl: (user["image_url"] as string) || undefined,
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

function normalizeClaim(value: unknown): string | string[] | undefined {
  if (typeof value === "string") return value || undefined;
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const entry = item as Record<string, unknown>;
        const key = entry["key"] ?? entry["name"] ?? entry["id"];
        return typeof key === "string" ? key : undefined;
      }
      return undefined;
    })
    .filter((item): item is string => !!item);
  return items.length > 0 ? items : undefined;
}

export type { ComponentApi };