/**
 * Translates concept cards to Turkish.
 * Run: npx dotenv-cli -e .env -- npx tsx prisma/translate-concepts.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

const concepts = [
  {
    id: "seed-concept-001",
    title: "True Open",
    definition: "True Open (Gerçek Açılış), bir seans veya mumun tam başladığı andaki fiyattır. Resmi borsa açılışından farklı olarak, o periyot için fiyatın gerçekten nereden başladığını yakalar. QT'de fiyatın her zaman dilimine ait kilit referans noktalarının üzerinde mi yoksa altında mı olduğunu belirlemek için kullanılır.",
    whyItMatters: "Fiyat True Open'ın üzerindeyse o zaman dilimi için yükseliş (bullish) bias'ı vardır; altındaysa düşüş (bearish) bias'ı. Birden fazla True Open'ın aynı yönde sıralanması maksimum bias güvenini verir.",
    whenToUse: "Her günlük hazırlıkta. Sırasıyla Haftalık, Günlük, NY Açılışı, Londra, Asya ve Gece Yarısı açılışlarını kontrol et.",
    whenNotToUse: "Tek bir True Open'a dayanma. En az 3–4 tanesinin aynı yönde hizalanmış olması gerekir.",
    requiredConditions: "Fiyat True Open seviyesinin kesin olarak üstünde ya da altında olmalı — 1–2 tick fark yetmez.",
    commonMistakes: "Resmi borsa açılışını True Open yerine kullanmak. Çelişen açılışları görmezden gelip bias zorlamak.",
    userNotes: "Renk kodlaması yapıyorum: yeşil = üstünde, kırmızı = altında. Hazırlık öncesi 6 açılışı not defterime yazıyorum.",
  },
  {
    id: "seed-concept-002",
    title: "Silver Bullet",
    definition: "Silver Bullet, belirli NY saat dilimlerinde oluşan 3 mumlu bir kill zone giriş modelidir: sabah 03:00–04:00, 10:00–11:00 ve 14:00–15:00 ET. Likidite süpürüşü → FVG (Fair Value Gap) oluşumu → fiyatın FVG'ye geri dönmesiyle teyit edilir.",
    whyItMatters: "Saat bazlı filtreleme, rastgele fiyat hareketlerinin büyük çoğunluğunu elek dışına atar. Model belirlenen zaman penceresi içinde HTF hizasıyla oluştuğunda isabet oranı yüksektir.",
    whenToUse: "HTF bias teyitlendikten sonra. Üç zaman penceresinden birinin içinde. M1 veya M5 zaman diliminde FVG oluştuğunda.",
    whenNotToUse: "Zaman penceresi dışında. HTF nötr veya çelişkili olduğunda. Kaçırılan bir Silver Bullet'ı asla kovalama.",
    requiredConditions: "1) Zaman penceresi içinde. 2) Grafik üzerinde likidite süpürüşü görünür. 3) HTF bias yönünde M1/M5 FVG oluştu.",
    commonMistakes: "FVG'nin yanlış tarafından giriş yapmak. Mum kapanışını beklemeden girmek. Pencere bittikten sonra giriş denemek.",
    userNotes: "NQ'da trend günlerinde 10:00–11:00 penceresini en güvenilir buluyorum. Londra Silver Bullet'ı (03:00–04:00) erken alarm gerektiriyor ama güçlü trend günlerinde çalışıyor.",
  },
  {
    id: "seed-concept-003",
    title: "DFR — Daily Fair Range",
    definition: "Daily Fair Range (Günlük Adil Aralık), ATR ve seans bağlamına göre belirlenen beklenen günlük fiyat aralığıdır. Gün için bir Yüksek, Düşük ve Orta Nokta (Mid) tanımlar. Fiyat ortanın üzerindeyse yükseliş iç-gün bias'ı; altındaysa düşüş bias'ı vardır.",
    whyItMatters: "Beklenen aralığın %70'inden fazlası hareket ettikten sonra giriş yapmanın önüne geçer. Gerçekçi TP hedefleri belirlemeye yardımcı olur.",
    whenToUse: "Her günlük hazırlığın başında hesapla. Günlük bias filtreniz olarak orta noktayı kullan.",
    whenNotToUse: "Aralığın 3–5 kat genişleyebildiği yüksek etkili haber günlerinde. Büyük yapısal kırılımlardan sonra yeniden hesapla.",
    commonMistakes: "DFR'yi görmezden gelip fiyat beklenen aralığın %80'ini zaten katetmişken giriş yapmak — düşük ihtimal.",
  },
  {
    id: "seed-concept-004",
    title: "SMT Divergence",
    definition: "SMT (Smart Money Technique) Diverjansı, birbiriyle ilişkili varlıkların aynı yapısal yüksek veya düşüğü oluşturamamasıdır. NQ bir yükseği taradığında ES bunu teyit edemezse (ya da tam tersi) diverjans oluşur ve tersine dönüş sinyali verir.",
    whyItMatters: "Kurumsal oyuncuların perakende görünümün tam tersinde pozisyon aldığı noktaları gösterir. En yüksek olasılıklı dönüş sinyallerinden biridir.",
    whenToUse: "Likidite süpürüşünün ardından. M5/M15'te diverjansı ara. Yapısal açıdan önemli bir seviyede oluşmalı.",
    whenNotToUse: "Tüm varlıkların birlikte konsolide olduğu karmaşık, trendsiz piyasalarda. Yapısal önemi olmayan 'rastgele SMT' geçerli sayılmaz.",
    requiredConditions: "İki ilişkili varlık. Biri yeni swing zirvesi/dibi yapar. Diğeri bunu açıkça teyit etmez.",
    commonMistakes: "SMT'yi çok erken ilan etmek — net başarısızlık için bekle. Korelasyonu düşük varlıkları kullanmak.",
    userNotes: "NQ ile ES benim birincil çiftim. NQ öncü, ES geride kalır. ES zirvesini teyit etmeyen NQ görürsem NQ short'a bakarım.",
  },
  {
    id: "seed-concept-005",
    title: "HTF Narrative & Bias",
    definition: "HTF Bias (Yüksek Zaman Dilimi Bias'ı), Haftalık → Günlük → H4 okunarak belirlenen yön beklentisidir. 'Yapı, likidite ve PO3 döngüsüne göre piyasa bugün büyük ihtimalle ne yapacak?' sorusunu yanıtlar. Bu bias tüm gün içi setup'ları filtreler.",
    whyItMatters: "HTF bias'a karşı işlem yapmak sürekli kayıpların 1 numaralı sebebidir. Bias filtrenizdir; giriş tetikleyiciniz değil.",
    whenToUse: "Her seans öncesinde. Yukarıdan aşağı: Haftalık yapı → Günlük yapı → likidite havuzlarını belirle.",
    whenNotToUse: "Karmaşık günlerde veya yön belirsizse bias zorlamak yerine NEUTRAL yaz ve netleşmesini bekle.",
    commonMistakes: "Tek bir M5 mumu nedeniyle gün içinde bias'ı değiştirmek. HTF bias yalnızca Günlük kapanışta değişir.",
  },
  {
    id: "seed-concept-006",
    title: "Order Block",
    definition: "Order Block (Emir Bloğu), güçlü bir itici hareketten önceki son karşı yönlü mumdur. Yükseliş OB = yükseliş ivmesinden önceki son düşüş mumu. Fiyat, kalan kurumsal emirleri doldurmak için genellikle bu bölgelere geri döner.",
    whyItMatters: "Kurumların pozisyon açtığı yerleri temsil eder. Fiyat geri döndüğünde, dolmamış emirler destek/direnç oluşturarak yüksek olasılıklı dönüş bölgeleri yaratır.",
    whenToUse: "HTF bias teyitlendikten ve likidite süpürüldükten sonra. Giriş zaman diliminde (H1, M15, M5) bias yönünde OB belirle.",
    whenNotToUse: "Daha önce test edilmiş ve kırılmış OB'ler artık geçerli değil. Her zaman tazeliğini kontrol et.",
    requiredConditions: "OB'den güçlü itici hareket. OB 'taze' olmalı (ilk dokunuş). HTF hizalaması zorunlu.",
    commonMistakes: "İhlal edilmiş OB'leri kullanmak. HTF hizası olmadan girmek. OB aralığı için gövde yerine wick'i kullanmak.",
  },
  {
    id: "seed-concept-007",
    title: "1% Risk Kuralı",
    definition: "Tek bir işlemde toplam hesabın %1'inden fazlasını riske etme. Stop loss konumu önce belirlenir, pozisyon büyüklüğü ona göre hesaplanır; tersi olmaz. Daha fazla kazanmak için büyük pozisyon açmak yasak.",
    whyItMatters: "10 ardışık kayıp %1 ile = %10 düşüş. %5 ile = %40 düşüş. Tutarlı risk boyutlandırması tutarlı psikoloji demektir.",
    whenToUse: "Her. İşlemde. İstisna yok. Yüksek etkili haber günlerinde %0,75; normalde %1.",
    whenNotToUse: "Herhangi bir koşulda %2'yi aşma. Kayıpları telafi etmek için pozisyonu büyütme — bu öç işlemi (revenge trade) olur.",
    requiredConditions: "Giriş öncesinde tanımlanmış stop loss. Pozisyon büyüklüğü = (Hesap × 0,01) / (Giriş − Stop, birim başına).",
    commonMistakes: "Normal fiyat dalgalanmasıyla stop out olmamak için çok dar stop koymak. Zarara uğramamak için girişten sonra stop'u genişletmek.",
    userNotes: "FOMC/CPI günleri %0,75, normal günler %1. Bunu titizlikle takip ediyorum — hesap yönetiminde disiplin her şeyden önemli.",
  },
];

async function main() {
  console.log("🌐 Translating concept cards to Turkish…\n");

  for (const c of concepts) {
    await prisma.concept.update({
      where: { id: c.id },
      data: {
        title:              c.title,
        definition:         c.definition,
        whyItMatters:       c.whyItMatters ?? null,
        whenToUse:          c.whenToUse ?? null,
        whenNotToUse:       c.whenNotToUse ?? null,
        requiredConditions: c.requiredConditions ?? null,
        commonMistakes:     c.commonMistakes ?? null,
        // userNotes moved to the per-user ConceptProgress table.
      },
    });
    console.log(`  ✅ ${c.title}`);
  }

  console.log("\n✨ Tüm kavram kartları Türkçeye çevrildi.");
}

main()
  .catch((e) => { console.error("❌ Hata:", e.message ?? e); process.exit(1); })
  .finally(() => prisma.$disconnect());
