"use client";

import { useEffect, useId, useRef } from "react";

// Maps internal instrument names to TradingView symbols
const TV_SYMBOL: Record<string, string> = {
  NQ:      "CME_MINI:NQ1!",
  ES:      "CME_MINI:ES1!",
  YM:      "CME_MINI:YM1!",
  XAUUSD:  "TVC:GOLD",
  XAGUSD:  "TVC:SILVER",
  BTCUSD:  "COINBASE:BTCUSD",
  ETHUSD:  "COINBASE:ETHUSD",
  XRPUSD:  "BINANCE:XRPUSDT",
  SOLUSD:  "BINANCE:SOLUSDT",
  EURUSD:  "FX:EURUSD",
  GBPUSD:  "FX:GBPUSD",
  USDJPY:  "FX:USDJPY",
  DXY:     "TVC:DXY",
};

interface Props {
  instrument: string;
  interval?: "1" | "5" | "15" | "60" | "240" | "D" | "W";
  height?: number;
  compact?: boolean; // true = mini widget, false = full advanced chart
}

/** Minimal shape of the TradingView script's global, which ships no types. */
type TradingViewGlobal = { widget: new (options: Record<string, unknown>) => void };

export function TvChartWidget({ instrument, interval = "60", height = 400, compact = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // useId gives a stable, SSR-safe unique id -- Math.random() during render is
  // impure and can produce a different value on re-render.
  const widgetId = `tv_${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const symbol = TV_SYMBOL[instrument.toUpperCase()] ?? `FX:${instrument}`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean up any previous widget
    container.innerHTML = "";

    const innerDiv = document.createElement("div");
    innerDiv.id = widgetId;
    innerDiv.style.height = `${height}px`;
    innerDiv.style.width = "100%";
    container.appendChild(innerDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      const tv = (window as unknown as { TradingView?: TradingViewGlobal }).TradingView;
      if (!tv) return;
      new tv.widget({
        autosize:          false,
        width:             container.offsetWidth || "100%",
        height,
        symbol,
        interval,
        timezone:          "America/New_York",
        theme:             "dark",
        style:             "1",
        locale:            "en",
        toolbar_bg:        "#1a1a2e",
        enable_publishing: false,
        hide_top_toolbar:  compact,
        hide_legend:       compact,
        save_image:        false,
        container_id:      widgetId,
        backgroundColor:   "rgba(13, 13, 23, 1)",
        gridColor:         "rgba(255, 255, 255, 0.05)",
      });
    };
    container.appendChild(script);

    return () => { container.innerHTML = ""; };
  }, [symbol, interval, height, compact, widgetId]);

  return (
    <div
      ref={containerRef}
      style={{ height, minHeight: height, width: "100%" }}
      className="rounded-lg overflow-hidden"
    />
  );
}

// Mini sparkline version using the lightweight widget
export function TvMiniChart({ instrument }: { instrument: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const symbol = TV_SYMBOL[instrument.toUpperCase()] ?? `FX:${instrument}`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width:            "100%",
      height:           "100%",
      locale:           "en",
      dateRange:        "1M",
      colorTheme:       "dark",
      isTransparent:    true,
      autosize:         true,
      largeChartUrl:    "",
      noTimeScale:      false,
    });
    container.appendChild(script);

    return () => { container.innerHTML = ""; };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" ref={containerRef} style={{ height: 120, width: "100%" }} />
  );
}
