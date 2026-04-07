const STORAGE_KEY = "usetiny-recent-tools";

type RecentMap = Record<string, number>;

function read(): RecentMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(map: RecentMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage full or unavailable
  }
}

export function recordVisit(href: string) {
  const map = read();
  map[href] = Date.now();
  write(map);
}

export function getRecentOrder(): string[] {
  const map = read();
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .map(([href]) => href);
}
