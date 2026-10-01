import { test } from "node:test";
import assert from "node:assert/strict";
import { UNCATEGORIZED_ID } from "../types.ts";
import { computeStats } from "./stats.ts";

const KNOWN = new Set(["deep", "meet"]);

test("no blocks, zero totals", () => {
  assert.deepEqual(computeStats([], KNOWN), { count: 0, planned: 0, done: 0, skipped: 0, byCategory: {} });
});

test("planned counts every block; done and skipped split out", () => {
  const stats = computeStats(
    [
      { categoryId: "deep", start: 540, end: 660, status: "done" },
      { categoryId: "deep", start: 660, end: 690, status: "planned" },
      { categoryId: "meet", start: 600, end: 660, status: "skipped" },
    ],
    KNOWN,
  );
  assert.equal(stats.count, 3);
  assert.equal(stats.planned, 210);
  assert.equal(stats.done, 120);
  assert.equal(stats.skipped, 60);
  assert.deepEqual(stats.byCategory.deep, { planned: 150, done: 120, skipped: 0 });
  assert.deepEqual(stats.byCategory.meet, { planned: 60, done: 0, skipped: 60 });
});

test("blocks in a deleted category count as Uncategorized", () => {
  const stats = computeStats([{ categoryId: "gone", start: 0, end: 30, status: "planned" }], KNOWN);
  assert.deepEqual(stats.byCategory[UNCATEGORIZED_ID], { planned: 30, done: 0, skipped: 0 });
});

test("template blocks without status count as planned", () => {
  const stats = computeStats([{ categoryId: "deep", start: 0, end: 60 }], KNOWN);
  assert.deepEqual(stats.byCategory.deep, { planned: 60, done: 0, skipped: 0 });
});
