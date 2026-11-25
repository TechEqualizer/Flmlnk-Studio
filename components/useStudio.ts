"use client";
import { useCallback, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { readLocal, STORAGE_KEYS, writeLocal } from "@/lib/storage-keys";

export type DoneMap = Partial<Record<"forecast" | "reactions" | "comps" | "sentiment", boolean>>;
type TrackType = "visit" | "film_set" | "tool_open" | "qr_present" | "link_copied";

function newVisitorId() {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return "v_" + Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function useStudio() {
  const [film, setFilmState] = useState("");
  const [email, setEmailState] = useState("");
  const [done, setDone] = useState<DoneMap>({});
  const [waitlist, setWaitlist] = useState<string[]>([]);
  const [visitorId, setVisitorId] = useState("");
  const [ready, setReady] = useState(false);
  const trackM = useMutation(api.leads.track);

  useEffect(() => {
    setFilmState(readLocal(STORAGE_KEYS.film, ""));
    setEmailState(readLocal(STORAGE_KEYS.email, ""));
    setDone(readLocal(STORAGE_KEYS.done, {}));
    setWaitlist(readLocal(STORAGE_KEYS.waitlist, []));
    let vid = readLocal(STORAGE_KEYS.visitor, "");
    if (!vid) {
      vid = newVisitorId();
      writeLocal(STORAGE_KEYS.visitor, vid);
    }
    setVisitorId(vid);
    setReady(true);
  }, []);

  const setFilm = useCallback((v: string) => {
    const t = v.trim().slice(0, 60);
    setFilmState(t);
    writeLocal(STORAGE_KEYS.film, t);
  }, []);
  const setEmail = useCallback((v: string) => {
    const t = v.trim().toLowerCase();
    setEmailState(t);
    writeLocal(STORAGE_KEYS.email, t);
  }, []);
  const markDone = useCallback((k: keyof DoneMap) => {
    setDone((d) => {
      const n = { ...d, [k]: true };
      writeLocal(STORAGE_KEYS.done, n);
      return n;
    });
  }, []);
  const markWaitlist = useCallback((id: string) => {
    setWaitlist((w) => {
      const n = Array.from(new Set([...w, id]));
      writeLocal(STORAGE_KEYS.waitlist, n);
      return n;
    });
  }, []);
  const track = useCallback(
    (type: TrackType, toolId?: string) => {
      const vid = readLocal(STORAGE_KEYS.visitor, "");
      if (!vid) return;
      trackM({ type, visitorId: vid, toolId }).catch(() => {});
    },
    [trackM],
  );

  return { ready, film, setFilm, email, setEmail, done, markDone, waitlist, markWaitlist, visitorId, track };
}

export const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s.trim());

export function errorMessage(e: unknown): string {
  if (e && typeof e === "object" && "data" in e) {
    const d = (e as { data: unknown }).data;
    if (d && typeof d === "object" && "message" in d && typeof (d as { message: unknown }).message === "string") return (d as { message: string }).message;
  }
  return "Something went wrong. Please try again.";
}
