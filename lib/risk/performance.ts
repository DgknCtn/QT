/**
 * Teşhis metrikleri.
 *
 * Uygulama bugüne kadar kazanma oranı ve ortalama R gösteriyordu. İkisi de
 * gerçek verideki sorunu görünmez kılıyor: kazanma oranı %65 iken hesap
 * eriyordu, çünkü ortalama kazanç +12.92, ortalama kayıp −30.92 idi.
 * Kazanma oranı tek başına yanıltıcı — buradaki metrikler eksik olan yarıyı
 * söylüyor.
 */

export type PerfTrade = {
  netPnl: number | null;
  exitTime: Date;
  /**
   * Pozisyonun acilis ani. `computeAfterLoss` icin zorunlu: "kayiptan sonra
   * acilan islem" ancak acilis anina bakilarak soylenebilir.
   */
  entryTime?: Date;
};

export type Performance = {
  count: number;
  wins: number;
  losses: number;
  /** Kazanma oranı (0–1). Sonuçlanmış işlem yoksa null. */
  winRate: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  /**
   * Payoff oranı = ortalama kazanç / |ortalama kayıp|.
   * 1'in altı, kazanma oranının bunu telafi etmesi gerektiği anlamına gelir.
   */
  payoff: number | null;
  /** İşlem başına beklenen değer. Negatifse sistem para kaybettiriyor. */
  expectancy: number | null;
  totalPnl: number;
  /** Kâr faktörü = toplam kazanç / |toplam kayıp|. */
  profitFactor: number | null;
  /** Dönem içindeki en uzun kesintisiz kayıp serisi. */
  maxConsecutiveLosses: number;
  /** En kötü tek işlem. */
  worstTrade: number | null;
  /** En kötü 5 işlemin toplamı — yoğunlaşmayı gösterir. */
  worst5Sum: number;
  /**
   * Kazanma oranının başabaş için gerekli olan değeri: 1 / (1 + payoff).
   * Gerçek kazanma oranı bunun altındaysa sistem matematiksel olarak kaybeder.
   */
  breakEvenWinRate: number | null;
};

const EMPTY: Performance = {
  count: 0, wins: 0, losses: 0, winRate: null,
  avgWin: null, avgLoss: null, payoff: null, expectancy: null,
  totalPnl: 0, profitFactor: null, maxConsecutiveLosses: 0,
  worstTrade: null, worst5Sum: 0, breakEvenWinRate: null,
};

export function computePerformance(trades: PerfTrade[]): Performance {
  const decided = trades.filter((t) => t.netPnl != null) as { netPnl: number; exitTime: Date }[];
  if (decided.length === 0) return EMPTY;

  const wins = decided.filter((t) => t.netPnl > 0);
  const losses = decided.filter((t) => t.netPnl < 0);

  const sum = (xs: { netPnl: number }[]) => xs.reduce((s, t) => s + t.netPnl, 0);
  const totalPnl = sum(decided);
  const grossWin = sum(wins);
  const grossLoss = Math.abs(sum(losses));

  const avgWin = wins.length ? grossWin / wins.length : null;
  const avgLoss = losses.length ? -grossLoss / losses.length : null; // negatif kalır

  const payoff = avgWin != null && avgLoss != null && avgLoss !== 0
    ? avgWin / Math.abs(avgLoss)
    : null;

  // En uzun kayıp serisi — kronolojik sırada.
  const chrono = [...decided].sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime());
  let streak = 0;
  let maxStreak = 0;
  for (const t of chrono) {
    if (t.netPnl < 0) { streak++; maxStreak = Math.max(maxStreak, streak); }
    else streak = 0;
  }

  const sorted = [...decided].sort((a, b) => a.netPnl - b.netPnl);

  return {
    count: decided.length,
    wins: wins.length,
    losses: losses.length,
    winRate: decided.length ? wins.length / decided.length : null,
    avgWin,
    avgLoss,
    payoff,
    expectancy: totalPnl / decided.length,
    totalPnl,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : null,
    maxConsecutiveLosses: maxStreak,
    worstTrade: sorted[0]?.netPnl ?? null,
    worst5Sum: sorted.slice(0, 5).reduce((s, t) => s + t.netPnl, 0),
    breakEvenWinRate: payoff != null && payoff > 0 ? 1 / (1 + payoff) : null,
  };
}

/**
 * Bir kaybın **gerçekleşmesinden sonra açılan** işlemlerin ortalaması.
 *
 * İntikam trade'i sezgisel bir kavram değil, ölçülebilir bir şey: gerçek
 * veride $50 üstü bir kayıptan sonraki işlemin ortalaması −39.11'di,
 * genel ortalama −2.95 iken.
 *
 * Ölçümün doğru kalması için iki kural:
 *
 * 1. Sıralama kapanışa göreydi ve "sonraki" işlem, ilk kayıp daha
 *    gerçekleşmeden açılmış olabiliyordu — üst üste binen iki pozisyonda
 *    ikincisi ilkinin sonucuna tepki olamaz. Artık `entryTime`, önceki
 *    işlemin `exitTime`'ından sonra olmak zorunda.
 * 2. Aradan saatler geçmişse bu bir tepki değil, yeni bir karardır.
 *    `maxGapMin` penceresi dışındaki işlemler sayılmaz.
 *
 * `entryTime` bilinmeyen işlemler sessizce dahil edilmez; kaç tanesinin
 * doğrulanamadığı `unverifiable` ile döner ki arayüz eksik veriyi
 * kesinmiş gibi göstermesin.
 */
export function computeAfterLoss(trades: PerfTrade[], lossThreshold = 50, maxGapMin = 240) {
  const chrono = (trades.filter((t) => t.netPnl != null) as (PerfTrade & { netPnl: number })[])
    .sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime());

  const after: number[] = [];
  let unverifiable = 0;

  for (let i = 1; i < chrono.length; i++) {
    if (chrono[i - 1].netPnl > -lossThreshold) continue;

    const entry = chrono[i].entryTime;
    if (!entry) {
      // Acilis ani bilinmiyor: dahil etmek de dislamak da varsayim olur.
      // Saymiyoruz ama sayiyi kaybetmiyoruz.
      unverifiable++;
      continue;
    }

    const lossAt = chrono[i - 1].exitTime.getTime();
    const gapMin = (entry.getTime() - lossAt) / 60_000;
    // Kayip gerceklesmeden acilmis pozisyon (gapMin < 0) tepki olamaz.
    if (gapMin < 0 || gapMin > maxGapMin) continue;

    after.push(chrono[i].netPnl);
  }

  const overall = chrono.length ? chrono.reduce((s, t) => s + t.netPnl, 0) / chrono.length : null;
  const avgAfter = after.length ? after.reduce((s, v) => s + v, 0) / after.length : null;

  return {
    threshold: lossThreshold,
    /** Tepki penceresi, dakika. */
    windowMin: maxGapMin,
    count: after.length,
    /** Acilis ani bilinmedigi icin degerlendirilemeyen aday sayisi. */
    unverifiable,
    avgAfterLoss: avgAfter,
    avgOverall: overall,
    /** Kaç kat kötü. Her iki ortalama da negatif değilse null. */
    ratio: avgAfter != null && overall != null && overall < 0 && avgAfter < 0
      ? avgAfter / overall
      : null,
  };
}

