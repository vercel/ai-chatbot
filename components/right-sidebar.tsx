'use client'
import { JSX, SVGProps } from 'react'
import React, { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Header } from '@/components/header'

interface TokenMetadata {
  name: string
  symbol: string
  token_standard: string
}

interface TokenInfo {
  balance: number
}

interface Asset {
  interface: string
  content: {
    metadata: TokenMetadata
  }
  token_info: TokenInfo
}

export default function Component() {
  const [assets, setAssets] = useState<Asset[]>([])

  const wallet = useWallet()
  const key = process.env.NEXT_PUBLIC_HELIUS_API_KEY

  const user = wallet.publicKey?.toBase58()
  const url = `https://mainnet.helius-rpc.com/?api-key=${key}`

  useEffect(() => {
    const getAssetsByOwner = async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'my-id',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: `${user}`,
            page: 1, // Starts at 1
            limit: 1000,
            displayOptions: {
              showFungible: true
            }
          }
        })
      })
      const { result } = await response.json()

      if (result?.items?.length > 0) {
        let data: Asset[] = await result.items

        data = data.sort((a, b) => {
          if (
            a.interface === 'FungibleToken' &&
            b.interface !== 'FungibleToken'
          ) {
            return -1
          }
          if (
            a.interface !== 'FungibleToken' &&
            b.interface === 'FungibleToken'
          ) {
            return 1
          }
          return 0
        })

        setAssets(data)
        console.log(
          'Assets by Owner on the NAAAAAAAVAVAAVAVABAAARRR IS DATA FETCHED IS THIS : ',
          data
        )

        console.log('ASSESTS IS THIS : ', assets)
      } else {
        console.error('Result or Result.items is undefined', result)
      }
    }

    getAssetsByOwner()
  }, [user])

  useEffect(() => {
    console.log('Assets have been updated: ', assets)
  }, [assets])

  // Group assets by their interface type
  const splTokens = assets.filter(asset => asset.interface === 'FungibleToken')
  const nfts = assets.filter(asset => asset.interface === 'V1_NFT')

  return (
    <aside className="h-[97vh] overflow-y-scroll flex flex-col items-center p-4 gap-2 bg-[#101010] m-4 rounded-[28px] ring-[3px] ring-[#1a1a1a]">
      <Header />
      <div className="w-full flex justify-center pt-6 pb-4">
        <svg
          width="53"
          height="65"
          viewBox="0 0 53 65"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clip-path="url(#clip0_4063_878)">
            <g clip-path="url(#clip1_4063_878)">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M22.67 12.9322C23.0526 11.4922 23.1744 9.89706 22.044 7.61306C22.757 6.23706 22.5136 4.43131 21.0875 2.94575C19.7831 1.57166 16.2702 0.822444 14.5484 0.529053C22.1136 6.98662 21.4181 11.6906 20.8789 13.2463C20.5659 13.312 20.2528 13.3833 19.9397 13.4605C15.6441 12.315 13.4352 10.9957 10.67 8.56054C11.2092 7.16958 10.8265 5.45863 9.383 4.11028C8.07865 2.90576 4.91357 2.35844 3.08748 2.13601C4.06139 3.97288 8.60039 11.1423 16.7743 14.4757C7.10474 18.2689 0.252563 27.6812 0.252563 38.68C0.252563 53.0254 11.9047 64.6715 26.2526 64.6715C40.6004 64.6715 52.2526 53.0254 52.2526 38.68C52.2526 24.3344 40.6004 12.6877 26.2526 12.6877C25.0352 12.6877 23.8526 12.7711 22.67 12.9322ZM18.2006 19.5757C10.131 25.3221 8.75711 37.2774 15.1571 46.2567C21.5397 55.236 33.2961 57.8609 41.3657 52.1144C49.4352 46.3682 50.8092 34.4129 44.4092 25.4336C38.0265 16.4541 26.2702 13.8294 18.2006 19.5757ZM39.1744 27.8974C41.3657 27.8974 43.1398 29.6779 43.1398 31.8713C43.1398 34.0645 41.3657 35.8451 39.1744 35.8451C36.9831 35.8451 35.1918 34.0645 35.1918 31.8713C35.1918 29.6779 36.9831 27.8974 39.1744 27.8974ZM28.044 27.8974C30.2353 27.8974 32.0267 29.6779 32.0267 31.8713C32.0267 34.0645 30.2353 35.8451 28.044 35.8451C25.8527 35.8451 24.0786 34.0645 24.0786 31.8713C24.0786 29.6779 25.8527 27.8974 28.044 27.8974ZM27.6265 29.2946C26.8265 29.8696 26.7745 31.18 27.5049 32.2191C28.2528 33.2581 29.5049 33.6348 30.3049 33.0598C31.1223 32.4847 31.1746 31.1743 30.4441 30.1353C29.6963 29.0962 28.4439 28.7195 27.6265 29.2946ZM38.757 29.2946C37.9396 29.8696 37.8875 31.18 38.6354 32.2191C39.3658 33.2581 40.6179 33.6348 41.4353 33.0598C42.2353 32.4847 42.2873 31.1743 41.5569 30.1353C40.8091 29.0962 39.557 28.7195 38.757 29.2946ZM1.88741 2.94871C2.20046 4.65254 2.9832 8.18192 4.37451 9.47914C5.57451 10.5962 6.96588 10.9673 8.18327 10.6962C4.75718 7.61688 2.67002 4.37149 1.88741 2.94871ZM13.7485 1.73879C13.9746 3.56366 14.5657 6.72523 15.7831 8.00349C16.8962 9.16888 18.2353 9.62836 19.4353 9.45775C18.8962 7.52819 17.4007 4.89757 13.7485 1.73879Z"
                fill="#1F1F1F"
              />
            </g>
          </g>
          <defs>
            <clipPath id="clip0_4063_878">
              <rect width="53" height="65" fill="white" />
            </clipPath>
            <clipPath id="clip1_4063_878">
              <rect width="53" height="65" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </div>
      <div className="grid gap-4">
        {/* <div className="flex items-center gap-4">
          <div className="flex-1 rounded-md bg-gray-100 p-3 dark:bg-gray-800">
            <p className="text-sm font-mono break-all">
              {wallet.publicKey?.toBase58() || 'N/A'}
            </p>
          </div>
        </div> */}
        <div className="grid gap-2">
          <div className="grid gap-2 items-center">
            <div className="grid gap-0.5">
              {/* SPL-Tokens section */}
              {splTokens.length > 0 && (
                <>
                  <h2 className="text-xl font-bold">SPL-Tokens</h2>
                  <div className="grid gap-2">
                    {splTokens.map((asset, index) => (
                      <div key={index} className="grid gap-0.5">
                        <p className="font-semibold">
                          Name: {asset.content.metadata.name}
                        </p>
                        <p className="font-semibold">
                          Symbol: {asset.content.metadata.symbol}
                        </p>
                        <p className="font-semibold">
                          Balance: {asset.token_info.balance}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* NFTs section */}
              {nfts.length > 0 && (
                <>
                  <h2 className="text-xl font-bold">NFTs</h2>
                  <div className="grid gap-2">
                    {nfts.map((asset, index) => (
                      <div key={index} className="grid gap-0.5">
                        <p className="font-semibold">
                          Name: {asset.content.metadata.name}
                        </p>
                        <p className="font-semibold">
                          Symbol: {asset.content.metadata.symbol}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
