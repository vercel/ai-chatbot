'use client'

import React, { useEffect, useRef, memo } from 'react'

export function MarketOverview({}) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return

    const script = document.createElement('script')
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      width: '100%',
      height: '100%',
      symbolsGroups: [
        {
          name: 'Indices',
          originalName: 'Indices',
          symbols: [
            {
              name: 'FOREXCOM:SPXUSD',
              displayName: 'S&P 500 Index'
            },
            {
              name: 'FOREXCOM:NSXUSD',
              displayName: 'US 100 Cash CFD'
            },
            {
              name: 'FOREXCOM:DJI',
              displayName: 'Dow Jones Index'
            },
            {
              name: 'INDEX:NKY',
              displayName: 'Nikkei 225'
            },
            {
              name: 'INDEX:DEU40',
              displayName: 'DAX Index'
            },
            {
              name: 'FOREXCOM:UKXGBP',
              displayName: 'FTSE 100 Index'
            }
          ]
        },
        {
          name: 'Futures',
          originalName: 'Futures',
          symbols: [
            {
              name: 'CME_MINI:ES1!',
              displayName: 'S&P 500'
            },
            {
              name: 'CME:6E1!',
              displayName: 'Euro'
            },
            {
              name: 'COMEX:GC1!',
              displayName: 'Gold'
            },
            {
              name: 'NYMEX:CL1!',
              displayName: 'WTI Crude Oil'
            },
            {
              name: 'NYMEX:NG1!',
              displayName: 'Gas'
            },
            {
              name: 'CBOT:ZC1!',
              displayName: 'Corn'
            }
          ]
        },
        {
          name: 'Bonds',
          originalName: 'Bonds',
          symbols: [
            {
              name: 'CBOT:ZB1!',
              displayName: 'T-Bond'
            },
            {
              name: 'CBOT:UB1!',
              displayName: 'Ultra T-Bond'
            },
            {
              name: 'EUREX:FGBL1!',
              displayName: 'Euro Bund'
            },
            {
              name: 'EUREX:FBTP1!',
              displayName: 'Euro BTP'
            },
            {
              name: 'EUREX:FGBM1!',
              displayName: 'Euro BOBL'
            }
          ]
        },
        {
          name: 'Forex',
          originalName: 'Forex',
          symbols: [
            {
              name: 'FX:EURUSD',
              displayName: 'EUR to USD'
            },
            {
              name: 'FX:GBPUSD',
              displayName: 'GBP to USD'
            },
            {
              name: 'FX:USDJPY',
              displayName: 'USD to JPY'
            },
            {
              name: 'FX:USDCHF',
              displayName: 'USD to CHF'
            },
            {
              name: 'FX:AUDUSD',
              displayName: 'AUD to USD'
            },
            {
              name: 'FX:USDCAD',
              displayName: 'USD to CAD'
            }
          ]
        }
      ],
      showSymbolLogo: true,
      isTransparent: true,
      colorTheme: 'light',
      locale: 'en'
      // backgroundColor: "#ffffff"
    })

    container.current.appendChild(script)

    return () => {
      if (container.current) {
        container.current.removeChild(script)
      }
    }
  }, [])

  return (
    <div style={{ height: '300px' }}>
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

export default memo(MarketOverview)