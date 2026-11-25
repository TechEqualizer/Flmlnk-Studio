"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useMemo } from "react";

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const client = useMemo(() => (url ? new ConvexReactClient(url) : null), [url]);
  if (!client) {
    return (
      <div className="center-card">
        <h1>Studio isn&apos;t connected yet</h1>
        <p>Set NEXT_PUBLIC_CONVEX_URL by running npx convex dev, then restart the app.</p>
      </div>
    );
  }
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
