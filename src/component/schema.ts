import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  kindeUsers: defineTable({
    kindeId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isSuspended: v.boolean(),
    organizations: v.array(
      v.object({
        code: v.string(),
        roles: v.optional(v.string()),
        permissions: v.optional(v.string()),
      }),
    ),
    lastSyncedAt: v.number(),
  })
    .index("by_kindeId", ["kindeId"])
    .index("by_email", ["email"]),

  processedWebhooks: defineTable({
    webhookId: v.string(),
    processedAt: v.number(),
  }).index("by_webhookId", ["webhookId"]),
});