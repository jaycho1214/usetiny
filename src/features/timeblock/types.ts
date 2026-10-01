export type BlockStatus = "planned" | "done" | "skipped";

/** A time block on a specific date. Times are minutes from midnight. */
export interface Block {
  id: string;
  title: string;
  categoryId: string;
  /** 0–1425, multiple of 15 */
  start: number;
  /** 15–1440, multiple of 15, greater than start */
  end: number;
  status: BlockStatus;
}

/** 0 = Monday … 6 = Sunday (ISO order, independent of the week-start setting). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TemplateBlock extends Omit<Block, "status"> {
  weekday: Weekday;
}

export interface Template {
  id: string;
  name: string;
  blocks: TemplateBlock[];
}

export type PaletteKey =
  | "blue"
  | "violet"
  | "slate"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "teal"
  | "lime"
  | "orange"
  | "pink";

export interface Category {
  id: string;
  name: string;
  color: PaletteKey;
}

export interface TimeblockData {
  categories: Category[];
  /** Keyed by local date "YYYY-MM-DD". Empty days are removed, never stored as []. */
  blocksByDate: Record<string, Block[]>;
  templates: Template[];
}

/** JS getDay() numbering: 0 = Sunday, 1 = Monday. */
export type WeekStartsOn = 0 | 1;

/** Stats/display key for blocks whose category was deleted. Never stored on a Category. */
export const UNCATEGORIZED_ID = "__uncategorized";
