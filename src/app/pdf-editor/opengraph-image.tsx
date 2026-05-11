import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../_og/frame";

export const alt = "PDF Editor | UseTiny";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const WORDMARK_STYLE = {
  fontSize: 184,
  fontWeight: 900,
  letterSpacing: "-0.06em",
  lineHeight: 1,
  color: "#fafafa",
} as const;

export default function Image() {
  return renderOgImage({
    tagline: "Annotate, fill, sign. Files never leave your device.",
    taglineMarginTop: 48,
    children: (
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <div style={WORDMARK_STYLE}>PDF</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            backgroundColor: "rgba(244,63,94,0.32)",
            borderRadius: 4,
          }}
        >
          <div style={WORDMARK_STYLE}>Editor</div>
        </div>
        <div style={{ ...WORDMARK_STYLE, color: "#f43f5e" }}>.</div>
      </div>
    ),
  });
}
