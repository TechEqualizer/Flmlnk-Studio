function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

function layout(title: string, body: string, cta?: { label: string; url: string }): string {
  const button = cta
    ? `<p style="margin:28px 0"><a href="${esc(cta.url)}" style="background:#d5111c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;display:inline-block">${esc(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#0b0d10;font-family:Inter,Arial,sans-serif;color:#f4f4f2">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="font-weight:700;letter-spacing:.02em;margin:0 0 24px">FLM<span style="color:#d5111c">LNK</span> Studio</p>
<h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.2;margin:0 0 16px">${esc(title)}</h1>
${body}${button}
<p style="color:#6b7180;font-size:12px;margin-top:40px">You're getting this because you used a free FLMLNK Studio tool. Reply to this email to reach a person.</p>
</div></body></html>`;
}

const p = (t: string) => `<p style="color:#c9ccd3;font-size:15px;line-height:1.6;margin:0 0 12px">${t}</p>`;

export function fmtMoney(n: number): string {
  const a = Math.abs(n);
  const s = a >= 1e6 ? (a / 1e6).toFixed(1) + "M" : a >= 1e4 ? Math.round(a / 1e3) + "K" : Math.round(a).toLocaleString("en-US");
  return (n < 0 ? "-$" : "$") + s;
}

export function forecastEmail(a: {
  filmName: string;
  net: number;
  gap: number;
  budget: number;
  breakEvenViews: number;
  monthlyToBreakEven: number;
  appUrl: string;
}) {
  const film = esc(a.filmName);
  const gapLine =
    a.gap > 0
      ? p(`On the plan you entered, ${film} earns <b>${fmtMoney(a.net)}</b> in its first year on Tubi after ad spend, against a ${fmtMoney(a.budget)} budget. That leaves a gap of <b>${fmtMoney(a.gap)}</b>.`) +
        (a.monthlyToBreakEven > 0 ? p(`Closing it takes about <b>${fmtMoney(a.monthlyToBreakEven)}/month</b> in ads at your current return. Most films get there in steps: warm the audience first, then scale what works.`) : "")
      : p(`On the plan you entered, ${film} earns back its ${fmtMoney(a.budget)} budget in year one with ${fmtMoney(-a.gap)} to spare.`);
  return {
    subject: `${a.filmName}: your first-year Tubi forecast`,
    html: layout(
      `${a.filmName}'s first-year Tubi forecast`,
      gapLine + p(`Break-even takes about <b>${Math.round(a.breakEvenViews).toLocaleString("en-US")} views</b> with no other revenue.`) +
        p("Forecasts are estimates from your inputs and FLMLNK campaign data. Actual Tubi earnings depend on the platform, the season and your film."),
      { label: "Talk to a campaign strategist", url: `${a.appUrl}/tools/tubi` },
    ),
  };
}

export function captureCreatedEmail(a: { filmName: string; eventName: string; manageUrl: string; captureUrl: string }) {
  return {
    subject: `Your reaction capture page for ${a.filmName} is ready`,
    html: layout(
      "Your capture page is ready",
      p(`Show the QR code on screen after <b>${esc(a.eventName)}</b>. Audiences scan it, record a reaction on their phone and agree to let you share it.`) +
        p(`Audience link: <a style="color:#ff8f97" href="${esc(a.captureUrl)}">${esc(a.captureUrl)}</a>`) +
        p("Keep this email. The button below opens your private page, where you'll see every reaction as it comes in."),
      { label: "Open my capture page", url: a.manageUrl },
    ),
  };
}

export function reactionReceivedEmail(a: { filmName: string; count: number; limit: number; manageUrl: string }) {
  const left = Math.max(0, a.limit - a.count);
  return {
    subject: `${a.count} reaction${a.count === 1 ? "" : "s"} in for ${a.filmName}`,
    html: layout(
      `${a.count} reaction${a.count === 1 ? "" : "s"} in for ${a.filmName}`,
      p(left > 0 ? `You have ${left} free reactions left for this screening.` : "This screening reached the free limit of 25 reactions. Starter removes the limit.") +
        p("Starter cuts your best reactions into a captioned highlight reel and runs it as an ad to people who like films like yours."),
      { label: "Watch your reactions", url: a.manageUrl },
    ),
  };
}

export function waitlistEmail(a: { toolName: string }) {
  return {
    subject: `You're on the list for ${a.toolName}`,
    html: layout(`You're on the list for ${a.toolName}`, p("We'll email you the day it opens. Waitlist demand decides what we build next, so thanks for voting.")),
  };
}

export function planFollowupEmail(a: { tierName: string; filmName?: string }) {
  const film = a.filmName ? esc(a.filmName) : "your film";
  return {
    subject: `Next steps for ${a.filmName ?? "your film"} on ${a.tierName}`,
    html: layout(
      `Let's set up ${a.filmName ?? "your film"}'s campaign`,
      p(`Thanks for choosing ${esc(a.tierName)}. A campaign strategist will reach out within one business day to plan ${film}'s first campaign.`) +
        p("To move faster, reply with your trailer link, release date and where the film is streaming."),
    ),
  };
}

export function teamAlertEmail(a: { email: string; filmName?: string; score: number; reason: string; meta: Record<string, number | string | undefined>; sources: string[] }) {
  const rows = Object.entries(a.meta)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `<tr><td style="color:#9aa0ac;padding:4px 12px 4px 0">${esc(k)}</td><td>${esc(String(v))}</td></tr>`)
    .join("");
  return {
    subject: `Hot lead (${a.score}): ${a.filmName ?? a.email} — ${a.reason}`,
    html: layout(
      `Hot lead: ${a.filmName ?? a.email}`,
      p(`<b>${esc(a.email)}</b> scored <b>${a.score}</b>. ${esc(a.reason)}.`) +
        p(`Came from: ${esc(a.sources.join(", "))}`) +
        `<table style="font-size:14px;color:#f4f4f2">${rows}</table>`,
    ),
  };
}
