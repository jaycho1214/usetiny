import { test } from "node:test";
import assert from "node:assert/strict";
import type { Block, Template, TimeblockData } from "../types.ts";
import { nextColor } from "../palette.ts";
import {
  LIMITS,
  addBlock,
  addCategory,
  applyTemplate,
  clearDates,
  countBlocks,
  createTemplate,
  deleteBlock,
  deleteCategory,
  duplicateBlock,
  duplicateTemplateBlock,
  initialData,
  isOpError,
  moveBlock,
  renameTemplate,
  saveWeekAsTemplate,
  updateBlock,
  updateCategory,
  updateTemplateBlock,
  type OpResult,
} from "./ops.ts";
import { weekDates } from "./time.ts";

const WEEK = weekDates("2026-09-28"); // Mon Sep 28 … Sun Oct 4
const MON = WEEK[0];
const TUE = WEEK[1];
const SUN = WEEK[6];

const block = (id: string, start: number, end: number, extra: Partial<Block> = {}): Block => ({
  id,
  title: id,
  categoryId: "deep-work",
  start,
  end,
  status: "planned",
  ...extra,
});

const withBlocks = (blocksByDate: Record<string, Block[]>): TimeblockData => ({
  ...initialData(),
  blocksByDate,
});

function counter(prefix = "n") {
  let i = 0;
  return () => `${prefix}${++i}`;
}

function expectData(result: OpResult): TimeblockData {
  if (isOpError(result)) assert.fail(result.error);
  return result;
}

const WORK: Template = {
  id: "work",
  name: "Work",
  blocks: [
    { id: "w1", title: "Focus", categoryId: "deep-work", start: 540, end: 660, weekday: 0 },
    { id: "w2", title: "Long run", categoryId: "exercise", start: 420, end: 480, weekday: 6 },
  ],
};

test("addBlock appends to the date", () => {
  const data = expectData(addBlock(initialData(), WEEK, MON, block("a", 540, 600)));
  assert.deepEqual(data.blocksByDate[MON].map((b) => b.id), ["a"]);
});

test("addBlock refuses the 301st block of a week", () => {
  const full = withBlocks(
    Object.fromEntries(
      WEEK.map((date, d) => [
        date,
        Array.from({ length: d < 6 ? 43 : 42 }, (_, i) => block(`${d}-${i}`, 0, 15)),
      ]),
    ),
  );
  assert.equal(countBlocks(full, WEEK), LIMITS.blocksPerWeek);
  assert.ok(isOpError(addBlock(full, WEEK, MON, block("x", 540, 600))));
});

test("updateBlock returns the same object when nothing changes", () => {
  const data = withBlocks({ [MON]: [block("a", 540, 600)] });
  assert.equal(updateBlock(data, MON, "a", { title: "a", start: 540 }), data);
  assert.equal(updateBlock(data, MON, "missing", { title: "x" }), data);
  assert.equal(updateBlock(data, MON, "a", { title: "Focus" }).blocksByDate[MON][0].title, "Focus");
});

test("moveBlock to another day keeps the id and drops the emptied day", () => {
  const data = moveBlock(withBlocks({ [MON]: [block("a", 540, 600)] }), MON, "a", TUE, 600, 660);
  assert.equal(MON in data.blocksByDate, false);
  assert.deepEqual(data.blocksByDate[TUE], [block("a", 600, 660)]);
});

test("deleteBlock removes the block and the empty day", () => {
  assert.deepEqual(deleteBlock(withBlocks({ [MON]: [block("a", 540, 600)] }), MON, "a").blocksByDate, {});
});

test("duplicateBlock places a planned copy right after the original", () => {
  const data = expectData(
    duplicateBlock(withBlocks({ [MON]: [block("a", 540, 600, { status: "done" })] }), WEEK, MON, "a", "b"),
  );
  assert.deepEqual(data.blocksByDate[MON][1], block("b", 600, 660, { title: "a" }));
});

test("duplicating a block that ends at midnight overlaps instead of spilling", () => {
  const data = expectData(duplicateBlock(withBlocks({ [MON]: [block("a", 1320, 1440)] }), WEEK, MON, "a", "b"));
  assert.equal(data.blocksByDate[MON][1].start, 1320);
  assert.equal(data.blocksByDate[MON][1].end, 1440);
});

test("clearDates removes only the given dates", () => {
  const data = withBlocks({ [MON]: [block("a", 0, 15)], "2026-10-05": [block("b", 0, 15)] });
  assert.deepEqual(Object.keys(clearDates(data, WEEK).blocksByDate), ["2026-10-05"]);
  const empty = initialData();
  assert.equal(clearDates(empty, WEEK), empty);
});

test("saveWeekAsTemplate records ISO weekdays and drops status", () => {
  const data = withBlocks({
    [MON]: [block("a", 540, 600, { status: "done" })],
    [SUN]: [block("b", 600, 660)],
  });
  const result = expectData(saveWeekAsTemplate(data, WEEK, "t1", "  Work week ", counter()));
  assert.deepEqual(result.templates, [
    {
      id: "t1",
      name: "Work week",
      blocks: [
        { id: "n1", title: "a", categoryId: "deep-work", start: 540, end: 600, weekday: 0 },
        { id: "n2", title: "b", categoryId: "deep-work", start: 600, end: 660, weekday: 6 },
      ],
    },
  ]);
});

test("createTemplate refuses the 21st template", () => {
  const data: TimeblockData = {
    ...initialData(),
    templates: Array.from({ length: LIMITS.templates }, (_, i) => ({ id: `t${i}`, name: `T${i}`, blocks: [] })),
  };
  assert.ok(isOpError(createTemplate(data, { id: "x", name: "X", blocks: [] })));
});

test("applyTemplate replace clears the week and adds fresh planned blocks", () => {
  const data: TimeblockData = { ...withBlocks({ [TUE]: [block("old", 0, 15)] }), templates: [WORK] };
  const result = expectData(applyTemplate(data, "work", WEEK, "replace", counter()));
  assert.deepEqual(Object.keys(result.blocksByDate).sort(), [MON, SUN]);
  assert.deepEqual(result.blocksByDate[MON], [
    { id: "n1", title: "Focus", categoryId: "deep-work", start: 540, end: 660, status: "planned" },
  ]);
  assert.equal(result.blocksByDate[SUN][0].id, "n2");
});

test("applyTemplate add keeps existing blocks", () => {
  const data: TimeblockData = { ...withBlocks({ [MON]: [block("old", 0, 15)] }), templates: [WORK] };
  const result = expectData(applyTemplate(data, "work", WEEK, "add", counter()));
  assert.deepEqual(result.blocksByDate[MON].map((b) => b.id), ["old", "n1"]);
});

test("applyTemplate maps weekdays correctly for a Sunday-start week", () => {
  const sundayWeek = weekDates("2026-09-27"); // Sun Sep 27 … Sat Oct 3
  const result = expectData(applyTemplate({ ...initialData(), templates: [WORK] }, "work", sundayWeek, "add", counter()));
  assert.equal(result.blocksByDate["2026-09-28"][0].title, "Focus"); // Monday
  assert.equal(result.blocksByDate["2026-09-27"][0].title, "Long run"); // Sunday
});

test("applyTemplate refuses to overflow the week", () => {
  const big: Template = {
    id: "big",
    name: "Big",
    blocks: Array.from({ length: LIMITS.blocksPerWeek }, (_, i) => ({
      id: `b${i}`,
      title: "",
      categoryId: "admin",
      start: 0,
      end: 15,
      weekday: 0 as const,
    })),
  };
  const data: TimeblockData = { ...withBlocks({ [MON]: [block("old", 0, 15)] }), templates: [big] };
  assert.ok(isOpError(applyTemplate(data, "big", WEEK, "add", counter())));
  assert.ok(!isOpError(applyTemplate(data, "big", WEEK, "replace", counter())));
});

test("template block edits", () => {
  const data: TimeblockData = { ...initialData(), templates: [WORK] };
  const moved = expectData(updateTemplateBlock(data, "work", "w1", { weekday: 2, start: 600, end: 720 }));
  assert.deepEqual(moved.templates[0].blocks[0], { ...WORK.blocks[0], weekday: 2, start: 600, end: 720 });
  assert.equal(updateTemplateBlock(data, "work", "w1", { start: 540 }), data);
  const dup = expectData(duplicateTemplateBlock(data, "work", "w1", "w3"));
  assert.deepEqual(dup.templates[0].blocks[2], { ...WORK.blocks[0], id: "w3", start: 660, end: 780 });
});

test("renameTemplate trims and ignores empty names", () => {
  const data: TimeblockData = { ...initialData(), templates: [WORK] };
  assert.equal(expectData(renameTemplate(data, "work", "  Deep week ")).templates[0].name, "Deep week");
  assert.equal(renameTemplate(data, "work", "   "), data);
});

test("categories: trimmed rename, add limit, keep at least one", () => {
  const data = initialData();
  assert.equal(updateCategory(data, "admin", { name: "  Ops " }).categories[2].name, "Ops");
  assert.equal(updateCategory(data, "admin", { name: "  " }), data);
  const full: TimeblockData = {
    ...data,
    categories: Array.from({ length: LIMITS.categories }, (_, i) => ({ id: `c${i}`, name: `C${i}`, color: "blue" as const })),
  };
  assert.ok(isOpError(addCategory(full, { id: "x", name: "X", color: nextColor(full.categories) })));
  assert.ok(isOpError(deleteCategory({ ...data, categories: [data.categories[0]] }, "deep-work")));
});

test("deleteCategory leaves blocks pointing at the old id", () => {
  const data = withBlocks({ [MON]: [block("a", 0, 15, { categoryId: "admin" })] });
  const result = expectData(deleteCategory(data, "admin"));
  assert.equal(result.categories.some((c) => c.id === "admin"), false);
  assert.equal(result.blocksByDate[MON][0].categoryId, "admin");
});
