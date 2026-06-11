const CACHE = "qt-v1";
const PRECACHE = ["/dashboard", "/journal", "/daily-prep", "/offline"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(["/qtlogo.png"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for navigation, cache-first for assets
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, and API requests
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});

// Push notification handler
self.addEventListener("push", (e) => {
  if (!e.data) return;
  let data;
  try { data = e.data.json(); } catch { data = { title: "QT", body: e.data.text() }; }

  e.waitUntil(
    self.registration.showNotification(data.title ?? "QT Workspace", {
      body: data.body ?? "",
      icon: "/qtlogo.png",
      badge: "/qtlogo.png",
      data: { url: data.url ?? "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? "/dashboard";
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else self.clients.openWindow(url);
    })
  );
});
