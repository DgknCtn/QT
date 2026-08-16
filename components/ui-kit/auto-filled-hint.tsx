import { Clock, Copy, Bookmark } from "lucide-react";

/**
 * Bir alanın değerinin kullanıcı tarafından değil uygulama tarafından
 * doldurulduğunu gösteren küçük rozet.
 *
 * Amaç bilgilendirmek, engellemek değil: alanlar her zaman düzenlenebilir
 * kalır, rozet kullanıcı değeri değiştirince kaybolur.
 */

const SOURCES = {
  /** Market saatinden türetildi (seans, quarter, micro). */
  clock: { icon: Clock, label: "saatten" },
  /** Son prep'ten taşındı. */
  carry: { icon: Copy, label: "kopyalandı" },
  /** Kayıtlı seviyeden alındı. */
  level: { icon: Bookmark, label: "seviyeden" },
} as const;

export type AutoFillSource = keyof typeof SOURCES;

/**
 * `PrepFormData.autoFilled` içindeki anahtarlar kaynağa göre öneklidir
 * ("carry:session" gibi); önek yoksa değer market saatinden gelmiştir.
 * Alan otomatik doldurulmadıysa `null` döner.
 */
export function autoFillSource(autoFilled: string[], field: string): AutoFillSource | null {
  if (autoFilled.includes(field)) return "clock";
  if (autoFilled.includes(`carry:${field}`)) return "carry";
  if (autoFilled.includes(`level:${field}`)) return "level";
  return null;
}

/** Rozeti yalnızca alan otomatik dolduysa gösterir. */
export function AutoFillBadge({ autoFilled, field }: { autoFilled: string[]; field: string }) {
  const source = autoFillSource(autoFilled, field);
  return source ? <AutoFilledHint source={source} /> : null;
}

export function AutoFilledHint({
  source,
  title,
}: {
  source: AutoFillSource;
  title?: string;
}) {
  const { icon: Icon, label } = SOURCES[source];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded align-middle"
      style={{ background: "var(--color-bg-border)", color: "var(--color-text-muted)" }}
      title={title ?? "Otomatik dolduruldu — değiştirebilirsin"}
    >
      <Icon size={10} />
      {label}
    </span>
  );
}
