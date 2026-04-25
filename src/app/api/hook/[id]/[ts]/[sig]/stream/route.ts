import { NextResponse } from "next/server";
import { verifyEndpoint } from "@/features/webhook-inspector/server/signing";
import {
  sendComment,
  sendEvent,
  subscribe,
} from "@/features/webhook-inspector/server/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEARTBEAT_MS = 25_000;

type RouteContext = {
  params: Promise<{ id: string; ts: string; sig: string }>;
};

export async function GET(req: Request, ctx: RouteContext) {
  const { id, ts, sig } = await ctx.params;
  const createdAt = Number(ts);
  if (!Number.isFinite(createdAt) || !verifyEndpoint(id, createdAt, sig)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      sendEvent(controller, "hello", { id });
      const unsubscribe = subscribe(id, controller);
      const heartbeat = setInterval(
        () => sendComment(controller, "ping"),
        HEARTBEAT_MS,
      );
      const onAbort = () => cleanup?.();

      cleanup = () => {
        cleanup = null;
        clearInterval(heartbeat);
        unsubscribe();
        req.signal.removeEventListener("abort", onAbort);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
      req.signal.addEventListener("abort", onAbort);
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
