import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "./_og/frame";

export const alt = "UseTiny - Free Online Tools";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const TOOL_DOTS = [
  "#f59e0b",
  "#a78bfa",
  "#a855f7",
  "#10b981",
  "#ec4899",
  "#f97316",
  "#3b82f6",
  "#ef4444",
  "#06b6d4",
  "#f43f5e",
];

export default function Image() {
  return renderOgImage({
    tagline: "Tiny tools. No sign-up. No tracking.",
    taglineMarginTop: 40,
    children: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <div
            style={{
              fontSize: 224,
              fontWeight: 900,
              letterSpacing: "-0.06em",
              lineHeight: 1,
              color: "#fafafa",
            }}
          >
            UseTiny
          </div>
          <div
            style={{
              fontSize: 224,
              fontWeight: 900,
              letterSpacing: "-0.06em",
              lineHeight: 1,
              color: "#a78bfa",
            }}
          >
            .
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 36 }}>
          {TOOL_DOTS.map((c) => (
            <div
              key={c}
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: c,
                display: "flex",
              }}
            />
          ))}
        </div>
      </div>
    ),
  });
}
