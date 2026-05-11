import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { loadOgFonts } from "./fonts";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png" as const;

type RenderOgImageProps = {
  tagline: string;
  children: ReactElement | ReactElement[];
  taglineMarginTop?: number;
};

export async function renderOgImage({
  tagline,
  children,
  taglineMarginTop = 44,
}: RenderOgImageProps) {
  const fonts = await loadOgFonts();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "96px",
        backgroundColor: "#0a0a0b",
        color: "#fafafa",
        fontFamily: "Geist",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {children}
        <div
          style={{
            fontSize: 44,
            fontWeight: 500,
            color: "#d4d4d8",
            marginTop: taglineMarginTop,
            letterSpacing: "-0.02em",
          }}
        >
          {tagline}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            fontFamily: "Geist Mono",
            fontSize: 36,
            fontWeight: 500,
            color: "#d4d4d8",
            letterSpacing: "-0.02em",
          }}
        >
          usetiny.app
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: fonts as never },
  );
}
