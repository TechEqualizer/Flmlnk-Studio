"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Footer, Nav } from "@/components/Chrome";
import { EmailDialog, type AskEmail } from "@/components/EmailDialog";
import { Locked, PlanCard } from "@/components/PlanCard";
import { useToast } from "@/components/Toast";
import { NumberField, type NumberKind } from "@/components/NumberField";
import { errorMessage, isEmail, useStudio } from "@/components/useStudio";
import { tierForMonthlySpend } from "@/lib/plans";
import { readLocal, STORAGE_KEYS, writeLocal } from "@/lib/storage-keys";
import { compactNumber, computeForecast, DEFAULT_INPUTS, money, type ForecastInputs, type ForecastResult } from "@/lib/tubi";

type NumKey = Exclude<keyof ForecastInputs, "audience">;


function Chart({ r, budget }: { r: ForecastResult; budget: number }) {
  const W = 640, H = 220, P = 34;
  const max = Math.max(budget, r.monthly[11].noAds, r.monthly[11].withCampaign, 1) * 1.08;
  const min = Math.min(0, ...r.monthly.map((m) => m.withCampaign));
  const x = (i: number) => P + (i * (W - P - 10)) / 11;
  const y = (v: number) => H - 24 - ((v - min) / (max - min)) * (H - 40);
  const path = (k: "noAds" | "withCampaign") => r.monthly.map((m, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(m[k]).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Cumulative earnings over 12 months">
      <line x1={P} x2={W - 10} y1={y(budget)} y2={y(budget)} stroke="#D4AF37" strokeDasharray="5 5" />
      {min < 0 ? <line x1={P} x2={W - 10} y1={y(0)} y2={y(0)} stroke="#232838" /> : null}
      <path d={path("noAds")} fill="none" stroke="#6b7180" strokeWidth={2} />
      <path d={path("withCampaign")} fill="none" stroke="#d5111c" strokeWidth={2.5} />
      {r.monthly.map((_, i) => (i % 2 === 0 || i === 11 ? <text key={i} x={x(i)} y={H - 6} fill="#6b7180" fontSize={11} textAnchor="middle">M{i + 1}</text> : null))}
      <text x={P - 4} y={y(budget) - 6} fill="#D4AF37" fontSize={11}>{money(budget)}</text>
    </svg>
  );
}

export default function TubiCalculator() {
  const s = useStudio();
  const toast = useToast();
  const unlock = useMutation(api.forecasts.unlock);
  const [inp, setInp] = useState<ForecastInputs>(DEFAULT_INPUTS);
  const [film, setFilm] = useState("");
  const [gateEmail, setGateEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ask, setAsk] = useState<AskEmail | null>(null);
  const opened = useRef(false);

  useEffect(() => {
    if (!s.ready) return;
    setInp({ ...DEFAULT_INPUTS, ...readLocal<Partial<ForecastInputs>>(STORAGE_KEYS.forecastInputs, {}) });
    setFilm(s.film);
    setGateEmail(s.email);
    setUnlocked(!!s.email && !!s.done.forecast);
    if (!opened.current) {
      opened.current = true;
      s.track("tool_open", "tubi");
    }
  }, [s.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const r = useMemo(() => computeForecast(inp), [inp]);
  useEffect(() => {
    if (!s.ready) return;
    writeLocal(STORAGE_KEYS.forecastInputs, inp);
    writeLocal(STORAGE_KEYS.lastForecast, r.net);
  }, [inp, r.net, s.ready]);

  const set = (k: NumKey, v: number) => {
    setInp((p) => ({ ...p, [k]: v }));
  };
  const F = (k: NumKey, label: string, kind: NumberKind, opts: { hint?: string; min?: number; max?: number } = {}) => (
    <NumberField id={`c_${k}`} label={label} kind={kind} value={inp[k]} onChange={(v) => set(k, v)} {...opts} />
  );
  const name = film || "your film";
  const tier = tierForMonthlySpend(Math.max(inp.spend, 1));
  const covered = Math.round(r.coveredPct);

  const verdict =
    r.gap <= 0 ? (
      <>{name} earns back its budget in year one on this plan, with <em>{money(-r.gap)}</em> left over. The next move is scaling what works.</>
    ) : inp.spend === 0 ? (
      <>With no promotion, {name} covers <em>{covered}%</em> of its budget in year one. Films rarely find an audience on Tubi without a push.</>
    ) : (
      <>On this plan, {name} covers <em>{covered}%</em> of its budget in year one. The gap is <em>{money(r.gap)}</em>. That&apos;s the honest number, and it&apos;s the one a campaign is built to close.</>
    );

  const steps: React.ReactNode[] = [];
  if (r.gap > 0 && r.roas > 1) steps.push(<><strong>Budget to break even:</strong> <span>about {money(r.extraSpendToBreakEven)} more in ads over the contract year ({money(r.monthlyToBreakEven)}/mo for {Math.max(1, Math.round(inp.months) || 4)} months), assuming a {r.roas}x return.</span></>);
  else if (r.gap > 0) steps.push(<><strong>Raise the return first.</strong> <span>At {r.roas}x per dollar, more ad spend won&apos;t close the gap. Warm the audience with reactions and a film page before you buy reach.</span></>);
  steps.push(<><strong>Warm the audience before launch.</strong> <span>Post festival reactions and clips so ads land on people who have seen the film talked about. <Link href="/tools/capture" style={{ textDecoration: "underline" }}>Capture reactions free</Link>.</span></>);
  steps.push(<><strong>Test small, then scale.</strong> <span>Run one creative per week, keep the one with the lowest cost per qualified viewer, and move budget to it.</span></>);

  const detail = (
    <>
      <div className="chart">
        <h4>Cumulative earnings over the 12-month contract</h4>
        <Chart r={r} budget={inp.budget} />
        <div className="legend">
          <span style={{ ["--c" as string]: "#6b7180" }}>No promotion</span>
          <span style={{ ["--c" as string]: "#d5111c" }}>With your campaign</span>
          <span style={{ ["--c" as string]: "#D4AF37" }}>Break-even ({money(inp.budget)})</span>
        </div>
      </div>
      <div className="plan">
        {steps.map((st, i) => (
          <div className="step" key={i}><b>{i + 1}</b><div>{st}</div></div>
        ))}
      </div>
    </>
  );

  return (
    <>
      <Nav film={s.film} active="Tubi calculator" />
      <main className="wrap">
        <div className="tool-page">
          <div className="tool-head">
            <h1>Tubi revenue calculator</h1>
            <Link className="btn btn-ghost btn-sm" href="/">All tools</Link>
          </div>
          <div className="tool-body">
            <div className="ws-main">
              <p style={{ color: "var(--muted)", maxWidth: "62ch" }}>An honest first-year forecast for {name} on Tubi. Tubi title contracts run 12 months, so this forecast covers one year.</p>
              <div className="fields" style={{ marginTop: 22 }}>
                <div className="field">
                  <label htmlFor="c_film">Film title</label>
                  <input id="c_film" maxLength={60} value={film} placeholder="e.g. Bone Hill" onChange={(e) => { setFilm(e.target.value); s.setFilm(e.target.value); }} />
                </div>
                {F("budget", "What did the film cost to make?", "money", { hint: "This is your break-even line.", max: 1e9 })}
                {F("runtime", "Runtime (minutes)", "int", { min: 1, max: 600 })}
                {F("organic", "Views per month with no promotion", "int", { hint: "Most indie titles land between 500 and 5,000.", max: 1e8 })}
                <div className="field">
                  <label>Who already knows the film?</label>
                  <div className="seg" role="group" aria-label="Audience">
                    <button type="button" aria-pressed={inp.audience === "cold"} onClick={() => { setInp((p) => ({ ...p, audience: "cold" })); }}>Nobody yet</button>
                    <button type="button" aria-pressed={inp.audience === "warm"} onClick={() => { setInp((p) => ({ ...p, audience: "warm" })); }}>We have fans</button>
                  </div>
                  <span className="hint">A warm audience (followers, an email list, festival buzz) turns ad dollars into views at a higher rate.</span>
                </div>
                {F("spend", "Monthly ad budget", "money", { hint: "Set it to 0 to see the forecast with no campaign.", max: 1e9 })}
                {F("months", "Months of ads", "int", { max: 12 })}
              </div>
              <details className="assume">
                <summary>Assumptions you can change</summary>
                <div className="fields">
                  {F("completion", "Average watch-through", "percent", { min: 1, max: 100 })}
                  {F("adsPerHour", "Ads per hour watched", "int", { hint: "Roughly 12 thirty-second spots.", max: 60 })}
                  {F("ecpm", "Partner revenue per 1,000 ad views", "rate", { hint: "$4.73 from FLMLNK's Shots campaign on Tubi.", max: 200 })}
                  {F("roasCold", "Return per $1 of ads, cold audience", "multiplier", { hint: "FLMLNK pilots have returned 2 to 10 times ad spend.", max: 50 })}
                  {F("roasWarm", "Return per $1 of ads, warm audience", "multiplier", { hint: "Shots returned 7.3 times ($1,500 in, about $11K back).", max: 50 })}
                </div>
              </details>

              <div className="results">
                <div className={`stat${r.gap <= 0 ? " good" : ""}`}>
                  <div className="k">First-year earnings after ad spend</div>
                  <div className="v">{money(r.net)}</div>
                  <div className="s">{money(r.organicYear)} from organic views, {money(r.campaignRevenue - r.spendTotal)} net from ads</div>
                </div>
                <div className="stat">
                  <div className="k">Views needed to break even</div>
                  <div className="v">{compactNumber(r.breakEvenViews)}</div>
                  <div className="s">About {(r.perView * 100).toFixed(1)}¢ per view at {inp.runtime} minutes</div>
                </div>
                <div className={`stat ${r.gap > 0 ? "bad" : "good"}`}>
                  <div className="k">{r.gap > 0 ? "Gap to break even" : "Profit over budget"}</div>
                  <div className="v">{money(Math.abs(r.gap))}</div>
                  <div className="s">Against a {money(inp.budget)} budget</div>
                </div>
              </div>
              <p className="verdict">{verdict}</p>

              {unlocked ? (
                detail
              ) : (
                <>
                  <div className="gate">
                    <h3>Get the month-by-month forecast and a plan to close the gap</h3>
                    <p>See the 12-month earnings curve for {name} and the ad budget it would take to break even. We&apos;ll email you a copy to share with your team or investors.</p>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setErr("");
                        if (!film.trim()) { setErr("Add your film's title first."); return; }
                        if (!isEmail(gateEmail)) { setErr("Enter a valid email address."); return; }
                        setBusy(true);
                        try {
                          await unlock({ email: gateEmail.trim(), filmName: film.trim(), inputs: inp });
                          s.setEmail(gateEmail);
                          s.markDone("forecast");
                          setUnlocked(true);
                          toast(`Full forecast unlocked. A copy is on its way to ${gateEmail.trim()}.`);
                        } catch (x) {
                          setErr(errorMessage(x));
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      <label className="sr" htmlFor="tubiEmail">Email</label>
                      <input id="tubiEmail" type="email" required placeholder="you@yourfilm.com" value={gateEmail} onChange={(e) => setGateEmail(e.target.value)} />
                      <button className="btn btn-red" type="submit" disabled={busy}>{busy ? "Unlocking…" : "Show my full forecast"}</button>
                    </form>
                    {err ? <p className="err">{err}</p> : null}
                    <p className="fine">Free. One email with your forecast, then occasional tips. Unsubscribe anytime.</p>
                  </div>
                  <div className="blurred" aria-hidden="true">{detail}</div>
                </>
              )}
            </div>
            <aside className="ws-side side">
              <h3>{r.gap > 0 ? `Close the ${money(r.gap)} gap` : "Scale what's working"}</h3>
              <p>
                FLMLNK builds and runs the campaign for {name}: creative from your trailer and reactions, targeting from films like yours, and weekly reporting tied to Tubi views.
                {r.monthlyToBreakEven > inp.spend ? ` Breaking even takes about ${money(r.monthlyToBreakEven)}/mo at today's return. Start at your budget, prove the return, then scale.` : ""}
              </p>
              <PlanCard
                tier={tier}
                bullets={[
                  `Fits your ${money(inp.spend)}/mo plan${tier.adCap === null || tier.adCap > inp.spend ? `, with room up to ${tier.adCap === null ? "any budget" : money(tier.adCap) + "/mo"}` : ""}`,
                  "Campaign built from your film's assets",
                  "Proof of demand you can show distributors",
                ]}
                cta={`Start ${tier.name}`}
                source="tubi"
                monthlySpend={inp.spend}
                email={s.email}
                filmName={film}
                onEmail={s.setEmail}
                setAsk={setAsk}
              />
              <Locked
                items={[
                  { title: "Live campaign tracking", body: "Cost per qualified viewer and actual Tubi lift, updated weekly." },
                  { title: "Distributor-ready report", body: "Turn your campaign results into proof a distributor can underwrite." },
                ]}
              />
              <p style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 16 }}>Forecasts are estimates based on the assumptions above and FLMLNK campaign data. Actual Tubi earnings depend on the platform, the season and your film.</p>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
      <EmailDialog ask={ask} initial={s.email} onClose={() => setAsk(null)} />
    </>
  );
}
