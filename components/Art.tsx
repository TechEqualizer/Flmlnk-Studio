import type { ReactNode } from "react";

const S = { fill: "none", strokeWidth: 2 } as const;

export const TOOL_ART: Record<string, ReactNode> = {
  tubi: (
    <svg viewBox="0 0 120 80" {...S}>
      <path d="M6 70 L30 58 L50 62 L72 40 L94 30 L114 10" stroke="#d5111c" strokeWidth={2.5} />
      <path d="M6 46 H114" stroke="#D4AF37" strokeDasharray="4 4" strokeWidth={1.5} />
      <circle cx="114" cy="10" r="4" fill="#d5111c" stroke="none" />
    </svg>
  ),
  capture: (
    <svg viewBox="0 0 120 80" {...S}>
      <rect x="44" y="6" width="32" height="64" rx="6" stroke="#9aa0ac" />
      <circle cx="60" cy="32" r="9" stroke="#f4f4f2" />
      <path d="M48 54c3-7 21-7 24 0" stroke="#f4f4f2" />
      <circle cx="50" cy="13" r="2.5" fill="#d5111c" stroke="none" />
      <rect x="8" y="18" width="24" height="24" stroke="#D4AF37" />
      <rect x="14" y="24" width="5" height="5" fill="#D4AF37" stroke="none" />
      <path d="M34 30h8" stroke="#D4AF37" />
    </svg>
  ),
  page: (
    <svg viewBox="0 0 120 80" {...S}>
      <rect x="36" y="8" width="48" height="64" rx="6" stroke="#9aa0ac" />
      <rect x="42" y="16" width="36" height="20" rx="2" fill="#2a0a0e" stroke="none" />
      <path d="M42 44h36M42 52h28M42 60h20" stroke="#6b7180" />
    </svg>
  ),
  comps: (
    <svg viewBox="0 0 120 80" {...S}>
      <rect x="10" y="20" width="26" height="40" rx="3" stroke="#6b7180" />
      <rect x="47" y="14" width="26" height="52" rx="3" stroke="#d5111c" />
      <rect x="84" y="20" width="26" height="40" rx="3" stroke="#6b7180" />
    </svg>
  ),
  keyart: (
    <svg viewBox="0 0 120 80" {...S}>
      <rect x="12" y="14" width="34" height="50" stroke="#9aa0ac" />
      <rect x="54" y="26" width="54" height="30" stroke="#9aa0ac" />
      <rect x="62" y="34" width="20" height="14" fill="#2a0a0e" stroke="none" />
    </svg>
  ),
  reels: (
    <svg viewBox="0 0 120 80" {...S}>
      <rect x="22" y="10" width="34" height="60" rx="5" stroke="#D4AF37" />
      <rect x="64" y="10" width="34" height="60" rx="5" stroke="#9aa0ac" />
      <path d="M34 34l10 6-10 6z" fill="#D4AF37" stroke="none" />
    </svg>
  ),
  cutdown: (
    <svg viewBox="0 0 120 80" {...S}>
      <rect x="8" y="30" width="104" height="20" rx="3" stroke="#6b7180" />
      <rect x="30" y="30" width="22" height="20" fill="rgba(213,17,28,.35)" stroke="#d5111c" />
      <rect x="70" y="30" width="14" height="20" fill="rgba(213,17,28,.35)" stroke="#d5111c" />
    </svg>
  ),
  sentiment: (
    <svg viewBox="0 0 120 80" {...S}>
      <rect x="14" y="16" width="50" height="22" rx="8" stroke="#9aa0ac" />
      <rect x="56" y="44" width="50" height="22" rx="8" stroke="#d5111c" />
    </svg>
  ),
  fanmail: (
    <svg viewBox="0 0 120 80" {...S}>
      <rect x="20" y="16" width="80" height="48" rx="4" stroke="#9aa0ac" />
      <path d="M20 20l40 26 40-26" stroke="#d5111c" />
    </svg>
  ),
  adpack: (
    <svg viewBox="0 0 120 80" {...S}>
      <rect x="10" y="14" width="30" height="52" rx="4" stroke="#9aa0ac" />
      <rect x="46" y="22" width="30" height="30" rx="4" stroke="#9aa0ac" />
      <rect x="82" y="28" width="30" height="18" rx="3" stroke="#d5111c" />
    </svg>
  ),
};

const I = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;
export const TOOL_ICON: Record<string, ReactNode> = {
  capture: (<svg {...I}><rect x="7" y="2" width="10" height="20" rx="2" /><circle cx="12" cy="10" r="2.5" /><path d="M9 16c1-2 5-2 6 0" /></svg>),
  tubi: (<svg {...I}><path d="M3 20l6-7 4 3 8-10" /><path d="M3 9h18" strokeDasharray="2 2" /></svg>),
  page: (<svg {...I}><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M8 7h8M8 11h8M8 15h5" /></svg>),
  reels: (<svg {...I}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M10 9l5 3-5 3z" /></svg>),
  comps: (<svg {...I}><rect x="2" y="6" width="6" height="12" rx="1" /><rect x="9" y="3" width="6" height="18" rx="1" /><rect x="16" y="6" width="6" height="12" rx="1" /></svg>),
  adpack: (<svg {...I}><rect x="2" y="4" width="8" height="16" rx="1.5" /><rect x="12" y="4" width="10" height="9" rx="1.5" /><path d="M12 17h10" /></svg>),
};

function Defs({ k }: { k: string }) {
  return (
    <defs>
      <radialGradient id={`g_${k}`} cx="50%" cy="20%" r="80%">
        <stop offset="0" stopColor="#3a0a10" />
        <stop offset="1" stopColor="#07080a" />
      </radialGradient>
      <linearGradient id={`s_${k}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".95" />
        <stop offset="1" stopColor="#ffd9a0" stopOpacity=".75" />
      </linearGradient>
    </defs>
  );
}

const QR_PAT = [1,1,1,0,1,0,1,1,1,1,0,1,1,0,0,1,0,1,1,1,1,0,1,1,1,1,1,0,1,0,1,1,0,0,1,0,1,0,1,1,0,1,1,0,1,0,1,1,0,1,0,0,1,1,1,1,1,0,0,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1];

export function FeatureArt({ kind, bigNumber, caption }: { kind: "capture" | "tubi" | "reels" | "comps"; bigNumber?: string; caption?: string }) {
  const bg = <rect width="320" height="180" fill={`url(#g_${kind})`} />;
  if (kind === "capture") {
    const seats = [];
    for (let r = 0; r < 3; r++)
      for (let i = 0; i < 12; i++) {
        const x = 8 + i * 27 + (r % 2 ? 13 : 0);
        const y = 132 + r * 16;
        seats.push(
          <g key={`${r}-${i}`} fill="#050506">
            <path d={`M${x} ${y + 16}v-9a10 10 0 0120 0v9z`} />
            <circle cx={x + 10} cy={y - 4} r={6.5} />
          </g>,
        );
      }
    return (
      <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <Defs k={kind} />
        {bg}
        <path d="M40 22h240l-14 82H54z" fill={`url(#s_${kind})`} opacity={0.92} />
        <rect x="136" y="34" width="48" height="48" rx="3" fill="#fff" />
        {QR_PAT.map((v, i) => (v ? <rect key={i} x={142 + (i % 9) * 4} y={40 + Math.floor(i / 9) * 4} width="4" height="4" fill="#0a0a0a" /> : null))}
        <text x="160" y="96" textAnchor="middle" fontFamily="Space Grotesk,Inter" fontWeight={700} fontSize={8} fill="#3a0a10">SCAN TO REACT</text>
        {seats}
        <g transform="translate(236 88) rotate(-8)">
          <rect width="46" height="86" rx="8" fill="#111" stroke="#2a2d35" strokeWidth={2} />
          <rect x="5" y="10" width="36" height="52" rx="4" fill="#2b1a1d" />
          <circle cx="23" cy="30" r="8" fill="#d9b8a0" />
          <path d="M11 58c2-10 22-10 24 0z" fill="#d9b8a0" />
          <circle cx="23" cy="72" r="6" fill="#d5111c" />
        </g>
      </svg>
    );
  }
  if (kind === "tubi") {
    const pts: [number, number][] = [[20,150],[60,146],[100,138],[140,120],[180,108],[220,84],[260,62],[300,34]];
    const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");
    return (
      <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <Defs k={kind} />
        {bg}
        {[0, 1, 2, 3, 4, 5].map((g) => <line key={g} x1="20" x2="300" y1={30 + g * 24} y2={30 + g * 24} stroke="#fff" strokeOpacity={0.05} />)}
        <path d={`${d} L300 160 L20 160z`} fill="#d5111c" opacity={0.14} />
        <path d={d} fill="none" stroke="#ff2a37" strokeWidth={3} strokeLinejoin="round" />
        <line x1="20" x2="300" y1="70" y2="70" stroke="#D4AF37" strokeDasharray="6 5" strokeWidth={1.6} />
        <text x="24" y="64" fontFamily="Inter" fontSize={9} fill="#D4AF37">Break-even</text>
        <circle cx="300" cy="34" r="5" fill="#ff2a37" />
        <circle cx="300" cy="34" r="11" fill="#ff2a37" opacity={0.25} />
        <text x="24" y="36" fontFamily="DM Serif Display,Georgia" fontSize={30} fill="#fff">{bigNumber ?? "$46K"}</text>
        <text x="24" y="50" fontFamily="Inter" fontSize={9} fill="#9a9ea8">{caption ?? "Gap to break even, sample film"}</text>
      </svg>
    );
  }
  if (kind === "reels") {
    const cols = [["#5b0f1a", "#d5111c"], ["#2b2310", "#D4AF37"], ["#1a1d24", "#9a9ea8"]];
    return (
      <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <Defs k={kind} />
        {bg}
        {cols.map((c, i) => {
          const tall = i === 1;
          return (
            <g key={i} transform={`translate(${58 + i * 72} ${tall ? 14 : 26})`}>
              <rect width="60" height={tall ? 152 : 136} rx="9" fill="#0c0d10" stroke="#2a2d35" strokeWidth={2} />
              <rect x="5" y="6" width="50" height={tall ? 112 : 98} rx="5" fill={c[0]} />
              <circle cx="30" cy={tall ? 50 : 44} r="12" fill={c[1]} opacity={0.8} />
              <path d={`M26 ${tall ? 44 : 38}l11 6-11 6z`} fill="#fff" />
              <rect x="10" y={tall ? 126 : 112} width="40" height="12" rx="6" fill="#fff" />
              <text x="30" y={tall ? 135 : 121} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={6.5} fill="#111">TICKETS</text>
            </g>
          );
        })}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Defs k={kind} />
      {bg}
      {[0, 1, 2].map((i) => {
        const mid = i === 1;
        return (
          <g key={i} transform={`translate(${46 + i * 82} ${mid ? 22 : 36})`}>
            <rect width="64" height={mid ? 136 : 112} rx="5" fill={mid ? "#3a0a10" : "#1a1d24"} stroke={mid ? "#d5111c" : "#33363f"} strokeWidth={2} />
            <rect x="8" y={mid ? 96 : 76} width="48" height="5" rx="2" fill="#fff" opacity={0.7} />
            <rect x="8" y={mid ? 106 : 86} width="30" height="4" rx="2" fill="#fff" opacity={0.35} />
          </g>
        );
      })}
    </svg>
  );
}

export function Stars() {
  const out = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 140; i++)
    out.push(<circle key={i} cx={`${(rnd() * 100).toFixed(2)}%`} cy={`${(rnd() * 100).toFixed(2)}%`} r={(rnd() * 1.2 + 0.3).toFixed(2)} fill="#fff" opacity={(rnd() * 0.7 + 0.15).toFixed(2)} />);
  return <svg className="stars" aria-hidden="true" width="100%" height="100%">{out}</svg>;
}
