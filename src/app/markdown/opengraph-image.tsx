import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../_og/frame";

export const alt = "Markdown to PDF | UseTiny";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    tagline: "Plain text in. Polished PDF out.",
    children: (
      <div style={{ display: "flex", alignItems: "baseline", gap: 28 }}>
        <div
          style={{
            fontSize: 168,
            fontWeight: 900,
            letterSpacing: "-0.06em",
            lineHeight: 1,
            color: "#ec4899",
            fontFamily: "Geist Mono",
          }}
        >
          #
        </div>
        <div
          style={{
            fontSize: 168,
            fontWeight: 900,
            letterSpacing: "-0.06em",
            lineHeight: 1,
            color: "#fafafa",
          }}
        >
          Markdown
        </div>
      </div>
    ),
  });
}
