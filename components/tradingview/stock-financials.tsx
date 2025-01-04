"use client";

import React, { useEffect, useRef, memo } from "react";

export function StockFinancials({ props: symbol }: { props: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !container.current ||
      container.current.querySelector("#stock-financial")
    )
      return;
    const script = document.createElement("script");
    script.id = "stock-financial";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-financials.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "isTransparent": true,
        "largeChartUrl": "",
        "displayMode": "regular",
        "width": "100%",
        "height": "100%",
        "colorTheme": "light",
        "symbol": "${symbol}",
        "locale": "en"
      }`;

    container.current.appendChild(script);

    return () => {
      if (container.current) {
        const scriptElement = container.current.querySelector("script");
        if (scriptElement) {
          container.current.removeChild(scriptElement);
        }
      }
    };
  }, [symbol]);

  return (
    <div style={{ height: "800px" }}>
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget"></div>
        <div className="tradingview-widget-copyright">
          <a
            href="https://www.tradingview.com/"
            rel="noopener nofollow"
            target="_blank"
          >
            <span className="">Track all markets on TradingView</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default memo(StockFinancials);
