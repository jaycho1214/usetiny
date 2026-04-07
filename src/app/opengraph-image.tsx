import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "UseTiny - Free Online Tools";
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
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0b",
        color: "#fafafa",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 80,
          fontWeight: 700,
          letterSpacing: "-0.04em",
        }}
      >
        UseTiny
      </div>
      <div
        style={{
          fontSize: 24,
          color: "#71717a",
          marginTop: 16,
        }}
      >
        Small tools that do one thing well.
      </div>
    </div>,
    { ...size },
  );
}
