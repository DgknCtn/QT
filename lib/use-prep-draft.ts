"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { writeStoredValue } from "./use-stored-value";
import type { PrepFormData } from "@/app/(app)/daily-prep/new/types";

/**
 * Daily Prep sihirbazı için taslak kalıcılığı.
 *
 * Sihirbaz 10 adım / ~70 alan ve hiçbir kalıcılığı yoktu: sekme yenilenince
 * hepsi gidiyordu. Burası formu localStorage'a yazar ve dönüşte geri yüklemeyi
 * TEKLİF eder.
 *
 * Neden `useStoredValue` kullanılmıyor: o yardımcı tek bir ham string'i
 * `useSyncExternalStore` ile okur; her okumada JSON'u yeniden parse etmek her
 * seferinde yeni bir nesne kimliği döndürür ve store'u sonsuz döngüye sokar.
 * Taslak zaten canlı bir state değil, tek seferlik bir kurtarma — bu yüzden
 * mount'ta bir kez okunur. Yazma yolu `writeStoredValue`'yu yeniden kullanır
 * (aynı sekmedeki dinleyicilere haber vermesi için).
 */

const DRAFT_VERSION = 1;
/** Bundan eski taslak yok sayılır: geçmiş bir seansın fiyatları bugüne sızmasın. */
const MAX_AGE_MS = 36 * 60 * 60 * 1000;
const DEBOUNCE_MS = 800;

export type PrepDraft = {
  version: number;
  savedAt: number;
  data: PrepFormData;
};

/** Butun taslak anahtarlarinin ortak oneki — cikista toplu temizlik icin. */
export const PREP_DRAFT_PREFIX = "qt:prep-draft:";

/**
 * Yeni prep ile her bir düzenlenen prep ayrı anahtar kullanır — iki farklı
 * prep'in taslağı asla birbirine karışmaz.
 *
 * Anahtar kullanıcı kimliğini de içerir. İçermediğinde, ortak bir cihazda
 * hesap değiştiren iki kişiden ikincisi birincinin yarım kalmış hazırlığını
 * "kurtarılacak taslak" olarak görüyordu — localStorage oturumdan bağımsız
 * yaşadığı için çıkış yapmak da bunu temizlemiyordu.
 */
export function prepDraftKey(userId: string, prepId?: string): string {
  return `${PREP_DRAFT_PREFIX}${userId}:${prepId ?? "new"}`;
}

/**
 * Cihazdaki tüm prep taslaklarını siler. Çıkışta çağrılır: anahtarlar artık
 * kullanıcıya göre ayrı olsa da, veriyi oturum bitince cihazda bırakmamak
 * ayrı bir gerekliliktir.
 */
export function clearAllPrepDrafts(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREP_DRAFT_PREFIX)) keys.push(k);
    }
    for (const k of keys) localStorage.removeItem(k);
  } catch {
    // Private mode / quota: okuyamiyorsak silecek bir sey de yoktur.
  }
}

export function serializeDraft(data: PrepFormData, now = Date.now()): string {
  return JSON.stringify({ version: DRAFT_VERSION, savedAt: now, data } satisfies PrepDraft);
}

/** Bozuk / eski sürüm / biçimsiz JSON → `null`. Asla fırlatmaz. */
export function parseDraft(raw: string | null): PrepDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PrepDraft>;
    if (parsed?.version !== DRAFT_VERSION) return null;
    if (typeof parsed.savedAt !== "number") return null;
    if (!parsed.data || typeof parsed.data !== "object") return null;
    return parsed as PrepDraft;
  } catch {
    return null;
  }
}

export function isStaleDraft(draft: PrepDraft, now = Date.now()): boolean {
  return now - draft.savedAt > MAX_AGE_MS;
}

function readDraft(key: string): PrepDraft | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return null;
  }
  const draft = parseDraft(raw);
  if (!draft || isStaleDraft(draft)) {
    if (raw) clearPrepDraft(key);
    return null;
  }
  return draft;
}

export function clearPrepDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Private mode / quota: yazamıyorsak silecek bir şey de yoktur.
  }
}

export function usePrepDraft(key: string) {
  // Mount'ta bir kez okunur. Banner yalnızca hidrasyondan sonra render edildiği
  // için (bkz. useIsHydrated), bu değerin sunucu markup'ıyla çakışma riski yok.
  const [draft, setDraft] = useState<PrepDraft | null>(() => readDraft(key));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  /** Debounce'lu yazma — her tuş vuruşunda localStorage'a gitmemek için. */
  const save = useCallback(
    (data: PrepFormData) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        writeStoredValue(key, serializeDraft(data));
      }, DEBOUNCE_MS);
    },
    [key],
  );

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    clearPrepDraft(key);
    setDraft(null);
  }, [key]);

  /** Kullanıcı "Geri yükle"yi reddettiğinde: banner kapanır, taslak diskte kalmaz. */
  const dismiss = useCallback(() => {
    clear();
  }, [clear]);

  return { draft, save, clear, dismiss };
}
