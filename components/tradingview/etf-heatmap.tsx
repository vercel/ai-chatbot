'use client'

import React, { useEffect, useRef, memo } from 'react'

export function ETFHeatmap({}) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return

    const script = document.createElement('script')
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-etf-heatmap.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      dataSource: 'AllUSEtf',
      blockSize: 'aum',
      blockColor: 'change',
      grouping: 'asset_class',
      locale: 'en',
      symbolUrl: '',
      colorTheme: 'light',
      hasTopBar: true,
      isDataSetEnabled: true,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: '100%',
      height: '100%'
    })

    container.current.appendChild(script)

    return () => {
      if (container.current) {
        container.current.removeChild(script)
      }
    }
  }, [])

  return (
    <div style={{ height: '500px' }}>
      <div
        className="tradingview-widget-container"
        ref={container}
        style={{ height: '100%', width: '100%' }}
      >
        <div
          className="tradingview-widget-container__widget"
          style={{ height: 'calc(100% - 32px)', width: '100%' }}
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
  )
}

export default memo(ETFHeatmap)
