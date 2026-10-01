import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutDay } from "./layout.ts";

const span = (id: string, start: number, end: number) => ({ id, start, end });

test("no blocks, no slots", () => {
  assert.equal(layoutDay([]).size, 0);
});

test("touching blocks don't share columns", () => {
  const slots = layoutDay([span("a", 0, 60), span("b", 60, 120)]);
  assert.deepEqual(slots.get("a"), { column: 0, columns: 1 });
  assert.deepEqual(slots.get("b"), { column: 0, columns: 1 });
});

test("two overlapping blocks sit side by side", () => {
  const slots = layoutDay([span("a", 540, 600), span("b", 570, 630)]);
  assert.deepEqual(slots.get("a"), { column: 0, columns: 2 });
  assert.deepEqual(slots.get("b"), { column: 1, columns: 2 });
});

test("a chain reuses freed columns but shares the cluster width", () => {
  const slots = layoutDay([span("a", 0, 60), span("b", 30, 90), span("c", 60, 120)]);
  assert.deepEqual(slots.get("a"), { column: 0, columns: 2 });
  assert.deepEqual(slots.get("b"), { column: 1, columns: 2 });
  assert.deepEqual(slots.get("c"), { column: 0, columns: 2 });
});

test("three mutually overlapping blocks get three columns, longest first", () => {
  const slots = layoutDay([span("b", 0, 60), span("c", 30, 90), span("a", 0, 120)]);
  assert.deepEqual(slots.get("a"), { column: 0, columns: 3 });
  assert.deepEqual(slots.get("b"), { column: 1, columns: 3 });
  assert.deepEqual(slots.get("c"), { column: 2, columns: 3 });
});
