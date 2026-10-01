import { test } from "node:test";
import assert from "node:assert/strict";
import { PALETTE, PALETTE_KEYS, categoryLook, nextColor } from "./palette.ts";
import { UNCATEGORIZED_ID, type Category } from "./types.ts";

const cat = (id: string, color: Category["color"]): Category => ({ id, name: id, color });

test("nextColor picks the first unused palette color", () => {
  const used = [cat("a", "blue"), cat("b", "violet"), cat("c", "slate"), cat("d", "emerald"), cat("e", "amber")];
  assert.equal(nextColor(used), "rose");
});

test("nextColor cycles once every color is taken", () => {
  const all = PALETTE_KEYS.map((key) => cat(key, key));
  assert.equal(nextColor(all), PALETTE_KEYS[all.length % PALETTE_KEYS.length]);
});

test("categoryLook resolves known and deleted categories", () => {
  const categories = [cat("deep", "blue")];
  assert.deepEqual(categoryLook(categories, "deep"), { id: "deep", name: "deep", hex: PALETTE.blue });
  assert.deepEqual(categoryLook(categories, "gone"), { id: UNCATEGORIZED_ID, name: "Uncategorized", hex: "#a1a1aa" });
});
