"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Hydration-safe "has the client taken over yet?" — false during SSR and
 * hydration, true immediately after. Lets components derive values from
 * localStorage or the clock at render time without a setState-in-effect.
 */
export function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
