import * as actions from "../actions";
import type { Weekday } from "../types";
import type { GridOps } from "./grid-types";

export function createWeekOps(dates: readonly string[]): GridOps {
  return {
    create(col, start, end) {
      const id = actions.newId();
      const ok = actions.addBlock(dates, dates[col], {
        id,
        title: "",
        categoryId: actions.defaultCategoryId(),
        start,
        end,
        status: "planned",
      });
      return ok ? id : null;
    },
    update: (col, id, patch, label) => actions.updateBlock(dates[col], id, patch, label),
    move: (fromCol, id, toCol, start, end) =>
      actions.moveBlock(dates[fromCol], id, dates[toCol], start, end),
    remove: (col, id) => actions.deleteBlock(dates[col], id),
    duplicate: (col, id) => actions.duplicateBlock(dates, dates[col], id),
  };
}

export function createTemplateOps(templateId: string, weekdays: readonly Weekday[]): GridOps {
  return {
    create(col, start, end) {
      const id = actions.newId();
      const ok = actions.addTemplateBlock(templateId, {
        id,
        title: "",
        categoryId: actions.defaultCategoryId(),
        start,
        end,
        weekday: weekdays[col],
      });
      return ok ? id : null;
    },
    // Template blocks have no status.
    update: (_col, id, { status: _, ...patch }, label) =>
      actions.updateTemplateBlock(templateId, id, patch, label),
    move: (_fromCol, id, toCol, start, end) =>
      actions.updateTemplateBlock(templateId, id, { weekday: weekdays[toCol], start, end }, "Move block"),
    remove: (_col, id) => actions.deleteTemplateBlock(templateId, id),
    duplicate: (_col, id) => actions.duplicateTemplateBlock(templateId, id),
  };
}
