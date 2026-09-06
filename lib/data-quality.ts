/**
 * Bir sorgunun sonucunun ne kadar güvenilir olduğunu taşıyan sarmalayıcı.
 *
 * Dashboard sorguları `.catch(() => [])` ve `.catch(() => null)` kullanıyordu.
 * Sonuç: broker sorgusu başarısız olduğunda Risk Guard boş işlem listesi alıp
 * "Gün açık", sıfır P&L ve sıfır ardışık kayıp gösteriyordu. Kullanıcı bunun
 * bir bağlantı hatası olduğunu hiçbir şekilde anlayamıyordu — riskli olanı da
 * bu: veri yokken güvenli durum izlenimi vermek.
 *
 * Üç durum ayrı tutulur:
 *   ok    — veri geldi, güncel.
 *   stale — veri geldi ama kapsamı sınırlı (son import'tan sonrası eksik).
 *   error — veri alınamadı. Bu asla "işlem yok" demek değildir.
 */

export type DataStatus = "ok" | "stale" | "error";

export type DataResult<T> = {
  status: DataStatus;
  /** `error` durumunda çağıranın devam edebilmesi için makul bir varsayılan. */
  value: T;
  /** Verinin kapsadığı en son an — "son import: …" göstergesi için. */
  coveredUntil?: Date | null;
};

export function ok<T>(value: T, coveredUntil?: Date | null): DataResult<T> {
  return { status: "ok", value, coveredUntil: coveredUntil ?? null };
}

export function failed<T>(fallback: T): DataResult<T> {
  return { status: "error", value: fallback, coveredUntil: null };
}

/**
 * Bir sorguyu `DataResult` içine alır. Hata yutulmaz, işaretlenir.
 *
 * `fallback` yalnızca sayfanın çökmemesi içindir; arayüz `status`'a bakmadan
 * bu değeri gerçek veri gibi göstermemelidir.
 */
export async function tracked<T>(
  query: Promise<T>,
  fallback: T,
): Promise<DataResult<T>> {
  try {
    return ok(await query);
  } catch {
    return failed(fallback);
  }
}
