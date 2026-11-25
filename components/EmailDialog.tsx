"use client";
import { useEffect, useRef, useState } from "react";
import { isEmail } from "./useStudio";

export type AskEmail = { title: string; body: string; ok: string; onSubmit: (email: string) => Promise<void> | void };

export function EmailDialog({ ask, initial, onClose }: { ask: AskEmail | null; initial: string; onClose: () => void }) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ask) return;
    setValue(initial);
    setErr("");
    setTimeout(() => input.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ask, initial, onClose]);

  if (!ask) return null;
  return (
    <div className="ws open" role="dialog" aria-modal="true" aria-labelledby="askTitle" style={{ zIndex: 70, alignItems: "center", padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ws-panel" style={{ maxWidth: 440, padding: 22, borderRadius: 14 }}>
        <h2 id="askTitle" style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 24 }}>{ask.title}</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>{ask.body}</p>
        <form
          style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (!isEmail(value)) {
              setErr("Enter a valid email address.");
              return;
            }
            setBusy(true);
            try {
              await ask.onSubmit(value.trim());
              onClose();
            } catch {
              setErr("That didn't go through. Please try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="sr" htmlFor="askEmail">Email</label>
          <input ref={input} id="askEmail" type="email" required placeholder="you@yourfilm.com" value={value} onChange={(e) => setValue(e.target.value)} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: "11px 12px", fontSize: 16 }} />
          {err ? <p className="err">{err}</p> : null}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-red" disabled={busy}>{busy ? "Saving…" : ask.ok}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
