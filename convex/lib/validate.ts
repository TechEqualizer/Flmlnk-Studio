import { ConvexError } from "convex/values";
import { z } from "zod";

export function parse<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const r = schema.safeParse(input);
  if (!r.success) {
    const first = r.error.issues[0];
    throw new ConvexError({ code: "INVALID_INPUT", message: first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input" });
  }
  return r.data;
}

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email());

export const filmNameSchema = z.string().trim().min(1).max(60);
export const visitorIdSchema = z.string().trim().min(8).max(64).regex(/^[a-zA-Z0-9_-]+$/);
export const toolIdSchema = z.string().trim().min(1).max(32).regex(/^[a-z0-9-]+$/);
export const sourceSchema = z.string().trim().min(1).max(48).regex(/^[a-z0-9:_-]+$/);
export const tierSchema = z.enum(["free", "starter", "growth", "pro", "managed"]);

export const money = z.number().finite().min(0).max(1e9);

export const forecastInputsSchema = z.object({
  budget: money,
  runtime: z.number().finite().min(1).max(600),
  organic: z.number().finite().min(0).max(1e8),
  spend: money,
  months: z.number().finite().min(0).max(12),
  audience: z.enum(["cold", "warm"]),
  completion: z.number().finite().min(1).max(100),
  adsPerHour: z.number().finite().min(0).max(60),
  ecpm: z.number().finite().min(0).max(200),
  roasCold: z.number().finite().min(0).max(50),
  roasWarm: z.number().finite().min(0).max(50),
});
