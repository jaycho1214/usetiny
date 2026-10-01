import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";

// zustand's persist reads window.localStorage; provide an in-memory one
// before the store module is evaluated.
const memory = new Map<string, string>();
Object.assign(globalThis, {
  window: {
    localStorage: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => void memory.set(key, value),
      removeItem: (key: string) => void memory.delete(key),
    },
  },
});

const { useTimeblockStore } = await import("./store.ts");
const { emptyHistory } = await import("./lib/history.ts");
const { addCategory, deleteCategory, initialData, updateCategory } = await import("./lib/ops.ts");

const store = () => useTimeblockStore.getState();

beforeEach(() => {
  useTimeblockStore.setState({ ...initialData(), history: emptyHistory() });
  memory.clear();
});

test("commit records an undo point; undo and redo walk it", () => {
  const result = store().commit("Rename category", (d) => updateCategory(d, "admin", { name: "Ops" }));
  assert.deepEqual(result, { ok: true, entryId: 1 });
  assert.equal(store().categories[2].name, "Ops");
  assert.equal(store().history.past.at(-1)?.label, "Rename category");
  store().undo();
  assert.equal(store().categories[2].name, "Admin");
  assert.equal(store().history.future.at(-1)?.label, "Rename category");
  store().redo();
  assert.equal(store().categories[2].name, "Ops");
});

test("a no-op recipe records nothing", () => {
  const result = store().commit("Rename category", (d) => updateCategory(d, "admin", { name: "Admin" }));
  assert.deepEqual(result, { ok: true, entryId: null });
  assert.equal(store().history.past.length, 0);
});

test("a refused change returns the error and records nothing", () => {
  store().commit("Trim", (d) => ({ ...d, categories: [d.categories[0]] }));
  const before = store().categories;
  const result = store().commit("Delete category", (d) => deleteCategory(d, "deep-work"));
  assert.deepEqual(result, { ok: false, error: "Keep at least one category" });
  assert.equal(store().categories, before);
  assert.equal(store().history.past.length, 1);
});

test("undoIfLatest undoes its own change", () => {
  const result = store().commit("Add category", (d) => addCategory(d, { id: "x", name: "X", color: "lime" }));
  if (!result.ok || result.entryId === null) assert.fail("expected a history entry");
  assert.equal(store().undoIfLatest(result.entryId), true);
  assert.equal(store().categories.some((c) => c.id === "x"), false);
});

test("undoIfLatest refuses once a newer change exists", () => {
  const first = store().commit("Add category", (d) => addCategory(d, { id: "x", name: "X", color: "lime" }));
  if (!first.ok || first.entryId === null) assert.fail("expected a history entry");
  store().commit("Rename category", (d) => updateCategory(d, "x", { name: "Y" }));
  assert.equal(store().undoIfLatest(first.entryId), false);
  assert.equal(store().categories.at(-1)?.name, "Y");
});

test("only data and settings are persisted, never history", () => {
  store().commit("Add category", (d) => addCategory(d, { id: "x", name: "X", color: "lime" }));
  const saved = JSON.parse(memory.get("timeblock-storage") ?? "{}");
  assert.equal(saved.version, 1);
  assert.deepEqual(Object.keys(saved.state).sort(), [
    "blocksByDate",
    "categories",
    "lastCategoryId",
    "templates",
    "weekStartsOn",
  ]);
});

test("discardIfLatest removes its own change without leaving undo or redo", () => {
  const added = store().commit("Add category", (d) => addCategory(d, { id: "x", name: "X", color: "lime" }));
  if (!added.ok || added.entryId === null) assert.fail("expected a history entry");
  assert.equal(store().discardIfLatest(added.entryId), true);
  assert.equal(store().categories.some((c) => c.id === "x"), false);
  assert.equal(store().history.past.length, 0);
  assert.equal(store().history.future.length, 0);
});

test("discardIfLatest refuses once a newer change exists", () => {
  const added = store().commit("Add category", (d) => addCategory(d, { id: "x", name: "X", color: "lime" }));
  if (!added.ok || added.entryId === null) assert.fail("expected a history entry");
  store().commit("Rename category", (d) => updateCategory(d, "x", { name: "Y" }));
  assert.equal(store().discardIfLatest(added.entryId), false);
  assert.equal(store().categories.at(-1)?.name, "Y");
  assert.equal(store().history.past.length, 2);
});

test("discardIfLatest refuses while redo entries exist", () => {
  const added = store().commit("Add category", (d) => addCategory(d, { id: "x", name: "X", color: "lime" }));
  if (!added.ok || added.entryId === null) assert.fail("expected a history entry");
  store().commit("Rename category", (d) => updateCategory(d, "x", { name: "Y" }));
  store().undo(); // the add is latest again, with the rename waiting in redo
  assert.equal(store().discardIfLatest(added.entryId), false);
  assert.equal(store().categories.some((c) => c.id === "x"), true);
  assert.equal(store().history.future.length, 1);
});
