"use client";
import { useEffect, useState } from "react";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { Nav } from "@/components/Chrome";
import { errorMessage } from "@/components/useStudio";
import { TOOLS, HOT_LEAD_SCORE } from "@/lib/plans";
import { money } from "@/lib/tubi";

type Dash = FunctionReturnType<typeof api.admin.dashboard>;
const KEY = "flmlnk_studio_admin_key";

export default function Admin() {
  const convex = useConvex();
  const [key, setKey] = useState("");
  const [data, setData] = useState<Dash | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async (k: string) => {
    setBusy(true);
    setErr("");
    try {
      const d = await convex.query(api.admin.dashboard, { key: k });
      setData(d);
      try { sessionStorage.setItem(KEY, k); } catch {}
    } catch (x) {
      setErr(errorMessage(x));
      setData(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let k = "";
    try { k = sessionStorage.getItem(KEY) ?? ""; } catch {}
    if (k) { setKey(k); load(k); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data)
    return (
      <>
        <Nav />
        <main className="wrap">
          <form className="center-card" onSubmit={(e) => { e.preventDefault(); load(key); }}>
            <h1>Team dashboard</h1>
            <p>Enter the admin key set in your Convex environment variables.</p>
            <div className="field" style={{ marginTop: 16 }}>
              <label htmlFor="ak">Admin key</label>
              <input id="ak" type="password" value={key} onChange={(e) => setKey(e.target.value)} required autoComplete="current-password" />
            </div>
            {err ? <p className="err">{err}</p> : null}
            <button className="btn btn-red" type="submit" disabled={busy} style={{ marginTop: 14 }}>{busy ? "Opening…" : "Open dashboard"}</button>
          </form>
        </main>
      </>
    );

  const f = data.funnel;
  const maxW = Math.max(1, ...data.waitlist.map((w) => w.count));
  const toolName = (id: string) => TOOLS.find((t) => t.id === id)?.name ?? id;
  const when = (t: number) => new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return (
    <>
      <Nav />
      <main className="wrap adm" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ marginTop: 0 }}>Funnel</h3>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => load(key)} disabled={busy}>{busy ? "Refreshing…" : "Refresh"}</button>
        </div>
        <div className="results" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
          {[["Visits", f.visits], ["Tool opens", f.toolOpens], ["Leads", f.leads], ["Plan clicks", f.planClicks], ["Capture pages", f.captureSessions], ["Reactions", f.reactions]].map(([k, v]) => (
            <div className="stat" key={k as string}><div className="k">{k}</div><div className="v">{v}</div></div>
          ))}
        </div>

        <h3>Leads, ranked by intent</h3>
        <p className="note">The score weighs film budget, the gap the calculator showed, planned ad spend, use of more than one tool and plan clicks. Leads at {HOT_LEAD_SCORE} or above alert the team.</p>
        <div style={{ overflow: "auto" }}>
          <table>
            <thead><tr><th>Email</th><th>Film</th><th>Came from</th><th>Budget</th><th>Gap shown</th><th>Plan</th><th>Score</th><th>Updated</th></tr></thead>
            <tbody>
              {data.leads.length === 0 ? <tr><td colSpan={8} style={{ color: "var(--dim)" }}>No leads yet.</td></tr> : null}
              {data.leads.map((l) => (
                <tr key={l.id}>
                  <td>{l.email}</td><td>{l.filmName ?? "—"}</td><td>{l.sources.join(", ")}</td>
                  <td>{l.budget ? money(l.budget) : "—"}</td><td>{l.gap ? money(l.gap) : "—"}</td><td>{l.plan ?? "—"}</td>
                  <td><span className={`heat ${l.score >= HOT_LEAD_SCORE ? "hot" : l.score >= 35 ? "warm" : ""}`}>{l.score}</span></td>
                  <td>{when(l.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Plan clicks</h3>
        <div style={{ overflow: "auto" }}>
          <table>
            <thead><tr><th>Email</th><th>Film</th><th>Plan</th><th>From</th><th>When</th></tr></thead>
            <tbody>
              {data.planIntents.length === 0 ? <tr><td colSpan={5} style={{ color: "var(--dim)" }}>No plan clicks yet.</td></tr> : null}
              {data.planIntents.map((p) => <tr key={p.id}><td>{p.email}</td><td>{p.filmName ?? "—"}</td><td>{p.tier}</td><td>{p.source}</td><td>{when(p.createdAt)}</td></tr>)}
            </tbody>
          </table>
        </div>

        <h3>What to build next</h3>
        <p className="note">Waitlist sign-ups for each tool that is coming soon.</p>
        <div className="bars">
          {data.waitlist.map((w) => (
            <div key={w.toolId}><span>{toolName(w.toolId)}</span><i style={{ width: `${Math.max(2, (w.count / maxW) * 100)}%`, opacity: w.count ? 1 : 0.25 }} /><span>{w.count}</span></div>
          ))}
        </div>

        <h3>Capture pages</h3>
        <div style={{ overflow: "auto" }}>
          <table>
            <thead><tr><th>Film</th><th>Screening</th><th>Owner</th><th>Reactions</th><th>Created</th></tr></thead>
            <tbody>
              {data.sessions.length === 0 ? <tr><td colSpan={5} style={{ color: "var(--dim)" }}>No capture pages yet.</td></tr> : null}
              {data.sessions.map((c) => <tr key={c.id}><td>{c.filmName}</td><td>{c.eventName}</td><td>{c.ownerEmail}</td><td>{c.reactionCount}</td><td>{when(c.createdAt)}</td></tr>)}
            </tbody>
          </table>
        </div>

        <h3>Email log</h3>
        <p className="note">&ldquo;Skipped&rdquo; means Resend isn&apos;t configured yet, so the email was logged but not sent.</p>
        <div style={{ overflow: "auto" }}>
          <table>
            <thead><tr><th>To</th><th>Subject</th><th>Type</th><th>Status</th><th>When</th></tr></thead>
            <tbody>
              {data.emails.map((e) => <tr key={e.id}><td>{e.to}</td><td>{e.subject}</td><td>{e.kind}</td><td title={e.error ?? undefined}>{e.status}</td><td>{when(e.createdAt)}</td></tr>)}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
