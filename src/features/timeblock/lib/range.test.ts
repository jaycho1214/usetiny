import { test } from "node:test";
import assert from "node:assert/strict";
import { clickRange, nudge, placeAfter, resizeEnd, withStart } from "./range.ts";

test("clickRange makes a one-hour block from the clicked slot, cut at midnight", () => {
  assert.deepEqual(clickRange(545), { start: 540, end: 600 });
  assert.deepEqual(clickRange(1420), { start: 1410, end: 1440 });
  assert.deepEqual(clickRange(-5), { start: 0, end: 60 });
  assert.deepEqual(clickRange(1500), { start: 1425, end: 1440 });
});

test("nudge keeps the duration and stays inside the day", () => {
  assert.deepEqual(nudge({ start: 540, end: 600 }, 15), { start: 555, end: 615 });
  assert.deepEqual(nudge({ start: 0, end: 60 }, -15), { start: 0, end: 60 });
  assert.deepEqual(nudge({ start: 1380, end: 1440 }, 15), { start: 1380, end: 1440 });
});

test("resizeEnd keeps at least one slot and stops at midnight", () => {
  assert.deepEqual(resizeEnd({ start: 540, end: 600 }, -15), { start: 540, end: 585 });
  assert.deepEqual(resizeEnd({ start: 540, end: 555 }, -15), { start: 540, end: 555 });
  assert.deepEqual(resizeEnd({ start: 1380, end: 1440 }, 15), { start: 1380, end: 1440 });
});

test("withStart keeps the duration, cut at midnight", () => {
  assert.deepEqual(withStart({ start: 540, end: 600 }, 600), { start: 600, end: 660 });
  assert.deepEqual(withStart({ start: 540, end: 660 }, 1410), { start: 1410, end: 1440 });
  assert.deepEqual(withStart({ start: 540, end: 600 }, 1425), { start: 1425, end: 1440 });
});

test("placeAfter puts a duplicate right after, shifting up at midnight", () => {
  assert.deepEqual(placeAfter({ start: 540, end: 600 }), { start: 600, end: 660 });
  assert.deepEqual(placeAfter({ start: 1380, end: 1410 }), { start: 1410, end: 1440 });
  assert.deepEqual(placeAfter({ start: 1320, end: 1440 }), { start: 1320, end: 1440 });
});
