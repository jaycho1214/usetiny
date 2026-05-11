import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../_og/frame";

export const alt = "QR Generator | UseTiny";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const FINDER = 56;
const RING = 12;

export default function Image() {
  return renderOgImage({
    tagline: "Real QR codes. No watermark, no sign-up.",
    taglineMarginTop: 48,
    children: (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "nowrap",
          gap: 32,
        }}
      >
        <div
          style={{
            fontSize: 192,
            fontWeight: 900,
            letterSpacing: "-0.06em",
            lineHeight: 1,
            color: "#fafafa",
            whiteSpace: "nowrap",
          }}
        >
          QR Code
        </div>
        <div
          style={{
            width: FINDER * 3,
            height: FINDER * 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#a855f7",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              width: FINDER * 3 - RING * 2,
              height: FINDER * 3 - RING * 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0a0a0b",
              borderRadius: 6,
            }}
          >
            <div
              style={{
                width: FINDER,
                height: FINDER,
                backgroundColor: "#a855f7",
                borderRadius: 3,
                display: "flex",
              }}
            />
          </div>
        </div>
      </div>
    ),
  });
}
