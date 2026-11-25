"use client";
import Link from "next/link";

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="logo" style={{ width: size, height: size, borderRadius: size * 0.26 }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" style={{ width: size * 0.58, height: size * 0.58 }}>
        <path d="M7 19V5h10M7 12h7" />
        <circle cx="18" cy="17" r="2.2" fill="#fff" stroke="none" />
      </svg>
    </span>
  );
}

export function Nav({ film, active }: { film?: string; active?: string }) {
  const links: [string, string][] = [
    ["Home", "/"],
    ["Reaction capture", "/tools/capture"],
    ["Tubi calculator", "/tools/tubi"],
    ["All tools", "/#explore"],
    ["Campaigns", "/#exclusive"],
  ];
  return (
    <nav className="top">
      <div className="wrap">
        <Link href="/" aria-label="FLMLNK Studio home">
          <Logo />
        </Link>
        <Link href="/#top" className="drops">
          New tools <b>2</b>
        </Link>
        <div className="navlinks">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className={active === label ? "on" : undefined}>
              {label}
            </Link>
          ))}
        </div>
        <div className="spacer" />
        {film ? (
          <div className="film-chip on" title="Your film">
            <i />
            <span>{film}</span>
          </div>
        ) : null}
        <Link className="btn btn-ghost btn-sm plans-pill" href="/#pricing">
          Plans<span className="badge free">FREE</span>
        </Link>
        <Link className="btn btn-red btn-sm" href="/#marqueeBox">
          Get started
        </Link>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="fcols">
          <div className="fbrand">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Logo size={28} />
              <b style={{ color: "var(--text)", fontSize: 15 }}>FLMLNK Studio</b>
            </div>
            <p>Free marketing tools for independent film, from the demand intelligence platform for indie distribution.</p>
          </div>
          <div>
            <h4>Tools</h4>
            <ul>
              <li><Link href="/tools/capture">Festival reaction capture</Link></li>
              <li><Link href="/tools/tubi">Tubi revenue calculator</Link></li>
              <li><a href="https://showlnk.com" target="_blank" rel="noopener noreferrer">Event reels</a></li>
              <li><a href="https://www.flmlnk.com" target="_blank" rel="noopener noreferrer">Film page</a></li>
            </ul>
          </div>
          <div>
            <h4>Campaigns</h4>
            <ul>
              <li><Link href="/#exclusive">How campaigns work</Link></li>
              <li><Link href="/#pricing">Plans</Link></li>
              <li><a href="https://www.flmlnk.com" target="_blank" rel="noopener noreferrer">For distributors</a></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="https://www.flmlnk.com" target="_blank" rel="noopener noreferrer">FLMLNK</a></li>
              <li><Link href="/admin">Team dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="legal">
          <span>© 2026 FLMLNK, an ALNKRA Holdings company.</span>
          <span>Metro Detroit</span>
        </div>
      </div>
    </footer>
  );
}

export const LockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="7" width="10" height="7" rx="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
  </svg>
);
