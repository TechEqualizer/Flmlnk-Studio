import { v } from "convex/values";
import { mutation, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { HOT_LEAD_SCORE, scoreLead, TIERS, TOOLS, type LeadMeta } from "../lib/plans";
import { emailSchema, filmNameSchema, parse, sourceSchema, tierSchema, toolIdSchema, visitorIdSchema, money } from "./lib/validate";
import { enqueueEmail } from "./emails";
import { planFollowupEmail, teamAlertEmail, waitlistEmail } from "./lib/templates";
import { z } from "zod";

export async function upsertLead(
  ctx: MutationCtx,
  a: { email: string; source: string; filmName?: string; meta?: LeadMeta; alertReason?: string },
): Promise<Doc<"leads">> {
  const now = Date.now();
  const existing = await ctx.db
    .query("leads")
    .withIndex("by_email", (q) => q.eq("email", a.email))
    .unique();
  const sources = existing ? Array.from(new Set([...existing.sources, a.source])) : [a.source];
  const meta: LeadMeta = { ...(existing?.meta ?? {}) };
  for (const [k, val] of Object.entries(a.meta ?? {})) if (val !== undefined) (meta as Record<string, unknown>)[k] = val;
  const score = scoreLead(sources, meta);
  const filmName = a.filmName ?? existing?.filmName;
  let id = existing?._id;
  if (existing) {
    await ctx.db.patch(existing._id, { sources, meta, score, filmName, updatedAt: now });
  } else {
    id = await ctx.db.insert("leads", { email: a.email, sources, meta, score, filmName, createdAt: now, updatedAt: now });
  }
  const lead = (await ctx.db.get(id!))!;
  const crossed = score >= HOT_LEAD_SCORE && !lead.alertedAt;
  if (crossed || a.alertReason) {
    await alertTeam(ctx, lead, a.alertReason ?? `Crossed the hot-lead score of ${HOT_LEAD_SCORE}`);
    if (!lead.alertedAt) await ctx.db.patch(lead._id, { alertedAt: now });
  }
  return lead;
}

async function alertTeam(ctx: MutationCtx, lead: Doc<"leads">, reason: string) {
  const to = process.env.TEAM_ALERT_EMAIL;
  const m = { budget: lead.meta.budget, gap: lead.meta.gap, monthlySpend: lead.meta.monthlySpend, plan: lead.meta.tierInterest };
  if (to) {
    const e = teamAlertEmail({ email: lead.email, filmName: lead.filmName, score: lead.score, reason, meta: m, sources: lead.sources });
    await enqueueEmail(ctx, { to, ...e, kind: "team_alert" });
  }
  await ctx.scheduler.runAfter(0, internal.emails.postSlack, {
    text: `:rotating_light: Hot lead (${lead.score}) ${lead.email}${lead.filmName ? ` — ${lead.filmName}` : ""}. ${reason}. Sources: ${lead.sources.join(", ")}${lead.meta.gap ? `. Gap shown: $${Math.round(lead.meta.gap).toLocaleString("en-US")}` : ""}`,
  });
}

export const track = mutation({
  args: { type: v.string(), visitorId: v.string(), toolId: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const a = parse(
      z.object({ type: z.enum(["visit", "film_set", "tool_open", "qr_present", "link_copied"]), visitorId: visitorIdSchema, toolId: toolIdSchema.optional() }),
      args,
    );
    await ctx.db.insert("events", { ...a, createdAt: Date.now() });
    return null;
  },
});

export const joinWaitlist = mutation({
  args: { toolId: v.string(), email: v.string(), filmName: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const a = parse(z.object({ toolId: toolIdSchema, email: emailSchema, filmName: filmNameSchema.optional() }), args);
    const tool = TOOLS.find((t) => t.id === a.toolId && t.status === "soon");
    if (!tool) throw new Error("Unknown tool");
    const dup = await ctx.db
      .query("waitlist")
      .withIndex("by_tool_email", (q) => q.eq("toolId", a.toolId).eq("email", a.email))
      .unique();
    if (dup) return null;
    await ctx.db.insert("waitlist", { toolId: a.toolId, email: a.email, createdAt: Date.now() });
    await upsertLead(ctx, { email: a.email, source: `waitlist:${a.toolId}`, filmName: a.filmName });
    await enqueueEmail(ctx, { to: a.email, ...waitlistEmail({ toolName: tool.name }), kind: "waitlist_joined" });
    return null;
  },
});

export const choosePlan = mutation({
  args: { email: v.string(), tier: v.string(), source: v.string(), monthlySpend: v.number(), filmName: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const a = parse(
      z.object({ email: emailSchema, tier: tierSchema, source: sourceSchema, monthlySpend: money, filmName: filmNameSchema.optional() }),
      args,
    );
    const tier = TIERS.find((t) => t.id === a.tier)!;
    await ctx.db.insert("planIntents", { ...a, createdAt: Date.now() });
    await upsertLead(ctx, {
      email: a.email,
      source: a.source,
      filmName: a.filmName,
      meta: { tierInterest: a.tier, monthlySpend: a.monthlySpend || undefined },
      alertReason: `Clicked the ${tier.name} plan from ${a.source}`,
    });
    await enqueueEmail(ctx, { to: a.email, ...planFollowupEmail({ tierName: tier.name, filmName: a.filmName }), kind: "plan_followup" });
    return null;
  },
});
