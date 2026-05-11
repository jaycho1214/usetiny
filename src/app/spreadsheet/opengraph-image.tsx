import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../_og/frame";

export const alt = "Spreadsheet | UseTiny";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    tagline: "Real formulas. Disposable sheets.",
    children: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 18px",
            borderRadius: 10,
            backgroundColor: "#0d1f17",
            border: "1px solid #14532d",
            alignSelf: "flex-start",
          }}
        >
          <div
            style={{
              fontFamily: "Geist Mono",
              fontSize: 24,
              fontWeight: 500,
              color: "#34d399",
            }}
          >
            =SUM(B2:B12)
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 24 }}>
          <div
            style={{
              fontSize: 152,
              fontWeight: 900,
              letterSpacing: "-0.06em",
              lineHeight: 1,
              color: "#fafafa",
            }}
          >
            Spreadsheet
          </div>
          <div
            style={{
              fontSize: 152,
              fontWeight: 900,
              letterSpacing: "-0.06em",
              lineHeight: 1,
              color: "#10b981",
            }}
          >
            .
          </div>
        </div>
      </div>
    ),
  });
}
