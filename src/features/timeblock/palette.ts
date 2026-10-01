import { UNCATEGORIZED_ID, type Category, type PaletteKey } from "./types.ts";

/** Mid-tone hues that read on both light and dark backgrounds. Order drives nextColor(). */
export const PALETTE: Record<PaletteKey, string> = {
  blue: "#3b82f6",
  violet: "#8b5cf6",
  slate: "#64748b",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  teal: "#14b8a6",
  lime: "#84cc16",
  orange: "#f97316",
  pink: "#ec4899",
};

export const PALETTE_KEYS = Object.keys(PALETTE) as PaletteKey[];

const UNCATEGORIZED_HEX = "#a1a1aa";

/** First palette color no category uses yet; cycles when all are taken. */
export function nextColor(categories: readonly Category[]): PaletteKey {
  const used = new Set(categories.map((c) => c.color));
  return (
    PALETTE_KEYS.find((key) => !used.has(key)) ??
    PALETTE_KEYS[categories.length % PALETTE_KEYS.length]
  );
}

export interface CategoryLook {
  id: string;
  name: string;
  hex: string;
}

/** Display name and color for a block's category; deleted ones render gray. */
export function categoryLook(
  categories: readonly Category[],
  id: string,
): CategoryLook {
  const category = categories.find((c) => c.id === id);
  return category
    ? { id: category.id, name: category.name, hex: PALETTE[category.color] }
    : { id: UNCATEGORIZED_ID, name: "Uncategorized", hex: UNCATEGORIZED_HEX };
}

const DARK_TEXT = "#0a0a0a";
const LIGHT_TEXT = "#ffffff";

/** WCAG relative luminance of a "#rrggbb" color. */
function luminance(hex: string): number {
  const channel = (offset: number) => {
    const c = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** Text color with the higher WCAG contrast on a solid `hex` fill. */
export function readableText(hex: string): typeof DARK_TEXT | typeof LIGHT_TEXT {
  const fill = luminance(hex) + 0.05;
  const lightTextContrast = (luminance(LIGHT_TEXT) + 0.05) / fill;
  const darkTextContrast = fill / (luminance(DARK_TEXT) + 0.05);
  return lightTextContrast > darkTextContrast ? LIGHT_TEXT : DARK_TEXT;
}
