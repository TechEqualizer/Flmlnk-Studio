"use client";
import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import qrcode from "qrcode-generator";
import { api } from "@/convex/_generated/api";
import { Footer, Nav } from "@/components/Chrome";
import { EmailDialog, type AskEmail } from "@/components/EmailDialog";
import { Locked, PlanCard } from "@/components/PlanCard";
import { useToast } from "@/components/Toast";
import { useStudio } from "@/components/useStudio";
import { TIERS } from "@/lib/plans";

function QR({ text }: { text: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !text) return;
    const q = qrcode(0, "M");
    q.addData(text);
    q.make();
    const n = q.getModuleCount(), sz = 8, m = 2;
    c.width = c.height = (n + m * 2) * sz;
    const x = c.getContext("2d");
    if (!x) return;
    x.fillStyle = "#fff";
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "#0b0d10";
    for (let r = 0; r < n; r++) for (let cc = 0; cc < n; cc++) if (q.isDark(r, cc)) x.fillRect((cc + m) * sz, (r + m) * sz, sz, sz);
  }, [text]);
  return <canvas ref={ref} role="img" aria-label="QR code for the audience capture page" />;
}

export default function Manage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const s = useStudio();
  const toast = useToast();
  const data = useQuery(api.capture.manageView, { token });
  const [ask, setAsk] = useState<AskEmail | null>(null);
  const [origin, setOrigin] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => setOrigin(window.location.origin), []);
  const captureUrl = useMemo(() => (data && origin ? `${origin}/r/${data.slug}` : ""), [data, origin]);

  if (data === undefined) return (<><Nav film={s.film} /><main className="wrap"><div className="center-card"><p>Loading your capture page…</p></div></main></>);
  if (data === null)
    return (
      <>
        <Nav film={s.film} />
        <main className="wrap">
          <div className="center-card">
            <h1>We couldn&apos;t find that capture page</h1>
            <p>Check the link in your email, or create a new capture page.</p>
            <Link className="btn btn-red" href="/tools/capture" style={{ marginTop: 16 }}>Create a capture page</Link>
          </div>
        </main>
      </>
    );

  const n = data.reactionCount;
  const starter = TIERS[1];
  return (
    <>
      <Nav film={data.filmName} active="Reaction capture" />
      <main className="wrap">
        <div className="tool-page">
          <div className="tool-head">
            <h1>{data.filmName} · {data.eventName}</h1>
            <Link className="btn btn-ghost btn-sm" href="/tools/capture">New screening</Link>
          </div>
          <div className="tool-body">
            <div className="ws-main">
              <p style={{ color: "var(--muted)", maxWidth: "62ch" }}>This is your private page. Bookmark it, or use the link we emailed to {data.ownerEmail}. New reactions appear here as they come in.</p>
              <div className="qr-card">
                <div className="qr-box" ref={box}>{captureUrl ? <QR text={captureUrl} /> : null}</div>
                <div>
                  <h4>Show this after the screening</h4>
                  <p>Put it on screen as the credits roll, or print it for the lobby. Audiences don&apos;t need an app. They&apos;ll be asked: &ldquo;{data.prompt}&rdquo;</p>
                  <div className="acts">
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => { s.track("qr_present", "capture"); box.current?.requestFullscreen?.().catch(() => toast("Full screen isn't available here. Right-click the code to save it.")); }}>Show full screen</button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => { s.track("link_copied", "capture"); navigator.clipboard.writeText(captureUrl).then(() => toast("Audience link copied."), () => toast(captureUrl)); }}>Copy audience link</button>
                    <a className="btn btn-ghost btn-sm" href={captureUrl} target="_blank" rel="noopener noreferrer">Preview audience page</a>
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 10, wordBreak: "break-all" }}>{captureUrl}</p>
                </div>
              </div>
              <div className="wall">
                <div className="wall-head"><h4>Reactions</h4><span>{n} of {data.reactionLimit} free reactions</span></div>
                <div className="cap-bar"><b style={{ width: `${Math.min(100, (n / data.reactionLimit) * 100)}%` }} /></div>
                <div className="reacts">
                  {data.reactions.map((r) => (
                    <div className="react" key={r.id}>
                      {r.url ? <video src={r.url} controls playsInline preload="metadata" /> : null}
                      <div className="who">{r.displayName ?? "Audience member"} · {Math.round(r.durationSec)}s{r.url ? <> · <a href={r.url} download style={{ textDecoration: "underline" }}>Download</a></> : null}</div>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - data.reactions.length) }).map((_, i) => (
                    <div className="react empty" key={`e${i}`}>{i === 0 && n === 0 ? "Reactions appear here as audiences record them." : "Waiting for a reaction"}</div>
                  ))}
                </div>
              </div>
            </div>
            <aside className="ws-side side">
              <h3>{n === 0 ? "Reactions are free. The reel is the payoff." : `${n} reaction${n > 1 ? "s" : ""} in. Now make them work.`}</h3>
              <p>Raw reactions are proof. A cut reel running as an ad is reach. Starter turns this screening into posts and your first campaign.</p>
              <PlanCard
                tier={starter}
                bullets={["Unlimited reactions per screening", "Auto-cut highlight reel with captions", "Best reactions run as ads, up to $500/mo"]}
                cta="Make my reaction reel"
                source="capture"
                monthlySpend={0}
                email={s.email || data.ownerEmail}
                filmName={data.filmName}
                onEmail={s.setEmail}
                setAsk={setAsk}
              />
              <Locked
                items={[
                  { title: "Highlight reel", body: "Your best 30 seconds of reactions, cut and captioned for Reels, TikTok and Shorts." },
                  { title: "Boost the best reaction", body: "Run your strongest reaction as an ad to people who like films like yours." },
                  { title: 'Remove "Captured with FLMLNK"', body: "Show only your film's branding on the capture page." },
                ]}
              />
            </aside>
          </div>
        </div>
      </main>
      <Footer />
      <EmailDialog ask={ask} initial={s.email} onClose={() => setAsk(null)} />
    </>
  );
}
