"use client";

import { useEffect } from "react";

/** Registers the service worker in production only. */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* Installability is optional; the app works without a service worker. */
    });
  }, []);
  return null;
}
