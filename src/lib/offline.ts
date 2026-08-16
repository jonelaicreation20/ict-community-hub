"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { MODULES, modulePath, type Module } from "./modules";

/** Cache the service worker also writes into, so both paths agree. */
export const PDF_CACHE = "esmmap-pdfs-v1";

function subscribeToConnectivity(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Connectivity as an external store rather than effect-driven state. Reading
 * `navigator.onLine` in an effect leaves the first client render claiming
 * "online" even when the device is not, which is long enough for a sync pass
 * to run and wrongly mark queued results as sent.
 */
export function useOnline() {
  return useSyncExternalStore(
    subscribeToConnectivity,
    () => navigator.onLine,
    () => true, // Server render: assume online, corrected on hydration.
  );
}

async function readSavedSlugs(): Promise<string[]> {
  if (typeof caches === "undefined") return [];
  const cache = await caches.open(PDF_CACHE);
  const keys = await cache.keys();
  const saved = new Set(keys.map((r) => new URL(r.url).pathname));
  return MODULES.filter((m) => saved.has(modulePath(m))).map((m) => m.slug);
}

/** Which module PDFs are already on the device. */
export function useSavedModules() {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const refresh = async () => {
    setSaved(new Set(await readSavedSlugs()));
    setReady(true);
  };

  useEffect(() => {
    let cancelled = false;
    void readSavedSlugs()
      .then((slugs) => {
        if (cancelled) return;
        setSaved(new Set(slugs));
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { saved, ready, refresh };
}

export async function isSaved(m: Module) {
  if (typeof caches === "undefined") return false;
  const cache = await caches.open(PDF_CACHE);
  return Boolean(await cache.match(modulePath(m)));
}

export async function saveModule(m: Module) {
  const cache = await caches.open(PDF_CACHE);
  if (await cache.match(modulePath(m))) return true;
  try {
    await cache.add(modulePath(m));
    return true;
  } catch {
    return false;
  }
}

/** Saves every module that is not already cached, reporting progress as it goes. */
export async function saveAllModules(onProgress: (done: number, total: number) => void) {
  const cache = await caches.open(PDF_CACHE);
  const pending: Module[] = [];
  for (const m of MODULES) {
    if (!(await cache.match(modulePath(m)))) pending.push(m);
  }

  let done = 0;
  onProgress(0, pending.length);
  for (const m of pending) {
    await saveModule(m);
    done += 1;
    onProgress(done, pending.length);
  }
  return pending.length;
}
