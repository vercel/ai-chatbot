"use client";

import React, { useEffect, useRef, memo } from "react";

export function MarketTrending({}) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !container.current ||
      container.current.querySelector("#market-trending")
    )
      return;

    const script = document.createElement("script");
    script.id = "market-trending";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "light",
      dateRange: "1D",
      exchange: "US",
      showChart: true,
      locale: "en",
      largeChartUrl: "",
      isTransparent: false,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      width: "100%",
      height: "100%",
      plotLineColorGrowing: "rgba(106, 168, 79, 1)",
      plotLineColorFalling: "rgba(255, 0, 0, 1)",
      gridLineColor: "rgba(0, 0, 0, 0)",
      scaleFontColor: "rgba(19, 23, 34, 1)",
      belowLineFillColorGrowing: "rgba(41, 98, 255, 0.12)",
      belowLineFillColorFalling: "rgba(41, 98, 255, 0.12)",
      belowLineFillColorGrowingBottom: "rgba(41, 98, 255, 0)",
      belowLineFillColorFallingBottom: "rgba(41, 98, 255, 0)",
      symbolActiveColor: "rgba(60, 120, 216, 0.12)",
    });

    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.removeChild(script);
      }
    };
  }, []);

  return (
    <div style={{ height: "540px" }}>
      <div
        className="tradingview-widget-container"
        ref={container}
        style={{ height: "100%", width: "100%" }}
      >
        <div
          className="tradingview-widget-container__widget"
          style={{ height: "calc(100% - 32px)", width: "100%" }}
        ></div>
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

export default memo(MarketTrending);
