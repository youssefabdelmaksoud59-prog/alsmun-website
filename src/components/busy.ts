"use client";

// Counts server actions in flight on this page. Background refreshes wait while
// any are running, because refreshing the router mid-action can abort the action's request.
let inFlight = 0;

export async function trackBusy<T>(fn: () => Promise<T>): Promise<T> {
  inFlight++;
  try {
    return await fn();
  } finally {
    inFlight--;
  }
}

export function isBusy() {
  return inFlight > 0;
}
