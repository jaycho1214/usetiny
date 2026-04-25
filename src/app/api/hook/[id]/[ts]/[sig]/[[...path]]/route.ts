import { handleWebhook } from "@/features/webhook-inspector/server/handle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string; ts: string; sig: string; path?: string[] }>;
};

async function handle(req: Request, ctx: RouteContext) {
  const { id, ts, sig } = await ctx.params;
  return handleWebhook(req, { id, ts, sig });
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
  handle as HEAD,
  handle as OPTIONS,
};
