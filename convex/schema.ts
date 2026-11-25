import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const tierId = v.union(
  v.literal("free"),
  v.literal("starter"),
  v.literal("growth"),
  v.literal("pro"),
  v.literal("managed"),
);

export const leadMeta = v.object({
  budget: v.optional(v.number()),
  gap: v.optional(v.number()),
  monthlySpend: v.optional(v.number()),
  tierInterest: v.optional(tierId),
});

export const emailStatus = v.union(v.literal("queued"), v.literal("sent"), v.literal("failed"), v.literal("skipped"));

export const emailKind = v.union(
  v.literal("forecast"),
  v.literal("capture_created"),
  v.literal("reaction_received"),
  v.literal("waitlist_joined"),
  v.literal("plan_followup"),
  v.literal("team_alert"),
);

export default defineSchema({
  leads: defineTable({
    email: v.string(),
    filmName: v.optional(v.string()),
    sources: v.array(v.string()),
    meta: leadMeta,
    score: v.number(),
    alertedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_score", ["score"]),

  waitlist: defineTable({
    toolId: v.string(),
    email: v.string(),
    createdAt: v.number(),
  })
    .index("by_tool", ["toolId"])
    .index("by_tool_email", ["toolId", "email"]),

  events: defineTable({
    type: v.string(),
    visitorId: v.string(),
    toolId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_type", ["type"]),

  forecasts: defineTable({
    email: v.string(),
    filmName: v.string(),
    budget: v.number(),
    monthlySpend: v.number(),
    months: v.number(),
    audience: v.union(v.literal("cold"), v.literal("warm")),
    net: v.number(),
    gap: v.number(),
    breakEvenViews: v.number(),
    monthlyToBreakEven: v.number(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  planIntents: defineTable({
    email: v.string(),
    tier: tierId,
    source: v.string(),
    monthlySpend: v.number(),
    filmName: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  captureSessions: defineTable({
    slug: v.string(),
    manageToken: v.string(),
    filmName: v.string(),
    eventName: v.string(),
    prompt: v.string(),
    ownerEmail: v.string(),
    reactionLimit: v.number(),
    reactionCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_token", ["manageToken"]),

  reactions: defineTable({
    sessionId: v.id("captureSessions"),
    storageId: v.id("_storage"),
    displayName: v.optional(v.string()),
    consentAt: v.number(),
    durationSec: v.number(),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"]),

  emails: defineTable({
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    kind: emailKind,
    status: emailStatus,
    error: v.optional(v.string()),
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
  }).index("by_status", ["status"]),
});
