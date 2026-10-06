import type {
  Block,
  BlockStatus,
  Category,
  Template,
  TemplateBlock,
  TimeblockData,
} from "../types.ts";
import { placeAfter } from "./range.ts";
import { isoWeekday } from "./time.ts";

export const LIMITS = { templates: 20, categories: 30, blocksPerWeek: 300 } as const;

export interface OpError {
  error: string;
}

export type OpResult = TimeblockData | OpError;

export function isOpError(result: OpResult): result is OpError {
  return "error" in result;
}

export type BlockPatch = Partial<Omit<Block, "id">>;
export type TemplateBlockPatch = Partial<Omit<TemplateBlock, "id">>;
export type CategoryPatch = Partial<Omit<Category, "id">>;

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "deep-work", name: "Deep work", color: "blue" },
  { id: "meetings", name: "Meetings", color: "violet" },
  { id: "admin", name: "Admin", color: "slate" },
  { id: "exercise", name: "Exercise", color: "emerald" },
  { id: "personal", name: "Personal", color: "amber" },
];

export function initialData(): TimeblockData {
  return { categories: DEFAULT_CATEGORIES, blocksByDate: {}, templates: [] };
}

const weekFull = (): OpError => ({
  error: `A week can hold up to ${LIMITS.blocksPerWeek} blocks`,
});
const templateFull = (): OpError => ({
  error: `A template can hold up to ${LIMITS.blocksPerWeek} blocks`,
});

/** True when applying `patch` would change nothing (undefined keys are ignored). */
function unchanged<T extends object>(target: T, patch: Partial<T>): boolean {
  return (Object.keys(patch) as (keyof T)[]).every(
    (key) => patch[key] === undefined || patch[key] === target[key],
  );
}

/** Apply `patch`, skipping undefined keys. */
function merge<T extends object>(target: T, patch: Partial<NoInfer<T>>): T {
  const next = { ...target };
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const value = patch[key];
    if (value !== undefined) next[key] = value as T[keyof T];
  }
  return next;
}

/** Replace one day's blocks; an empty day is removed rather than stored as []. */
function withDay(data: TimeblockData, date: string, blocks: Block[]): TimeblockData {
  const { [date]: _, ...rest } = data.blocksByDate;
  return {
    ...data,
    blocksByDate: blocks.length > 0 ? { ...rest, [date]: blocks } : rest,
  };
}

export function countBlocks(data: TimeblockData, dates: readonly string[]): number {
  return dates.reduce((n, date) => n + (data.blocksByDate[date]?.length ?? 0), 0);
}

// ── Week blocks ────────────────────────────────────────────────────────────

export function addBlock(
  data: TimeblockData,
  week: readonly string[],
  date: string,
  block: Block,
): OpResult {
  if (countBlocks(data, week) >= LIMITS.blocksPerWeek) return weekFull();
  return withDay(data, date, [...(data.blocksByDate[date] ?? []), block]);
}

export function updateBlock(
  data: TimeblockData,
  date: string,
  id: string,
  patch: BlockPatch,
): TimeblockData {
  const day = data.blocksByDate[date] ?? [];
  const block = day.find((b) => b.id === id);
  if (!block || unchanged(block, patch)) return data;
  return withDay(data, date, day.map((b) => (b.id === id ? merge(b, patch) : b)));
}

export function moveBlock(
  data: TimeblockData,
  fromDate: string,
  id: string,
  toDate: string,
  start: number,
  end: number,
): TimeblockData {
  if (fromDate === toDate) return updateBlock(data, fromDate, id, { start, end });
  const source = data.blocksByDate[fromDate] ?? [];
  const block = source.find((b) => b.id === id);
  if (!block) return data;
  const removed = withDay(data, fromDate, source.filter((b) => b.id !== id));
  return withDay(removed, toDate, [
    ...(removed.blocksByDate[toDate] ?? []),
    { ...block, start, end },
  ]);
}

export function deleteBlock(data: TimeblockData, date: string, id: string): TimeblockData {
  const day = data.blocksByDate[date] ?? [];
  if (!day.some((b) => b.id === id)) return data;
  return withDay(data, date, day.filter((b) => b.id !== id));
}

/** Copy placed right after the original, reset to planned. */
export function duplicateBlock(
  data: TimeblockData,
  week: readonly string[],
  date: string,
  id: string,
  newId: string,
): OpResult {
  const block = data.blocksByDate[date]?.find((b) => b.id === id);
  if (!block) return data;
  return addBlock(data, week, date, {
    ...block,
    ...placeAfter(block),
    id: newId,
    status: "planned",
  });
}

export function clearDates(data: TimeblockData, dates: readonly string[]): TimeblockData {
  if (!dates.some((date) => date in data.blocksByDate)) return data;
  const blocksByDate = { ...data.blocksByDate };
  for (const date of dates) delete blocksByDate[date];
  return { ...data, blocksByDate };
}

// ── Templates ──────────────────────────────────────────────────────────────

function withTemplate(
  data: TimeblockData,
  id: string,
  update: (template: Template) => Template | OpError,
): OpResult {
  const template = data.templates.find((t) => t.id === id);
  if (!template) return data;
  const next = update(template);
  if ("error" in next) return next;
  if (next === template) return data;
  return { ...data, templates: data.templates.map((t) => (t.id === id ? next : t)) };
}

export function addTemplateBlock(
  data: TimeblockData,
  templateId: string,
  block: TemplateBlock,
): OpResult {
  return withTemplate(data, templateId, (t) =>
    t.blocks.length >= LIMITS.blocksPerWeek
      ? templateFull()
      : { ...t, blocks: [...t.blocks, block] },
  );
}

export function updateTemplateBlock(
  data: TimeblockData,
  templateId: string,
  id: string,
  patch: TemplateBlockPatch,
): OpResult {
  return withTemplate(data, templateId, (t) => {
    const block = t.blocks.find((b) => b.id === id);
    if (!block || unchanged(block, patch)) return t;
    return { ...t, blocks: t.blocks.map((b) => (b.id === id ? merge(b, patch) : b)) };
  });
}

export function deleteTemplateBlock(
  data: TimeblockData,
  templateId: string,
  id: string,
): OpResult {
  return withTemplate(data, templateId, (t) =>
    t.blocks.some((b) => b.id === id)
      ? { ...t, blocks: t.blocks.filter((b) => b.id !== id) }
      : t,
  );
}

export function duplicateTemplateBlock(
  data: TimeblockData,
  templateId: string,
  id: string,
  newId: string,
): OpResult {
  return withTemplate(data, templateId, (t) => {
    const block = t.blocks.find((b) => b.id === id);
    if (!block) return t;
    if (t.blocks.length >= LIMITS.blocksPerWeek) return templateFull();
    return { ...t, blocks: [...t.blocks, { ...block, ...placeAfter(block), id: newId }] };
  });
}

export function createTemplate(data: TimeblockData, template: Template): OpResult {
  if (data.templates.length >= LIMITS.templates) {
    return { error: `You can save up to ${LIMITS.templates} templates` };
  }
  return { ...data, templates: [...data.templates, template] };
}

export function renameTemplate(data: TimeblockData, id: string, name: string): OpResult {
  const trimmed = name.trim();
  return withTemplate(data, id, (t) =>
    !trimmed || trimmed === t.name ? t : { ...t, name: trimmed },
  );
}

export function deleteTemplate(data: TimeblockData, id: string): TimeblockData {
  if (!data.templates.some((t) => t.id === id)) return data;
  return { ...data, templates: data.templates.filter((t) => t.id !== id) };
}

/** New template from a week's blocks: weekday taken from each date, status dropped. */
export function saveWeekAsTemplate(
  data: TimeblockData,
  week: readonly string[],
  templateId: string,
  name: string,
  makeId: () => string,
): OpResult {
  const blocks: TemplateBlock[] = week.flatMap((date) =>
    (data.blocksByDate[date] ?? []).map(({ status: _, ...block }) => ({
      ...block,
      id: makeId(),
      weekday: isoWeekday(date),
    })),
  );
  // The week limit counts the week on screen; after a week-start switch the
  // same dates can hold more, and a template that big could never be applied.
  if (blocks.length > LIMITS.blocksPerWeek) return templateFull();
  return createTemplate(data, {
    id: templateId,
    name: name.trim() || "Untitled template",
    blocks,
  });
}

/** Copy a template's blocks onto the week's dates by ISO weekday; "replace" clears the week first. */
export function applyTemplate(
  data: TimeblockData,
  templateId: string,
  week: readonly string[],
  mode: "replace" | "add",
  makeId: () => string,
): OpResult {
  const template = data.templates.find((t) => t.id === templateId);
  if (!template) return data;
  const base = mode === "replace" ? clearDates(data, week) : data;
  if (countBlocks(base, week) + template.blocks.length > LIMITS.blocksPerWeek) {
    return weekFull();
  }
  let next = base;
  for (const date of week) {
    const weekday = isoWeekday(date);
    const added: Block[] = template.blocks
      .filter((b) => b.weekday === weekday)
      .map(({ weekday: _, ...b }) => ({
        ...b,
        id: makeId(),
        status: "planned" as BlockStatus,
      }));
    if (added.length > 0) {
      next = withDay(next, date, [...(next.blocksByDate[date] ?? []), ...added]);
    }
  }
  return next;
}

// ── Categories ─────────────────────────────────────────────────────────────

export function addCategory(data: TimeblockData, category: Category): OpResult {
  if (data.categories.length >= LIMITS.categories) {
    return { error: `You can have up to ${LIMITS.categories} categories` };
  }
  return { ...data, categories: [...data.categories, category] };
}

export function updateCategory(
  data: TimeblockData,
  id: string,
  patch: CategoryPatch,
): TimeblockData {
  const category = data.categories.find((c) => c.id === id);
  const clean = patch.name === undefined ? patch : { ...patch, name: patch.name.trim() };
  if (!category || clean.name === "" || unchanged(category, clean)) return data;
  return {
    ...data,
    categories: data.categories.map((c) => (c.id === id ? merge(c, clean) : c)),
  };
}

/** Blocks keep their categoryId and render as Uncategorized. */
export function deleteCategory(data: TimeblockData, id: string): OpResult {
  if (!data.categories.some((c) => c.id === id)) return data;
  if (data.categories.length === 1) return { error: "Keep at least one category" };
  return { ...data, categories: data.categories.filter((c) => c.id !== id) };
}
