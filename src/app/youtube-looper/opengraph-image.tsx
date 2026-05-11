import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../_og/frame";

export const alt = "YouTube Looper | UseTiny";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const WORDMARK_STYLE = {
  fontSize: 168,
  fontWeight: 900,
  letterSpacing: "-0.06em",
  lineHeight: 1,
} as const;

export default function Image() {
  return renderOgImage({
    tagline: "Loop A to B. Until you nail it.",
    taglineMarginTop: 40,
    children: (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: 720,
            height: 14,
            borderRadius: 7,
            backgroundColor: "#1f1f23",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "22%",
              top: -8,
              bottom: -8,
              width: "44%",
              borderRadius: 7,
              backgroundColor: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingLeft: 14,
              paddingRight: 14,
            }}
          >
            <div
              style={{
                fontFamily: "Geist Mono",
                fontSize: 18,
                fontWeight: 500,
                color: "#fafafa",
                display: "flex",
              }}
            >
              A
            </div>
            <div
              style={{
                fontFamily: "Geist Mono",
                fontSize: 18,
                fontWeight: 500,
                color: "#fafafa",
                display: "flex",
              }}
            >
              B
            </div>
          </div>
        </div>
        <div style={{ ...WORDMARK_STYLE, color: "#fafafa", marginTop: 36 }}>
          YouTube
        </div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 40 }}>
          <div style={{ ...WORDMARK_STYLE, color: "#71717a" }}>Looper</div>
          <div style={{ ...WORDMARK_STYLE, color: "#ef4444" }}>.</div>
        </div>
      </>
    ),
  });
}
