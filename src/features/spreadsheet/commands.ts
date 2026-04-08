// Centralized Univer command ID registry

export const CMD = {
  // General
  UNDO: "univer.command.undo",
  REDO: "univer.command.redo",

  // Text formatting (toggle)
  BOLD: "sheet.command.set-range-bold",
  ITALIC: "sheet.command.set-range-italic",
  UNDERLINE: "sheet.command.set-range-underline",
  STRIKETHROUGH: "sheet.command.set-range-stroke",

  // Font
  FONT_FAMILY: "sheet.command.set-range-font-family",
  FONT_SIZE: "sheet.command.set-range-fontsize",

  // Color
  TEXT_COLOR: "sheet.command.set-range-text-color",
  RESET_TEXT_COLOR: "sheet.command.reset-range-text-color",
  BG_COLOR: "sheet.command.set-background-color",
  RESET_BG_COLOR: "sheet.command.reset-background-color",

  // Alignment
  H_ALIGN: "sheet.command.set-horizontal-text-align",
  V_ALIGN: "sheet.command.set-vertical-text-align",
  TEXT_WRAP: "sheet.command.set-text-wrap",

  // Cells
  MERGE_ALL: "sheet.command.add-worksheet-merge-all",
  MERGE: "sheet.command.add-worksheet-merge",
  UNMERGE: "sheet.command.remove-worksheet-merge",

  // Border
  BORDER: "sheet.command.set-border-basic",

  // Clipboard
  COPY: "sheet.command.copy",
  CUT: "sheet.command.cut",
  PASTE: "sheet.command.paste",

  // Insert / Delete
  INSERT_ROW_BEFORE: "sheet.command.insert-row-before",
  INSERT_ROW_AFTER: "sheet.command.insert-row-after",
  INSERT_COL_BEFORE: "sheet.command.insert-col-before",
  INSERT_COL_AFTER: "sheet.command.insert-col-after",
  REMOVE_ROW: "sheet.command.remove-row",
  REMOVE_COL: "sheet.command.remove-col",

  // Sheets
  INSERT_SHEET: "sheet.command.insert-sheet",
  REMOVE_SHEET: "sheet.command.remove-sheet-confirm",
  COPY_SHEET: "sheet.command.copy-sheet",
  RENAME_SHEET: "sheet.operation.rename-sheet",

  // Clear
  CLEAR_FORMAT: "sheet.command.clear-selection-format",
  CLEAR_CONTENT: "sheet.command.clear-selection-content",
  CLEAR_ALL: "sheet.command.clear-selection-all",
} as const;

export const H_ALIGN = { LEFT: 1, CENTER: 2, RIGHT: 3 } as const;

export const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Impact",
  "Comic Sans MS",
];

export const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 36, 48, 72,
];

export const COLORS = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#B7B7B7",
  "#D9D9D9",
  "#FFFFFF",
  "#E06666",
  "#F6B26B",
  "#FFD966",
  "#93C47D",
  "#76A5AF",
  "#6FA8DC",
  "#8E7CC3",
  "#C27BA0",
  "#CC0000",
  "#E69138",
  "#F1C232",
  "#6AA84F",
  "#45818E",
  "#3D85C6",
  "#674EA7",
  "#A64D79",
  "#990000",
  "#B45F06",
  "#BF9000",
  "#38761D",
  "#134F5C",
  "#0B5394",
  "#351C75",
  "#741B47",
];
