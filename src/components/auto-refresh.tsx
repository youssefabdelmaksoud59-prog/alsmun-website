"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isBusy } from "./busy";

/** Refreshes server data periodically while the tab is visible, so lists stay live during sessions. */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    let last = Date.now();
    let hiddenAt = 0;
    const refresh = () => {
      // Skip while the user is typing or an action is saving, so nothing they are doing gets interrupted.
      const active = document.activeElement;
      const typing = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement;
      if (isBusy() || typing) return;
      last = Date.now();
      router.refresh();
    };
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - last >= seconds * 1000) refresh();
    }, 5000);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 5000) refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, seconds]);
  return null;
}
