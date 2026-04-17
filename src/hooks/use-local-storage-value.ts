import { useSyncExternalStore } from "react";

const SSR_SENTINEL = "__ssr__";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function getServerSnapshot() {
  return SSR_SENTINEL;
}

export function useLocalStorageValue(key: string): string {
  return useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) ?? "",
    getServerSnapshot,
  );
}

export const LOCAL_STORAGE_SSR_SENTINEL = SSR_SENTINEL;
