import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server.js";

const orgValidator = v.object({
  code: v.string(),
  roles: v.optional(v.string()),
  permissions: v.optional(v.string()),
});

const userValidator = v.object({
  _id: v.id("kindeUsers"),
  _creationTime: v.number(),
  kindeId: v.string(),
  email: v.string(),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  isSuspended: v.boolean(),
  organizations: v.array(orgValidator),
  lastSyncedAt: v.number(),
});

// ─── Internal helpers ────────────────────────────────────────────────────────

export const isWebhookProcessed = internalQuery({
  args: { webhookId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("processedWebhooks")
      .withIndex("by_webhookId", (q) => q.eq("webhookId", args.webhookId))
      .first();
    return existing !== null;
  },
});

export const markWebhookProcessed = internalMutation({
  args: { webhookId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("processedWebhooks", {
      webhookId: args.webhookId,
      processedAt: Date.now(),
    });
    return null;
  },
});

export const upsertUser = internalMutation({
  args: {
    kindeId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isSuspended: v.boolean(),
    organizations: v.array(orgValidator),
  },
  returns: v.id("kindeUsers"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("kindeUsers")
      .withIndex("by_kindeId", (q) => q.eq("kindeId", args.kindeId))
      .first();
    if (existing) {
      await ctx.db.patch("kindeUsers", existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
        isSuspended: args.isSuspended,
        organizations: args.organizations,
        lastSyncedAt: Date.now(),
      });
      return existing._id;
    }
    return await ctx.db.insert("kindeUsers", {
      kindeId: args.kindeId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      isSuspended: args.isSuspended,
      organizations: args.organizations,
      lastSyncedAt: Date.now(),
    });
  },
});

export const deleteUser = internalMutation({
  args: { kindeId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("kindeUsers")
      .withIndex("by_kindeId", (q) => q.eq("kindeId", args.kindeId))
      .first();
    if (existing) await ctx.db.delete("kindeUsers", existing._id);
    return null;
  },
});

export const handleWebhookEvent = mutation({
  args: {
    webhookId: v.string(),
    type: v.string(),
    kindeId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isSuspended: v.boolean(),
    organizations: v.array(orgValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const alreadyProcessed = await ctx.db
      .query("processedWebhooks")
      .withIndex("by_webhookId", (q) => q.eq("webhookId", args.webhookId))
      .first();
    if (alreadyProcessed) return null;

    await ctx.db.insert("processedWebhooks", {
      webhookId: args.webhookId,
      processedAt: Date.now(),
    });

    if (args.type === "user.deleted") {
      const existing = await ctx.db
        .query("kindeUsers")
        .withIndex("by_kindeId", (q) => q.eq("kindeId", args.kindeId))
        .first();
      if (existing) await ctx.db.delete("kindeUsers", existing._id);
      return null;
    }

    const existing = await ctx.db
      .query("kindeUsers")
      .withIndex("by_kindeId", (q) => q.eq("kindeId", args.kindeId))
      .first();
    if (existing) {
      await ctx.db.patch("kindeUsers", existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
        isSuspended: args.isSuspended,
        organizations: args.organizations,
        lastSyncedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("kindeUsers", {
        kindeId: args.kindeId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
        isSuspended: args.isSuspended,
        organizations: args.organizations,
        lastSyncedAt: Date.now(),
      });
    }
    return null;
  },
});

export const getUser = query({
  args: { kindeId: v.string() },
  returns: v.union(v.null(), userValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kindeUsers")
      .withIndex("by_kindeId", (q) => q.eq("kindeId", args.kindeId))
      .first();
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  returns: v.union(v.null(), userValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kindeUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const listUsers = query({
  args: {},
  returns: v.array(userValidator),
  handler: async (ctx) => {
    return await ctx.db.query("kindeUsers").order("desc").take(100);
  },
});