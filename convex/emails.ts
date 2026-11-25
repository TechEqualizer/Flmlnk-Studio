import { v } from "convex/values";
import { internalAction, internalMutation, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Infer } from "convex/values";
import { emailKind } from "./schema";

export async function enqueueEmail(
  ctx: MutationCtx,
  e: { to: string; subject: string; html: string; kind: Infer<typeof emailKind> },
) {
  const id = await ctx.db.insert("emails", { ...e, status: "queued", createdAt: Date.now() });
  await ctx.scheduler.runAfter(0, internal.emails.send, { emailId: id });
  return id;
}

export const getForSend = internalMutation({
  args: { emailId: v.id("emails") },
  handler: async (ctx, { emailId }) => {
    const e = await ctx.db.get(emailId);
    if (!e || e.status !== "queued") return null;
    return { to: e.to, subject: e.subject, html: e.html };
  },
});

export const markResult = internalMutation({
  args: {
    emailId: v.id("emails"),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("skipped")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { emailId, status, error }) => {
    await ctx.db.patch(emailId, { status, error, sentAt: status === "sent" ? Date.now() : undefined });
  },
});

export const send = internalAction({
  args: { emailId: v.id("emails") },
  handler: async (ctx, { emailId }) => {
    const e = await ctx.runMutation(internal.emails.getForSend, { emailId });
    if (!e) return;
    const key = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!key || !from) {
      await ctx.runMutation(internal.emails.markResult, { emailId, status: "skipped", error: "RESEND_API_KEY or EMAIL_FROM not set" });
      return;
    }
    const replyTo = process.env.EMAIL_REPLY_TO;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": emailId },
      body: JSON.stringify({ from, to: [e.to], subject: e.subject, html: e.html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (res.ok) {
      await ctx.runMutation(internal.emails.markResult, { emailId, status: "sent" });
    } else {
      const text = (await res.text()).slice(0, 300);
      await ctx.runMutation(internal.emails.markResult, { emailId, status: "failed", error: `Resend ${res.status}: ${text}` });
    }
  },
});

export const postSlack = internalAction({
  args: { text: v.string() },
  handler: async (_ctx, { text }) => {
    const url = process.env.SLACK_WEBHOOK_URL;
    if (!url) return;
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
  },
});
