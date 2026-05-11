import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../_og/frame";

export const alt = "Word Counter | UseTiny";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const WORDMARK_STYLE = {
  fontSize: 144,
  fontWeight: 900,
  letterSpacing: "-0.06em",
  lineHeight: 1,
} as const;

export default function Image() {
  return renderOgImage({
    tagline: "Words, characters, time to read.",
    taglineMarginTop: 36,
    children: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 18px",
            borderRadius: 10,
            backgroundColor: "#0d1a2e",
            border: "1px solid #1e40af",
            alignSelf: "flex-start",
          }}
        >
          <div
            style={{
              fontFamily: "Geist Mono",
              fontSize: 24,
              fontWeight: 500,
              color: "#60a5fa",
            }}
          >
            1,247 words · 6 min read
          </div>
        </div>
        <div style={{ ...WORDMARK_STYLE, color: "#fafafa", marginTop: 28 }}>
          Word
        </div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 40 }}>
          <div style={{ ...WORDMARK_STYLE, color: "#71717a" }}>Counter</div>
          <div style={{ ...WORDMARK_STYLE, color: "#3b82f6" }}>.</div>
        </div>
      </div>
    ),
  });
}
