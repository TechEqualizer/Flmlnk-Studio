"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Footer, LockIcon, Nav } from "@/components/Chrome";
import { FeatureArt, Stars, TOOL_ART, TOOL_ICON } from "@/components/Art";
import { EmailDialog, type AskEmail } from "@/components/EmailDialog";
import { useToast } from "@/components/Toast";
import { useStudio, type DoneMap } from "@/components/useStudio";
import { STAGES, TIERS, TOOLS, type Tool } from "@/lib/plans";
import { readLocal, STORAGE_KEYS } from "@/lib/storage-keys";
import { money } from "@/lib/tubi";

const DEMAND: { id: keyof DoneMap | "campaign" | "distributor"; label: string; href?: string; paid?: boolean; tool?: string }[] = [
  { id: "forecast", label: "Revenue forecast", href: "/tools/tubi" },
  { id: "reactions", label: "Audience reactions", href: "/tools/capture" },
  { id: "comps", label: "Comparable titles", tool: "comps" },
  { id: "sentiment", label: "Audience sentiment", tool: "sentiment" },
  { id: "campaign", label: "Campaign proof (ROAS)", paid: true },
  { id: "distributor", label: "Distributor-ready report", paid: true },
];

function Badge({ t }: { t: Tool }) {
  if (t.id === "capture") return <span className="badge new">NEW</span>;
  if (t.status === "live") return <span className="badge free">FREE</span>;
  if (t.status === "external") return <span className="badge ext">LIVE</span>;
  return <span className="badge soon">SOON</span>;
}

function Bulbs({ lit, animate }: { lit: boolean; animate: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pts, setPts] = useState<[number, number][]>([]);
  const [on, setOn] = useState(0);
  useEffect(() => {
    const build = () => {
      const el = ref.current;
      if (!el) return;
      const { width: w, height: h } = el.getBoundingClientRect();
      const nx = Math.floor(w / 18), ny = Math.floor(h / 18);
      const p: [number, number][] = [];
      for (let i = 0; i <= nx; i++) p.push([(i / nx) * 100, 0]);
      for (let j = 1; j <= ny; j++) p.push([100, (j / ny) * 100]);
      for (let i = nx - 1; i >= 0; i--) p.push([(i / nx) * 100, 100]);
      for (let j = ny - 1; j > 0; j--) p.push([0, (j / ny) * 100]);
      setPts(p);
    };
    build();
    const ro = new ResizeObserver(build);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!lit || reduce) {
      setOn(lit ? pts.length : 0);
      return;
    }
    setOn(0);
    let n = 0;
    const id = setInterval(() => {
      n += 2;
      setOn(n);
      if (n >= pts.length) clearInterval(id);
    }, 14);
    return () => clearInterval(id);
  }, [lit, animate, pts.length]);
  return (
    <div className="bulbs" ref={ref} aria-hidden="true">
      {pts.map((p, i) => (
        <i key={i} className={i < on ? "lit" : undefined} style={{ left: `${p[0]}%`, top: `${p[1]}%` }} />
      ))}
    </div>
  );
}

export default function Home() {
  const s = useStudio();
  const toast = useToast();
  const joinWaitlist = useMutation(api.leads.joinWaitlist);
  const [draft, setDraft] = useState("");
  const [animate, setAnimate] = useState(0);
  const [tab, setTab] = useState<string>("all");
  const [ask, setAsk] = useState<AskEmail | null>(null);
  const [lastForecast, setLastForecast] = useState<number | null>(null);
  const feat = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (!s.ready) return;
    setDraft(s.film);
    setLastForecast(readLocal<number | null>(STORAGE_KEYS.lastForecast, null));
    if (!tracked.current) {
      tracked.current = true;
      s.track("visit");
    }
  }, [s.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const go = () => {
      const h = window.location.hash.replace("#", "");
      if (STAGES.includes(h as (typeof STAGES)[number])) setTab(h);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);

  const notify = useCallback(
    (toolId: string) => {
      const tool = TOOLS.find((t) => t.id === toolId);
      if (!tool) return;
      const submit = async (email: string) => {
        await joinWaitlist({ toolId, email, filmName: s.film || undefined });
        s.setEmail(email);
        s.markWaitlist(toolId);
        toast(`You're on the list. We'll email ${email} when ${tool.name} opens.`);
      };
      if (s.email) {
        submit(s.email).catch(() => toast("That didn't go through. Please try again."));
        return;
      }
      setAsk({ title: `Get ${tool.name} first`, body: "We'll email you the day it opens. Waitlist demand decides what we build next.", ok: "Notify me", onSubmit: submit });
    },
    [joinWaitlist, s, toast],
  );

  const doneCount = DEMAND.filter((d) => s.done[d.id as keyof DoneMap]).length;
  const filmLabel = s.film || "your film";
  const tools = TOOLS.filter((t) => tab === "all" || t.stage === tab);

  return (
    <>
      <Nav film={s.film} active="Home" />
      <main className="wrap" id="top">
        <div className="feat" ref={feat} aria-label="Featured tools">
          <Link className="fcard" href="/tools/capture">
            <div className="media"><FeatureArt kind="capture" /></div>
            <h3>Festival reaction capture</h3>
            <p>A QR code after your screening turns the audience into free ads</p>
          </Link>
          <Link className="fcard" href="/tools/tubi">
            <div className="media">
              <FeatureArt kind="tubi" bigNumber={lastForecast !== null && s.film ? money(lastForecast) : undefined} caption={lastForecast !== null && s.film ? `${s.film}, year one after ads` : undefined} />
            </div>
            <h3>Tubi revenue calculator</h3>
            <p>Your film&apos;s first-year earnings and break-even, before you spend a dollar</p>
          </Link>
          <a className="fcard" href="https://showlnk.com" target="_blank" rel="noopener noreferrer">
            <div className="media"><FeatureArt kind="reels" /></div>
            <h3>Event reels on Showlnk</h3>
            <p>Turn a screening flyer into reels with a ticket link</p>
          </a>
          <button type="button" className="fcard" onClick={() => notify("comps")}>
            <div className="media"><FeatureArt kind="comps" /></div>
            <h3>Comp finder</h3>
            <p>Coming soon: the five titles your film should be sold next to</p>
          </button>
        </div>
        <div className="feat-nav">
          <button type="button" aria-label="Previous" onClick={() => feat.current?.scrollBy({ left: -(feat.current.clientWidth * 0.8), behavior: "smooth" })}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 3L5 8l5 5" /></svg>
          </button>
          <button type="button" aria-label="Next" onClick={() => feat.current?.scrollBy({ left: feat.current.clientWidth * 0.8, behavior: "smooth" })}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3l5 5-5 5" /></svg>
          </button>
        </div>

        <section className="duo" aria-label="Start with your film">
          <div className="marquee" id="marqueeBox">
            <Bulbs lit animate={animate} />
            <div>
              <div className="kicker">Now showing</div>
              <div className={`marquee-title${draft || s.film ? "" : " empty"}`}>{draft || s.film || "Your film"}</div>
            </div>
            <div>
              <form
                className="film-form"
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.trim()) return;
                  s.setFilm(draft);
                  s.track("film_set");
                  setAnimate((n) => n + 1);
                  toast(`${draft.trim()} is on the marquee. Pick a tool to start.`);
                }}
              >
                <label className="sr" htmlFor="filmInput">What&apos;s your film called?</label>
                <input id="filmInput" maxLength={60} placeholder="What's your film called?" required value={draft} onChange={(e) => setDraft(e.target.value)} />
                <button className="btn btn-red" type="submit">Put it on the marquee</button>
              </form>
              <small>Free tools for independent filmmakers. Enter your title once and every tool uses it.</small>
            </div>
          </div>
          <div className="quick">
            {["capture", "tubi", "page", "reels", "comps", "adpack"].map((id) => {
              const t = TOOLS.find((x) => x.id === id)!;
              const onList = s.waitlist.includes(id);
              const inner = (
                <>
                  <div className="top"><span className="ic">{TOOL_ICON[id]}</span><Badge t={t} /></div>
                  <h3>{t.name}</h3>
                  <p>{t.status === "soon" && onList ? "You're on the list" : t.desc}</p>
                </>
              );
              if (t.status === "live") return <Link key={id} className="qt" href={t.href!}>{inner}</Link>;
              if (t.status === "external") return <a key={id} className="qt" href={t.href} target="_blank" rel="noopener noreferrer">{inner}</a>;
              return <button key={id} type="button" className="qt" onClick={() => notify(id)} disabled={onList}>{inner}</button>;
            })}
          </div>
        </section>

        <section className="excl" id="exclusive" aria-labelledby="exclH">
          <Stars />
          <span className="chip">FLMLNK exclusive</span>
          <h2 id="exclH">The tools are free.<span>The campaigns close the gap.</span></h2>
          <p>When a tool shows your film is short of break-even, FLMLNK builds the campaign from your trailer and audience reactions, runs it, and reports the lift in Tubi views.</p>
          <div className="acts">
            <Link className="btn btn-white" href="/tools/tubi">Forecast my film</Link>
            <Link className="btn btn-ghost" href="#pricing">See plans</Link>
          </div>
          <div className="proof">
            <div><b>7.3x</b><span>Return on ad spend, Shots campaign on Tubi</span></div>
            <div><b>~$11K</b><span>Back from $1,500 in ads on Shots</span></div>
            <div><b>2–10x</b><span>Return range across FLMLNK pilot campaigns</span></div>
            <div><b>$0</b><span>Cost to use every Studio tool</span></div>
          </div>
        </section>

        <section className="demand" aria-labelledby="demandH">
          <div>
            <h2 id="demandH">Your film&apos;s demand file</h2>
            <p>
              {doneCount === 0
                ? `Each tool adds proof that people want to watch ${filmLabel}. That proof is what distributors buy.`
                : `${doneCount} of ${DEMAND.length} complete for ${filmLabel}. Campaign proof and the distributor report unlock when FLMLNK runs your first campaign.`}
            </p>
            <div className="meter"><b style={{ width: `${Math.round((doneCount / DEMAND.length) * 100)}%` }} /></div>
          </div>
          <div className="chips">
            {DEMAND.map((d) => {
              const isDone = !!s.done[d.id as keyof DoneMap];
              const cls = `chip${isDone ? " done" : ""}${d.paid ? " locked" : ""}`;
              if (d.href) return <Link key={d.id} href={d.href} className={cls}>{d.label}</Link>;
              if (d.paid) return <Link key={d.id} href="#pricing" className={cls}><LockIcon />{d.label}</Link>;
              return <button key={d.id} type="button" className={cls} onClick={() => notify(d.tool!)}>{d.label}</button>;
            })}
          </div>
        </section>

        <section className="sect" id="explore" aria-labelledby="exploreH">
          <div className="sect-head">
            <div>
              <h2 id="exploreH">Every tool, by what it does for your film</h2>
              <p>From the first screening to the distributor meeting.</p>
            </div>
          </div>
          <div className="tabs" role="group" aria-label="Filter tools by stage">
            {["all", ...STAGES].map((st) => (
              <button key={st} type="button" aria-pressed={tab === st} onClick={() => setTab(st)}>{st === "all" ? "All tools" : st}</button>
            ))}
          </div>
          <div className="grid">
            {tools.map((t) => {
              const onList = s.waitlist.includes(t.id);
              return (
                <article className="gcard" key={t.id}>
                  {t.status === "live" ? <Link className="cover" href={t.href!} aria-label={`Open ${t.name}`} /> : null}
                  <div className="art">{TOOL_ART[t.id]}</div>
                  <div className="info">
                    <div className="row1"><Badge t={t} /><span className="stage">{t.stage}</span></div>
                    <h3>{t.name}</h3>
                    <p>{t.desc}</p>
                    {t.status === "live" ? (
                      <span className="btn btn-white btn-sm cta" aria-hidden="true">Open free</span>
                    ) : t.status === "external" ? (
                      <a className="btn btn-white btn-sm cta" href={t.href} target="_blank" rel="noopener noreferrer">{t.extLabel}</a>
                    ) : (
                      <button type="button" className="btn btn-ghost btn-sm cta" onClick={() => notify(t.id)} disabled={onList}>{onList ? "You're on the list" : "Notify me"}</button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="pricing" id="pricing" aria-labelledby="pricingH">
          <h2 id="pricingH">Every plan includes every tool</h2>
          <p>Plans add the campaigns: ads built from your film&apos;s assets, run by FLMLNK, with reporting you can show a distributor.</p>
          <div className="tiers">
            {TIERS.map((t) => (
              <div className="t" key={t.id}>
                <b>{t.name}</b>
                <div className="p">${t.price.toLocaleString("en-US")}<small>/mo</small></div>
                <ul>
                  <li>{t.blurb}</li>
                  <li>Ad budget up to {t.adCap === null ? "unlimited" : `$${t.adCap.toLocaleString("en-US")}/mo`}</li>
                  <li>{t.takeRate}% take rate</li>
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <EmailDialog ask={ask} initial={s.email} onClose={() => setAsk(null)} />
    </>
  );
}
