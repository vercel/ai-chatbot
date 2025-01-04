"use client";

import React, { useEffect, useRef, memo } from "react";

type ComparisonSymbolObject = {
  symbol: string;
  position: "SameScale";
};

interface StockChartProps {
  symbol?: string;
  comparisonSymbols?: ComparisonSymbolObject[];
}

const StockChartComponent = ({
  symbol,
  comparisonSymbols,
}: StockChartProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !container.current ||
      !symbol ||
      !comparisonSymbols ||
      container.current.querySelector(`#${symbol}-chart`)
    ) {
      return;
    }

    const script = document.createElement("script");
    script.id = `${symbol}-chart`;
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "light",
      style: comparisonSymbols.length === 0 ? "1" : "2",
      hide_volume: comparisonSymbols.length === 0 ? false : true,
      locale: "en",
      backgroundColor: "rgba(255, 255, 255, 1)",
      gridColor: "rgba(247, 247, 247, 1)",
      withdateranges: true,
      hide_side_toolbar: comparisonSymbols.length > 0 ? true : false,
      allow_symbol_change: true,
      compareSymbols: comparisonSymbols,
      calendar: false,
      hide_top_toolbar: true,
      support_host: "https://www.tradingview.com",
    });

    container.current.appendChild(script);
  }, [symbol, comparisonSymbols]);

  return (
    <div style={{ height: "500px" }}>
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
};

export const StockChart = memo(StockChartComponent);

StockChart.displayName = "StockChart";
