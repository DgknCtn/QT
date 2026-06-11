"use client";

import { useEffect, useRef } from "react";

export function InvestingCalendarWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container__widget";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme:    "dark",
      isTransparent: true,
      width:         "100%",
      height:        "600",
      locale:        "tr",
      importanceFilter: "-1,0,1",
      countryFilter:  "us,eu,gb,jp,au,nz,ca,ch",
    });

    container.appendChild(wrapper);
    container.appendChild(script);

    return () => { container.innerHTML = ""; };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{
        borderRadius: 12,
        border: "1px solid var(--color-bg-border)",
        overflow: "hidden",
        minHeight: 600,
      }}
    />
  );
}
