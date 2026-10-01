export interface LayoutSlot {
  column: number;
  columns: number;
}

interface Span {
  id: string;
  start: number;
  end: number;
}

/**
 * Side-by-side layout for overlapping blocks in one day (Google Calendar
 * style). Transitively overlapping blocks form a cluster; each block takes the
 * first column whose previous block has ended, and every block in a cluster
 * shares the cluster's column count.
 */
export function layoutDay(blocks: readonly Span[]): Map<string, LayoutSlot> {
  const result = new Map<string, LayoutSlot>();
  const sorted = [...blocks].sort(
    (a, b) => a.start - b.start || b.end - a.end,
  );
  let cluster: { id: string; column: number }[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const { id, column } of cluster) {
      result.set(id, { column, columns: columnEnds.length });
    }
    cluster = [];
    columnEnds = [];
  };

  for (const block of sorted) {
    if (block.start >= clusterEnd) flush();
    let column = columnEnds.findIndex((end) => end <= block.start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(block.end);
    } else {
      columnEnds[column] = block.end;
    }
    cluster.push({ id: block.id, column });
    clusterEnd = Math.max(clusterEnd, block.end);
  }
  flush();
  return result;
}
