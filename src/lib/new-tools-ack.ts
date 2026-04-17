export const SEEN_AT_STORAGE_KEY = "usetiny-new-tools-seen-at";

export function getSeenAt(): number {
  try {
    const raw = localStorage.getItem(SEEN_AT_STORAGE_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function markAllNewToolsSeen() {
  try {
    localStorage.setItem(SEEN_AT_STORAGE_KEY, String(Date.now()));
    // Native `storage` event only fires in other tabs; dispatch synthetically
    // so same-tab useSyncExternalStore subscribers update immediately.
    window.dispatchEvent(
      new StorageEvent("storage", { key: SEEN_AT_STORAGE_KEY }),
    );
  } catch {
    // localStorage full or unavailable
  }
}
