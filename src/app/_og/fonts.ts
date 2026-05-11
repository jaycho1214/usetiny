import { readFile } from "node:fs/promises";

function loadFont(filename: string) {
  return readFile(new URL(`./fonts/${filename}`, import.meta.url));
}

let geistBlackData: Promise<Buffer> | null = null;
let geistMediumData: Promise<Buffer> | null = null;
let geistMonoMediumData: Promise<Buffer> | null = null;

function geistBlack() {
  return (geistBlackData ??= loadFont("Geist-Black.ttf"));
}

function geistMedium() {
  return (geistMediumData ??= loadFont("Geist-Medium.ttf"));
}

function geistMonoMedium() {
  return (geistMonoMediumData ??= loadFont("GeistMono-Medium.ttf"));
}

export async function loadOgFonts() {
  const [black, medium, mono] = await Promise.all([
    geistBlack(),
    geistMedium(),
    geistMonoMedium(),
  ]);
  return [
    { name: "Geist", data: black, weight: 900, style: "normal" },
    { name: "Geist", data: medium, weight: 500, style: "normal" },
    { name: "Geist Mono", data: mono, weight: 500, style: "normal" },
  ] as const;
}
