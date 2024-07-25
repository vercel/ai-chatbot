import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS } from "@solana/actions";
import {
    PROGRAM_ID,
    CONNECTION,
    gmClientService,
    getNftMint,
    validatedQueryParams
} from '@/lib/chat/blinks/actions';
import { assets, ATLAS } from '@/app/api/actions/buy/const';

export const dynamic = 'force-dynamic'

export const GET = async (req: Request) => {
    try {
        const requestURL = new URL(req.url);
        const { playerPubKey } = validatedQueryParams(requestURL);
        // Extract the asset parameter from the pathname
        const assetParam = requestURL.searchParams.get("asset");

        // Find the matching asset
        const matchingAsset = assets.find(asset => asset.param === assetParam);

        const baseHref = new URL(`/api/buy?asset=${matchingAsset?.param}`, requestURL.origin).toString();

        const nftMint = getNftMint(matchingAsset?.param!) as PublicKey;
        console.log('nftMint: ', nftMint.toString());
        const orders = await gmClientService.getOpenOrdersForAsset(CONNECTION, nftMint, PROGRAM_ID);
        const atlasSellOrders = orders.filter(order => order.orderType === 'sell' && order.currencyMint === ATLAS);
        console.log('atlasSellOrders: ', atlasSellOrders);

        // Get the top 6 orders
        const topOrders = atlasSellOrders.slice(0, 6).map(order => ({
            label: `${order.uiPrice} ATLAS`,
            href: `${baseHref}&action=buy`
        }));
        console.log('topOrders: ', topOrders);

        const payload: ActionGetResponse = {
            title: `Star Atlas: ${matchingAsset?.name} Market`,
            icon: "https://staratlas.com/favicon.ico",
            description: `Purchase an NFT from the Galactic Marketplace`,
            label: "FindOrdersForAsset",
            links: {
                actions: topOrders
            }
        };

        return NextResponse.json(payload, {
            headers: ACTIONS_CORS_HEADERS
        });
    } catch ( error ) {
        console.log('error: ', error);
        return new NextResponse(
            'Invalid request',
            { headers: ACTIONS_CORS_HEADERS, status: 400 }
        );
    }
}

export const OPTIONS = GET;

export const POST = async (req: Request) => {
    try {
        const requestURL = new URL(req.url);
        const { nftName, label } = validatedQueryParams(requestURL);
        // console.log('nft name: ', nftName);
        // console.log('performing action... ', requestURL);
        // const orderId = requestURL.searchParams.get('orderId');
        // const orderIdKey = new PublicKey(orderId as string);

        const body: ActionPostRequest = await req.json();
        console.log('body: ', body);
        const buyerPubkey = new PublicKey(body.account);

        const payload: ActionGetResponse = {
            title: "Star Atlas NFT Purchase",
            icon: "https://staratlas.com/favicon.ico",
            description: `Select an order to purchase ${nftName.toUpperCase()} NFT`,
            label: "Select Order",
            // links: { actions: topOrders }
        };

        // const purchaseQty = 1;
        // const exchangeTx = await gmClientService.getCreateExchangeTransaction(
        //     CONNECTION,
        //     orders[0],
        //     buyerPubkey,
        //     purchaseQty,
        //     PROGRAM_ID,
        // );
        //
        // const serializedTransaction = exchangeTx.transaction.serialize({ requireAllSignatures: false }).toString('base64');
        //
        // const second_payload: ActionPostResponse = {
        //     transaction: serializedTransaction,
        //     message: `Purchase ${nftName.toUpperCase()} NFT for ${orders[0].uiPrice} ATLAS`
        // };

        return NextResponse.json(payload, { headers: ACTIONS_CORS_HEADERS }
        );

    } catch ( error ) {
        console.log('error: ', error);
    }
}
