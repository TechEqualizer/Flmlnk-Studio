/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test, vi, beforeEach } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import { DEFAULT_INPUTS } from "../lib/tubi";

const modules = import.meta.glob("./**/*.ts");

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("APP_URL", "https://studio.test");
  vi.stubEnv("ADMIN_KEY", "test-admin-key-123456");
  vi.stubEnv("TEAM_ALERT_EMAIL", "team@flmlnk.test");
});

async function drain(t: ReturnType<typeof convexTest>) {
  await t.finishAllScheduledFunctions(vi.runAllTimers);
}

describe("Tubi forecast unlock", () => {
  test("creates a scored lead, a forecast record and a forecast email", async () => {
    const t = convexTest(schema, modules);
    const r = await t.mutation(api.forecasts.unlock, { email: "  Maker@Film.com ", filmName: "Bone Hill", inputs: DEFAULT_INPUTS });
    expect(r.gap).toBeGreaterThan(40000);
    await drain(t);
    const d = await t.query(api.admin.dashboard, { key: "test-admin-key-123456" });
    expect(d.leads).toHaveLength(1);
    expect(d.leads[0].email).toBe("maker@film.com");
    expect(d.leads[0].sources).toEqual(["tubi"]);
    expect(d.leads[0].score).toBe(10 + 15 + 12 + 15);
    expect(d.emails.find((e) => e.kind === "forecast")?.status).toBe("skipped");
  });

  test("rejects bad input", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.forecasts.unlock, { email: "nope", filmName: "X", inputs: DEFAULT_INPUTS })).rejects.toThrow();
    await expect(t.mutation(api.forecasts.unlock, { email: "a@b.co", filmName: "X", inputs: { ...DEFAULT_INPUTS, runtime: 0 } })).rejects.toThrow();
  });
});

describe("Hot leads and plans", () => {
  test("a plan click alerts the team once per lead and sends a follow-up", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.forecasts.unlock, { email: "big@film.com", filmName: "Bone Hill", inputs: { ...DEFAULT_INPUTS, budget: 250000 } });
    await t.mutation(api.leads.choosePlan, { email: "big@film.com", tier: "starter", source: "tubi", monthlySpend: 500, filmName: "Bone Hill" });
    await drain(t);
    const d = await t.query(api.admin.dashboard, { key: "test-admin-key-123456" });
    expect(d.leads[0].plan).toBe("starter");
    expect(d.leads[0].score).toBe(95);
    expect(d.planIntents).toHaveLength(1);
    const alerts = d.emails.filter((e) => e.kind === "team_alert");
    expect(alerts.length).toBe(2);
    expect(d.emails.some((e) => e.kind === "plan_followup")).toBe(true);
  });

  test("waitlist dedupes and counts", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.leads.joinWaitlist, { toolId: "comps", email: "a@b.co" });
    await t.mutation(api.leads.joinWaitlist, { toolId: "comps", email: "A@b.co" });
    await t.mutation(api.leads.joinWaitlist, { toolId: "adpack", email: "a@b.co" });
    await expect(t.mutation(api.leads.joinWaitlist, { toolId: "tubi", email: "a@b.co" })).rejects.toThrow();
    const d = await t.query(api.admin.dashboard, { key: "test-admin-key-123456" });
    expect(d.waitlist.find((w) => w.toolId === "comps")?.count).toBe(1);
    expect(d.leads[0].sources.sort()).toEqual(["waitlist:adpack", "waitlist:comps"]);
    await drain(t);
  });

  test("admin key is required", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.admin.dashboard, { key: "wrong-key-wrong-key-" })).rejects.toThrow();
  });
});

describe("Reaction capture", () => {
  async function setup() {
    const t = convexTest(schema, modules);
    const { manageToken, slug } = await t.action(api.capture.createSession, { email: "maker@film.com", filmName: "Bone Hill", eventName: "Freep Film Festival", prompt: "What did you feel?" });
    return { t, manageToken, slug };
  }
  async function upload(t: ReturnType<typeof convexTest>, type = "video/webm") {
    return await t.run(async (ctx) => {
      const id = await ctx.storage.store(new Blob([new Uint8Array(2048)], { type }));
      // convex-test does not record contentType; production Convex sets it from the upload's Content-Type header.
      await (ctx.db as unknown as { patch: (id: string, v: Record<string, unknown>) => Promise<void> }).patch(id, { contentType: type });
      return id;
    });
  }

  test("audience page sees only public fields; owner sees reactions", async () => {
    const { t, manageToken, slug } = await setup();
    const pub = await t.query(api.capture.publicSession, { slug });
    expect(pub).toEqual({ filmName: "Bone Hill", eventName: "Freep Film Festival", prompt: "What did you feel?", isFull: false });
    const storageId = await upload(t);
    await t.mutation(api.capture.submitReaction, { slug, storageId, consent: true, durationSec: 12, displayName: "Tasha" });
    await t.mutation(api.capture.submitReaction, { slug, storageId, consent: true, durationSec: 12 });
    const m = await t.query(api.capture.manageView, { token: manageToken });
    expect(m?.reactionCount).toBe(1);
    expect(m?.reactions[0].displayName).toBe("Tasha");
    expect(await t.query(api.capture.manageView, { token: "x".repeat(32) })).toBeNull();
    await drain(t);
    const d = await t.query(api.admin.dashboard, { key: "test-admin-key-123456" });
    expect(d.emails.map((e) => e.kind).sort()).toEqual(["capture_created", "reaction_received"]);
  });

  test("rejects non-video uploads and enforces the free limit", async () => {
    const { t, slug } = await setup();
    const bad = await upload(t, "text/html");
    await expect(t.mutation(api.capture.submitReaction, { slug, storageId: bad, consent: true, durationSec: 5 })).rejects.toThrow();
    for (let i = 0; i < 25; i++) {
      const id = await upload(t);
      await t.mutation(api.capture.submitReaction, { slug, storageId: id, consent: true, durationSec: 5 });
    }
    await expect(t.mutation(api.capture.generateUploadUrl, { slug })).rejects.toThrow();
    const pub = await t.query(api.capture.publicSession, { slug });
    expect(pub?.isFull).toBe(true);
    await drain(t);
  });
});
