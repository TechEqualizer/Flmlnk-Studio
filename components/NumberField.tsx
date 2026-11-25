"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type NumberKind = "money" | "rate" | "int" | "percent" | "multiplier";

const SPEC: Record<NumberKind, { decimals: number; prefix?: string; suffix?: string; step: number }> = {
  money: { decimals: 2, prefix: "$", step: 100 },
  rate: { decimals: 2, prefix: "$", step: 0.01 },
  int: { decimals: 0, step: 1 },
  percent: { decimals: 1, suffix: "%", step: 1 },
  multiplier: { decimals: 2, suffix: "x", step: 0.1 },
};

export function formatNumber(n: number, kind: NumberKind): string {
  const { decimals } = SPEC[kind];
  const hasFraction = Math.round(n * 10 ** decimals) % 10 ** decimals !== 0;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: kind === "rate" || (kind === "money" && hasFraction) ? 2 : 0,
    maximumFractionDigits: decimals,
  });
}

export function cleanInput(raw: string, decimals: number): string {
  let s = raw.replace(/[^\d.,]/g, "").replace(/,/g, "");
  if (decimals === 0) return s.split(".")[0];
  const dot = s.indexOf(".");
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "").slice(0, decimals);
  if (s.startsWith(".")) s = "0" + s;
  return s;
}

export function groupDigits(clean: string): string {
  const [int, frac] = clean.split(".");
  const grouped = int.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac === undefined ? grouped : `${grouped || "0"}.${frac}`;
}

function caretAfterChars(text: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < text.length; i++) {
    if (/[\d.]/.test(text[i])) seen++;
    if (seen === count) return i + 1;
  }
  return text.length;
}

export function NumberField({
  id,
  label,
  hint,
  value,
  onChange,
  kind,
  min = 0,
  max,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  kind: NumberKind;
  min?: number;
  max?: number;
}) {
  const spec = SPEC[kind];
  const typingDecimals = Math.max(1, spec.decimals);
  const toValue = (n: number) => (spec.decimals === 0 ? Math.trunc(n) : Number(n.toFixed(spec.decimals)));
  const [text, setText] = useState(() => formatNumber(value, kind));
  const focused = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (pendingCaret.current === null || !input.current) return;
    const pos = caretAfterChars(text, pendingCaret.current);
    input.current.setSelectionRange(pos, pos);
    pendingCaret.current = null;
  }, [text]);

  useEffect(() => {
    if (!focused.current) setText(formatNumber(value, kind));
  }, [value, kind]);

  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min, n));
  const commit = (n: number) => onChange(toValue(clamp(n)));

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="num">
        {spec.prefix ? <span className="adorn pre" aria-hidden="true">{spec.prefix}</span> : null}
        <input
          ref={input}
          id={id}
          type="text"
          inputMode={spec.decimals ? "decimal" : "numeric"}
          autoComplete="off"
          spellCheck={false}
          value={text}
          className={`${spec.prefix ? "has-pre" : ""} ${spec.suffix ? "has-suf" : ""}`}
          onFocus={(e) => {
            focused.current = true;
            setText(groupDigits(cleanInput(e.target.value, typingDecimals)));
          }}
          onChange={(e) => {
            const raw = e.target.value;
            const caret = e.target.selectionStart ?? raw.length;
            const t = cleanInput(raw, typingDecimals);
            const before = cleanInput(raw.slice(0, caret), typingDecimals).length;
            pendingCaret.current = Math.min(before, t.length);
            setText(groupDigits(t));
            const n = parseFloat(t);
            if (Number.isFinite(n)) onChange(toValue(Math.min(max ?? Infinity, n)));
            else if (t === "") onChange(min);
          }}
          onBlur={() => {
            focused.current = false;
            const n = parseFloat(cleanInput(text, typingDecimals));
            const v = clamp(Number.isFinite(n) ? n : min);
            commit(v);
            setText(formatNumber(toValue(v), kind));
          }}
          onKeyDown={(e) => {
            const el = e.currentTarget;
            const at = el.selectionStart ?? 0;
            if (at === el.selectionEnd) {
              if (e.key === "Backspace" && el.value[at - 1] === ",") el.setSelectionRange(at - 1, at - 1);
              if (e.key === "Delete" && el.value[at] === ",") el.setSelectionRange(at + 1, at + 1);
            }
            if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
            e.preventDefault();
            const cur = parseFloat(cleanInput(text, typingDecimals)) || 0;
            const big = e.shiftKey ? 10 : 1;
            const next = clamp(cur + (e.key === "ArrowUp" ? 1 : -1) * spec.step * big);
            const fixed = toValue(next);
            setText(groupDigits(String(fixed)));
            commit(fixed);
          }}
        />
        {spec.suffix ? <span className="adorn suf" aria-hidden="true">{spec.suffix}</span> : null}
      </div>
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}
