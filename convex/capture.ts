import { ConvexError, v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { z } from "zod";
import { FREE_REACTION_LIMIT } from "../lib/plans";
import { emailSchema, filmNameSchema, parse } from "./lib/validate";
import { upsertLead } from "./leads";
import { enqueueEmail } from "./emails";
import { captureCreatedEmail, reactionReceivedEmail } from "./lib/templates";

const MAX_BYTES = 60 * 1024 * 1024;
const NOTIFY_AT = new Set([1, 5, 10, 25]);

const createSchema = z.object({
  email: emailSchema,
  filmName: filmNameSchema,
  eventName: z.string().trim().min(1).max(80),
  prompt: z.string().trim().min(3).max(90),
});

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "film";
}

function randomString(len: number): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export const createSession = action({
  args: { email: v.string(), filmName: v.string(), eventName: v.string(), prompt: v.string() },
  returns: v.object({ manageToken: v.string(), slug: v.string() }),
  handler: async (ctx, args): Promise<{ manageToken: string; slug: string }> => {
    const a = parse(createSchema, args);
    const manageToken = randomString(32);
    const slug = `${slugify(a.filmName)}-${randomString(5)}`;
    await ctx.runMutation(internal.capture.insertSession, { ...a, slug, manageToken });
    return { manageToken, slug };
  },
});

export const insertSession = internalMutation({
  args: { email: v.string(), filmName: v.string(), eventName: v.string(), prompt: v.string(), slug: v.string(), manageToken: v.string() },
  returns: v.null(),
  handler: async (ctx, a) => {
    const clash = await ctx.db
      .query("captureSessions")
      .withIndex("by_slug", (q) => q.eq("slug", a.slug))
      .unique();
    if (clash) throw new ConvexError({ code: "RETRY", message: "Please try again." });
    await ctx.db.insert("captureSessions", {
      slug: a.slug,
      manageToken: a.manageToken,
      filmName: a.filmName,
      eventName: a.eventName,
      prompt: a.prompt,
      ownerEmail: a.email,
      reactionLimit: FREE_REACTION_LIMIT,
      reactionCount: 0,
      createdAt: Date.now(),
    });
    await upsertLead(ctx, { email: a.email, source: "capture", filmName: a.filmName });
    const appUrl = process.env.APP_URL ?? "";
    await enqueueEmail(ctx, {
      to: a.email,
      ...captureCreatedEmail({
        filmName: a.filmName,
        eventName: a.eventName,
        manageUrl: `${appUrl}/manage/${a.manageToken}`,
        captureUrl: `${appUrl}/r/${a.slug}`,
      }),
      kind: "capture_created",
    });
    return null;
  },
});

const slugSchema = z.string().trim().min(3).max(48).regex(/^[a-z0-9-]+$/);
const tokenSchema = z.string().trim().length(32).regex(/^[a-z0-9]+$/);

export const publicSession = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const r = slugSchema.safeParse(args.slug);
    if (!r.success) return null;
    const s = await ctx.db
      .query("captureSessions")
      .withIndex("by_slug", (q) => q.eq("slug", r.data))
      .unique();
    if (!s) return null;
    return { filmName: s.filmName, eventName: s.eventName, prompt: s.prompt, isFull: s.reactionCount >= s.reactionLimit };
  },
});

export const manageView = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const r = tokenSchema.safeParse(args.token);
    if (!r.success) return null;
    const s = await ctx.db
      .query("captureSessions")
      .withIndex("by_token", (q) => q.eq("manageToken", r.data))
      .unique();
    if (!s) return null;
    const rows = await ctx.db
      .query("reactions")
      .withIndex("by_session", (q) => q.eq("sessionId", s._id))
      .order("desc")
      .take(200);
    const reactions = await Promise.all(
      rows.map(async (x) => ({ id: x._id, url: await ctx.storage.getUrl(x.storageId), displayName: x.displayName ?? null, durationSec: x.durationSec, createdAt: x.createdAt })),
    );
    return {
      slug: s.slug,
      filmName: s.filmName,
      eventName: s.eventName,
      prompt: s.prompt,
      ownerEmail: s.ownerEmail,
      reactionLimit: s.reactionLimit,
      reactionCount: s.reactionCount,
      reactions,
    };
  },
});

async function sessionBySlug(ctx: { db: import("./_generated/server").QueryCtx["db"] }, slug: string) {
  const sl = parse(slugSchema, slug);
  const s = await ctx.db
    .query("captureSessions")
    .withIndex("by_slug", (q) => q.eq("slug", sl))
    .unique();
  if (!s) throw new ConvexError({ code: "NOT_FOUND", message: "This capture page doesn't exist." });
  return s;
}

export const generateUploadUrl = mutation({
  args: { slug: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const s = await sessionBySlug(ctx, args.slug);
    if (s.reactionCount >= s.reactionLimit) throw new ConvexError({ code: "FULL", message: "This screening has reached its reaction limit." });
    return await ctx.storage.generateUploadUrl();
  },
});

export const submitReaction = mutation({
  args: { slug: v.string(), storageId: v.id("_storage"), consent: v.literal(true), durationSec: v.number(), displayName: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const a = parse(
      z.object({ durationSec: z.number().finite().min(1).max(35), displayName: z.string().trim().max(40).optional() }),
      { durationSec: args.durationSec, displayName: args.displayName },
    );
    const s = await sessionBySlug(ctx, args.slug);
    const meta = await ctx.db.system.get(args.storageId as Id<"_storage">);
    const okType = !!meta?.contentType && /^(video|audio)\//.test(meta.contentType);
    if (!meta || !okType || meta.size > MAX_BYTES) {
      if (meta) await ctx.storage.delete(args.storageId);
      throw new ConvexError({ code: "INVALID_FILE", message: "That upload isn't a reaction video." });
    }
    const used = await ctx.db
      .query("reactions")
      .withIndex("by_session", (q) => q.eq("sessionId", s._id))
      .filter((q) => q.eq(q.field("storageId"), args.storageId))
      .first();
    if (used) return null;
    if (s.reactionCount >= s.reactionLimit) {
      await ctx.storage.delete(args.storageId);
      throw new ConvexError({ code: "FULL", message: "This screening has reached its reaction limit." });
    }
    const now = Date.now();
    await ctx.db.insert("reactions", { sessionId: s._id, storageId: args.storageId, displayName: a.displayName || undefined, consentAt: now, durationSec: a.durationSec, createdAt: now });
    const count = s.reactionCount + 1;
    await ctx.db.patch(s._id, { reactionCount: count });
    if (NOTIFY_AT.has(count)) {
      const appUrl = process.env.APP_URL ?? "";
      await enqueueEmail(ctx, {
        to: s.ownerEmail,
        ...reactionReceivedEmail({ filmName: s.filmName, count, limit: s.reactionLimit, manageUrl: `${appUrl}/manage/${s.manageToken}` }),
        kind: "reaction_received",
      });
    }
    return null;
  },
});
