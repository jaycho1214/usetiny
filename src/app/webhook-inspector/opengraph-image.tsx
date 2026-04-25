import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Webhook Inspector | UseTiny";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#0a0a0b",
        color: "#fafafa",
        fontFamily: "system-ui, sans-serif",
        padding: "80px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ fontSize: 18, color: "#3f3f46" }}>usetiny.app</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 28,
          }}
        >
          <div
            style={{
              fontSize: 110,
              fontWeight: 800,
              letterSpacing: "-0.05em",
              lineHeight: 1,
            }}
          >
            Webhook Inspector
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#71717a",
              maxWidth: 760,
              textAlign: "right",
              lineHeight: 1.3,
            }}
          >
            Capture any HTTP request at a unique URL. Inspect headers, query,
            and body live.
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
