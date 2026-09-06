# QT Workspace

Quarterly Theory ile işlem yapan bir trader'ın **hazırlık → işlem → değerlendirme**
döngüsünü tek yerde tutan uygulama. Ürünün çekirdeği bu döngü; eğitim, ekonomik
takvim, araştırma arşivi ve mentorluk bölümleri ona hizmet eder.

## Ana kullanıcı akışı

```
Daily Prep (10 adım, GO/NO-GO kararı)
      ↓
İşleme gir → broker CSV'sini içe aktar (Trade Log)
      ↓
Broker pozisyonunu journal kaydına bağla   ← planla gerçeği burada buluşur
      ↓
Analytics / Weekly Review
```

Zincirin kritik halkası **eşleştirme**: `BrokerTrade.tradeId`. Plan (`Trade` —
setup, seans, GO kararı, süreç notu) ile gerçek sonuç (`BrokerTrade` — borsadan
gelen P&L) ancak bu bağla birlikte okunabilir.

## Kurulum

```bash
npm install          # postinstall prisma generate çalıştırır
npm run dev          # http://localhost:3000
```

### Ortam değişkenleri

`.env` dosyası (repoda yok, git'e de girmemeli):

| Değişken | Ne işe yarar |
| --- | --- |
| `DATABASE_URL` | Postgres bağlantısı (Supabase pooler). Prisma runtime bunu kullanır. |
| `DIRECT_URL` | Havuzsuz doğrudan bağlantı. Şema işlemleri (`db push`) bunu kullanır. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL'i. Tarayıcıya gider. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon anahtarı. Tarayıcıya gider. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sunucu tarafı yönetim işlemleri. **Asla** istemciye sızmamalı. |

### Veritabanı

Şema `prisma/schema.prisma`. Proje versiyonlanmış migration geçmişi tutmuyor,
`prisma db push` kullanıyor:

```bash
npx prisma db push       # şemayı veritabanına uygula
npx prisma studio        # veriyi görsel incele
```

> Bu, tek geliştiricili geliştirme için pratik ama **production için eksik**:
> geri alma yolu ve değişiklik geçmişi yok. Çok kullanıcılı yayına geçmeden
> önce `prisma migrate` akışına taşınması gerekir.

## İçe aktarma (CSV)

Üç broker desteklenir, her biri ayrı parser:

| Kaynak | Dosya | Notlar |
| --- | --- | --- |
| Tradovate | `app/(app)/trade-log/parse-tradovate.ts` | P&L vermez; kullanıcıdan beklenir (`needsManualPnl`). |
| Binance Futures | `app/(app)/trade-log/parse-binance-futures.ts` | Saat dilimi taşımaz, dosya adından tahmin edilir. Funding yok. |
| OKX | `app/(app)/trade-log/parse-okx.ts` | Saat dilimini dosyanın içine yazar. |

Akış: `parseImportFile` (önizleme, hiçbir şey kaydedilmez) → kullanıcı onayı →
`commitImport`. Tekrar import'ta aynı pozisyonun aynı anahtarı alması
`externalRef` ile garanti edilir (`@@unique([userId, externalRef])`).

**Veri kalitesi:** dönüştürülemeyen komisyon (ör. BNB ile ödenmiş fee) net
P&L'den düşülmez; satır `costDataIncomplete` ile işaretlenir ve arayüzde `~`
rozetiyle gösterilir. "Sonuç kesin" ile "sonuç yaklaşık" ayrı tutulur.

## Mimarideki tek-kaynak modülleri

Aynı iş kuralının iki yerde yaşaması bu projede somut hatalar üretmişti; şu
kurallar tek dosyada tanımlıdır ve hem istemci hem sunucu aynısını çalıştırır:

| Modül | Sorumluluk |
| --- | --- |
| `lib/prep/go-rules.ts` | GO/NO-GO hard block'ları. Sunucu kaydetmeden önce yeniden doğrular. |
| `lib/units/instruments.ts` | Enstrüman birim modeli ve pozisyon büyüklüğü (futures kontratı / forex lotu / coin). |
| `lib/money.ts` | Para biçimlendirme. Negatif değer **her zaman** eksi işaretiyle. |
| `lib/time/trading-day.ts` | Gün sınırları. Piyasa günü (ET) ≠ sunucunun günü ≠ kullanıcının günü. |
| `lib/auth/assert-owns.ts` | İlişki kurulmadan önce bağlı kaydın sahipliği. |
| `lib/journal/process-score.ts` | Süreç puanı; form doluluğu ile kural uyumu ayrı ölçülür. |
| `lib/data-quality.ts` | "veri yok" / "veri bayat" / "veri alınamadı" ayrımı. |
| `lib/broker/match.ts` | Broker–journal eşleştirme önerileri (öneri; bağlama kararı kullanıcının). |

## Doğrulama

```bash
npm run test         # vitest
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build
```

## İşletim tarafında eksikler

Devralacak kişinin bilmesi gerekenler — bunlar repoda **yok**:

- Versiyonlanmış migration geçmişi ve rollback yaklaşımı (yukarıya bakınız).
- Staging / production ortam ayrımı.
- Yedekleme ve geri yükleme tatbikatı.
- Hata takibi ve başarısız import alarmı.
- Yayın sonrası smoke test.
- Supabase `screenshots` bucket'ının gerçek erişim ayarı doğrulanmadı. Kod
  `getPublicUrl` üretiyor; bucket public ise bağlantıyı bilen herkes journal
  görsellerine erişebilir. Private bucket + süreli imzalı URL'e geçilmeli.
