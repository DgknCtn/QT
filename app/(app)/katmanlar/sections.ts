// Education (/katmanlar) bölüm kaydı — ToC, arama ve ilerleme yüzdesi için tek kaynak.
// Sayfadaki her ana Card'ın id'si burada tanımlı; page.tsx'te aynı id anchor olarak verilir.

export type EduTab = "ozet" | "k1" | "k2" | "k3" | "k4" | "k5";

export interface EduSection {
  id: string;
  tab: EduTab;
  title: string;
  keywords?: string[];
}

export const EDU_TABS: { id: EduTab; label: string }[] = [
  { id: "ozet", label: "Master Özet" },
  { id: "k1", label: "K1: Temeller" },
  { id: "k2", label: "K2: CIC Ailesi" },
  { id: "k3", label: "K3: Zaman & Alan" },
  { id: "k4", label: "K4: Karar" },
  { id: "k5", label: "K5: Montaj" },
];

export const EDU_SECTIONS: EduSection[] = [
  // ── Master Özet ──
  { id: "ozet-zincir-yeri", tab: "ozet", title: "Katmanların Zincirdeki Yeri", keywords: ["zincir", "chain", "bias", "narrative", "dol", "poi"] },
  { id: "ozet-hizli-bakis", tab: "ozet", title: "Katman Özeti — Hızlı Bakış", keywords: ["özet", "k1", "k2", "k3", "k4", "k5", "hızlı bakış"] },

  // ── K1: Temeller ──
  { id: "k1-fraktal-ceyrek", tab: "k1", title: "1. Fraktal Çeyrek Yapısı", keywords: ["fraktal", "çeyrek", "quarter", "fractal", "q1", "q2", "q3", "q4"] },
  { id: "k1-gunluk-dongu", tab: "k1", title: "Günlük Döngü — NY Saatleri", keywords: ["günlük", "döngü", "cycle", "ny", "new york", "seans"] },
  { id: "k1-true-opens", tab: "k1", title: "2. True Opens (TXO)", keywords: ["true open", "txo", "tdo", "açılış", "q2 açılışı"] },
  { id: "k1-q1-fonksiyon", tab: "k1", title: "3. Q1'in Fonksiyonu", keywords: ["q1", "accumulation", "akumülasyon", "fonksiyon"] },
  { id: "k1-triad-amd", tab: "k1", title: "4. Triad + AMD(X) Fazları", keywords: ["triad", "amd", "amdx", "nq", "es", "ym", "accumulation", "manipulation", "distribution"] },

  // ── K2: CIC Ailesi ──
  { id: "k2-cic-araclari", tab: "k2", title: "CIC Araçları (SSMT, PSP, PRC, PG, SMTF, SD, O/C Div)", keywords: ["cic", "crack", "korelasyon", "ssmt", "hssmt", "psp", "prc", "pg", "smtf", "sd", "o/c div", "open close divergence", "swing divergence", "precision"] },
  { id: "k2-ozet-tablo", tab: "k2", title: "Özet Tablo", keywords: ["özet", "tablo", "ssmt", "psp", "prc", "reversal", "continuation"] },

  // ── K3: Zaman & Alan ──
  { id: "k3-tf-alignment", tab: "k3", title: "TF Alignment — İki Ayrı Tablo", keywords: ["tf", "timeframe", "alignment", "htf", "ltf", "mmxm", "qt"] },
  { id: "k3-dfr", tab: "k3", title: "DFR — Defining Range", keywords: ["dfr", "defining range", "projeksiyon", "q1 h/l"] },
  { id: "k3-doubling-b2b", tab: "k3", title: "Doubling B2B Theory", keywords: ["doubling", "b2b", "back to back", "stage", "lrl", "reversal"] },

  // ── K4: Karar ──
  { id: "k4-bias-narrative", tab: "k4", title: "Bias vs Narrative", keywords: ["bias", "narrative", "yön", "bölge", "long", "short"] },
  { id: "k4-bias-belirleme", tab: "k4", title: "Bias Belirleme — İki Ayak", keywords: ["bias", "belirleme", "qt", "mmxm", "po3", "economic calendar", "haber"] },
  { id: "k4-mmxm", tab: "k4", title: "MMxM — Market Maker X Model", keywords: ["mmxm", "market maker", "smr", "smart money reversal", "accumulation"] },
  { id: "k4-checklist", tab: "k4", title: "8 Soruluk Narrative Checklist", keywords: ["checklist", "8 soru", "narrative", "filtre", "tdo", "poi", "cic"] },
  { id: "k4-dol-poi", tab: "k4", title: "DOL / POI — Nereye Bakacaksın", keywords: ["dol", "poi", "draw on liquidity", "point of interest", "pxh", "pxl"] },
  { id: "k4-entry-stop-tp", tab: "k4", title: "Entry / Stop / TP", keywords: ["entry", "stop", "tp", "take profit", "giriş", "risk", "rr"] },

  // ── K5: Montaj ──
  { id: "k5-calisma-duzeni", tab: "k5", title: "Çalışma Düzeni → Seans Ayrımı", keywords: ["çalışma", "düzen", "seans", "am", "pm"] },
  { id: "k5-neden-am", tab: "k5", title: "Neden AM Ana Seans?", keywords: ["am", "ana seans", "ny am", "9:30", "10:00"] },
  { id: "k5-ny-am-saatleri", tab: "k5", title: "NY AM Saatleri — Ana Seans (Yaz, TR)", keywords: ["ny am", "saat", "yaz", "tr", "seans"] },
  { id: "k5-ny-pm-saatleri", tab: "k5", title: "NY PM Saatleri — İkincil (Yaz, TR)", keywords: ["ny pm", "saat", "yaz", "tr", "ikincil"] },
  { id: "k5-cycles", tab: "k5", title: "Senin Cycle'ların", keywords: ["cycle", "döngü", "kişisel"] },
  { id: "k5-enstruman-risk", tab: "k5", title: "Enstrüman / Risk (BEM Funding — CFD)", keywords: ["enstrüman", "risk", "bem", "funding", "cfd"] },
  { id: "k5-kis-uyarisi", tab: "k5", title: "Kış Uyarısı (Kasım Sonrası)", keywords: ["kış", "winter", "kasım", "dst", "saat"] },
  { id: "k5-kritik-kural", tab: "k5", title: "En Kritik Kural — Önce Bir Seansı Oturt", keywords: ["kritik", "kural", "seans", "disiplin"] },
];

export const EDU_SECTION_COUNT = EDU_SECTIONS.length;

export function sectionsByTab(tab: EduTab): EduSection[] {
  return EDU_SECTIONS.filter((s) => s.tab === tab);
}

export function searchSections(query: string): EduSection[] {
  const q = query.trim().toLocaleLowerCase("tr");
  if (!q) return [];
  return EDU_SECTIONS.filter((s) => {
    if (s.title.toLocaleLowerCase("tr").includes(q)) return true;
    return (s.keywords ?? []).some((k) => k.toLocaleLowerCase("tr").includes(q));
  });
}
