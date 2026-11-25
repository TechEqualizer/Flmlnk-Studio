# FLMLNK Studio

Free tools for independent filmmakers that turn into demand for FLMLNK campaigns.
Next.js 15 + Convex, the same stack as the main FLMLNK app, deployed as its own app.

## What works

| Workflow | Where |
|---|---|
| Home: featured tools, film marquee, tools by funnel stage, plans | `/` |
| Tubi revenue calculator. Free answer first, email unlocks the 12-month curve and break-even plan, forecast emailed | `/tools/tubi` |
| Festival reaction capture. Filmmaker creates a screening, gets a QR code and a private page | `/tools/capture` → `/manage/[token]` |
| Audience page. Scan, agree to share, record up to 30s (or upload from the phone camera), send | `/r/[slug]` |
| Live reaction wall with download, free limit of 25 per screening | `/manage/[token]` |
| Plan click → plan intent, follow-up email, team alert | every upsell card |
| Waitlist for coming-soon tools, with a confirmation email | "Notify me" |
| Lead scoring and hot-lead alerts (email + optional Slack) at score 60+ or any plan click | server-side |
| Team dashboard: funnel, ranked leads, plan clicks, waitlist demand, capture pages, email log | `/admin` |

## Run it

```bash
npm install
npx convex dev          # sign in, create the project; writes .env.local
npm run dev             # in a second terminal
```

Then set the Convex environment variables listed in `.env.example` in the Convex dashboard.
Without `RESEND_API_KEY`, every email is still recorded and shows as "skipped" in `/admin`.

## Code map

- `lib/tubi.ts`: forecast math, shared by the page and the server
- `lib/plans.ts`: plans, tools, lead scoring, free limits
- `convex/forecasts.ts`, `convex/leads.ts`, `convex/capture.ts`, `convex/emails.ts`, `convex/admin.ts`
- `convex/lib/templates.ts`: every email
- `convex/studio.test.ts`: workflow tests (`npx vitest run`)

## Not built yet

- Stripe checkout (plan clicks record intent and alert the team for now)
- Filmmaker accounts (capture pages use a private link; reactions are stored in Convex file storage, not R2)
- Highlight reel cutting and ad boosting behind the Starter plan
- Swapping in the original Tubi calculator and review capture apps
