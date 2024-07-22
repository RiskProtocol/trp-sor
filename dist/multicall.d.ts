import { Provider } from 'ethers';
import { Pools, SubGraphPools } from './types';
export declare function getAllPoolDataOnChain(
    pools: SubGraphPools,
    multiAddress: string,
    provider: Provider
): Promise<Pools>;
