import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";
import { SOON_TOOL_IDS } from "../lib/plans";

function checkKey(key: string) {
  const expected = process.env.ADMIN_KEY;
  if (!expected || expected.length < 16) throw new ConvexError({ code: "ADMIN_DISABLED", message: "Set ADMIN_KEY (16+ characters) in the Convex dashboard." });
  if (key.length !== expected.length) throw new ConvexError({ code: "UNAUTHORIZED", message: "Wrong admin key." });
  let diff = 0;
  for (let i = 0; i < key.length; i++) diff |= key.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) throw new ConvexError({ code: "UNAUTHORIZED", message: "Wrong admin key." });
}

export const dashboard = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    checkKey(key);
    const leads = await ctx.db.query("leads").withIndex("by_score").order("desc").take(200);
    const waitlist = await Promise.all(
      SOON_TOOL_IDS.map(async (toolId) => ({
        toolId,
        count: (await ctx.db.query("waitlist").withIndex("by_tool", (q) => q.eq("toolId", toolId)).take(10000)).length,
      })),
    );
    const countType = async (type: string) => (await ctx.db.query("events").withIndex("by_type", (q) => q.eq("type", type)).take(100000)).length;
    const [visits, toolOpens] = await Promise.all([countType("visit"), countType("tool_open")]);
    const planIntents = await ctx.db.query("planIntents").order("desc").take(50);
    const emails = await ctx.db.query("emails").order("desc").take(30);
    const sessions = await ctx.db.query("captureSessions").order("desc").take(50);
    const leadCount = (await ctx.db.query("leads").take(100000)).length;
    return {
      funnel: { visits, toolOpens, leads: leadCount, planClicks: planIntents.length, captureSessions: sessions.length, reactions: sessions.reduce((n, s) => n + s.reactionCount, 0) },
      leads: leads.map((l) => ({ id: l._id, email: l.email, filmName: l.filmName ?? null, sources: l.sources, score: l.score, gap: l.meta.gap ?? null, budget: l.meta.budget ?? null, plan: l.meta.tierInterest ?? null, updatedAt: l.updatedAt })),
      waitlist: waitlist.sort((a, b) => b.count - a.count),
      planIntents: planIntents.map((p) => ({ id: p._id, email: p.email, tier: p.tier, source: p.source, filmName: p.filmName ?? null, createdAt: p.createdAt })),
      emails: emails.map((e) => ({ id: e._id, to: e.to, subject: e.subject, kind: e.kind, status: e.status, error: e.error ?? null, createdAt: e.createdAt })),
      sessions: sessions.map((s) => ({ id: s._id, filmName: s.filmName, eventName: s.eventName, ownerEmail: s.ownerEmail, reactionCount: s.reactionCount, slug: s.slug, createdAt: s.createdAt })),
    };
  },
});
