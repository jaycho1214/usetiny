import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../_og/frame";

export const alt = "Rich Text | UseTiny";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    tagline: "All the formatting. None of the sign-up.",
    taglineMarginTop: 48,
    children: (
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <div
          style={{
            fontSize: 208,
            fontWeight: 900,
            letterSpacing: "-0.06em",
            lineHeight: 1,
            color: "#fafafa",
          }}
        >
          Rich
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 14px",
            backgroundColor: "rgba(139,92,246,0.32)",
            borderRadius: 4,
          }}
        >
          <div
            style={{
              fontSize: 208,
              fontWeight: 900,
              letterSpacing: "-0.06em",
              lineHeight: 1,
              color: "#fafafa",
            }}
          >
            Text
          </div>
        </div>
        <div
          style={{
            width: 6,
            height: 192,
            backgroundColor: "#a78bfa",
            display: "flex",
          }}
        />
      </div>
    ),
  });
}
