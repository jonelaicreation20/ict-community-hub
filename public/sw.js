/**
 * E-SMMAp service worker.
 *
 * Two caches with deliberately different policies:
 *   shell  — the app itself, precached on install so a cold start with no
 *            signal still boots. Updated on activate.
 *   pdfs   — module PDFs, ~7 MB in total. Cached the first time a student
 *            opens one (or in bulk from "Save all for offline"), never
 *            precached, so a first load on mobile data stays small.
 */
const VERSION = "v3";
const SHELL = `esmmap-shell-${VERSION}`;
const PDFS = "esmmap-pdfs-v1";

// Routes are trailing-slash (next.config.ts), so each is its own index.html.
const SHELL_URLS = [
  "/",
  "/modules/",
  "/quizzes/",
  "/results/",
  "/manifest.webmanifest",
  "/assets/Bgremake.png",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then(async (cache) => {
      // addAll fails the whole install if any single URL 404s; add
      // individually so one missing asset cannot break offline support.
      await Promise.all(SHELL_URLS.map((url) => cache.add(url).catch(() => {})));
      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith("esmmap-shell-") && n !== SHELL).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // App bundles: prefer the newest UI when connected, but keep the cached
  // copy as an offline fallback. This also prevents an old stylesheet from
  // surviving a pilot update.
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      caches.open(SHELL).then(async (cache) => {
        try {
          const res = await fetch(request);
          if (res.ok) await cache.put(request, res.clone());
          return res;
        } catch {
          return (await cache.match(request)) || Response.error();
        }
      }),
    );
    return;
  }

  // PDFs: serve from cache when present, otherwise fetch and keep a copy.
  if (url.pathname.startsWith("/assets/") && url.pathname.endsWith(".pdf")) {
    event.respondWith(
      caches.open(PDFS).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) await cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  // Navigations: network first so students get updates, cache as the fallback
  // that makes a cold offline start work at all.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          const cache = await caches.open(SHELL);
          cache.put(request, res.clone());
          return res;
        } catch {
          return (await caches.match(request)) || (await caches.match("/")) || Response.error();
        }
      })(),
    );
    return;
  }

  // Everything else (JS, CSS, images): cache first, they are content-hashed.
  event.respondWith(
    caches.open(SHELL).then(async (cache) => {
      const hit = await cache.match(request);
      if (hit) return hit;
      try {
        const res = await fetch(request);
        if (res.ok) await cache.put(request, res.clone());
        return res;
      } catch {
        return hit || Response.error();
      }
    }),
  );
});
