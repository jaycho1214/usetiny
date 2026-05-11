import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../_og/frame";

export const alt = "Webhook Inspector | UseTiny";
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
    tagline: "Test webhooks. Without the curl.",
    taglineMarginTop: 36,
    children: (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 16px",
              borderRadius: 8,
              backgroundColor: "#06b6d4",
              fontFamily: "Geist Mono",
              fontSize: 22,
              fontWeight: 500,
              color: "#0a0a0b",
            }}
          >
            POST
          </div>
          <div
            style={{
              fontFamily: "Geist Mono",
              fontSize: 24,
              fontWeight: 500,
              color: "#a1a1aa",
            }}
          >
            /hook/a8f3c2…
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginLeft: 8,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#22c55e",
                display: "flex",
              }}
            />
            <div
              style={{
                fontFamily: "Geist Mono",
                fontSize: 22,
                fontWeight: 500,
                color: "#22c55e",
              }}
            >
              200
            </div>
          </div>
        </div>
        <div style={{ ...WORDMARK_STYLE, color: "#fafafa", marginTop: 28 }}>
          Webhook
        </div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 40 }}>
          <div style={{ ...WORDMARK_STYLE, color: "#71717a" }}>Inspector</div>
          <div style={{ ...WORDMARK_STYLE, color: "#06b6d4" }}>.</div>
        </div>
      </>
    ),
  });
}
