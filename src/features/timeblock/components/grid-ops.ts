import * as actions from "../actions";
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
