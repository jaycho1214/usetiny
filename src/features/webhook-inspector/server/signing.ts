import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = (() => {
  const s = process.env.WEBHOOK_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "WEBHOOK_SECRET env var is missing or too short. Generate one with `openssl rand -base64 32`.",
    );
  }
  return s;
})();

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function signEndpoint(id: string, createdAt: number): string {
  return sign(`endpoint.${id}.${createdAt}`);
}

export function verifyEndpoint(
  id: string,
  createdAt: number,
  sig: string,
): boolean {
  return safeEqual(sig, signEndpoint(id, createdAt));
}

export function signCookie(payload: string): string {
  return sign(`cookie.${payload}`);
}

export function verifyCookie(payload: string, sig: string): boolean {
  return safeEqual(sig, signCookie(payload));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
