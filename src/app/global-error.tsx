"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      posthog.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          backgroundColor: "#0a0a0b",
          color: "#fafafa",
        }}
      >
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            ⚠
          </div>
          <div style={{ maxWidth: 320 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 500,
                margin: "0 0 0.5rem",
                letterSpacing: "-0.01em",
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "#71717a",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              An unexpected error occurred. You can try again or head back to
              the homepage.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={reset}
              style={{
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 6,
                border: "none",
                backgroundColor: "#fafafa",
                color: "#0a0a0b",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error replaces entire HTML, no Next.js providers available */}
            <a
              href="/"
              style={{
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "transparent",
                color: "#fafafa",
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
