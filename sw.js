/*
 * Busy Bee Pro — service worker
 *
 * Strategy:
 *  - App shell (this app's own files) is precached on install, so the app opens offline.
 *  - HTML pages use "network-first, falling back to cache" — when you're online you always
 *    get the latest version; when you're offline you get the last cached copy instead of
 *    a browser error page.
 *  - "Live data" endpoints (World Clock's time-sync + weather calls) are NETWORK-ONLY and
 *    NEVER cached, at any point, under any circumstance — see isLiveDataRequest() below.
 *  - Everything else (fonts, CDN scripts/styles, images) uses "cache-first, falling back to
 *    network", and successful network responses are stored for next time.
 *
 * Bump CACHE_VERSION whenever you change any of the precached files below and want visitors
 * to pick up the new copies (old caches are cleaned up automatically on activate).
 */

const CACHE_VERSION = "v10";
const CACHE_NAME = "busybee-" + CACHE_VERSION;

// Same-origin app shell — the three pages plus their installable assets.
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./markdown-viewer.html",
  "./world-clock.html",
  "./pdf-viewer.html",
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

// A request should be network-first if it's a top-level navigation OR any same-origin
// ".html" document (this crucially includes the Markdown Viewer / World Clock loaded in
// iframes, whose requests don't always carry a "navigate" mode or a text/html accept header).
// Network-first means a fresh deploy is always picked up when online, so an HTML page can
// never get "stuck" on a stale cached copy the way a cache-first asset would.
function isPageRequest(request) {
  if (request.mode === "navigate") return true;
  var accept = request.headers.get("accept");
  if (request.method === "GET" && accept && accept.indexOf("text/html") !== -1) return true;
  try {
    var url = new URL(request.url);
    if (url.origin === self.location.origin) {
      var path = url.pathname;
      if (path === "/" || path.endsWith("/") || /\.html?$/i.test(path)) return true;
    }
  } catch (e) {}
  return false;
}

// "Live data" endpoints: World Clock's time-sync sources and its weather lookup. These must
// ALWAYS hit the network fresh — caching them even once means every future call silently
// replays that first stale response forever (this was the actual cause of World Clock
// appearing "stuck" on an old date/time: its Cloudflare time-sync call got cache-first'd on
// its very first successful fetch, and never touched the network again after that).
const LIVE_DATA_HOSTS = [
  "www.cloudflare.com",   // cdn-cgi/trace time sync
  "timeapi.io",           // time sync fallback
  "worldtimeapi.org",     // time sync fallback
  "api.open-meteo.com"    // World Clock weather
];
function isLiveDataRequest(request) {
  try {
    var host = new URL(request.url).hostname;
    return LIVE_DATA_HOSTS.indexOf(host) !== -1;
  } catch (e) {
    return false;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return; // never intercept POST/PUT/etc.

  if (isLiveDataRequest(request)) {
    // Pure network passthrough: never read from or write to any cache. If you're offline
    // this simply fails, which World Clock already handles gracefully (falls back to the
    // device clock / shows "—" for weather) rather than silently showing stale data.
    event.respondWith(fetch(request));
    return;
  }

  if (isPageRequest(request)) {
    // Network-first for pages, so a deployed update is picked up immediately when online.
    // Falls back to the cached copy of *this same page* when offline — never substitutes a
    // different page (an offline World Clock iframe should show the cached World Clock, not
    // the whole app shell).
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached ||
            (request.mode === "navigate" ? caches.match("./index.html") : undefined))
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
