import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { verifyEndpoint } from "./signing";
import { broadcast } from "./subscribers";

const MAX_BODY_BYTES = 256 * 1024;

export async function handleWebhook(
  req: Request,
  params: { id: string; ts: string; sig: string },
) {
  const { id, ts, sig } = params;
  const createdAt = Number(ts);
  if (!Number.isFinite(createdAt) || !verifyEndpoint(id, createdAt, sig)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const url = new URL(req.url);
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const contentType = req.headers.get("content-type") ?? "";
  let bodyText: string | undefined;
  let bodyBase64: string | undefined;
  let size = 0;

  const methodHasBody =
    req.body !== null && req.method !== "HEAD" && req.method !== "OPTIONS";
  if (methodHasBody) {
    const buf = await readBoundedBuffer(req, MAX_BODY_BYTES);
    size = buf.byteLength;
    if (size > 0) {
      if (looksTextual(contentType)) {
        try {
          bodyText = new TextDecoder("utf-8", { fatal: true }).decode(buf);
        } catch {
          bodyBase64 = Buffer.from(buf).toString("base64");
        }
      } else {
        bodyBase64 = Buffer.from(buf).toString("base64");
      }
    }
  }

  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const prefix = `/api/hook/${id}/${ts}/${sig}`;
  const path = url.pathname.startsWith(prefix)
    ? url.pathname.slice(prefix.length) || "/"
    : url.pathname;

  const captured = {
    id: randomUUID(),
    receivedAt: Date.now(),
    method: req.method,
    path,
    rawPath: url.pathname,
    query,
    headers,
    contentType,
    size,
    bodyText,
    bodyBase64,
    truncated: size >= MAX_BODY_BYTES,
  };

  broadcast(id, captured);
  return NextResponse.json({ ok: true });
}

function looksTextual(contentType: string): boolean {
  if (!contentType) return true;
  const ct = contentType.toLowerCase();
  return (
    ct.startsWith("text/") ||
    ct.includes("json") ||
    ct.includes("xml") ||
    ct.includes("javascript") ||
    ct.includes("urlencoded") ||
    ct.includes("form-data")
  );
}

async function readBoundedBuffer(
  req: Request,
  max: number,
): Promise<Uint8Array> {
  if (!req.body) return new Uint8Array(0);
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    const remaining = max - total;
    if (remaining <= 0) {
      try {
        await reader.cancel();
      } catch {}
      break;
    }
    if (value.byteLength > remaining) {
      chunks.push(value.subarray(0, remaining));
      total += remaining;
      try {
        await reader.cancel();
      } catch {}
      break;
    }
    chunks.push(value);
    total += value.byteLength;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}
