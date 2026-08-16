"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Circle, RotateCcw, AlertTriangle, Info, Zap, Search, X, ChevronDown } from "lucide-react";
import { EDU_TABS, EDU_SECTIONS, EDU_SECTION_COUNT, sectionsByTab, searchSections, type EduTab, type EduSection } from "./sections";
import { useReadProgress } from "./use-read-progress";
import { useStoredValue, writeStoredValue } from "@/lib/use-stored-value";

type Tab = EduTab;

// ─── Reusable layout pieces ────────────────────────────────────────────────

function Card({ id, title, children }: { id?: string; title?: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      className="rounded-xl border p-4 space-y-3"
      style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)", scrollMarginTop: 160 }}
    >
      {title && (
        <p className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--color-text-muted)" }}>{title}</p>
      )}
      {children}
    </div>
  );
}

function Callout({ children, variant = "accent" }: { children: React.ReactNode; variant?: "accent" | "warn" | "success" }) {
  const styles = {
    accent:  { background: "rgba(99,102,241,0.06)",  borderColor: "rgba(99,102,241,0.25)" },
    warn:    { background: "rgba(245,158,11,0.06)",  borderColor: "rgba(245,158,11,0.3)" },
    success: { background: "rgba(52,201,126,0.06)",  borderColor: "rgba(52,201,126,0.3)" },
  };
  return (
    <div className="rounded-xl border p-4" style={styles[variant]}>{children}</div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ background: "var(--color-bg-surface)" }}>
            {headers.map((h, i) => (
              <th key={i} className="text-left px-3 py-2 font-semibold border"
                style={{ borderColor: "var(--color-bg-border)", color: "var(--color-text-secondary)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 border"
                  style={{ borderColor: "var(--color-bg-border)", color: "var(--color-text-secondary)" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold mt-2" style={{ color: "var(--color-text-primary)" }}>{children}</p>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{children}</li>
  );
}

// ─── TAB CONTENTS ──────────────────────────────────────────────────────────

function MasterOzet() {
  return (
    <div className="space-y-4">
      <Callout variant="accent">
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-accent)" }}>
          ZİNCİR — her şey buraya bağlanır
        </p>
        <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
          Bias belirle → 8 soruyla narrative kur → DOL/POI seç → crack ile teyit et → TF alignment ile LTF&apos;ye in → entry/stop/TP
        </p>
      </Callout>

      <Card id="ozet-zincir-yeri" title="Katmanların Zincirdeki Yeri">
        <ul className="space-y-2">
          <li className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>K1 + K2</span>
            {" "}→ &quot;crack nerede, hangi tip&quot; (teyit aşaması)
          </li>
          <li className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>K3</span>
            {" "}→ &quot;hangi TF&apos;de konfirme, fiyat hangi alanda&quot; (konumlandırma)
          </li>
          <li className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>K4</span>
            {" "}→ &quot;ne yapacağım&quot; (karar)
          </li>
          <li className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>K5</span>
            {" "}→ &quot;ben ne zaman, neyle yapacağım&quot; (montaj)
          </li>
        </ul>
      </Card>

      <Card id="ozet-hizli-bakis" title="Katman Özeti — Hızlı Bakış">
        <div className="space-y-3">
          {[
            { k: "K1", title: "Temeller", desc: "Fraktal çeyrek · True Open (Q2 açılışı) · Q1 akumüle → Q2 expansion · AMD(X) fazları · NQ-ES-YM Triad" },
            { k: "K2", title: "CIC Ailesi", desc: "SSMT direktir → PG/SMTF/O-C ona bağımlı · Rev: SSMT/HSSMT/PSP/SD · Cont: PRC/SMTF · Hiçbiri tek başına sinyal değil" },
            { k: "K3", title: "Zaman & Alan", desc: "2 AYRI TF tablosu (QT ≠ MMxM) · DFR = Q1&apos;in T2+T3&apos;ü · Doubling B2B = aynı cycle, 2 Stage = farklı cycle" },
            { k: "K4", title: "Karar", desc: "Bias = yön · Narrative = bölge · 8 soru filtre · Crack yoksa reversal yok · Stop: crack&apos;in 1 tık dışı" },
            { k: "K5", title: "Montaj", desc: "AM = Q3 dağıtım (ana seans, TR 13:00–19:00) · PM = Q4 X fazı (ofis günleri) · ÖNCE AM&apos;i oturt" },
          ].map(({ k, title, desc }) => (
            <div key={k} className="flex gap-3">
              <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded h-fit"
                style={{ background: "rgba(99,102,241,0.12)", color: "var(--color-accent)" }}>{k}</span>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--color-text-primary)" }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Callout variant="success">
        <p className="text-xs font-semibold mb-1" style={{ color: "rgba(52,201,126,0.9)" }}>Montajın Tek Cümlesi</p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          TR 20:30&apos;da PM TSO&apos;da otur → Q3→Q4 Daily SSMT veya PM içi 90m SSMT ara → 4 adımlı süzgeçten geçir → 8 soruluk checklist&apos;le bias/narrative doğrula → US100/US500/US30 küçük lot → crack&apos;in 1 tık dışına stop, LGL/LGH&apos;ye ilk TP → 23:30&apos;da bırak.
        </p>
      </Callout>

      <Callout variant="warn">
        <div className="flex gap-2">
          <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Bu sistem strateji sorununu çözer, execution sorununu çözmez. Asıl iş: bu zinciri her seans AYNI disiplinle uygulamak.
            İzlenen metrik &quot;kaç işlem&quot; değil → <strong>8 soruyu geçen setup kalitesi + bias/narrative isabeti.</strong>
          </p>
        </div>
      </Callout>
    </div>
  );
}

function Katman1() {
  return (
    <div className="space-y-4">
      <Card id="k1-fraktal-ceyrek" title="1. Fraktal Çeyrek Yapısı">
        <Table
          headers={["Döngü", "Bölünme"]}
          rows={[
            ["Yıl", "4 × 3 ay"],
            ["Ay", "4 hafta (kısmi ilk hafta atla = distorsiyon)"],
            ["Hafta", "4 gün (Pzt–Per). Cuma ayrı fraktal."],
            ["Gün", "4 × 6 saat = 4 seans"],
            ["Seans", "4 × 90 dk"],
            ["90 dk", "4 × 22.5 dk (mikro)"],
          ]}
        />
      </Card>

      <Card id="k1-gunluk-dongu" title="Günlük Döngü — NY Saatleri">
        <Table
          headers={["Çeyrek", "Seans", "NY Saati"]}
          rows={[
            ["Q1", "Asya", "18:00 – 00:00"],
            ["Q2", "Londra (TDO)", "00:00 – 06:00"],
            ["Q3", "NY AM", "06:00 – 12:00"],
            ["Q4 ★", "NY PM", "12:00 – 18:00 ← asıl seans"],
          ]}
        />
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          NY PM = günün <strong>Q4&apos;ü</strong> = X fazı (continuation/reversal). Karar/bitiş çeyreği.
        </p>
      </Card>

      <Card id="k1-true-opens" title="2. True Opens (TXO)">
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          <strong>Kural:</strong> Her döngünün Q2&apos;sinin açılış fiyatı = o döngünün True Open&apos;ı. <strong>Statik, değişmez.</strong>
        </p>
        <div className="flex gap-4 flex-wrap">
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--color-text-secondary)" }}>
            Fiyat TXO <strong>üstünde</strong> → pahalı → <strong style={{ color: "var(--color-danger)" }}>SHORT</strong> ara
          </div>
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(52,201,126,0.08)", border: "1px solid rgba(52,201,126,0.2)", color: "var(--color-text-secondary)" }}>
            Fiyat TXO <strong>altında</strong> → ucuz → <strong style={{ color: "var(--color-success)" }}>LONG</strong> ara
          </div>
        </div>
        <Table
          headers={["TXO", "NY Saati", "Açıklama"]}
          rows={[
            ["TDO", "00:00", "True Day Open"],
            ["TSO (AM)", "07:30", "NY AM True Session Open"],
            ["PM TSO ★", "13:30", "PM seansı asıl true open (benim seans)"],
            ["TWO", "Pzt 18:00", "True Week Open"],
          ]}
        />
      </Card>

      <Card id="k1-q1-fonksiyon" title="3. Q1'in Fonksiyonu">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px] rounded-lg p-3" style={{ background: "rgba(52,201,126,0.08)", border: "1px solid rgba(52,201,126,0.2)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-success)" }}>✓ İstenen Senaryo</p>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Q1 dar / akumüle → Q2&apos;de <strong>expansion</strong> bekle</p>
          </div>
          <div className="flex-1 min-w-[180px] rounded-lg p-3" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "#f59e0b" }}>⚠ Dikkat</p>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Q1 overextended → Q2&apos;de <strong>konsolidasyon</strong> bekle</p>
          </div>
        </div>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Q1 ayrıca DFR&apos;ın çıktığı yerdir (Katman 3).</p>
      </Card>

      <Card id="k1-triad-amd" title="4. Triad + AMD(X) Fazları">
        <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
          <strong>Triad:</strong> NQ – ES – YM. Tüm CIC&apos;ler bu üçlü arasında okunur.
        </p>
        <Table
          headers={["Faz", "Anlam"]}
          rows={[
            ["A — Accumulation", "Döngünün oluşması için şart"],
            ["M — Manipulation", "Judas Swing — trader&apos;ı ters tarafta (offside) bırakan sahte hareket"],
            ["D — Distribution", "Gerçek hareket; trade edilmesi en kolay faz"],
            ["X — Rev/Cont", "Reversal veya Continuation (A ya da M olamaz)"],
          ]}
        />
        <div className="flex gap-3 flex-wrap mt-2">
          <div className="text-xs px-3 py-1.5 rounded" style={{ background: "var(--color-bg-surface)", color: "var(--color-text-muted)" }}>
            AMDX: Q1 akumüle → Q2 manip → Q3 dağıtım → Q4 X
          </div>
          <div className="text-xs px-3 py-1.5 rounded" style={{ background: "var(--color-bg-surface)", color: "var(--color-text-muted)" }}>
            X-AMD: Q1 X → Q2 akumüle → Q3 manip → Q4 dağıtım
          </div>
        </div>
      </Card>

      <Callout variant="accent">
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-accent)" }}>3 Çıpa — Akılda Kalması Gereken</p>
        <ul className="space-y-1.5">
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>1. <strong>Q2 açılışı = True Open</strong> (her döngüde, statik).</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>2. <strong>Q1 akumüle → Q2 expansion</strong> (aradığımız senaryo).</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>3. <strong>M = Judas Swing</strong>, amacı seni offside bırakmak — crack&apos;ler bu yüzden M bölgesinde oluşur.</li>
        </ul>
      </Callout>
    </div>
  );
}

function Katman2() {
  const tools = [
    {
      name: "SSMT", full: "Sequential SMT", rev: "Reversal (konfirme varsa)", prereq: "Önceki çeyrek H/L",
      desc: "Korelasyon kırılması zamanla birleşince: divergence çeyrekler ARASINDA + önceki çeyreğin gerçek H/L&apos;sinde (random swing&apos;de OLMAZ). SSMT beklemek = doğru zamanı beklemek.",
      rules: [
        "3 işlev: Bias konfirme + Narrative konfirme + doğru zamanı getirir",
        "LTF, HTF&apos;yi konfirme etmeli; etmezse retracement trade&apos;i (reversal değil)",
        "SSMT 4 adımlı süzgeç: (1) hangi cycle? (2) önceki çeyreğin H/L&apos;sinde mi? (3) doğru TF&apos;de mi? (4) narrative&apos;le uyumlu mu?",
        "Gap içi SSMT (HTF SMTF) çok daha yüksek olasılıklı",
        "En güçlü: Q3-Q4 arası",
      ],
    },
    {
      name: "HSSMT", full: "Hidden SSMT", rev: "Reversal", prereq: "SSMT + gövde",
      desc: "Normal SSMT fitile bakar; HSSMT gövdeye (body) bakar. Line grafiğine al veya fitilleri kapat. Algoritma fitili eşitleyip yanıltabilir — gövdede ortaya çıkar.",
      rules: [],
    },
    {
      name: "PSP", full: "Precision Swing Point", rev: "Reversal", prereq: "Narrative",
      desc: "3 mumluk formasyon. Ortadaki (swing) mum korele assetlerde aynı yerde — biri upclose, diğeri downclose. Doji&apos;li PSP daha yüksek olasılıklı. 3 asset&apos;in hepsinde şart DEĞİL.",
      rules: [
        "PSP swing noktada OLMALI (PRC&apos;den ayıran fark)",
        "Bearish PSP ≠ short, Bullish PSP ≠ long — narrative esasında kullanılır",
        "PSP&apos;den direkt girme, sonraki muma bak",
        "PSP ↔ SSMT karşılıklı konfirme",
      ],
    },
    {
      name: "PRC", full: "Precision Candle", rev: "Continuation", prereq: "—",
      desc: "PSP swing noktada, PRC swing noktada DEĞİL. Continuation için. Entry: body kapanışı → PRC&apos;ye limit, stop PRC&apos;nin 1 tık dışı. Çok dar stop = yüksek RR.",
      rules: ["SSMT&apos;ler ve 4H SMTF PRC&apos;yi konfirme eder"],
    },
    {
      name: "PG", full: "Precision Gap", rev: "Güçlü/zayıf bulma", prereq: "SSMT (şart)",
      desc: "Gap BİR asset&apos;te VAR, ötekilerinde YOK (aynı zaman + aynı TF). En güçlü/zayıf asset&apos;i bulur.",
      rules: ["Yalnızca SSMT varsa geçerli", "Entry için sonraki FVG daha mantıklı", "Gap stoplu gir; stop çok uzaksa alma"],
    },
    {
      name: "SMTF", full: "SMT Failure", rev: "Continuation", prereq: "SSMT (şart)",
      desc: "Gap ÜÇÜNDE DE var, ama biri/ikisi gap&apos;i DOLDURURKEN öteki doldurmadan trend yönüne gidiyor. Odin&apos;in continuation için en sevdiği.",
      rules: ["Yalnızca SSMT varsa önemli", "PG vs SMTF: PG&apos;de gap hiç yok (varlık asimetrisi); SMTF&apos;de gap var ama doldurulmuyor (doldurma asimetrisi)"],
    },
    {
      name: "SD", full: "Swing Divergence", rev: "Reversal", prereq: "SSMT/DFR/Main DOL + önceki mum PSP",
      desc: "Biri önceki mumun H/L&apos;sini alırken diğeri almıyor; ya da biri koruma yaparken öteki Turtle Soup.",
      rules: [
        "Tek başına asla sinyal değil",
        "NY: 9:30 öncesi SD = analiz, 9:30 sonrası SD = entry",
        "Accumulation&apos;da KULLANMA — sadece reversal noktalarında",
        "İstisna: Soup olunan SD mumu PSP ise TF alignment&apos;sız direkt entry",
      ],
    },
    {
      name: "O/C Div", full: "Open/Close Divergence", rev: "Reversal", prereq: "SSMT + PSP (2. mum)",
      desc: "3 mum. C1 kapanış ↔ C3 açılış uyumsuzluğu. Yüksek olasılık için 2 şart: SSMT + 2. mum PSP.",
      rules: ["Dizi: SSMT → PSP (uyumlu TF, random değil) → C3 open", "Premium/discount&apos;ta (hem zaman hem fiyat) oluşması önemli"],
    },
  ];

  return (
    <div className="space-y-4">
      <Callout variant="accent">
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          <strong style={{ color: "var(--color-accent)" }}>CIC = Crack in Correlation</strong> = korelasyon kırılması.
          NQ-ES-YM normalde birlikte hareket eder; biri bir şey yaparken öteki yapmazsa = crack.
          Crack&apos;ler <strong>manipülasyon (Judas) bölgelerinde</strong> oluşur.
        </p>
      </Callout>

      <div id="k2-cic-araclari" className="grid gap-3 sm:grid-cols-2" style={{ scrollMarginTop: 160 }}>
        {tools.map((t) => (
          <Card key={t.name}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{t.name}</span>
                <span className="text-xs ml-2" style={{ color: "var(--color-text-muted)" }}>{t.full}</span>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: t.rev.includes("Reversal") ? "rgba(239,68,68,0.12)" : t.rev.includes("Continuation") ? "rgba(52,201,126,0.12)" : "rgba(99,102,241,0.12)",
                    color: t.rev.includes("Reversal") ? "var(--color-danger)" : t.rev.includes("Continuation") ? "var(--color-success)" : "var(--color-accent)",
                  }}>{t.rev}</span>
              </div>
            </div>
            {t.prereq !== "—" && (
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                <strong>Ön şart:</strong> {t.prereq}
              </p>
            )}
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{t.desc}</p>
            {t.rules.length > 0 && (
              <ul className="space-y-1">
                {t.rules.map((r, i) => (
                  <li key={i} className="text-xs flex gap-1.5" style={{ color: "var(--color-text-muted)" }}>
                    <span className="flex-shrink-0">·</span>{r}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>

      <Card id="k2-ozet-tablo" title="Özet Tablo">
        <Table
          headers={["Araç", "Neye bakar", "Rev/Cont", "Ön şart"]}
          rows={[
            ["SSMT",   "Fitil (çeyrek H/L)",         "Reversal (konfirme varsa)", "Önceki çeyrek H/L"],
            ["HSSMT",  "Gövde (body)",                "Reversal",                  "SSMT + gövde"],
            ["PSP",    "Mum rengi (swing&apos;de)",   "Reversal",                  "Narrative"],
            ["PRC",    "Mum rengi (swing dışı)",      "Continuation",              "—"],
            ["PG",     "Gap&apos;in varlığı",         "Güçlü/zayıf bulma",         "SSMT"],
            ["SMTF",   "Gap&apos;in doldurulması",    "Continuation",              "SSMT"],
            ["SD",     "Önceki mum H/L",              "Reversal",                  "Diğer konfirmeler (akümülede yok)"],
            ["O/C Div","C1 kapanış vs C3 açılış",     "Reversal",                  "SSMT + PSP"],
          ]}
        />
      </Card>

      <Callout variant="accent">
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-accent)" }}>3 Büyük Desen</p>
        <ul className="space-y-1.5">
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>1. <strong>SSMT direktir</strong> — PG/SMTF/O-C ona bağımlı; PSP/SSMT karşılıklı konfirme.</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>2. <strong>Rev/Cont sorusu araçta gizli:</strong> PSP/SD/SSMT → reversal; PRC/SMTF → continuation.</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>3. <strong>Hiçbiri tek başına yön sinyali değil</strong> — hepsi narrative esasında.</li>
        </ul>
      </Callout>
    </div>
  );
}

function Katman3() {
  return (
    <div className="space-y-4">
      <Card id="k3-tf-alignment" title="TF Alignment — İki Ayrı Tablo">
        <Callout variant="warn">
          <div className="flex gap-2">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              QT TF uyumu ile MMxM TF uyumu <strong>iki AYRI tablo</strong>. MMxM için olan QT için geçerli DEĞİL.
            </p>
          </div>
        </Callout>

        <SectionTitle>Tablo 1 — QT (Cycle SSMT → Konfirme TF)</SectionTitle>
        <Table
          headers={["Cycle SSMT", "Konfirme TF"]}
          rows={[
            ["MC (Monthly = weekly mumlar arası)", "4H"],
            ["WC (Weekly = daily mumlar arası)",   "1H"],
            ["DC (Daily = 6H mumlar arası)",       "15m"],
            ["90m",                                 "5m"],
          ]}
        />

        <SectionTitle>Tablo 2 — MMxM (HTF PDA → LTF Entry)</SectionTitle>
        <Table
          headers={["HTF PDA", "LTF Entry"]}
          rows={[
            ["Daily", "1H"],
            ["4H",    "15m"],
            ["1H",    "5m"],
            ["15m",   "1m"],
          ]}
        />

        <SectionTitle>Birleştirme Örnekleri</SectionTitle>
        <div className="space-y-1.5">
          {[
            "4H PDA → 15m entry → 15m&apos;i konfirme eden QT = DC SSMT",
            "1H PDA → 5m entry → 5m&apos;i konfirme eden QT = 90m SSMT",
          ].map((ex, i) => (
            <p key={i} className="text-xs px-3 py-2 rounded" style={{ background: "var(--color-bg-surface)", color: "var(--color-text-secondary)" }}>
              → {ex}
            </p>
          ))}
        </div>

        <SectionTitle>3 Altın Kural</SectionTitle>
        <ul className="space-y-1.5">
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>· Grafiği ilk açınca <strong>1H altına asla inme</strong> (analiz monthly&apos;den başlar).</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>· <strong>LTF yalnızca entry için</strong>, analiz için DEĞİL. HTF yapı/narrative belirler, LTF tetik.</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>· Büyük TF&apos;de CIC → uzun sürede konfirme. &quot;Previous Month High CIC&apos;ine 1m reversal&quot; = saçma.</li>
        </ul>
      </Card>

      <Card id="k3-dfr" title="DFR — Defining Range">
        <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--color-text-secondary)" }}>
          Q1&apos;i üçe böl: T1 / T2 / T3. <strong>T1 önemsiz.</strong> DFR = <strong>T2 + T3</strong> (Q1&apos;in 2/3 ve 3/3&apos;ü). 0.5 noktası = POC.
        </p>

        <Table
          headers={["Cycle DFR", "Eşdeğeri", "Konfirme TF"]}
          rows={[
            ["Weekly DFR",       "Pazartesi T2-T3",  "1H"],
            ["Daily DFR (ADFR)", "Asya T2-T3",       "15m"],
            ["90m DFR (★)",      "NYAM DFR — en yüksek olasılıklı", "5m"],
          ]}
        />

        <SectionTitle>Kalite Şartı (kritik)</SectionTitle>
        <Callout variant="warn">
          <ul className="space-y-1">
            <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>· DFR H/L aynı zamanda <strong>Q1&apos;in H/L&apos;si değilse → yüksek olasılıklı DEĞİL.</strong></li>
            <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>· Q1&apos;in consolidation (akumüle) geçmesi gerekir, expansion değil.</li>
            <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>· DFR projeksiyonuna <strong>ASLA limit emri atma</strong> (bölge, nokta değil).</li>
          </ul>
        </Callout>

        <SectionTitle>Kullanım Kuralları</SectionTitle>
        <ul className="space-y-1">
          {[
            "HTF bias + narrative&apos;e dayalı kullan; bölgede crack bekle",
            "Range içi = ideal continuation. Range dışı = ekstra riskli (daha çok reversal)",
            "DFR = QT&apos;nin en yüksek olasılıklı DOL&apos;ları → buralarda büyük kar alımı",
          ].map((r, i) => <Rule key={i}><span className="text-xs">· {r}</span></Rule>)}
        </ul>
      </Card>

      <Card id="k3-doubling-b2b" title="Doubling B2B Theory">
        <Callout variant="warn">
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            PO4&apos;teki &quot;Doubling Theory&quot;den FARKLI. B2B = Back to Back. SSMT ve DFR&apos;a odaklı.
          </p>
        </Callout>

        <SectionTitle>Model 1 — Doubling B2B SSMT</SectionTitle>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Fiyat Q1-Q2 arası SSMT, sonra Q2-Q3 arası da SSMT — <strong>aynı cycle&apos;ın çeyreklerinde.</strong> Hedef tamamlanmamış çünkü.
        </p>
        <ul className="space-y-1 mt-2">
          <li className="text-xs" style={{ color: "var(--color-text-muted)" }}>· <strong>2 Stage SSMT</strong> = farklı cycle&apos;lar. <strong>B2B</strong> = aynı cycle&apos;ın ardışık çeyrekleri.</li>
          <li className="text-xs" style={{ color: "var(--color-text-muted)" }}>· 3 asset de hedefini tamamlamamışsa reversal yok.</li>
          <li className="text-xs" style={{ color: "var(--color-text-muted)" }}>· Cycle içinde <strong>&gt;2 Doubling</strong> → reversal bekleme, orası <strong>LRL</strong> (Low Resistance Liquidity). Max 2.</li>
        </ul>

        <SectionTitle>Model 2 — Doubling B2B DFR</SectionTitle>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Daha az görülür ama SSMT&apos;lerden daha etkili olabilir. İki tarz: (1) DFR H/L&apos;lerinde SSMT, (2) DFR H/L&apos;sindeki SSMT&apos;nin farklı çeyreklerde olması (nadir, çok etkili).
        </p>
      </Card>

      <Callout variant="accent">
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-accent)" }}>Katman 3 Çıpaları</p>
        <ul className="space-y-1.5">
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>1. <strong>İki TF tablosu ayrı:</strong> QT = konfirme, MMxM = entry. Birleştir: HTF PDA → LTF → korele cycle SSMT.</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>2. <strong>DFR = Q1&apos;in T2+T3&apos;ü</strong>, ama H/L = Q1 H/L değilse geçersiz. Projeksiyona limit YOK.</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>3. <strong>B2B aynı cycle, 2 Stage farklı cycle.</strong> Aynı cycle&apos;da &gt;2 Doubling = LRL, reversal değil.</li>
        </ul>
      </Callout>
    </div>
  );
}

const CHECKLIST_QUESTIONS = [
  "Haftanın hangi günü + dün ne yaptı? (Dün akumüle → bugün expansion/volatil)",
  "TDO altında mı üstünde mi, fiyat nasıldı? (İstenen: TDO&apos;dan tepki, etrafında akumüle değil)",
  "Fiyat HTF hedefini tamamladı mı? (Hedef = PXL/PXH. Hedefe gelmeden ters işlem arama)",
  "En son CIC benim bias&apos;ım yönünde mi oldu?",
  "En son CIC sonrası market neler yaptı?",
  "Fiyat önceki range&apos;in 0.5 altında mı üstünde mi? (0.5 üstü short, altı long)",
  "Time-based POI var mı çevrede? (TXO, 9:30, 10:00, 8:30 haber)",
  "Price-based POI var mı çevrede? (PXH/PXL çevresinde crack)",
];

const CHECKLIST_KEY = "katmanlar-checklist";

function Katman4() {
  // localStorage is the source of truth, so there is no read-on-mount effect.
  const raw = useStoredValue(CHECKLIST_KEY, "[]");
  const checked = useMemo<boolean[]>(() => {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length === 8) return arr.map(Boolean);
    } catch {
      // yoksay — bozuk/erişilemez storage
    }
    return Array(8).fill(false);
  }, [raw]);

  const writeChecked = (next: boolean[]) => {
    writeStoredValue(CHECKLIST_KEY, JSON.stringify(next));
  };

  const allPassed = checked.every(Boolean);
  const passedCount = checked.filter(Boolean).length;

  return (
    <div className="space-y-4">
      <Card id="k4-bias-narrative" title="Bias vs Narrative">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[140px] rounded-lg p-3" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <p className="text-xs font-bold mb-1" style={{ color: "var(--color-accent)" }}>BIAS = Yön</p>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Marketin gideceği yön (long/short). &quot;Nereye?&quot;</p>
          </div>
          <div className="flex-1 min-w-[140px] rounded-lg p-3" style={{ background: "rgba(52,201,126,0.08)", border: "1px solid rgba(52,201,126,0.2)" }}>
            <p className="text-xs font-bold mb-1" style={{ color: "var(--color-success)" }}>NARRATIVE = Bölge</p>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>O yönde işlem kuracağın bölgeler. &quot;Nerelerden?&quot;</p>
          </div>
        </div>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Önce yön, sonra o yön içindeki giriş noktaları. İki ayrı katman.</p>
      </Card>

      <Card id="k4-bias-belirleme" title="Bias Belirleme — İki Ayak">
        <SectionTitle>QT Ayağı</SectionTitle>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Previous X H/L&apos;lerde oluşan cracklar, market structure&apos;ı destekleyen yönde.
          Previous X = Ay/Hafta/Gün/6H/4H/1H/90m/30m/15m/5m H/L. <strong>Random yerlerde DEĞİL.</strong>
        </p>
        <SectionTitle>MMxM + Po3 Ayağı</SectionTitle>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          HTF MMxM&apos;in aşaması + fiyatın Weekly/Daily Po3&apos;e göre yeri.
          <strong> HTF cracklar haftalık bazda economic calendar&apos;la desteklenmek ZORUNDA.</strong>
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Cuma çok haber = volatil. Salı az haber = akumüle. Habersiz Pazartesi → genelde haftalık accumulation.
        </p>
      </Card>

      <Card id="k4-mmxm" title="MMxM — Market Maker X Model">
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Her model <strong>accumulation</strong> ile başlar. Satış tarafı (sol) / Alış tarafı (sağ), ortada <strong>SMR (Smart Money Reversal)</strong>.
        </p>
        <Callout variant="warn">
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            SMR önemli zaman dilimine denk gelmeli: <strong>9:30 / 10:00 / 12:00 / 13:30</strong>. Random değil. HTF Po3 konfirme etmeli.
          </p>
        </Callout>
      </Card>

      {/* 8 SORU CHECKLİST */}
      <Card id="k4-checklist" title="8 Soruluk Narrative Checklist">
        <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
          İşleme girmeden önce sırayla sor. Her soru bir filtre — &quot;crack gördüm gireyim&quot; dürtüsünü keser.
        </p>

        {allPassed && (
          <Callout variant="success">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: "var(--color-success)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--color-success)" }}>
                Tüm filtreyi geçtin — işleme girebilirsin.
              </p>
            </div>
          </Callout>
        )}

        <div className="space-y-2">
          {CHECKLIST_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => writeChecked(checked.map((v, idx) => (idx === i ? !v : v)))}
              className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
              style={{
                background: checked[i] ? "rgba(52,201,126,0.08)" : "var(--color-bg-surface)",
                border: `1px solid ${checked[i] ? "rgba(52,201,126,0.3)" : "var(--color-bg-border)"}`,
              }}
            >
              {checked[i]
                ? <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" style={{ color: "var(--color-success)" }} />
                : <Circle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "var(--color-text-muted)" }} />
              }
              <span className="text-xs leading-relaxed" style={{ color: checked[i] ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
                <strong>{i + 1}.</strong> {q}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {passedCount}/8 soru geçildi
          </span>
          <button
            onClick={() => writeChecked(Array(8).fill(false))}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "var(--color-text-muted)", background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)" }}
          >
            <RotateCcw size={12} /> Sıfırla
          </button>
        </div>
      </Card>

      <Card id="k4-dol-poi" title="DOL / POI — Nereye Bakacaksın">
        <Callout variant="warn">
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Belirli previous H/L&apos;ler DIŞINDA hiçbir H/L seni ilgilendirmez. Dışı = engineering liquidity = stop yeri.
          </p>
        </Callout>
        <SectionTitle>Price-based POI</SectionTitle>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Previous Quarter / Month / Week / Day / 6H / 4H / 1H / 90m / 22.5m / 15m / 5m H/L.
          Day ve üstü → HTF/reversal. 22.5m/15m/5m → continuation.
        </p>
        <SectionTitle>Time-based POI (TOI)</SectionTitle>
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          True Opens · NWOG · NDOG · 8:30 Data H/L · 10:00 kuralı. Reversal bölgeleri = PXH/PXL&apos;ler.
        </p>
      </Card>

      <Card id="k4-entry-stop-tp" title="Entry / Stop / TP">
        <SectionTitle>Reversal Şartı — Üstün Kural</SectionTitle>
        <Callout variant="warn">
          <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
            Market reversal yapıyorsa CRACK vermeli. <strong>Crack yoksa reversal yok</strong> — cracksiz pullback %99 engineering (fake).
          </p>
        </Callout>

        <SectionTitle>Entry</SectionTitle>
        <div className="space-y-1.5">
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)" }}>
            <span className="font-semibold" style={{ color: "var(--color-success)" }}>Safe:</span>
            <span style={{ color: "var(--color-text-secondary)" }}> LTF&apos;de CISD sonrası FVG/IFVG ile market emri</span>
          </div>
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)" }}>
            <span className="font-semibold" style={{ color: "#f59e0b" }}>Agresif:</span>
            <span style={{ color: "var(--color-text-secondary)" }}> PSP sonrası direkt market (yeni başlayan kullanmasın)</span>
          </div>
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)" }}>
            <span className="font-semibold" style={{ color: "var(--color-accent)" }}>PRC:</span>
            <span style={{ color: "var(--color-text-secondary)" }}> body kapanışı → PRC&apos;ye limit, stop PRC&apos;nin 1 tık dışı (dar stop = yüksek RR)</span>
          </div>
        </div>

        <SectionTitle>Stop</SectionTitle>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Crack ile korunan bölgenin <strong>1 tık dışı</strong> (swing&apos;e DEĞİL).
          Swing&apos;e atarsan fiyat HOD&apos;u almadan 1 HH daha (Turtle Soup) yapıp seni stop&apos;lar.
        </p>

        <SectionTitle>TP</SectionTitle>
        <ul className="space-y-1">
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>· İlk hedef = <strong>LGL/LGH</strong> (expansion öncesi son low/high). BSL/SSL alması önemli.</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>· Asıl hedef = HTF yapı (Original Consolidation, PDL/PDH).</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>· Çok uzak hedef TP ihtimalini düşürür — günlük işlemde fazla uzatma.</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>· İlk hedef sonrası BE. Stop training ancak market swing&apos;de manipülasyon gösterince.</li>
        </ul>
      </Card>

      <Callout variant="accent">
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-accent)" }}>Tam Akış — 4 Katmanın Birleşimi</p>
        <p className="text-sm leading-relaxed font-medium" style={{ color: "var(--color-text-primary)" }}>
          Bias belirle (QT cracklar + MMxM/Po3) → 8 soruyla narrative kur → DOL/POI seç → crack ile teyit → TF alignment ile LTF&apos;ye in → entry/stop/TP
        </p>
      </Callout>

      <Callout variant="accent">
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-accent)" }}>Katman 4 Çıpaları</p>
        <ul className="space-y-1.5">
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>1. Bias = yön, Narrative = bölge. Önce yön, sonra giriş noktaları.</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>2. <strong>Crack yoksa reversal yok</strong> — cracksiz pullback fake.</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>3. Stop her zaman crack&apos;in 1 tık dışı, swing&apos;e değil (Turtle Soup koruması).</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>4. 8 soru = girmeden önceki filtre. Hepsi geçmeden &quot;crack gördüm gireyim&quot; yok.</li>
        </ul>
      </Callout>
    </div>
  );
}

function Katman5() {
  return (
    <div className="space-y-4">
      <Card id="k5-calisma-duzeni" title="Çalışma Düzeni → Seans Ayrımı">
        <Table
          headers={["Gün Tipi", "Seans", "TR Saati", "Karakter"]}
          rows={[
            ["Evden (2 gün)", "NY AM — ANA SEANS ★", "13:00–19:00", "Tam odak, prime pencere"],
            ["Ofis (3 gün)",  "NY PM — ikincil",      "19:00–01:00 (aktif 20:30–23:30)", "İş çıkışı, sınırlı, cutoff 23:30"],
          ]}
        />
        <Callout variant="warn">
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Tekrar sayısı: Evden sadece 2 gün → AM&apos;i haftada 2 kez canlı görürsün.
            Telafi: ofis günleri AM&apos;i <strong>replay&apos;de</strong> çalış. Hedef: 2 canlı + 3 replay = <strong>5 AM tekrarı/hafta.</strong>
          </p>
        </Callout>
      </Card>

      <Card id="k5-neden-am" title="Neden AM Ana Seans?">
        <ul className="space-y-2">
          <li className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            · AM = günün <strong>Q3&apos;ü = distribution</strong> fazı. &quot;Trade edilmesi en kolay faz&quot; — önceki çeyrekler trendi belirlemiş.
          </li>
          <li className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            · PM (Q4/X) continuation mı reversal mı belirsiz; AM &quot;yön belli, dağıtımı sür&quot; karakterinde.
          </li>
          <li className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            · Asıl crack araçları AM&apos;de CANLI: <strong>9:30 açılışı, 10:00 kuralı, NYAM DFR</strong> (en yüksek olasılıklı DFR).
          </li>
        </ul>
      </Card>

      <Card id="k5-ny-am-saatleri" title="NY AM Saatleri — Ana Seans (Yaz, TR)">
        <Table
          headers={["Olay", "NY", "TR", "Kullanım"]}
          rows={[
            ["AM TSO ★",      "07:30", "14:30", "Asıl true open. Üstü short, altı long. AKTİF izle."],
            ["9:30 açılışı",  "09:30", "16:30", "Kaos/manipülasyon penceresi."],
            ["10:00 kuralı",  "10:00", "17:00", "Yeni 4H mum, rebalance."],
            ["Q3→Q4 bitişi",  "12:00", "19:00", "Seans kapanışı. Cutoff baskısı yok."],
          ]}
        />
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Aktif blok: TR 14:30–19:00.</p>
      </Card>

      <Card id="k5-ny-pm-saatleri" title="NY PM Saatleri — İkincil (Yaz, TR)">
        <Table
          headers={["TXO", "NY", "TR", "Kullanım"]}
          rows={[
            ["PM TSO ★",  "13:30", "20:30", "PM asıl true open. PM Q2 açılışı."],
            ["TDO",       "00:00", "07:00", "8-soru #2 referansı."],
            ["TWO (Pzt)", "18:00", "01:00", "Haftalık bias arka planı."],
          ]}
        />
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Aktif blok: TR 20:30–23:30. Hard cutoff: 23:30.</p>
      </Card>

      <Card id="k5-cycles" title="Senin Cycle'ların">
        <div className="space-y-3">
          <div className="rounded-lg p-3" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Daily Cycle SSMT (6H çeyrekler) — Konfirme TF: 15m</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>AM&apos;de: Londra(Q2)→NY AM(Q3) geçişi. PM&apos;de: NY AM(Q3)→NY PM(Q4) geçişi.</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>90m Cycle SSMT (seans içi) — Konfirme TF: 5m</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>AM çeyrekleri: 06:00–07:30 / 07:30–09:00 / 09:00–10:30 / 10:30–12:00</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>NYAM DFR</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>AM&apos;de CANLI (kendi DFR&apos;ın). PM&apos;de previous/POI referansı.</p>
          </div>
        </div>
      </Card>

      <Card id="k5-enstruman-risk" title="Enstrüman / Risk (BEM Funding — CFD)">
        <Table
          headers={["CFD", "Futures Eşdeğeri", "Not"]}
          rows={[
            ["US30",  "YM (Dow Jones)",   "—"],
            ["US500", "ES (S&P 500)",     "—"],
            ["US100", "NQ (Nasdaq)",      "—"],
          ]}
        />
        <ul className="space-y-1.5 mt-2">
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>· Micro futures (MNQ/MES/MYM) BEM&apos;de YOK. Pozisyon = <strong>lot/risk yüzdesiyle.</strong></li>
          <li className="text-xs" style={{ color: "var(--color-danger)" }}>· CFD spread: geç saat/düşük likiditede genişler, stop tetikler. Özellikle PM cutoff&apos;a yakın.</li>
        </ul>
      </Card>

      <Card id="k5-kis-uyarisi" title="Kış Uyarısı (Kasım Sonrası)">
        <Callout variant="warn">
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            ABD yaz saatinden çıkınca fark 8 saat → tüm NY saatleri TR&apos;de <strong>+1 saat</strong> kayar.
            AM TSO: 14:30 → <strong>15:30</strong>. 9:30 açılışı: 16:30 → <strong>17:30</strong>. PM entry: 20:30 → <strong>21:30.</strong>
            Takvime not düş.
          </p>
        </Callout>
      </Card>

      <Card id="k5-kritik-kural" title="En Kritik Kural — Önce Bir Seansı Oturt">
        <ul className="space-y-2">
          <li className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>· İlk haftalar <strong>iki seansı birden CANLI trade etme.</strong></li>
          <li className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>· <strong>AM&apos;i</strong> oturt (replay + küçük lot). PM&apos;i bu sürede sadece <strong>gözlemle.</strong></li>
          <li className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>· Metrik stabilize olunca (8 soruyu geçen setup kalitesi tutarlı) PM&apos;i canlıya ekle.</li>
          <li className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>· Tutarlılık çoğaltmakla değil, <strong>bir pencereyi mükemmelleştirmekle</strong> gelir.</li>
        </ul>
      </Card>

      <Callout variant="success">
        <div className="flex gap-2 items-start">
          <Zap size={14} className="flex-shrink-0 mt-0.5" style={{ color: "rgba(52,201,126,0.9)" }} />
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: "rgba(52,201,126,0.9)" }}>Montajın Tek Cümlesi</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Evden günü TR 14:30&apos;da AM TSO&apos;da otur (ana seans) → Londra→AM Daily SSMT veya AM içi 90m SSMT ara → 9:30/10:00 + NYAM DFR canlı kullan → 8 soruluk checklist → US100/US500/US30 küçük lot, spread&apos;e dikkat → 19:00&apos;da bitir.
              Ofis günü aynısını PM&apos;de (TR 20:30, cutoff 23:30) + AM&apos;i replay&apos;de çalış.
            </p>
          </div>
        </div>
      </Callout>

      <Callout variant="accent">
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-accent)" }}>Katman 5 Çıpaları</p>
        <ul className="space-y-1.5">
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>1. AM = ana seans (Q3 dağıtım, en zengin); PM = ikincil (Q4 X fazı). Gün tipine göre ayrı.</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>2. AM tek aktif TXO: 07:30 TSO (TR 14:30). 9:30 / 10:00 / NYAM DFR canlı.</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>3. Tekrar az (2 canlı AM/hafta) → ofiste AM&apos;i replay&apos;de çalış.</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>4. BEM = CFD; micro yok, risk lot ile; spread tehlikeli. Kasım&apos;da tüm saatler +1.</li>
          <li className="text-xs" style={{ color: "var(--color-text-secondary)" }}>5. ÖNCE AM&apos;i oturt, PM&apos;i gözlemle. İki seansı paralel canlı öğrenme.</li>
        </ul>
      </Callout>
    </div>
  );
}

// ─── Arama kutusu ──────────────────────────────────────────────────────────

function SearchBox({ onJump }: { onJump: (s: EduSection) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => searchSections(q).slice(0, 8), [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const tabLabel = (t: EduTab) => EDU_TABS.find((x) => x.id === t)?.label ?? t;

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2"
        style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-bg-border)" }}>
        <Search size={14} style={{ color: "var(--color-text-muted)" }} />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Ara: SSMT, DFR, checklist, entry…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--color-text-primary)" }}
        />
        {q && (
          <button onClick={() => { setQ(""); setOpen(false); }} aria-label="Temizle">
            <X size={14} style={{ color: "var(--color-text-muted)" }} />
          </button>
        )}
      </div>

      {open && q && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border overflow-hidden shadow-lg"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-xs" style={{ color: "var(--color-text-muted)" }}>Sonuç yok</p>
          ) : (
            results.map((s) => (
              <button
                key={s.id}
                onClick={() => { onJump(s); setOpen(false); setQ(""); }}
                className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 transition-colors hover:bg-[var(--color-bg-hover)]"
              >
                <span className="text-xs" style={{ color: "var(--color-text-primary)" }}>{s.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ background: "var(--color-bg-surface)", color: "var(--color-text-muted)" }}>{tabLabel(s.tab)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── İçindekiler (ToC) ─────────────────────────────────────────────────────

function TableOfContents({
  tab, isRead, toggle, onJump,
}: {
  tab: EduTab;
  isRead: (id: string) => boolean;
  toggle: (id: string) => void;
  onJump: (s: EduSection) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const sections = sectionsByTab(tab);
  const readCount = sections.filter((s) => isRead(s.id)).length;

  return (
    <div className="rounded-xl border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-3 py-2.5"
      >
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          İçindekiler · {readCount}/{sections.length}
        </span>
        <ChevronDown size={14} style={{ color: "var(--color-text-muted)", transform: collapsed ? "rotate(-90deg)" : "none", transition: "transform 150ms" }} />
      </button>
      {!collapsed && (
        <div className="px-2 pb-2 space-y-0.5">
          {sections.map((s) => {
            const done = isRead(s.id);
            return (
              <div key={s.id} className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-[var(--color-bg-hover)]">
                <button onClick={() => toggle(s.id)} aria-label={done ? "Okunmadı işaretle" : "Okundu işaretle"} className="flex-shrink-0">
                  {done
                    ? <CheckCircle2 size={15} style={{ color: "var(--color-success)" }} />
                    : <Circle size={15} style={{ color: "var(--color-text-muted)" }} />}
                </button>
                <button
                  onClick={() => onJump(s)}
                  className="flex-1 text-left text-xs leading-tight truncate"
                  style={{ color: done ? "var(--color-text-muted)" : "var(--color-text-secondary)" }}
                  title={s.title}
                >
                  {s.title}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────

export default function KatmanlarPage() {
  const [active, setActive] = useState<Tab>("ozet");
  const { ready, isRead, toggle } = useReadProgress();
  const pendingScroll = useRef<string | null>(null);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Sekme değişince beklemedeki scroll'u uygula (içerik yeni render olduğundan)
  useEffect(() => {
    if (pendingScroll.current) {
      const id = pendingScroll.current;
      pendingScroll.current = null;
      requestAnimationFrame(() => scrollToId(id));
    }
  }, [active]);

  const jumpTo = (s: EduSection) => {
    if (s.tab === active) {
      scrollToId(s.id);
    } else {
      pendingScroll.current = s.id;
      setActive(s.tab);
    }
  };

  const totalRead = ready ? EDU_SECTIONS.filter((s) => isRead(s.id)).length : 0;
  const tabSections = sectionsByTab(active);
  const tabRead = tabSections.filter((s) => isRead(s.id)).length;
  const tabPct = tabSections.length ? Math.round((tabRead / tabSections.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Sticky üst blok: başlık + arama + sekmeler + ilerleme */}
      <div
        className="sticky top-0 z-20 -mx-1 px-1 pt-1 pb-2 space-y-3"
        style={{ background: "var(--color-bg-base)" }}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Quarterly Theory</p>
            <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>Education</h2>
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }} suppressHydrationWarning>
            {ready ? `Toplam ${totalRead}/${EDU_SECTION_COUNT} okundu` : ""}
          </p>
        </div>

        <SearchBox onJump={jumpTo} />

        {/* Tab bar — her sekmede okundu/sayı rozeti */}
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex gap-1 min-w-max pb-1">
            {EDU_TABS.map((tab) => {
              const secs = sectionsByTab(tab.id);
              const r = ready ? secs.filter((s) => isRead(s.id)).length : 0;
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1.5"
                  style={{
                    background: isActive ? "var(--color-accent)" : "var(--color-bg-elevated)",
                    color: isActive ? "#fff" : "var(--color-text-secondary)",
                    border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-bg-border)"}`,
                  }}
                >
                  {tab.label}
                  <span
                    className="text-[10px] px-1 rounded"
                    suppressHydrationWarning
                    style={{
                      background: isActive ? "rgba(255,255,255,0.2)" : "var(--color-bg-surface)",
                      color: isActive ? "#fff" : (r === secs.length && r > 0 ? "var(--color-success)" : "var(--color-text-muted)"),
                    }}
                  >
                    {r}/{secs.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Okuma ilerleme çubuğu (aktif sekme) */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${tabPct}%`, background: "var(--color-success)" }} suppressHydrationWarning />
        </div>
      </div>

      {/* İçindekiler */}
      <TableOfContents tab={active} isRead={isRead} toggle={toggle} onJump={jumpTo} />

      {/* Content */}
      {active === "ozet" && <MasterOzet />}
      {active === "k1"   && <Katman1 />}
      {active === "k2"   && <Katman2 />}
      {active === "k3"   && <Katman3 />}
      {active === "k4"   && <Katman4 />}
      {active === "k5"   && <Katman5 />}
    </div>
  );
}
