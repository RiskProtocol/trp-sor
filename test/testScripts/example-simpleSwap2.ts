// Example showing full swaps with timings - run using: $ ts-node ./test/testScripts/example-swapExactIn.ts
require('dotenv').config();
const sor = require('../../src');
import { BigNumber } from 'bignumber.js';
import { JsonRpcProvider } from '@ethersproject/providers';

const R2 = '0x177bf72d4ad8ebd0a2ce23180fed33b94b5ccc25';
const R1 = '0x4b9420e43a9aa972b64bb3ba3b3b56e8aed508de'; // USDC Address
const Rk = '0x8d9396c9075af8ef45618bcad5bb0130bd1d61d6'; // uUSDwETH Synthetic Token

async function simpleSwap() {
    // If running this example make sure you have a .env file saved in root DIR with INFURA=your_key
    const provider = new JsonRpcProvider(
        `https://sepolia.infura.io/v3/f95a31543737407fb0c6c19df7dae0c8`
    );

    // gasPrice is used by SOR as a factor to determine how many pools to swap against.
    // i.e. higher cost means more costly to trade against lots of different pools.
    // Can be changed in future using SOR.gasPrice = newPrice
    const gasPrice = new BigNumber('30000000000');
    // This determines the max no of pools the SOR will use to swap.
    const maxNoPools = 4;
    const chainId = 11155111;

    const poolsUrl = `https://raw.githubusercontent.com/RiskProtocol/trp-sor/main/test/newTrpPools.json`;
    // const poolsUrl = `https://cloudflare-ipfs.com/ipns/balancer-team-bucket.storage.fleek.co/balancer-exchange/pools`;
    // const poolsUrl = `https://ipfs.io/ipns/balancer-team-bucket.storage.fleek.co/balancer-exchange-kovan/pools`;
    // const poolsUrl = `https://cloudflare-ipfs.com/ipns/balancer-team-bucket.storage.fleek.co/balancer-exchange-kovan/pools`;
    // const poolsUrl = `https://raw.githubusercontent.com/balancer-labs/balancer-exchange/8615273ca006dba50fd12051535a68ad058f0611/src/allPublicPools.json`;

    const SOR = new sor.SOR(provider, gasPrice, maxNoPools, chainId, poolsUrl);

    const tokenIn = R1;
    const tokenOut = R2;
    const swapType = 'swapExactIn'; // Two different swap types are used: swapExactIn & swapExactOut
    let amountIn = new BigNumber('10'); // 1 USDC, Always pay attention to Token Decimals. i.e. In this case USDC has 6 decimals.

    console.log(
        `\n************** First Call, Without All Pools - Loading Subset of Pools For Pair`
    );

    // This can be used to check if all pools have been fetched
    SOR.isAllFetched;
    // Can be used to check if pair/pools been fetched
    SOR.hasDataForPair(tokenIn, tokenOut);
    console.log(`Has data for pair: ${SOR.hasDataForPair(tokenIn, tokenOut)}`);

    console.time(`totalCallNoPools`);
    // This calculates the cost to make a swap which is used as an input to SOR to allow it to make gas efficient recommendations.
    // Can be set once and will be used for further swap calculations.
    // Defaults to 0 if not called or can be set manually using: await SOR.setCostOutputToken(tokenOut, manualPriceBn)
    console.time(`setCostOutputToken`);
    await SOR.setCostOutputToken(tokenOut);
    console.timeEnd(`setCostOutputToken`);

    // This fetches a subset of pair pools onchain information
    console.time('fetchFilteredPairPools');
    await SOR.fetchFilteredPairPools(tokenIn, tokenOut);
    console.timeEnd('fetchFilteredPairPools');

    // First call so any paths must be processed so this call will take longer than cached in future.
    console.time('withOutPathsCache');
    let [swaps, amountOut] = await SOR.getSwaps(
        tokenIn,
        tokenOut,
        swapType,
        amountIn
    );
    console.timeEnd('withOutPathsCache');
    console.timeEnd(`totalCallNoPools`);

    console.log(
        `USDC>WETH, SwapExactIn, 1USDC, Total WETH Return: ${amountOut.toString()}`
    );
    console.log(`Swaps: `);
    console.log(swaps);

    console.log(
        `\n************** Fetch All Pools & Onchain Balances (In Background)`
    );
    // This fetches all pools list from URL in constructor then onChain balances using Multicall
    let fetch = SOR.fetchPools();

    let isAllPoolsFetched = SOR.isAllFetched;
    console.log(`Are all pools fetched: ${isAllPoolsFetched}`);

    console.log(
        `\n**************  Fetch All Pools In Background - Get swap (exactIn) using previously fetched filtered pools`
    );

    console.time(`getSwapsWithFilteredPoolsExactIn`);
    [swaps, amountOut] = await SOR.getSwaps(
        tokenIn,
        tokenOut,
        swapType,
        new BigNumber('2000000')
    );
    console.timeEnd(`getSwapsWithFilteredPoolsExactIn`);

    console.log(
        `USDC>WETH, SwapExactIn, 2USDC, Total WETH Return: ${amountOut.toString()}`
    );
    console.log(`Swaps: `);
    console.log(swaps);

    console.log(
        `\n**************  Fetch All Pools In Background - Get swap (exactOut) using previously fetched filtered pools`
    );
    console.time(`getSwapsWithFilteredPoolsExactOut`);
    let usdcIn;
    [swaps, usdcIn] = await SOR.getSwaps(
        tokenIn,
        tokenOut,
        'swapExactOut',
        amountOut
    );
    console.timeEnd(`getSwapsWithFilteredPoolsExactOut`);
    console.log(`USDC>WETH, SwapExactOut, Total USDC In: ${usdcIn.toString()}`);
    console.log(`Swaps: `);
    console.log(swaps);

    console.log(
        `\n**************  Fetch All Pools In Background - Get swap (WETH>USDC) using previously fetched filtered pools`
    );
    console.time(`getSwapsWithFilteredPoolsTokensSwapped`);
    [swaps, amountOut] = await SOR.getSwaps(
        tokenOut,
        tokenIn,
        swapType,
        new BigNumber(1e18)
    );
    console.timeEnd(`getSwapsWithFilteredPoolsTokensSwapped`);

    console.log(
        `WETH>USDC, SwapExactIn, 1WETH, Total USDC Return: ${amountOut.toString()}`
    );
    console.log(`Swaps: `);
    console.log(swaps);

    isAllPoolsFetched = SOR.isAllFetched;
    console.log(`\n\nAre all pools fetched: ${isAllPoolsFetched}`);
    console.log(`Waiting for fetch to complete...`);
    await fetch;
    isAllPoolsFetched = SOR.isAllFetched;
    console.log(`Are all pools fetched: ${isAllPoolsFetched}`);

    console.log(`\n************** Using All Pools - Without Paths Cache`);
    // First call so any paths must be processed so this call will take longer than cached in future.
    console.time('allPoolsWithOutPathsCache');
    [swaps, amountOut] = await SOR.getSwaps(
        tokenIn,
        tokenOut,
        swapType,
        amountIn
    );
    console.timeEnd('allPoolsWithOutPathsCache');
    console.log(`Total WETH Return: ${amountOut.toString()}`);
    console.log(`Swaps: `);
    console.log(swaps);

    console.log(`\n************** Using All Pools - With Paths Cache`);
    // Cached pools & paths will now be used for processing making it much faster
    console.time('allPoolsWithPathsCache');
    [swaps, amountOut] = await SOR.getSwaps(
        tokenIn,
        tokenOut,
        swapType,
        amountIn
    );
    console.timeEnd('allPoolsWithPathsCache');
    console.log(`Total WETH Return: ${amountOut.toString()}`);
    console.log(`Swaps: `);
    console.log(swaps);

    console.log(`\n************** Different Swap Type - No Paths Cache`);
    // The paths for this swap needs to be processed
    console.time('differentSwap');
    let amtIn;
    [swaps, amtIn] = await SOR.getSwaps(
        tokenIn,
        tokenOut,
        'swapExactOut',
        amountOut
    );
    console.timeEnd('differentSwap');
    console.log(`Total USDC In: ${amtIn.toString()}`);
    console.log(`Swaps: `);
    console.log(swaps);

    console.log(`\n************** FetchPools again - updates onChain info`);
    // This updates all pool onchain balances
    console.time('balanceUpdate');
    await SOR.fetchPools();
    console.timeEnd('balanceUpdate');

    console.time('swapAfterBalanceUpdate');
    [swaps, amtIn] = await SOR.getSwaps(
        tokenIn,
        tokenOut,
        'swapExactOut',
        amountOut
    );
    console.timeEnd('swapAfterBalanceUpdate');
    console.log(`Total USDC In: ${amtIn.toString()}`);
    console.log(`Swaps: `);
    console.log(swaps);

    //     console.log(`\n************** New token`);
    //     // This token hasn't been cached
    //     console.time('newToken');
    //     [swaps, amountOut] = await SOR.getSwaps(tokenIn, uUSD, swapType, amountIn);
    //     console.timeEnd('newToken');
    //     console.log(`Total New Token Return: ${amountOut.toString()}`);
    //     console.log(`Swaps: `);
    //     console.log(swaps);
}

simpleSwap();
