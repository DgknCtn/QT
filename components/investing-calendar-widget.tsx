"use client";

export function InvestingCalendarWidget() {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--color-bg-border)",
        overflow: "auto",
      }}
    >
      <iframe
        src="https://sslecal2.investing.com?ecoDayBackground=%23131722&leftColumnColor=%23131722&centralColumnColor=%231e222d&contractLinkColor=%236366f1&borderColor=%23252933&columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone&countries=5,22,17,39,72,36,110,43,14,48,56,76,11,37&calType=week&timeZone=55&lang=56"
        width="100%"
        height="467"
        frameBorder={0}
        // @ts-expect-error — non-standard but supported by investing.com embed
        allowTransparency="true"
        marginWidth={0}
        marginHeight={0}
        style={{ minWidth: 650, display: "block" }}
      />
    </div>
  );
}
