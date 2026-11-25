export type Audience = "cold" | "warm";

export type ForecastInputs = {
  budget: number;
  runtime: number;
  organic: number;
  spend: number;
  months: number;
  audience: Audience;
  completion: number;
  adsPerHour: number;
  ecpm: number;
  roasCold: number;
  roasWarm: number;
};

export type ForecastResult = {
  perView: number;
  organicYear: number;
  roas: number;
  spendTotal: number;
  campaignRevenue: number;
  net: number;
  gap: number;
  breakEvenViews: number;
  extraSpendToBreakEven: number;
  monthlyToBreakEven: number;
  coveredPct: number;
  monthly: { noAds: number; withCampaign: number }[];
};

export const DEFAULT_INPUTS: ForecastInputs = {
  budget: 50000,
  runtime: 90,
  organic: 1500,
  spend: 500,
  months: 4,
  audience: "cold",
  completion: 55,
  adsPerHour: 12,
  ecpm: 4.73,
  roasCold: 2.5,
  roasWarm: 5,
};

export function computeForecast(i: ForecastInputs): ForecastResult {
  const perView = (i.runtime / 60) * (i.completion / 100) * i.adsPerHour * (i.ecpm / 1000);
  const organicMonthly = i.organic * perView;
  const organicYear = organicMonthly * 12;
  const roas = i.audience === "warm" ? i.roasWarm : i.roasCold;
  const months = Math.min(12, Math.max(0, Math.round(i.months)));
  const spendTotal = i.spend * months;
  const campaignRevenue = spendTotal * roas;
  const net = organicYear + campaignRevenue - spendTotal;
  const gap = i.budget - net;
  const breakEvenViews = perView > 0 ? Math.ceil(i.budget / perView) : 0;
  const extraSpendToBreakEven = gap > 0 && roas > 1 ? gap / (roas - 1) : 0;
  const monthlyToBreakEven =
    extraSpendToBreakEven > 0 ? Math.ceil((i.spend * months + extraSpendToBreakEven) / Math.max(1, months || 4) / 50) * 50 : 0;
  const coveredPct = i.budget > 0 ? Math.max(0, Math.min(100, (net / i.budget) * 100)) : 100;
  const monthly: ForecastResult["monthly"] = [];
  let noAds = 0;
  let withCampaign = 0;
  for (let m = 1; m <= 12; m++) {
    noAds += organicMonthly;
    withCampaign += organicMonthly + (m <= months ? i.spend * roas - i.spend : 0);
    monthly.push({ noAds, withCampaign });
  }
  return {
    perView,
    organicYear,
    roas,
    spendTotal,
    campaignRevenue,
    net,
    gap,
    breakEvenViews,
    extraSpendToBreakEven,
    monthlyToBreakEven,
    coveredPct,
    monthly,
  };
}

export function money(n: number): string {
  const a = Math.abs(n);
  const s = a >= 1e6 ? (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + "M" : a >= 1e4 ? Math.round(a / 1e3) + "K" : Math.round(a).toLocaleString("en-US");
  return (n < 0 ? "−$" : "$") + s;
}

export function compactNumber(n: number): string {
  return n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e4 ? Math.round(n / 1e3) + "K" : Math.round(n).toLocaleString("en-US");
}
