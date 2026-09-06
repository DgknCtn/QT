/**
 * Broker pozisyonu ile manuel journal kaydını eşleştirme.
 *
 * Şemada `BrokerTrade.tradeId` baştan beri vardı ama onu kuran hiçbir kullanıcı
 * akışı yoktu: plan (`Trade` — setup, seans, GO kararı, süreç notu) ile gerçek
 * sonuç (`BrokerTrade` — borsadan gelen P&L) birbirini hiç görmüyordu.
 * "Kurala uygun girdiklerim gerçekte ne getirdi?" sorusu ancak bu bağla
 * cevaplanabiliyor — ve bu, ürünün asıl değer vaadi.
 *
 * Burası yalnızca **öneri** üretir. Otomatik bağlamıyoruz: yanlış eşleşen bir
 * pozisyon, hiç eşleşmemiş bir pozisyondan daha kötüdür, çünkü sonrasında
 * yapılan bütün analizi sessizce bozar. Kararı kullanıcı verir.
 */

import { toBaseAsset } from "./symbols";

export type MatchCandidate = {
  id: string;
  date: Date;
  instrument: string;
  direction: string;
  setupType: string | null;
  result: string;
};

export type BrokerSide = {
  instrument: string;
  direction: string;
  entryTime: Date;
};

/**
 * Enstruman karsilastirmasi `toBaseAsset` uzerinden yapilir: borsa yazimlarini
 * ("PUMP-USDT-SWAP" / "PUMPUSDT") tek kimlige indirgeyen kural zaten orada ve
 * "1000PEPE" gibi olcekli tickerlari dogru sekilde ayri tutuyor.
 */
function normalizeInstrument(s: string): string {
  return toBaseAsset(s);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export type ScoredCandidate = MatchCandidate & {
  /** 0–3: aynı gün (1) + aynı yön (1) + aynı enstrüman (1). */
  score: number;
  reasons: string[];
};

/**
 * Adayları güçlü eşleşmeden zayıfa doğru sıralar.
 *
 * Tam gün + yön + enstrüman üçlüsü tutmayan adaylar da listede kalır: kullanıcı
 * enstrümanı journal'a farklı yazmış olabilir. Eleme değil sıralama yapıyoruz.
 */
export function rankMatchCandidates(
  broker: BrokerSide,
  candidates: MatchCandidate[],
): ScoredCandidate[] {
  const bInst = normalizeInstrument(broker.instrument);

  return candidates
    .map((c) => {
      const reasons: string[] = [];
      let score = 0;
      if (sameDay(c.date, broker.entryTime)) {
        score += 1;
        reasons.push("aynı gün");
      }
      if (c.direction?.toUpperCase() === broker.direction?.toUpperCase()) {
        score += 1;
        reasons.push("aynı yön");
      }
      if (normalizeInstrument(c.instrument) === bInst) {
        score += 1;
        reasons.push("aynı enstrüman");
      }
      return { ...c, score, reasons };
    })
    .sort((a, b) => b.score - a.score || b.date.getTime() - a.date.getTime());
}

export { normalizeInstrument };
