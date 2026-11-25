"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Footer, Nav } from "@/components/Chrome";
import { errorMessage, isEmail, useStudio } from "@/components/useStudio";
import { readLocal, STORAGE_KEYS, writeLocal } from "@/lib/storage-keys";
import { FREE_REACTION_LIMIT } from "@/lib/plans";

type SavedLink = { token: string; filmName: string; eventName: string; createdAt: number };

export default function CaptureSetup() {
  const s = useStudio();
  const router = useRouter();
  const create = useAction(api.capture.createSession);
  const [film, setFilm] = useState("");
  const [eventName, setEventName] = useState("");
  const [prompt, setPrompt] = useState("What did you feel when the credits rolled?");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<SavedLink[]>([]);
  const opened = useRef(false);

  useEffect(() => {
    if (!s.ready) return;
    setFilm(s.film);
    setEmail(s.email);
    setSaved(readLocal<SavedLink[]>(STORAGE_KEYS.manageLinks, []));
    if (!opened.current) {
      opened.current = true;
      s.track("tool_open", "capture");
    }
  }, [s.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Nav film={s.film} active="Reaction capture" />
      <main className="wrap">
        <div className="tool-page">
          <div className="tool-head">
            <h1>Festival reaction capture</h1>
            <Link className="btn btn-ghost btn-sm" href="/">All tools</Link>
          </div>
          <div className="tool-body">
            <div className="ws-main">
              <p style={{ color: "var(--muted)", maxWidth: "62ch" }}>
                Put a QR code on screen after your screening. Audience members scan it, record a short reaction on their phone and agree to let you share it. You get vertical videos to post for free.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setErr("");
                  if (!film.trim() || !eventName.trim()) { setErr("Add the film and the screening."); return; }
                  if (!isEmail(email)) { setErr("Enter a valid email address."); return; }
                  setBusy(true);
                  try {
                    const r = await create({ email: email.trim(), filmName: film.trim(), eventName: eventName.trim(), prompt: prompt.trim() });
                    s.setFilm(film);
                    s.setEmail(email);
                    s.markDone("reactions");
                    const list = [{ token: r.manageToken, filmName: film.trim(), eventName: eventName.trim(), createdAt: Date.now() }, ...saved].slice(0, 20);
                    writeLocal(STORAGE_KEYS.manageLinks, list);
                    router.push(`/manage/${r.manageToken}`);
                  } catch (x) {
                    setErr(errorMessage(x));
                    setBusy(false);
                  }
                }}
              >
                <div className="fields" style={{ marginTop: 22 }}>
                  <div className="field">
                    <label htmlFor="k_film">Film</label>
                    <input id="k_film" maxLength={60} value={film} placeholder="Film title" onChange={(e) => setFilm(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label htmlFor="k_event">Screening or festival</label>
                    <input id="k_event" maxLength={80} value={eventName} placeholder="e.g. Freep Film Festival, Saturday 7pm" onChange={(e) => setEventName(e.target.value)} required />
                  </div>
                  <div className="field full">
                    <label htmlFor="k_prompt">The question audiences answer</label>
                    <input id="k_prompt" maxLength={90} minLength={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} required />
                    <span className="hint">Short and emotional works best. Reactions are capped at 30 seconds.</span>
                  </div>
                </div>
                <div className="gate">
                  <h3>Create your capture page</h3>
                  <p>We&apos;ll make a QR code for this screening and a page where your audience records. Free for up to {FREE_REACTION_LIMIT} reactions per screening.</p>
                  <div className="gate-row" style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                    <label className="sr" htmlFor="capEmail">Email</label>
                    <input id="capEmail" type="email" required placeholder="you@yourfilm.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, minWidth: 220, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px" }} />
                    <button className="btn btn-red" type="submit" disabled={busy}>{busy ? "Creating…" : "Create capture page"}</button>
                  </div>
                  {err ? <p className="err">{err}</p> : null}
                  <p className="fine">We email you the private link to your reactions. Audiences need no app and no account.</p>
                </div>
              </form>
              {saved.length ? (
                <div style={{ marginTop: 28 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 600 }}>Your capture pages on this device</h4>
                  <ul style={{ listStyle: "none", marginTop: 10, display: "grid", gap: 8 }}>
                    {saved.map((l) => (
                      <li key={l.token}>
                        <Link className="chip" href={`/manage/${l.token}`}>{l.filmName} · {l.eventName}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <aside className="ws-side side">
              <h3>How it works</h3>
              <div className="plan">
                <div className="step"><b>1</b><div><strong>Create the page.</strong> <span>Takes a minute. You get a QR code and a private link.</span></div></div>
                <div className="step"><b>2</b><div><strong>Show the QR code.</strong> <span>Put it on screen as the credits roll, or print it for the lobby.</span></div></div>
                <div className="step"><b>3</b><div><strong>Collect reactions.</strong> <span>Each person records up to 30 seconds and agrees to let you share it.</span></div></div>
                <div className="step"><b>4</b><div><strong>Post them.</strong> <span>Download any reaction, or let Starter cut a highlight reel and run it as an ad.</span></div></div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
