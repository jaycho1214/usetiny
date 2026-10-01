import { nanoid } from "nanoid";
import { toast } from "sonner";
import * as ops from "./lib/ops";
import { nextColor } from "./palette";
import { useTimeblockStore, type ActionResult } from "./store";
import {
  UNCATEGORIZED_ID,
  type Block,
  type TemplateBlock,
  type TimeblockData,
} from "./types";

export const newId = () => nanoid(10);

const store = () => useTimeblockStore.getState();

/** Commit through history; a refused change surfaces as an error toast. */
function run(label: string, recipe: (data: TimeblockData) => ops.OpResult): ActionResult {
  const result = store().commit(label, recipe);
  if (!result.ok) toast.error(result.error);
  return result;
}

/** Toast whose Undo button reverts exactly this change — never a newer one. */
function toastWithUndo(message: string, result: ActionResult) {
  if (!result.ok || result.entryId === null) return;
  const { entryId } = result;
  toast(message, {
    action: {
      label: "Undo",
      onClick: () => {
        if (!store().undoIfLatest(entryId)) {
          toast("You've made changes since — use Undo in the toolbar instead.");
        }
      },
    },
  });
}

/** Category for new blocks: the last one used, if it still exists. */
export function defaultCategoryId(): string {
  const { categories, lastCategoryId } = store();
  if (lastCategoryId && categories.some((c) => c.id === lastCategoryId)) return lastCategoryId;
  return categories[0]?.id ?? UNCATEGORIZED_ID;
}

// ── Week blocks ────────────────────────────────────────────────────────────

export function addBlock(week: readonly string[], date: string, block: Block): boolean {
  return run("Add block", (d) => ops.addBlock(d, week, date, block)).ok;
}

export function updateBlock(date: string, id: string, patch: ops.BlockPatch, label = "Edit block") {
  if (patch.categoryId) store().setLastCategoryId(patch.categoryId);
  run(label, (d) => ops.updateBlock(d, date, id, patch));
}

export function moveBlock(fromDate: string, id: string, toDate: string, start: number, end: number) {
  run("Move block", (d) => ops.moveBlock(d, fromDate, id, toDate, start, end));
}

export function deleteBlock(date: string, id: string) {
  toastWithUndo("Block deleted", run("Delete block", (d) => ops.deleteBlock(d, date, id)));
}

export function duplicateBlock(week: readonly string[], date: string, id: string) {
  run("Duplicate block", (d) => ops.duplicateBlock(d, week, date, id, newId()));
}

export function clearWeek(week: readonly string[]) {
  toastWithUndo("Week cleared", run("Clear week", (d) => ops.clearDates(d, week)));
}

// ── Template blocks ────────────────────────────────────────────────────────

export function addTemplateBlock(templateId: string, block: TemplateBlock): boolean {
  return run("Add block", (d) => ops.addTemplateBlock(d, templateId, block)).ok;
}

export function updateTemplateBlock(
  templateId: string,
  id: string,
  patch: ops.TemplateBlockPatch,
  label = "Edit block",
) {
  if (patch.categoryId) store().setLastCategoryId(patch.categoryId);
  run(label, (d) => ops.updateTemplateBlock(d, templateId, id, patch));
}

export function deleteTemplateBlock(templateId: string, id: string) {
  toastWithUndo(
    "Block deleted",
    run("Delete block", (d) => ops.deleteTemplateBlock(d, templateId, id)),
  );
}

export function duplicateTemplateBlock(templateId: string, id: string) {
  run("Duplicate block", (d) => ops.duplicateTemplateBlock(d, templateId, id, newId()));
}

// ── Templates ──────────────────────────────────────────────────────────────

export function createTemplate(name: string): string | null {
  const id = newId();
  const result = run("New template", (d) =>
    ops.createTemplate(d, { id, name: name.trim() || "Untitled template", blocks: [] }),
  );
  return result.ok ? id : null;
}

export function renameTemplate(id: string, name: string) {
  run("Rename template", (d) => ops.renameTemplate(d, id, name));
}

export function deleteTemplate(id: string) {
  toastWithUndo("Template deleted", run("Delete template", (d) => ops.deleteTemplate(d, id)));
}

export function saveWeekAsTemplate(week: readonly string[], name: string): string | null {
  const id = newId();
  const result = run("Save week as template", (d) =>
    ops.saveWeekAsTemplate(d, week, id, name, newId),
  );
  if (!result.ok) return null;
  toast.success(`Saved “${name.trim()}” as a template`);
  return id;
}

export function applyTemplate(templateId: string, week: readonly string[], mode: "replace" | "add") {
  const result = run(mode === "replace" ? "Replace week with template" : "Apply template", (d) =>
    ops.applyTemplate(d, templateId, week, mode, newId),
  );
  toastWithUndo(mode === "replace" ? "Week replaced with template" : "Template applied", result);
}

// ── Categories ─────────────────────────────────────────────────────────────

export function addCategory() {
  run("Add category", (d) =>
    ops.addCategory(d, { id: newId(), name: "New category", color: nextColor(d.categories) }),
  );
}

export function updateCategory(id: string, patch: ops.CategoryPatch, label = "Edit category") {
  run(label, (d) => ops.updateCategory(d, id, patch));
}

export function deleteCategory(id: string) {
  toastWithUndo("Category deleted", run("Delete category", (d) => ops.deleteCategory(d, id)));
}
