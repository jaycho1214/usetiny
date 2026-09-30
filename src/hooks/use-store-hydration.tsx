import { useLayoutEffect, useState } from "react";

/**
 * Any Zustand store wrapped in `persist` with `skipHydration: true`.
 * Typed structurally so stores that use `partialize` (persisted shape ≠
 * store shape) are accepted without casts.
 */
type PersistedStore = {
  persist: { rehydrate: () => Promise<void> | void };
};

export function useStoreHydration(store: PersistedStore) {
  const [hydrated, setHydrated] = useState(false);
  useLayoutEffect(() => {
    Promise.resolve(store.persist.rehydrate()).finally(() => {
      setHydrated(true);
    });
  }, [store]);
  return hydrated;
}
