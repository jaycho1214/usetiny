// Singleton Map of endpoint id -> set of active SSE controllers.
// Module-level state, in-memory only. Per-process: works on single-instance
// deployments (local dev, single Vercel function instance under low traffic).
// Multi-instance deployments will lose deliveries that cross instances —
// upgrade path is Upstash Redis pub/sub if scale demands it.

type Encoder = TextEncoder;
type Controller = ReadableStreamDefaultController<Uint8Array>;

const subscribers = new Map<string, Set<Controller>>();
const encoder: Encoder = new TextEncoder();

export function subscribe(id: string, controller: Controller): () => void {
  let set = subscribers.get(id);
  if (!set) {
    set = new Set();
    subscribers.set(id, set);
  }
  set.add(controller);
  return () => {
    const s = subscribers.get(id);
    if (!s) return;
    s.delete(controller);
    if (s.size === 0) subscribers.delete(id);
  };
}

export function broadcast(id: string, payload: unknown): number {
  const set = subscribers.get(id);
  if (!set || set.size === 0) return 0;
  const data = encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
  let delivered = 0;
  for (const c of set) {
    try {
      c.enqueue(data);
      delivered++;
    } catch {
      set.delete(c);
    }
  }
  if (set.size === 0) subscribers.delete(id);
  return delivered;
}

export function sendComment(controller: Controller, comment: string): void {
  try {
    controller.enqueue(encoder.encode(`: ${comment}\n\n`));
  } catch {
    // controller closed; no-op
  }
}

export function sendEvent(
  controller: Controller,
  event: string,
  data: unknown,
): void {
  try {
    controller.enqueue(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
    );
  } catch {
    // controller closed; no-op
  }
}
