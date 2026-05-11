export function computeTabOrder<T extends { id: string; lastEditedAt: number }>(
  tabs: Record<string, T>,
): string[] {
  return Object.values(tabs)
    .sort((a, b) => b.lastEditedAt - a.lastEditedAt)
    .map((tab) => tab.id);
}
