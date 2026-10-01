import { test } from "node:test";
import assert from "node:assert/strict";
import { pointToCell, resolveGesture } from "./drag.ts";

const RECT = { left: 50, top: 100, width: 700 };

test("pointToCell maps pixels to a column and minute", () => {
  assert.deepEqual(pointToCell(350, 148, RECT, 7, 48), { col: 3, minute: 60 });
  assert.equal(pointToCell(2000, 148, RECT, 7, 48).col, 6);
  assert.equal(pointToCell(0, 148, RECT, 7, 48).col, 0);
});

test("create covers both the anchor slot and the pointer slot", () => {
  const down = resolveGesture({ kind: "create", col: 2, anchor: 540 }, { col: 2, minute: 610 }, 7);
  assert.deepEqual(down, { col: 2, start: 540, end: 615 });
  const up = resolveGesture({ kind: "create", col: 2, anchor: 600 }, { col: 2, minute: 545 }, 7);
  assert.deepEqual(up, { col: 2, start: 540, end: 615 });
  const single = resolveGesture({ kind: "create", col: 2, anchor: 541 }, { col: 2, minute: 549 }, 7);
  assert.deepEqual(single, { col: 2, start: 540, end: 555 });
});

test("create stays in its column and inside the day", () => {
  const below = resolveGesture({ kind: "create", col: 1, anchor: 1400 }, { col: 5, minute: 2000 }, 7);
  assert.deepEqual(below, { col: 1, start: 1395, end: 1440 });
  const above = resolveGesture({ kind: "create", col: 1, anchor: 30 }, { col: 1, minute: -100 }, 7);
  assert.deepEqual(above, { col: 1, start: 0, end: 45 });
});

test("move keeps the duration, follows the column, and clamps to the day", () => {
  const g = { kind: "move" as const, col: 2, start: 540, end: 600, grabOffset: 20 };
  assert.deepEqual(resolveGesture(g, { col: 4, minute: 680 }, 7), { col: 4, start: 660, end: 720 });
  assert.deepEqual(resolveGesture(g, { col: 2, minute: 1500 }, 7), { col: 2, start: 1380, end: 1440 });
  assert.deepEqual(resolveGesture(g, { col: 2, minute: 0 }, 7), { col: 2, start: 0, end: 60 });
  assert.equal(resolveGesture(g, { col: 9, minute: 600 }, 7).col, 6);
});

test("resizing keeps at least one slot and stays inside the day", () => {
  const box = { col: 1, start: 540, end: 600 };
  assert.deepEqual(resolveGesture({ kind: "resize-end", ...box }, { col: 3, minute: 500 }, 7), { col: 1, start: 540, end: 555 });
  assert.deepEqual(resolveGesture({ kind: "resize-end", ...box }, { col: 1, minute: 2000 }, 7), { col: 1, start: 540, end: 1440 });
  assert.deepEqual(resolveGesture({ kind: "resize-start", ...box }, { col: 1, minute: 630 }, 7), { col: 1, start: 585, end: 600 });
  assert.deepEqual(resolveGesture({ kind: "resize-start", ...box }, { col: 1, minute: -50 }, 7), { col: 1, start: 0, end: 600 });
});
