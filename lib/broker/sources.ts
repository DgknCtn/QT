/**
 * Broker kaynak kaydı.
 *
 * `BrokerTrade.source` serbest bir string; hangi değerlerin ne anlama geldiği
 * ve hangilerinin kendi sayfası olduğu tek yerde burada tanımlı. Yeni bir
 * borsa eklerken buraya bir satır yazmak, listeyi tüketen her yeri
 * (kendi sayfası, Trade Log'un dışlama filtresi) birden günceller.
 */

export type BrokerSource = "TRADOVATE" | "BINANCE_FUTURES" | "OKX";

export const BINANCE_SOURCE = "BINANCE_FUTURES" satisfies BrokerSource;
export const OKX_SOURCE = "OKX" satisfies BrokerSource;
export const TRADOVATE_SOURCE = "TRADOVATE" satisfies BrokerSource;

export type BrokerSourceInfo = {
  source: BrokerSource;
  /** Arayüzde görünen borsa adı. */
  label: string;
  /** İçe aktarma butonunun etiketi. */
  importLabel: string;
  /** Kendi sayfasının yolu — yoksa null (Trade Log'da listelenir). */
  href: string | null;
  /** Miktar kolonunun başlığı: vadelide kontrat, kriptoda coin adedi. */
  quantityLabel: string;
  /** Perp funding'i olan kaynaklar için ek kolon/KPI gösterilir. */
  hasFunding: boolean;
  /** CSV'nin nereden indirileceğini anlatan ipucu. */
  exportHint: string;
};

export const BROKER_SOURCES: Record<BrokerSource, BrokerSourceInfo> = {
  TRADOVATE: {
    source: "TRADOVATE",
    label: "Tradovate",
    importLabel: "Tradovate CSV İçe Aktar",
    href: null,
    quantityLabel: "Adet",
    hasFunding: false,
    exportHint: "Tradovate → Account Reports → Fills → Export CSV",
  },
  BINANCE_FUTURES: {
    source: "BINANCE_FUTURES",
    label: "Binance Futures",
    importLabel: "Binance CSV İçe Aktar",
    href: "/binance-log",
    quantityLabel: "Adet",
    hasFunding: false,
    exportHint: "Binance → Orders & Trade History → Trade History → Export",
  },
  OKX: {
    source: "OKX",
    label: "OKX",
    importLabel: "OKX CSV İçe Aktar",
    href: "/okx-log",
    quantityLabel: "Kontrat",
    hasFunding: true,
    exportHint: "OKX → Assets → Order Center → Trading History → Export",
  },
};

/**
 * Kendi sayfası olan kaynaklar. Trade Log bunları dışlar; aksi hâlde
 * yüzlerce kripto round-trip'i vadeli işlem istatistiklerini boğar.
 */
export const DEDICATED_SOURCES: BrokerSource[] = Object.values(BROKER_SOURCES)
  .filter((s) => s.href !== null)
  .map((s) => s.source);
