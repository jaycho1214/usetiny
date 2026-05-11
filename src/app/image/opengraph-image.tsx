import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../_og/frame";

export const alt = "Image Compressor | UseTiny";
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
    tagline: "Smaller files. Same sharp image.",
    taglineMarginTop: 36,
    children: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              fontFamily: "Geist Mono",
              fontSize: 38,
              fontWeight: 500,
              color: "#71717a",
              textDecoration: "line-through",
            }}
          >
            2.4 MB
          </div>
          <div
            style={{
              fontSize: 38,
              fontWeight: 500,
              color: "#52525b",
              margin: "0 14px",
            }}
          >
            →
          </div>
          <div
            style={{
              fontFamily: "Geist Mono",
              fontSize: 38,
              fontWeight: 500,
              color: "#f97316",
            }}
          >
            184 KB
          </div>
        </div>
        <div style={{ ...WORDMARK_STYLE, color: "#fafafa", marginTop: 28 }}>
          Image
        </div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 40 }}>
          <div style={{ ...WORDMARK_STYLE, color: "#71717a" }}>Compressor</div>
          <div style={{ ...WORDMARK_STYLE, color: "#f97316" }}>.</div>
        </div>
      </div>
    ),
  });
}
