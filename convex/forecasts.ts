import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { z } from "zod";
import { computeForecast } from "../lib/tubi";
import { emailSchema, filmNameSchema, forecastInputsSchema, parse } from "./lib/validate";
import { upsertLead } from "./leads";
import { enqueueEmail } from "./emails";
import { forecastEmail } from "./lib/templates";

export const unlock = mutation({
  args: {
    email: v.string(),
    filmName: v.string(),
    inputs: v.object({
      budget: v.number(),
      runtime: v.number(),
      organic: v.number(),
      spend: v.number(),
      months: v.number(),
      audience: v.union(v.literal("cold"), v.literal("warm")),
      completion: v.number(),
      adsPerHour: v.number(),
      ecpm: v.number(),
      roasCold: v.number(),
      roasWarm: v.number(),
    }),
  },
  returns: v.object({ net: v.number(), gap: v.number() }),
  handler: async (ctx, args) => {
    const a = parse(z.object({ email: emailSchema, filmName: filmNameSchema, inputs: forecastInputsSchema }), args);
    const r = computeForecast(a.inputs);
    await ctx.db.insert("forecasts", {
      email: a.email,
      filmName: a.filmName,
      budget: a.inputs.budget,
      monthlySpend: a.inputs.spend,
      months: a.inputs.months,
      audience: a.inputs.audience,
      net: r.net,
      gap: r.gap,
      breakEvenViews: r.breakEvenViews,
      monthlyToBreakEven: r.monthlyToBreakEven,
      createdAt: Date.now(),
    });
    await upsertLead(ctx, {
      email: a.email,
      source: "tubi",
      filmName: a.filmName,
      meta: { budget: a.inputs.budget, gap: Math.max(0, r.gap), monthlySpend: a.inputs.spend },
    });
    const appUrl = process.env.APP_URL ?? "";
    await enqueueEmail(ctx, {
      to: a.email,
      ...forecastEmail({ filmName: a.filmName, net: r.net, gap: r.gap, budget: a.inputs.budget, breakEvenViews: r.breakEvenViews, monthlyToBreakEven: r.monthlyToBreakEven, appUrl }),
      kind: "forecast",
    });
    return { net: r.net, gap: r.gap };
  },
});
