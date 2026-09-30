import { handleWebhook } from "@/features/webhook-inspector/server/handle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(
  req: Request,
  ctx: RouteContext<"/api/hook/[id]/[ts]/[sig]/[[...path]]">,
) {
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
