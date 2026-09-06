/**
 * Süreç puanı — tek kaynak.
 *
 * İki sorunu birden çözüyor:
 *
 * 1. Kural iki ayrı action dosyasında birebir kopyalanmıştı (yeni kayıt ve
 *    güncelleme). Birinde yapılan değişiklik diğerine geçmiyordu.
 *
 * 2. Puan iki farklı şeyi tek sayıda topluyordu: **formu doldurmak** ve
 *    **doğru karar vermek**. Bunlar aynı ölçüm değil — eksiksiz doldurulmuş
 *    kötü bir işlem, yarım doldurulmuş iyi bir işlemden yüksek puan
 *    alabiliyordu. Artık ikisi ayrı hesaplanıyor ve ayrı gösterilebiliyor.
 *
 * Toplam puan ve harf notu **bilerek** değiştirilmedi: geçmiş kayıtlar bu
 * ölçekle kaydedildi, formülü değiştirmek eski notları sessizce
 * karşılaştırılamaz hale getirirdi. Kırılım yeni bilgi ekliyor, eskisini
 * geçersiz kılmıyor.
 */

export type ProcessScore = {
  /** Geriye dönük uyumlu toplam. */
  score: number;
  grade: "A_PLUS" | "B" | "C" | "RULE_BREAK";
  /** Kaydın ne kadar eksiksiz doldurulduğu (0–5). Karar kalitesi DEĞİL. */
  completeness: number;
  /** Kurallara uyumun net etkisi. Ceza aldıysa negatif olabilir. */
  compliance: number;
};

export function computeProcessScore(
  form: Record<string, unknown>,
  mistakeTags: string[],
): ProcessScore {
  // Kaydin eksiksizligi: bunlar "iyi islem" degil, "iyi kayit" gostergesi.
  let completeness = 0;
  if (form.dailyPrepId) completeness += 2;
  if (form.setupType && form.setupType !== "CUSTOM") completeness += 2;
  if (form.entryPrice && form.stopPrice) completeness += 1;
  if (form.tp1) completeness += 1;
  if (form.riskPercent) completeness += 1;

  // Kurala uyum: asil olculmek istenen sey.
  let compliance = 0;
  if (form.goStatusAtEntry === "GO") compliance += 2;
  if (form.planFollowed === "YES") compliance += 2;

  if (mistakeTags.includes("FOMO")) compliance -= 2;
  if (!form.stopPrice) compliance -= 5;
  if (!form.tp1 && form.result === "WIN") compliance -= 1;
  if (form.goStatusAtEntry === "NO_GO_BUT_ENTERED") compliance -= 3;
  if (mistakeTags.includes("News ignored")) compliance -= 3;
  if (mistakeTags.includes("No HTF narrative")) compliance -= 2;
  if (mistakeTags.includes("Wrong TF alignment")) compliance -= 2;

  const score = completeness + compliance;

  const grade =
    score >= 10 ? "A_PLUS" :
    score >= 6  ? "B" :
    score >= 3  ? "C" :
    "RULE_BREAK";

  return { score, grade, completeness, compliance };
}
