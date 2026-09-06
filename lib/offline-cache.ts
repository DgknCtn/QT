/**
 * Service worker cache'inin uygulama tarafındaki kontrolü.
 *
 * Service worker başarılı sayfa yanıtlarını ortak bir cache'e yazıyordu ve
 * çıkış bunu temizlemiyordu. Ortak bir cihazda ikinci bir hesap, bağlantı
 * koptuğunda birincinin daha önce görüntülediği sayfaları geri servis
 * edilmiş halde görebilirdi.
 *
 * Politika: kimlik doğrulamalı sayfalar hiç cache'lenmez (bkz. public/sw.js),
 * ve çıkışta ne kaldıysa silinir.
 */
export async function clearAppCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {
    // Cache API yoksa veya erisim reddedildiyse silinecek bir sey de yoktur.
  }
}
