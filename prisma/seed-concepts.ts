/**
 * Seeds core Quarterly Theory concept cards (system concepts).
 * Idempotent: removes existing system concepts, then re-creates them.
 * Run: npx dotenv-cli -e .env -- npx tsx prisma/seed-concepts.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

type Seed = {
  title: string;
  category: string;
  definition: string;
  whyItMatters: string;
  whenToUse: string;
  commonMistakes: string;
  checklistQuestions: string[];
};

const concepts: Seed[] = [
  {
    title: "Quarterly Theory (Zaman Fraktallığı)",
    category: "QT_BASICS",
    definition: "Piyasa zamanı iç içe geçmiş çeyreklere (Q1-Q4) bölünür: yıl→ay→hafta→gün→90dk→mikro. Her seviye aynı akümülasyon-manipülasyon-dağıtım ritmini tekrarlar.",
    whyItMatters: "Hangi çeyrekte olduğunu bilmek, beklenen davranışı (birikim mi, genişleme mi) önceden kestirmeni sağlar.",
    whenToUse: "Her prep'in başında: aktif haftalık/günlük/90dk çeyreği belirle.",
    commonMistakes: "Tek bir timeframe'e bakıp üst çeyrek bağlamını ihmal etmek.",
    checklistQuestions: ["Aktif haftalık çeyrek hangisi?", "Günlük ve 90dk çeyrek hizalı mı?", "Bu çeyrekte beklenen davranış ne?"],
  },
  {
    title: "PO3 (Power of 3: AMD)",
    category: "QT_BASICS",
    definition: "Accumulation → Manipulation → Distribution. Fiyat önce birikir, sonra likidite avlar (manipülasyon), sonra gerçek yönde genişler.",
    whyItMatters: "Manipülasyon bacağını erken girişle karıştırmamak için AMD fazını doğru okumak şart.",
    whenToUse: "Bias ve narrative kurarken günün/haftanın hangi fazda olduğunu işaretle.",
    commonMistakes: "Manipülasyon (stop avı) bacağını breakout sanıp ters yönde girmek.",
    checklistQuestions: ["Şu an accumulation, manipulation mı distribution mı?", "Likidite alındı mı?"],
  },
  {
    title: "True Day Open (TDO)",
    category: "TRUE_OPENS",
    definition: "Günün gerçek açılış referansı (genellikle 00:00 veya seans başı). Fiyatın TDO'ya göre üstünde/altında olması premium/discount bağlamı verir.",
    whyItMatters: "Ucuz/pahalı filtresi: TDO üstü premium (short-favorable), altı discount (long-favorable).",
    whenToUse: "Step 5 True Opens'ta TDO gir ve fiyatın konumunu işaretle.",
    commonMistakes: "TDO üstünde long, altında short aramak (premium/discount çelişkisi).",
    checklistQuestions: ["Fiyat TDO'nun üstünde mi altında mı?", "Bias bu bağlamla uyumlu mu?"],
  },
  {
    title: "True Week Open (TWO)",
    category: "TRUE_OPENS",
    definition: "Haftanın gerçek açılış referansı (Salı açılışı / True Week logic). Haftalık premium/discount çerçevesini verir.",
    whyItMatters: "Haftalık bias'ın ucuzdan mı pahalıdan mı işlem aradığını netleştirir.",
    whenToUse: "Hafta başı prep'inde haftalık bağlamı kurarken.",
    commonMistakes: "TWO'yu göz ardı edip sadece günlük açılışa bakmak.",
    checklistQuestions: ["Fiyat TWO'ya göre nerede?", "Haftalık bias premium/discount ile uyumlu mu?"],
  },
  {
    title: "SSMT (Smart Money Technique / Crack)",
    category: "SSMT_CORRELATION",
    definition: "Korele varlıklar (ör. NQ-ES-YM) arasında bir tanesinin high/low yaparken diğerinin yapmaması — kurumsal divergence sinyali.",
    whyItMatters: "SSMT, manipülasyonun bittiğine ve gerçek yönün başladığına dair en güçlü teyitlerden biri.",
    whenToUse: "Step 7'de üç varlığın davranışını karşılaştır; biri raid ederken diğeri korumalı.",
    commonMistakes: "Rastgele swing'i SSMT sanmak; üç varlığı kontrol etmeden karar vermek.",
    checklistQuestions: ["Hangi varlık raid etti, hangisi korudu?", "Divergence bias yönüyle uyumlu mu?", "Random SMT mi, kaliteli mi?"],
  },
  {
    title: "Triad Korelasyon Kontrolü",
    category: "SSMT_CORRELATION",
    definition: "Üçlü grupta (NQ/ES/YM, EU/GU/DXY, BTC/ETH/TOTAL3) güçlü ve zayıf varlığı belirleyip yönü teyit etme.",
    whyItMatters: "Güçlü varlıkta long, zayıf varlıkta short — edge burada. Hizalanmayan triad zayıf setup demek.",
    whenToUse: "SSMT işaretlerken hangi varlığın güçlü/zayıf olduğunu belirle.",
    commonMistakes: "Tek enstrümana bakıp korelasyonu atlamak.",
    checklistQuestions: ["Güçlü varlık hangisi?", "Üçü de aynı yönü mü işaret ediyor?"],
  },
  {
    title: "PSP (Precision Swing Point)",
    category: "CONFIRMATION",
    definition: "Alt timeframe'de SSMT sonrası oluşan hassas swing teyidi — girişin zamanlamasını verir.",
    whyItMatters: "SSMT yönü verir, PSP zamanı verir. İkisi birlikte yüksek olasılıklı giriş sağlar.",
    whenToUse: "Step 8'de confirmation seçerken SSMT timeframe'iyle hizalı PSP ara.",
    commonMistakes: "Weekly SSMT'ye 1m PSP ile girmek (timeframe uyumsuzluğu).",
    checklistQuestions: ["PSP timeframe'i SSMT ile uyumlu mu?", "Teyit tam oluştu mu?"],
  },
  {
    title: "CISD (Change in State of Delivery)",
    category: "CONFIRMATION",
    definition: "Fiyatın teslim yönünün değiştiğini gösteren yapı kırılımı — manipülasyondan dağıtıma geçiş teyidi.",
    whyItMatters: "Girişten önce yönün gerçekten döndüğünü doğrular, erken girişi engeller.",
    whenToUse: "Confirmation adımında CISD sonrası giriş modeli seçerken.",
    commonMistakes: "CISD beklemeden manipülasyon bacağında girmek.",
    checklistQuestions: ["Teslim yönü değişti mi?", "Kırılım kapanışla teyitli mi?"],
  },
  {
    title: "DFR (Daily Fractal Range)",
    category: "DFR",
    definition: "Q1'de oluşan aralığın high/low'u ve 0.5 orta noktası; günün projeksiyon hedeflerini türetir.",
    whyItMatters: "Hedef ve geçersizlik seviyelerini önceden tanımlar — TP planı DFR'ye bağlanır.",
    whenToUse: "Step 6'da Q1 aralığından DFR high/low gir, 0.5 otomatik hesaplanır.",
    commonMistakes: "DFR projeksiyonunu otomatik giriş sinyali sanmak (sadece hedef bağlamıdır).",
    checklistQuestions: ["Q1 aralığı temiz mi?", "DFR H/L = Q1 H/L mi?", "Projeksiyon bias ile hizalı mı?"],
  },
  {
    title: "Q1 Kalitesi (Barometre)",
    category: "DFR",
    definition: "Q1'in dar aralık / temiz birikim / aşırı uzamış / bozuk olması, sonraki çeyreklerin davranışını öngörür.",
    whyItMatters: "Temiz birikim genişleme olasılığını artırır; aşırı uzamış Q1 konsolidasyon riskini büyütür.",
    whenToUse: "Cycle adımında Q1 kalitesini işaretle, beklenen davranışı buna göre kur.",
    commonMistakes: "Aşırı uzamış Q1 sonrası koşulsuz genişleme beklemek.",
    checklistQuestions: ["Q1 dar mı, uzamış mı?", "Beklenen davranış (genişleme/konsolidasyon) ne?"],
  },
  {
    title: "HTF Bias & Narrative",
    category: "BIAS_NARRATIVE",
    definition: "Üst timeframe'de fiyatın nereye teslim edildiğine dair yönlü hikâye: hedef likidite + geçersizlik.",
    whyItMatters: "Narrative olmadan giriş = rastgele. Her setup HTF hikâyesine hizmet etmeli.",
    whenToUse: "Step 2'de bias + açıklama + hedef likidite gir.",
    commonMistakes: "Bias'ı açıklamadan işaretlemek; hedef tanımlamamak.",
    checklistQuestions: ["Hedef likidite neresi?", "Geçersizlik nerede?", "Bias'ı bir cümleyle açıklayabiliyor muyum?"],
  },
  {
    title: "Premium / Discount Filtresi",
    category: "BIAS_NARRATIVE",
    definition: "Fiyatın ilgili True Open'lara / aralık ortasına göre pahalı (premium) mı ucuz (discount) mu olduğunu değerlendirme.",
    whyItMatters: "Ucuzdan long, pahalıdan short — konum edge'i. Premium'da long çelişkilidir.",
    whenToUse: "True Open ve DFR bağlamında girişten önce konum kontrolü.",
    commonMistakes: "Premium bölgede long, discount bölgede short aramak.",
    checklistQuestions: ["Fiyat premium mı discount mı?", "Bias konumla uyumlu mu?"],
  },
  {
    title: "Risk & Execution Disiplini",
    category: "RISK_EXECUTION",
    definition: "Sabit yüzde risk, tanımlı stop, planlı TP ve GO/NO-GO checklist'ine uyum.",
    whyItMatters: "Edge ancak tutarlı risk yönetimiyle paraya döner; tek büyük kayıp seriyi bozar.",
    whenToUse: "Her girişte: risk %, stop mantığı, TP hedefleri net olmalı.",
    commonMistakes: "Stop'suz girmek, risk %'yi büyütmek, NO-GO'da işlem açmak.",
    checklistQuestions: ["Risk % sabit mi?", "Stop mantığı tanımlı mı?", "GO checklist tamam mı?"],
  },
  {
    title: "Stop Mantığı (Yapısal Geçersizlik)",
    category: "RISK_EXECUTION",
    definition: "Stop'un keyfi değil, yapısal bir geçersizliğe (swing, FVG, DFR, PRC) dayandırılması.",
    whyItMatters: "Yapısal stop, fikrin gerçekten yanlış olduğu yeri işaretler; erken/geç stop'u önler.",
    whenToUse: "Entry planında stop mantığını seç ve fiyatı gir.",
    commonMistakes: "Sabit tick stop kullanmak; yapıyı görmezden gelmek.",
    checklistQuestions: ["Stop hangi yapıya dayanıyor?", "Geçersizlik seviyesi net mi?"],
  },
  {
    title: "No-Trade Haber Penceresi",
    category: "RISK_EXECUTION",
    definition: "Yüksek etkili haber öncesi/sonrası tanımlı süre boyunca işlem açmama kuralı.",
    whyItMatters: "Haber volatilitesi stop avı ve slippage riskini büyütür; edge'i bozar.",
    whenToUse: "Calendar'da yüksek etkili haberleri işaretle; prep'te no-trade penceresi GO'yu bloklar.",
    commonMistakes: "Haber penceresinde işlem açmak.",
    checklistQuestions: ["Yakında yüksek etkili haber var mı?", "No-trade penceresindeyim mi?"],
  },
];

async function main() {
  await prisma.concept.deleteMany({ where: { isSystemConcept: true } });
  for (const c of concepts) {
    await prisma.concept.create({
      data: {
        title: c.title,
        category: c.category as never,
        definition: c.definition,
        whyItMatters: c.whyItMatters,
        whenToUse: c.whenToUse,
        commonMistakes: c.commonMistakes,
        checklistQuestions: c.checklistQuestions,
        // Learning state is per-user now (ConceptProgress) -- not seed data.
        isSystemConcept: true,
      },
    });
  }
  console.log(`Seeded ${concepts.length} system concepts.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
