import { test } from "node:test";
import assert from "node:assert/strict";
import { HISTORY_LIMIT, discardLatest, emptyHistory, latestId, record, redo, undo } from "./history.ts";

test("record pushes an undo point with increasing ids", () => {
  const a = record(emptyHistory<string>(), "First", "v0");
  const b = record(a.history, "Second", "v1");
  assert.equal(a.id, 1);
  assert.equal(b.id, 2);
  assert.deepEqual(b.history.past.map((e) => e.data), ["v0", "v1"]);
  assert.equal(latestId(b.history), 2);
});

test("undo restores the previous data and moves the entry to redo", () => {
  const { history } = record(emptyHistory<string>(), "Edit", "v0");
  const undone = undo(history, "v1");
  assert.ok(undone);
  assert.equal(undone.data, "v0");
  assert.deepEqual(undone.history.past, []);
  assert.deepEqual(undone.history.future, [{ id: 1, label: "Edit", data: "v1" }]);
});

test("redo reapplies and keeps the label", () => {
  const { history } = record(emptyHistory<string>(), "Edit", "v0");
  const undone = undo(history, "v1");
  assert.ok(undone);
  const redone = redo(undone.history, undone.data);
  assert.ok(redone);
  assert.equal(redone.data, "v1");
  assert.deepEqual(redone.history.past, [{ id: 1, label: "Edit", data: "v0" }]);
  assert.deepEqual(redone.history.future, []);
});

test("undo and redo on empty stacks do nothing", () => {
  assert.equal(undo(emptyHistory<string>(), "v"), null);
  assert.equal(redo(emptyHistory<string>(), "v"), null);
  assert.equal(latestId(emptyHistory<string>()), null);
});

test("a new change clears redo", () => {
  const { history } = record(emptyHistory<string>(), "Edit", "v0");
  const undone = undo(history, "v1");
  assert.ok(undone);
  const next = record(undone.history, "Other", "v0");
  assert.deepEqual(next.history.future, []);
});

test("history keeps only the newest entries", () => {
  let history = emptyHistory<number>();
  for (let i = 0; i < HISTORY_LIMIT + 5; i++) history = record(history, "Edit", i).history;
  assert.equal(history.past.length, HISTORY_LIMIT);
  assert.equal(history.past[0].id, 6);
  assert.equal(history.past[0].data, 5);
});

test("discardLatest drops the newest entry and any redo built on it", () => {
  // Add block (entry 1), then another edit (entry 2) that gets undone.
  const added = record(emptyHistory<string>(), "Add block", "before-add");
  const edited = record(added.history, "Change category", "with-block");
  const undone = undo(edited.history, "with-block-recolored");
  assert.ok(undone);
  assert.equal(latestId(undone.history), added.id);
  assert.equal(undone.history.future.length, 1);

  const discarded = discardLatest(undone.history);
  assert.ok(discarded);
  assert.equal(discarded.data, "before-add");
  assert.deepEqual(discarded.history.past, []);
  assert.deepEqual(discarded.history.future, []);
  assert.equal(discarded.history.nextId, undone.history.nextId);
});

test("discardLatest on an empty history does nothing", () => {
  assert.equal(discardLatest(emptyHistory<string>()), null);
});

test("discardLatest keeps older entries and exposes the previous id", () => {
  const first = record(emptyHistory<string>(), "Edit", "v0");
  const second = record(first.history, "Add block", "v1");
  const discarded = discardLatest(second.history);
  assert.ok(discarded);
  assert.deepEqual(discarded.history.past.map((e) => e.label), ["Edit"]);
  assert.equal(latestId(discarded.history), first.id);
});
