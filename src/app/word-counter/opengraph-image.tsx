import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Word Counter | UseTiny";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "72px 80px",
        backgroundColor: "#0a0a0b",
        color: "#fafafa",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: "-0.05em",
          lineHeight: 1,
        }}
      >
        Word
      </div>
      <div
        style={{
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: "-0.05em",
          lineHeight: 1,
          color: "#71717a",
        }}
      >
        Counter
      </div>
      <div style={{ display: "flex", flex: 1 }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div style={{ fontSize: 20, color: "#71717a" }}>
          Count every word. Runs in your browser.
        </div>
        <div style={{ fontSize: 18, color: "#3f3f46" }}>usetiny.app</div>
      </div>
    </div>,
    { ...size },
  );
}
