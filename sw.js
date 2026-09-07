/*
 * Busy Bee Pro — service worker
 *
 * Strategy:
 *  - App shell (this app's own files) is precached on install, so the app opens offline.
 *  - HTML pages use "network-first, falling back to cache" — when you're online you always
 *    get the latest version; when you're offline you get the last cached copy instead of
 *    a browser error page.
 *  - Everything else (fonts, CDN scripts/styles, images) uses "cache-first, falling back to
 *    network", and successful network responses are stored for next time.
 *
 * Bump CACHE_VERSION whenever you change any of the precached files below and want visitors
 * to pick up the new copies (old caches are cleaned up automatically on activate).
 */

const CACHE_VERSION = "v1";
const CACHE_NAME = "busybee-" + CACHE_VERSION;

// Same-origin app shell — the three pages plus their installable assets.
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./markdown-viewer.html",
  "./world-clock.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache each file independently so one failure (e.g. offline during first install)
      // doesn't abort caching the rest of the app shell.
      return Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name.startsWith("busybee-") && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

function isHTMLRequest(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" && request.headers.get("accept") && request.headers.get("accept").includes("text/html"))
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return; // never intercept POST/PUT/etc.

  if (isHTMLRequest(request)) {
    // Network-first for pages, so a deployed update is picked up immediately when online.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("./index.html"))
        )
    );
    return;
  }

  // Cache-first for everything else (fonts, CDN JS/CSS, images).
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Only cache successful, cacheable responses (includes opaque cross-origin ones).
          if (response && (response.ok || response.type === "opaque")) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached); // undefined if we truly have nothing — caller sees a network error
    })
  );
});
