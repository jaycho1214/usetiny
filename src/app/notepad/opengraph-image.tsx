import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../_og/frame";

export const alt = "Notepad | UseTiny";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const TABS = ["Brainstorm", "Meeting", "Ideas"];

export default function Image() {
  return renderOgImage({
    tagline: "Quick notes. Saved without asking.",
    taglineMarginTop: 40,
    children: (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {TABS.map((label, i) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 18px",
                borderRadius: 10,
                backgroundColor: i === 0 ? "#1f1d18" : "transparent",
                border: i === 0 ? "1px solid #3f3725" : "1px solid #27272a",
                fontSize: 22,
                fontWeight: 500,
                color: i === 0 ? "#fef3c7" : "#71717a",
              }}
            >
              {label}
            </div>
          ))}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 14px",
              fontSize: 22,
              color: "#52525b",
            }}
          >
            +
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 28 }}>
          <div
            style={{
              fontSize: 224,
              fontWeight: 900,
              letterSpacing: "-0.06em",
              lineHeight: 1,
              color: "#fafafa",
            }}
          >
            Notepad
          </div>
          <div
            style={{
              fontSize: 224,
              fontWeight: 900,
              letterSpacing: "-0.06em",
              lineHeight: 1,
              color: "#f59e0b",
            }}
          >
            .
          </div>
        </div>
      </>
    ),
  });
}
