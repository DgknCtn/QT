import { describe, it, expect } from "vitest";
import { prepDraftKey, serializeDraft, parseDraft, isStaleDraft } from "./use-prep-draft";
import { createEmptyPrepForm } from "@/app/(app)/daily-prep/new/types";

/**
 * Yalnızca saf yardımcılar test edilir. Hook'un React kısmı jsdom gerektirir,
 * bu repoda jsdom kurulu değil.
 */

const NOW = Date.UTC(2026, 7, 16, 12, 0, 0);

describe("prepDraftKey", () => {
  it("yeni prep ile düzenlenen prep farklı anahtar kullanır", () => {
    expect(prepDraftKey("u1")).toBe("qt:prep-draft:u1:new");
    expect(prepDraftKey("u1", "abc123")).toBe("qt:prep-draft:u1:abc123");
  });

  it("iki farklı prep'in anahtarı çakışmaz", () => {
    expect(prepDraftKey("u1", "abc")).not.toBe(prepDraftKey("u1", "def"));
  });

  it("aynı cihazdaki iki kullanıcının taslağı çakışmaz", () => {
    // Ortak cihaz senaryosu: anahtar kullanıcıyı içermediğinde ikinci kişi
    // birincinin yarım hazırlığını "kurtarılacak taslak" olarak görüyordu.
    expect(prepDraftKey("u1")).not.toBe(prepDraftKey("u2"));
    expect(prepDraftKey("u1", "abc")).not.toBe(prepDraftKey("u2", "abc"));
  });
});

describe("serializeDraft / parseDraft", () => {
  it("gidiş-dönüş formu korur", () => {
    const form = { ...createEmptyPrepForm(), primaryInstrument: "NQ", htfBias: "LONG" };
    const draft = parseDraft(serializeDraft(form, NOW));
    expect(draft?.data.primaryInstrument).toBe("NQ");
    expect(draft?.data.htfBias).toBe("LONG");
    expect(draft?.savedAt).toBe(NOW);
  });

  it("iç içe alanları korur", () => {
    const form = createEmptyPrepForm();
    form.entry.entryPrice = "21050";
    form.trueOpens.TDO = { price: "21000", position: "ABOVE", interpretation: "PREMIUM", notes: "" };
    const draft = parseDraft(serializeDraft(form, NOW));
    expect(draft?.data.entry.entryPrice).toBe("21050");
    expect(draft?.data.trueOpens.TDO.position).toBe("ABOVE");
  });

  it.each([
    ["null", null],
    ["boş string", ""],
    ["bozuk JSON", "{ bu json degil"],
    ["JSON ama nesne değil", "42"],
    ["data eksik", JSON.stringify({ version: 1, savedAt: NOW })],
    ["savedAt eksik", JSON.stringify({ version: 1, data: {} })],
    ["eski sürüm", JSON.stringify({ version: 0, savedAt: NOW, data: {} })],
    ["gelecek sürüm", JSON.stringify({ version: 99, savedAt: NOW, data: {} })],
  ])("%s → null (fırlatmaz)", (_label, raw) => {
    expect(parseDraft(raw as string | null)).toBeNull();
  });
});

describe("isStaleDraft", () => {
  const draft = parseDraft(serializeDraft(createEmptyPrepForm(), NOW))!;

  it("aynı gün içindeki taslak taze", () => {
    expect(isStaleDraft(draft, NOW + 2 * 60 * 60 * 1000)).toBe(false);
  });

  it("36 saat sınırında hâlâ taze", () => {
    expect(isStaleDraft(draft, NOW + 36 * 60 * 60 * 1000)).toBe(false);
  });

  it("36 saati aşınca bayat — eski seansın fiyatları bugüne sızmasın", () => {
    expect(isStaleDraft(draft, NOW + 36 * 60 * 60 * 1000 + 1)).toBe(true);
  });
});
