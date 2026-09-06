"use client";

import { useState } from "react";
import { useStoredValue, writeStoredValue } from "@/lib/use-stored-value";
import {
  INSTRUMENTS, positionSize, usdPerTick, usdPerPricePoint, qtyDecimals,
} from "@/lib/units/instruments";
import { formatUsd } from "@/lib/money";

const QUICK_RISKS = [0.5, 1, 1.5, 2];

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function RiskCalculatorPage() {
  // Persisted directly: localStorage is the single source of truth for the
  // balance, so there is no read-on-mount effect to fall out of sync with.
  const balance = useStoredValue("rc-balance", "");
  const [riskPct, setRiskPct]     = useState("1");
  const [instrument, setInstrument] = useState("NQ");
  const [entry, setEntry]         = useState("");
  const [stop, setStop]           = useState("");

  const inst = INSTRUMENTS[instrument];

  const balanceNum  = parseFloat(balance);
  const riskPctNum  = parseFloat(riskPct);
  const entryNum    = parseFloat(entry);
  const stopNum     = parseFloat(stop);

  const valid =
    !isNaN(balanceNum) && balanceNum > 0 &&
    !isNaN(riskPctNum) && riskPctNum > 0 &&
    !isNaN(entryNum)   && entryNum > 0 &&
    !isNaN(stopNum)    && stopNum > 0 &&
    entryNum !== stopNum;

  const contractDecimals = qtyDecimals(inst);
  const rTargetDecimals = inst.priceDecimals;

  let riskDollar = 0;
  let pointsToStop = 0;
  let direction: "LONG" | "SHORT" = "LONG";
  // Birim modeli hesabı yapıyor; sayfa yalnızca sonucu gösteriyor.
  // Eskiden burada futures/forex/kripto tek formülden geçiyordu ve forex'te
  // lot yerine "10.000 kontrat" çıkıyordu.
  let size: ReturnType<typeof positionSize> = null;
  const rTargets: { label: string; price: number }[] = [];

  if (valid) {
    riskDollar   = balanceNum * (riskPctNum / 100);
    pointsToStop = Math.abs(entryNum - stopNum);
    direction    = entryNum > stopNum ? "LONG" : "SHORT";
    size         = positionSize(inst, riskDollar, entryNum, stopNum);
    const rUnit  = entryNum - stopNum;
    for (let r = 1; r <= 3; r++) {
      rTargets.push({ label: `${r}R`, price: entryNum + rUnit * r });
    }
  }

  const qty = size?.qty ?? 0;
  const rawQty = size?.rawQty ?? 0;
  const perPointUsd = valid ? usdPerPricePoint(inst, entryNum) : inst.quotePerPricePoint;

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors";
  const inputStyle = {
    background: "var(--color-bg-surface)",
    borderColor: "var(--color-bg-border)",
    color: "var(--color-text-primary)",
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Risk Hesaplayıcı</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Hesap büyüklüğü + risk % + entry/stop → kaç kontrat alacağını hesapla
        </p>
      </div>

      {/* Input card */}
      <div className="rounded-xl border p-5 space-y-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        {/* Balance + Risk row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Hesap Bakiyesi ($)</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => writeStoredValue("rc-balance", e.target.value)}
              placeholder="10000"
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Risk (%)</label>
            <input
              type="number"
              step="0.1"
              value={riskPct}
              onChange={(e) => setRiskPct(e.target.value)}
              placeholder="1"
              className={inputCls}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Quick risk buttons */}
        <div className="flex gap-2">
          {QUICK_RISKS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRiskPct(String(r))}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
              style={{
                background: riskPct === String(r) ? "var(--color-accent)" : "var(--color-bg-surface)",
                borderColor: riskPct === String(r) ? "var(--color-accent)" : "var(--color-bg-border)",
                color: riskPct === String(r) ? "#fff" : "var(--color-text-muted)",
              }}
            >
              {r}%
            </button>
          ))}
        </div>

        {/* Instrument */}
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Enstrüman</label>
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            className={inputCls}
            style={inputStyle}
          >
            <optgroup label="Futures">
              {Object.entries(INSTRUMENTS).filter(([, v]) => v.type === "futures").map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </optgroup>
            <optgroup label="Forex (Std Lot)">
              {Object.entries(INSTRUMENTS).filter(([, v]) => v.type === "forex").map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </optgroup>
            <optgroup label="Crypto (Spot)">
              {Object.entries(INSTRUMENTS).filter(([, v]) => v.type === "crypto").map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </optgroup>
          </select>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            {formatUsd(perPointUsd)}/puan · tick: {inst.tickSize} · tick değeri: {formatUsd(usdPerTick(inst, valid ? entryNum : 1))}
            {inst.quoteCurrency !== "USD" && inst.quoteCurrency !== "USDT" && " (kura göre)"}
          </p>
        </div>

        {/* Entry + Stop */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Entry Fiyatı</label>
            <input
              type="number"
              step="0.01"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="21000"
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Stop Fiyatı</label>
            <input
              type="number"
              step="0.01"
              value={stop}
              onChange={(e) => setStop(e.target.value)}
              placeholder="20980"
              className={inputCls}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Result card */}
      {valid && (
        <div className="rounded-xl border p-5 space-y-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          {/* Direction badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded"
              style={{
                background: direction === "LONG" ? "rgba(52,201,126,0.15)" : "rgba(239,68,68,0.15)",
                color: direction === "LONG" ? "#34c97e" : "#ef4444",
              }}>
              {direction}
            </span>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {pointsToStop.toFixed(2)} puan stop
            </span>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Risk ($)", value: formatUsd(riskDollar) },
              { label: "Stop (puan)", value: fmt(pointsToStop, rTargetDecimals) },
              { label: "$/Puan", value: formatUsd(perPointUsd) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg py-3" style={{ background: "var(--color-bg-surface)" }}>
                <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Contract result — hero */}
          <div className="rounded-xl p-4 text-center" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid var(--color-accent)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Hesaplanan Pozisyon Büyüklüğü
            </p>
            <p className="text-4xl font-black font-mono" style={{ color: "var(--color-accent)" }}>
              {fmt(qty, contractDecimals)}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              → <strong style={{ color: "var(--color-text-primary)" }}>{fmt(qty, contractDecimals)} {size?.unitLabel ?? ""}</strong>
              {" "}(işlem adımına aşağı yuvarlandı · ham: {fmt(rawQty, contractDecimals + 2)})
            </p>
            {size && (
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                Bu büyüklükte fiili risk: {formatUsd(size.riskAtQtyUsd)} / {formatUsd(riskDollar)} bütçe
              </p>
            )}
            {size?.belowMinimum && (
              <p className="text-xs mt-2" style={{ color: "#f59e0b" }}>
                ⚠ Bu risk bütçesiyle minimum işlem büyüklüğü ({fmt(inst.minQty, contractDecimals)}{" "}
                {size.unitLabel}) karşılanmıyor. Mikro kontrat / daha küçük enstrüman
                değerlendirilebilir; uygun değilse bu işlemi geçmek de geçerli bir karardır.
              </p>
            )}
          </div>

          {/* R targets */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>R Hedefleri</p>
            <div className="grid grid-cols-3 gap-2">
              {rTargets.map(({ label, price }) => (
                <div key={label} className="rounded-lg px-3 py-2 text-center" style={{ background: "var(--color-bg-surface)" }}>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                  <p className="text-sm font-semibold font-mono" style={{ color: "var(--color-text-primary)" }}>
                    {fmt(price, rTargetDecimals)}
                  </p>
                  <p className="text-xs" style={{ color: "#34c97e" }}>
                    {formatUsd(Math.abs(price - entryNum) * perPointUsd * qty, { signed: true })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
