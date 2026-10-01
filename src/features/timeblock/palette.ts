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
