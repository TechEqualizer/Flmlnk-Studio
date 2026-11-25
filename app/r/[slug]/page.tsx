"use client";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { errorMessage } from "@/components/useStudio";

const MAX_SEC = 30;
type Phase = "ready" | "recording" | "review" | "uploading" | "done";

function pickMime(): string {
  const options = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  if (typeof MediaRecorder === "undefined") return "";
  return options.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

function uploadWithProgress(url: string, blob: Blob, onProgress: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", blob.type || "video/webm");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve((JSON.parse(xhr.responseText) as { storageId: string }).storageId);
        } catch {
          reject(new Error("Upload failed"));
        }
      } else reject(new Error("Upload failed"));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(blob);
  });
}

function videoDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const d = v.duration;
      URL.revokeObjectURL(v.src);
      resolve(Number.isFinite(d) ? d : 0);
    };
    v.onerror = () => resolve(0);
    v.src = URL.createObjectURL(blob);
  });
}

export default function AudiencePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const session = useQuery(api.capture.publicSession, { slug });
  const getUploadUrl = useMutation(api.capture.generateUploadUrl);
  const submit = useMutation(api.capture.submitReaction);
  const [phase, setPhase] = useState<Phase>("ready");
  const [consent, setConsent] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [secs, setSecs] = useState(0);
  const [progress, setProgress] = useState(0);
  const [clip, setClip] = useState<{ blob: Blob; url: string; duration: number } | null>(null);
  const live = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const started = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const stopStream = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(() => () => stopStream(), []);

  useEffect(() => {
    if (phase !== "recording") return;
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - started.current) / 1000);
      setSecs(s);
      if (s >= MAX_SEC && rec.current?.state === "recording") rec.current.stop();
    }, 250);
    return () => clearInterval(id);
  }, [phase]);

  const start = async () => {
    setErr("");
    if (!consent) {
      setErr("Check the box to agree first. Every reaction needs it.");
      return;
    }
    const mime = pickMime();
    if (!navigator.mediaDevices?.getUserMedia || !mime) {
      fileInput.current?.click();
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } }, audio: true });
      stream.current = s;
      if (live.current) {
        live.current.srcObject = s;
        await live.current.play().catch(() => {});
      }
      const chunks: Blob[] = [];
      const r = new MediaRecorder(s, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        const duration = Math.max(1, Math.min(MAX_SEC, (Date.now() - started.current) / 1000));
        const blob = new Blob(chunks, { type: mime.split(";")[0] });
        stopStream();
        setClip({ blob, url: URL.createObjectURL(blob), duration });
        setPhase("review");
      };
      rec.current = r;
      started.current = Date.now();
      setSecs(0);
      r.start(500);
      setPhase("recording");
    } catch {
      fileInput.current?.click();
    }
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (!/^video\//.test(f.type)) {
      setErr("Choose a video.");
      return;
    }
    const d = await videoDuration(f);
    if (d > MAX_SEC + 5) {
      setErr(`Keep it under ${MAX_SEC} seconds.`);
      return;
    }
    setClip({ blob: f, url: URL.createObjectURL(f), duration: Math.max(1, Math.min(MAX_SEC, d || MAX_SEC)) });
    setPhase("review");
  };

  const send = async () => {
    if (!clip) return;
    setErr("");
    setPhase("uploading");
    setProgress(0);
    try {
      const url = await getUploadUrl({ slug });
      const storageId = await uploadWithProgress(url, clip.blob, setProgress);
      await submit({ slug, storageId: storageId as Id<"_storage">, consent: true, durationSec: clip.duration, displayName: name.trim() || undefined });
      setPhase("done");
    } catch (x) {
      setErr(x instanceof Error && x.message === "Upload failed" ? "The upload didn't finish. Check your connection and try again." : errorMessage(x));
      setPhase("review");
    }
  };

  if (session === undefined) return <div className="aud"><p style={{ color: "var(--muted)" }}>Loading…</p></div>;
  if (session === null)
    return (
      <div className="aud">
        <h1>This link isn&apos;t active</h1>
        <p className="q">Ask the filmmakers for their QR code again.</p>
      </div>
    );

  return (
    <div className="aud">
      <div className="kick">You just watched</div>
      <h1>{session.filmName}</h1>
      <p className="q">{session.prompt}</p>

      {phase === "done" ? (
        <>
          <div className="cam" style={{ color: "var(--text)" }}>
            <div>
              <p style={{ fontFamily: "var(--serif)", fontSize: 26 }}>Thank you.</p>
              <p style={{ color: "var(--muted)", marginTop: 6 }}>The filmmakers behind {session.filmName} just got your reaction.</p>
            </div>
          </div>
          <Link className="btn btn-ghost" href="/tools/capture">Made a film? Capture reactions free</Link>
        </>
      ) : session.isFull && phase === "ready" ? (
        <div className="cam">This screening has collected all its reactions. Thanks for watching.</div>
      ) : (
        <>
          <div className="cam">
            {phase === "review" && clip ? (
              <video src={clip.url} controls playsInline />
            ) : (
              <>
                <video ref={live} muted playsInline autoPlay className="mirror" style={{ display: phase === "recording" ? "block" : "none" }} />
                {phase === "ready" ? <span>Tap record. You have {MAX_SEC} seconds.</span> : null}
                {phase === "uploading" ? (
                  <div style={{ width: "80%" }}>
                    <p>Sending your reaction…</p>
                    <div className="progress"><b style={{ width: `${Math.round(progress * 100)}%` }} /></div>
                  </div>
                ) : null}
              </>
            )}
            {phase === "recording" ? <div className="rec"><i />0:{String(secs).padStart(2, "0")} / 0:{MAX_SEC}</div> : null}
          </div>

          {phase === "ready" ? (
            <>
              <label className="consent">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>I agree that the filmmakers of {session.filmName} can share my reaction video to promote the film.</span>
              </label>
              <label className="sr" htmlFor="aud_name">Your first name (optional)</label>
              <input id="aud_name" type="text" maxLength={40} placeholder="Your first name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
              <button className="btn btn-red" type="button" onClick={start}>Record my reaction</button>
            </>
          ) : null}
          {phase === "recording" ? <button className="btn btn-red" type="button" onClick={() => rec.current?.stop()}>Stop</button> : null}
          {phase === "review" ? (
            <div style={{ display: "grid", gap: 10 }}>
              <button className="btn btn-red" type="button" onClick={send}>Send my reaction</button>
              <button className="btn btn-ghost" type="button" onClick={() => { if (clip) URL.revokeObjectURL(clip.url); setClip(null); setPhase("ready"); }}>Record again</button>
            </div>
          ) : null}
          {err ? <p className="err" role="alert">{err}</p> : null}
          <input ref={fileInput} type="file" accept="video/*" capture="user" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </>
      )}
      <p className="brandline">Captured with <Link href="/">FLMLNK</Link></p>
    </div>
  );
}
