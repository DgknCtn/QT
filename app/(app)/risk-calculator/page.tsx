"use client";

import { useState, useEffect } from "react";

const INSTRUMENTS: Record<string, { label: string; dollarPerPoint: number; tickSize: number; dollarPerTick: number; type: "futures" | "forex" | "crypto"; unit?: string }> = {
  NQ:      { label: "NQ  (Nasdaq Futures)",    dollarPerPoint: 20,   tickSize: 0.25,   dollarPerTick: 5,     type: "futures" },
  ES:      { label: "ES  (S&P 500 Futures)",   dollarPerPoint: 50,   tickSize: 0.25,   dollarPerTick: 12.5,  type: "futures" },
  YM:      { label: "YM  (Dow Futures)",       dollarPerPoint: 5,    tickSize: 1,      dollarPerTick: 5,     type: "futures" },
  RTY:     { label: "RTY (Russell Futures)",   dollarPerPoint: 50,   tickSize: 0.10,   dollarPerTick: 5,     type: "futures" },
  MNQ:     { label: "MNQ (Micro Nasdaq)",      dollarPerPoint: 2,    tickSize: 0.25,   dollarPerTick: 0.5,   type: "futures" },
  MES:     { label: "MES (Micro S&P)",         dollarPerPoint: 5,    tickSize: 0.25,   dollarPerTick: 1.25,  type: "futures" },
  MYM:     { label: "MYM (Micro Dow)",         dollarPerPoint: 0.5,  tickSize: 1,      dollarPerTick: 0.5,   type: "futures" },
  M2K:     { label: "M2K (Micro Russell)",     dollarPerPoint: 5,    tickSize: 0.10,   dollarPerTick: 0.5,   type: "futures" },
  EURUSD:  { label: "EUR/USD",                 dollarPerPoint: 10,   tickSize: 0.0001, dollarPerTick: 1,     type: "forex" },
  GBPUSD:  { label: "GBP/USD",                 dollarPerPoint: 10,   tickSize: 0.0001, dollarPerTick: 1,     type: "forex" },
  AUDUSD:  { label: "AUD/USD",                 dollarPerPoint: 10,   tickSize: 0.0001, dollarPerTick: 1,     type: "forex" },
  USDJPY:  { label: "USD/JPY",                 dollarPerPoint: 10,   tickSize: 0.01,   dollarPerTick: 1,     type: "forex" },
  BTC:     { label: "BTC (Bitcoin)",           dollarPerPoint: 1,    tickSize: 1,      dollarPerTick: 1,     type: "crypto", unit: "BTC" },
  ETH:     { label: "ETH (Ethereum)",          dollarPerPoint: 1,    tickSize: 0.01,   dollarPerTick: 0.01,  type: "crypto", unit: "ETH" },
  SOL:     { label: "SOL (Solana)",            dollarPerPoint: 1,    tickSize: 0.01,   dollarPerTick: 0.01,  type: "crypto", unit: "SOL" },
  BNB:     { label: "BNB",                     dollarPerPoint: 1,    tickSize: 0.01,   dollarPerTick: 0.01,  type: "crypto", unit: "BNB" },
  XRP:     { label: "XRP (Ripple)",            dollarPerPoint: 1,    tickSize: 0.0001, dollarPerTick: 0.0001, type: "crypto", unit: "XRP" },
  AVAX:    { label: "AVAX (Avalanche)",        dollarPerPoint: 1,    tickSize: 0.01,   dollarPerTick: 0.01,  type: "crypto", unit: "AVAX" },
};

const QUICK_RISKS = [0.5, 1, 1.5, 2];

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function RiskCalculatorPage() {
  const [balance, setBalance]     = useState("");
  const [riskPct, setRiskPct]     = useState("1");
  const [instrument, setInstrument] = useState("NQ");
  const [entry, setEntry]         = useState("");
  const [stop, setStop]           = useState("");

  // Persist balance in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("rc-balance");
    if (saved) setBalance(saved);
  }, []);
  useEffect(() => {
    if (balance) localStorage.setItem("rc-balance", balance);
  }, [balance]);

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

  const isCrypto = inst.type === "crypto";
  const tickDecimals = (inst.tickSize.toString().split(".")[1] ?? "").length;
  const contractDecimals = isCrypto ? 4 : 2;
  const rTargetDecimals = isCrypto
    ? Math.max(2, tickDecimals)
    : instrument === "EURUSD" || instrument === "GBPUSD" || instrument === "AUDUSD"
      ? 5
      : instrument === "USDJPY" ? 3 : 2;

  let riskDollar = 0;
  let pointsToStop = 0;
  let contracts = 0;
  let contractsFloor = 0;
  let direction: "LONG" | "SHORT" = "LONG";
  const rTargets: { label: string; price: number }[] = [];

  if (valid) {
    riskDollar   = balanceNum * (riskPctNum / 100);
    pointsToStop = Math.abs(entryNum - stopNum);
    contracts    = riskDollar / (pointsToStop * inst.dollarPerPoint);
    contractsFloor = Math.floor(contracts);
    direction    = entryNum > stopNum ? "LONG" : "SHORT";
    const rUnit  = entryNum - stopNum;
    for (let r = 1; r <= 3; r++) {
      rTargets.push({ label: `${r}R`, price: entryNum + rUnit * r });
    }
  }

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
              onChange={(e) => setBalance(e.target.value)}
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
            {inst.dollarPerPoint}$/puan · tick: {inst.tickSize} · tick değeri: ${inst.dollarPerTick}
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
              { label: "Risk ($)", value: `$${fmt(riskDollar)}` },
              { label: "Stop (puan)", value: fmt(pointsToStop, 2) },
              { label: "$/Puan", value: `$${inst.dollarPerPoint}` },
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
              {isCrypto ? "Hesaplanan Miktar" : "Hesaplanan Kontrat"}
            </p>
            <p className="text-4xl font-black font-mono" style={{ color: "var(--color-accent)" }}>
              {fmt(contracts, contractDecimals)}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              {isCrypto ? (
                <>→ <strong style={{ color: "var(--color-text-primary)" }}>{fmt(contracts, 4)} {inst.unit ?? "birim"}</strong></>
              ) : (
                <>→ <strong style={{ color: "var(--color-text-primary)" }}>{contractsFloor} tam kontrat</strong>{" "}(aşağı yuvarlandı)</>
              )}
            </p>
            {!isCrypto && contractsFloor === 0 && contracts > 0 && (
              <p className="text-xs mt-2" style={{ color: "#f59e0b" }}>
                ⚠ Minimum 1 kontrat için hesap bakiyeni veya risk%'ini artır
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
                    +${fmt(Math.abs(price - entryNum) * inst.dollarPerPoint * (isCrypto ? contracts : contractsFloor))}
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
