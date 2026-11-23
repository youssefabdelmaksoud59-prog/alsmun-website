"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during server render and hydration, true once React is interactive.
 * Action buttons stay disabled until then, because a server action fired before
 * the router has hydrated can be left waiting forever.
 */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
