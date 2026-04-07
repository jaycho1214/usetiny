import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "QR Generator | UseTiny";
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
        justifyContent: "center",
        padding: "72px 80px",
        backgroundColor: "#0a0a0b",
        color: "#fafafa",
        fontFamily: "system-ui, sans-serif",
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
        QR Generator
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginTop: 28,
        }}
      >
        <div style={{ fontSize: 22, color: "#71717a" }}>
          Instant QR codes. No watermarks.
        </div>
        <div style={{ fontSize: 18, color: "#3f3f46" }}>usetiny.app</div>
      </div>
    </div>,
    { ...size },
  );
}
