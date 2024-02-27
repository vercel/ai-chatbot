'use client'
import { JSX, SVGProps } from 'react'
import React, { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

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
    <div className="flex min-h-screen items-start p-4 gap-2">
      <div className="grid gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium shrink-0 w-20">Address</p>
          <div className="flex-1 rounded-md bg-gray-100 p-3 dark:bg-gray-800">
            <p className="text-sm font-mono break-all">
              {wallet.publicKey?.toBase58() || 'N/A'}
            </p>
          </div>
        </div>
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
    </div>
  )
}
