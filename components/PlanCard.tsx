"use client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Tier } from "@/lib/plans";
import type { AskEmail } from "./EmailDialog";
import { useToast } from "./Toast";

export function PlanCard({
  tier,
  bullets,
  cta,
  source,
  monthlySpend,
  email,
  filmName,
  onEmail,
  setAsk,
}: {
  tier: Tier;
  bullets: string[];
  cta: string;
  source: "tubi" | "capture";
  monthlySpend: number;
  email: string;
  filmName?: string;
  onEmail: (e: string) => void;
  setAsk: (a: AskEmail | null) => void;
}) {
  const choose = useMutation(api.leads.choosePlan);
  const toast = useToast();
  const submit = async (e: string) => {
    await choose({ email: e, tier: tier.id, source, monthlySpend, filmName: filmName || undefined });
    onEmail(e);
    toast(`Thanks. A campaign strategist will reach out to ${e} within one business day.`);
  };
  return (
    <div className="tier">
      <div className="name">
        <b>{tier.name}</b>
        <span>
          ${tier.price.toLocaleString("en-US")}
          <small style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>/mo</small>
        </span>
      </div>
      <ul>
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <button
        className="btn btn-red"
        type="button"
        onClick={() => {
          if (email) submit(email).catch(() => toast("That didn't go through. Please try again."));
          else setAsk({ title: `Start ${tier.name}`, body: `A campaign strategist will reach out within one business day to set up ${filmName || "your film"}.`, ok: `Start ${tier.name}`, onSubmit: submit });
        }}
      >
        {cta}
      </button>
    </div>
  );
}

export function Locked({ items }: { items: { title: string; body: string }[] }) {
  return (
    <div className="locked-list">
      {items.map((i) => (
        <div className="locked-item" key={i.title}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="7" width="10" height="7" rx="1.5" />
            <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
          </svg>
          <div>
            <b>{i.title}</b>
            {i.body}
          </div>
        </div>
      ))}
    </div>
  );
}
