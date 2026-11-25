export type TierId = "free" | "starter" | "growth" | "pro" | "managed";

export type Tier = {
  id: TierId;
  name: string;
  price: number;
  adCap: number | null;
  takeRate: number;
  blurb: string;
};

export const TIERS: Tier[] = [
  { id: "free", name: "Free", price: 0, adCap: 100, takeRate: 20, blurb: "All Studio tools, up to $100/mo in ads" },
  { id: "starter", name: "Starter", price: 99, adCap: 500, takeRate: 18, blurb: "Reaction reels and your first campaign" },
  { id: "growth", name: "Growth", price: 297, adCap: 2500, takeRate: 15, blurb: "Ongoing campaigns across Tubi and social" },
  { id: "pro", name: "Pro", price: 597, adCap: 7500, takeRate: 12, blurb: "Multi-title campaigns and distributor reporting" },
  { id: "managed", name: "Managed", price: 1500, adCap: null, takeRate: 15, blurb: "Our team runs everything, no ad cap" },
];

export function tierForMonthlySpend(spend: number): Tier {
  const fit = TIERS.find((t) => t.adCap === null || spend <= t.adCap) ?? TIERS[TIERS.length - 1];
  return fit.id === "free" ? TIERS[1] : fit;
}

export const FREE_REACTION_LIMIT = 25;
export const HOT_LEAD_SCORE = 60;

export type LeadMeta = {
  budget?: number;
  gap?: number;
  monthlySpend?: number;
  tierInterest?: TierId;
};

export function scoreLead(sources: string[], meta: LeadMeta): number {
  let s = 10;
  if ((meta.budget ?? 0) >= 100000) s += 25;
  else if ((meta.budget ?? 0) >= 25000) s += 15;
  if ((meta.gap ?? 0) > 0) s += Math.min(25, Math.round((meta.gap ?? 0) / 4000));
  if ((meta.monthlySpend ?? 0) >= 500) s += 15;
  if (sources.some((x) => x.startsWith("capture"))) s += 15;
  if (new Set(sources.map((x) => x.split(":")[0])).size > 1) s += 10;
  if (meta.tierInterest) s += 20;
  return Math.min(100, s);
}

export type ToolStatus = "live" | "external" | "soon";
export type Stage = "Showcase" | "Share" | "Capture" | "Nurture" | "Convert";

export type Tool = {
  id: string;
  name: string;
  desc: string;
  stage: Stage;
  status: ToolStatus;
  href?: string;
  extLabel?: string;
};

export const TOOLS: Tool[] = [
  { id: "page", name: "Film page", desc: "A link-in-bio page for your film with trailer, clips and where to watch.", stage: "Showcase", status: "external", href: "https://www.flmlnk.com", extLabel: "Free on FLMLNK" },
  { id: "comps", name: "Comp finder", desc: "Find the five titles your film should be sold next to, and how they performed.", stage: "Showcase", status: "soon" },
  { id: "keyart", name: "Key art resizer", desc: "One poster, resized for every platform, festival and store listing.", stage: "Showcase", status: "soon" },
  { id: "reels", name: "Event reels", desc: "Turn a screening flyer into reels with a ticket link.", stage: "Share", status: "external", href: "https://showlnk.com", extLabel: "Live on Showlnk" },
  { id: "cutdown", name: "Trailer cutdown", desc: "Cut your trailer into 15 and 30 second vertical clips.", stage: "Share", status: "soon" },
  { id: "capture", name: "Festival reaction capture", desc: "Put a QR code on the screen after your screening. Audiences record a reaction on their phone, and you get videos to post for free.", stage: "Capture", status: "live", href: "/tools/capture" },
  { id: "sentiment", name: "Audience sentiment scan", desc: "See what people say about films like yours, in their words.", stage: "Capture", status: "soon" },
  { id: "fanmail", name: "Fan email sequences", desc: "Ready-to-send emails for premiere, release day and awards season.", stage: "Nurture", status: "soon" },
  { id: "tubi", name: "Tubi revenue calculator", desc: "See what your film can earn on Tubi in its first year, how many views it needs to break even, and what a campaign changes.", stage: "Convert", status: "live", href: "/tools/tubi" },
  { id: "adpack", name: "Ad packager", desc: "Your trailer and reactions, packaged into ads for Meta, YouTube and TikTok.", stage: "Convert", status: "soon" },
];

export const SOON_TOOL_IDS = TOOLS.filter((t) => t.status === "soon").map((t) => t.id);
export const STAGES: Stage[] = ["Showcase", "Share", "Capture", "Nurture", "Convert"];
