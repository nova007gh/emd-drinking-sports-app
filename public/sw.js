const SHELL_CACHE = "emd-shell-v2";
const API_CACHE = "emd-api-v2";
const SHELL = ["/", "/login", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old cache versions
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== API_CACHE)
            .map((k) => caches.delete(k))
        )
      )
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip Next.js HMR and dev resources
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  // API routes: network-first, cache fallback (short TTL)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, copy);
              // Expire API cache after 60 seconds
              setTimeout(() => cache.delete(request), 60000);
            });
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || new Response('{"error":"offline"}', { status: 503, headers: { "Content-Type": "application/json" } })))
    );
    return;
  }

  // Static assets (_next/static): cache-first (immutable)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // App shell & pages: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || caches.match("/"));

      // Return cached immediately if available, otherwise wait for network
      return cached || fetchPromise;
    })
  );
});

// Handle messages from the app (e.g. manual cache clear)
self.addEventListener("message", (event) => {
  if (event.data === "clear-cache") {
    Promise.all([caches.delete(SHELL_CACHE), caches.delete(API_CACHE)]).then(() => {
      event.source?.postMessage({ ok: true });
    });
  }
});
