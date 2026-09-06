const CACHE = "qt-v3";
const OFFLINE_URL = "/offline";

/**
 * Offline veri politikasi (acikca yazilmistir, cunku sessiz varsayimi bir
 * gizlilik sorunu uretmisti):
 *
 * Cache YALNIZCA kullanicidan bagimsiz statik varliklari tutar — logo, offline
 * ekrani, /public altindaki dosyalar. Kimlik dogrulamali sayfa yanitlari
 * (dashboard, journal, prep...) HIC cache'lenmez.
 *
 * Sebep: cache tek ve ortak. Once her basarili "basic" yanit yaziliyordu, yani
 * ortak bir cihazda ikinci hesap, baglanti koptugunda birincinin daha once
 * goruntuledigi sayfayi geri servis edilmis halde gorebiliyordu. Cikista da
 * temizlenmiyordu.
 *
 * Cevrimdisi navigasyonda artik kullaniciya ait icerik degil, /offline ekrani
 * gosterilir. Bayat bir sayfayi guncel sanmak, hicbir sey gormemekten kotudur.
 */
const CACHEABLE_PATHS = [OFFLINE_URL];

/** Kullanicidan bagimsiz statik varlik mi? */
function isPublicAsset(url) {
  if (CACHEABLE_PATHS.includes(url.pathname)) return true;
  return /\.(png|jpg|jpeg|svg|webp|ico|woff2?|ttf|css)$/i.test(url.pathname);
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(["/qtlogo.png", OFFLINE_URL]))
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

  const cacheable = isPublicAsset(url);

  e.respondWith(
    fetch(request)
      .then((res) => {
        // Yalnizca statik varliklar yazilir; kimlik dogrulamali sayfa yanitlari
        // asla cache'e girmez.
        if (cacheable && res.ok && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(async () => {
        if (cacheable) {
          const cached = await caches.match(request);
          if (cached) return cached;
        }
        // Cevrimdisi navigasyon: kullaniciya ait bayat sayfa yerine offline
        // ekrani. Tarayicinin kendi hata sayfasindan da iyi.
        if (request.mode === "navigate") {
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
        }
        return Response.error();
      })
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
