"use server";

import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { signEndpoint, signCookie, verifyCookie } from "./server/signing";

const HOUR_LIMIT = 5;
const DAY_LIMIT = 20;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MINT_COOKIE = "usetiny-wh-mint";

export type CreateEndpointResult = {
  id: string;
  createdAt: number;
  sig: string;
};

export async function createWebhookEndpoint(): Promise<CreateEndpointResult> {
  const now = Date.now();
  const history = await readMintHistory();
  const lastDay = history.filter((t) => now - t < DAY_MS);
  const lastHour = lastDay.filter((t) => now - t < HOUR_MS);

  if (lastHour.length >= HOUR_LIMIT) {
    throw new Error(
      `Rate limit: max ${HOUR_LIMIT} endpoints per hour. Try again later.`,
    );
  }
  if (lastDay.length >= DAY_LIMIT) {
    throw new Error(
      `Rate limit: max ${DAY_LIMIT} endpoints per day. Try again tomorrow.`,
    );
  }

  await writeMintHistory([...lastDay, now]);

  const id = randomUUID();
  const createdAt = now;
  const sig = signEndpoint(id, createdAt);
  return { id, createdAt, sig };
}

async function readMintHistory(): Promise<number[]> {
  const jar = await cookies();
  const raw = jar.get(MINT_COOKIE)?.value;
  if (!raw) return [];
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return [];
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!verifyCookie(payload, sig)) return [];
  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8"),
    );
    if (!Array.isArray(decoded)) return [];
    return decoded.filter((n): n is number => typeof n === "number");
  } catch {
    return [];
  }
}

async function writeMintHistory(timestamps: number[]): Promise<void> {
  const jar = await cookies();
  const payload = Buffer.from(JSON.stringify(timestamps)).toString("base64url");
  const sig = signCookie(payload);
  jar.set(MINT_COOKIE, `${payload}.${sig}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60,
    path: "/",
  });
}
