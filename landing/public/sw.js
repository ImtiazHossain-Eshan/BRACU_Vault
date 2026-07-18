/* BRACU Vault service worker — offline shell + smart caching.
 * Bump VERSION to invalidate the app shell (static + pages) on deploy.
 * The opened-files cache is kept stable across versions (LRU-trimmed) so
 * material you've viewed stays available offline through app updates. */
const VERSION = "v1";
const STATIC_CACHE = `static-${VERSION}`;
const PAGE_CACHE = `pages-${VERSION}`;
const FILE_CACHE = "files"; // version-independent (LRU)
const FILE_MAX = 30; // keep the last ~30 opened files
const FILE_MAX_BYTES = 20 * 1024 * 1024; // don't cache files > 20 MB

const PRECACHE = ["/offline.html", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          // drop old shell caches; keep the current ones + the LRU file cache
          .filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE && k !== FILE_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

const isStatic = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/icons") ||
  /\.(?:js|css|woff2?|png|jpe?g|svg|webp|avif|mjs)$/.test(url.pathname);

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys(); // insertion order → oldest first
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

// cache-first with LRU — used for opened vault files (PDFs, code, etc.)
async function fileStrategy(req) {
  const cache = await caches.open(FILE_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  const len = Number(res.headers.get("content-length") || 0);
  if (res.ok && (len === 0 || len <= FILE_MAX_BYTES)) {
    cache.put(req, res.clone());
    trimCache(FILE_CACHE, FILE_MAX);
  }
  return res;
}

// network-first with cache fallback — fresh data, but works offline
async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || Response.error();
  }
}

// stale-while-revalidate — instant from cache, refresh in background
async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const fetching = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || fetching;
}

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // skip cross-origin

  // app pages — network-first, fall back to cache, then the offline shell
  if (request.mode === "navigate") {
    e.respondWith(
      networkFirst(request, PAGE_CACHE).then(
        (r) => (r && r.ok ? r : caches.match("/offline.html")),
        () => caches.match("/offline.html")
      )
    );
    return;
  }

  // opened files (real vault) — cache-first + LRU so they read offline
  if (url.pathname.startsWith("/api/file")) {
    e.respondWith(fileStrategy(request));
    return;
  }

  // search / listings — fresh when online, cached when not
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  // hashed/static assets — instant from cache, revalidate quietly
  if (isStatic(url)) {
    e.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }
});

/* ---- push notifications (optional, needs a server with VAPID keys) ------- */
self.addEventListener("push", (e) => {
  let data = { title: "BRACU Vault", body: "New material is available." };
  try {
    if (e.data) data = { ...data, ...e.data.json() };
  } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/maskable-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const open = clients.find((c) => "focus" in c);
      if (open) return open.focus();
      return self.clients.openWindow(target);
    })
  );
});
