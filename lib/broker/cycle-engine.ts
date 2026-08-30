/**
 * Broker fill'lerinden round-trip pozisyon çıkarma motoru.
 *
 * Broker export'ları işlem değil *dolum* (fill) satırı verir: "SOL short açtım,
 * şuradan kapattım" bilgisi dosyada yoktur. Bir pozisyon, net miktarın 0'dan
 * çıktığı anda başlar ve 0'a döndüğü anda biter — aradaki tüm fill'ler
 * (piramitleme, kısmi kapanış) o pozisyona aittir. Bu yürüyüş Tradovate ve
 * Binance parser'larının ortak çekirdeği.
 */

export type BaseFill = {
  side: "Buy" | "Sell";
  qty: number;
  time: Date;
};

export type FlatToFlatResult<T> = {
  /** Flat'tan flat'a tamamlanmış pozisyonlar, kronolojik. */
  cycles: T[][];
  /** Dosya bittiğinde hâlâ açık olan pozisyonun fill'leri. */
  leftover: T[];
};

/**
 * Miktar karşılaştırma toleransı.
 *
 * `position === 0` ile kıyaslamak vadeli kontratlarda (tam sayı adet) çalışır
 * ama kriptoda çalışmaz: 0.881 gibi ondalıklı miktarlar toplanıp çıkarıldığında
 * float kayması bırakır (0.881 - 0.403 - 0.478 === 0 yanlıştır), ve pozisyon
 * asla "kapandı" sayılmaz. Tolerans en küçük fill'e göre ölçeklenir, böylece
 * hem 1 kontratlık NQ'da hem 0.006 ZEC'te doğru davranır.
 */
function flatEpsilon(fills: BaseFill[]): number {
  let smallest = Infinity;
  for (const f of fills) if (f.qty > 0 && f.qty < smallest) smallest = f.qty;
  if (!Number.isFinite(smallest)) return 1e-9;
  return Math.max(smallest * 1e-6, 1e-9);
}

/**
 * Tek bir enstrümanın fill'lerini kronolojik yürüyüp flat→flat pozisyonlara böler.
 *
 * Girdi tek bir gruba (hesap + sembol) ait olmalıdır; farklı sembolleri
 * karıştırmak net pozisyonu anlamsız kılar. Fill'ler burada sıralanır,
 * çağıranın sıralamış olması gerekmez.
 */
export function walkFlatToFlat<T extends BaseFill>(fills: T[]): FlatToFlatResult<T> {
  const sorted = [...fills].sort((a, b) => a.time.getTime() - b.time.getTime());
  const eps = flatEpsilon(sorted);

  const cycles: T[][] = [];
  let position = 0;
  let cycle: T[] = [];

  for (const f of sorted) {
    cycle.push(f);
    position += f.side === "Buy" ? f.qty : -f.qty;

    if (Math.abs(position) < eps) {
      cycles.push(cycle);
      cycle = [];
      position = 0; // biriken float kaymasını sıfırla, sonraki pozisyona taşınmasın
    }
  }

  return { cycles, leftover: cycle };
}

/** Bir pozisyonun açılış yönü — ilk fill'in yönü belirler. */
export function cycleDirection(cycle: BaseFill[]): "LONG" | "SHORT" {
  return cycle[0].side === "Buy" ? "LONG" : "SHORT";
}

/**
 * Pozisyonun ortalama giriş/çıkış fiyatı, miktarı ve zaman aralığı.
 *
 * Açılış yönündeki fill'ler giriş, karşı yöndekiler çıkış sayılır; fiyatlar
 * miktara göre ağırlıklı ortalanır.
 */
export function summarizeCycle<T extends BaseFill & { price: number }>(cycle: T[]) {
  const openingSide = cycle[0].side;
  const opening = cycle.filter((f) => f.side === openingSide);
  const closing = cycle.filter((f) => f.side !== openingSide);

  const entryQty = opening.reduce((s, f) => s + f.qty, 0);
  const exitQty = closing.reduce((s, f) => s + f.qty, 0);
  const quantity = Math.min(entryQty, exitQty) || entryQty || exitQty;

  const entryPrice = entryQty > 0
    ? opening.reduce((s, f) => s + f.price * f.qty, 0) / entryQty
    : cycle[0].price;
  const exitPrice = exitQty > 0
    ? closing.reduce((s, f) => s + f.price * f.qty, 0) / exitQty
    : cycle[0].price;

  const entryTime = new Date(Math.min(...opening.map((f) => f.time.getTime())));
  const exitTime = new Date(Math.max(...closing.map((f) => f.time.getTime()), entryTime.getTime()));

  return {
    direction: cycleDirection(cycle),
    opening,
    closing,
    quantity,
    entryPrice,
    exitPrice,
    entryTime,
    exitTime,
    durationSec: Math.max(0, Math.round((exitTime.getTime() - entryTime.getTime()) / 1000)),
  };
}
