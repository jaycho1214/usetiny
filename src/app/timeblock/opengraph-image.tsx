import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../_og/frame";

export const alt = "Timeblock | UseTiny";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const ACCENT = "#84cc16";

const WORDMARK_STYLE = {
  fontSize: 176,
  fontWeight: 900,
  letterSpacing: "-0.06em",
  lineHeight: 1,
} as const;

export default function Image() {
  return renderOgImage({
    tagline: "Plan every hour. Skip the calendar app.",
    children: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            alignItems: "center",
            gap: 18,
            padding: "16px 24px",
            border: "2px solid rgba(132, 204, 22, 0.55)",
            backgroundColor: "rgba(132, 204, 22, 0.16)",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Geist Mono",
              fontSize: 30,
              fontWeight: 500,
              color: "#ecfccb",
              letterSpacing: "-0.02em",
            }}
          >
            9:00 – 11:00
          </div>
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke={ACCENT}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 40 }}>
          <div style={{ ...WORDMARK_STYLE, color: "#fafafa" }}>Timeblock</div>
          <div style={{ ...WORDMARK_STYLE, color: ACCENT }}>.</div>
        </div>
      </div>
    ),
  });
}
