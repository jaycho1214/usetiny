"use client";

import { useSyncExternalStore } from "react";

interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: { platform?: string };
}

function getIsMac() {
  const nav = navigator as NavigatorWithUserAgentData;
  return (
    nav.userAgentData?.platform?.toLowerCase().includes("mac") ??
    nav.platform?.toLowerCase().includes("mac") ??
    false
  );
}

const subscribe = () => () => {}; // platform never changes

export function useIsMac() {
  return useSyncExternalStore(subscribe, getIsMac, () => false);
}
