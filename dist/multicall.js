'use strict';
var __createBinding =
    (this && this.__createBinding) ||
    (Object.create
        ? function(o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              var desc = Object.getOwnPropertyDescriptor(m, k);
              if (
                  !desc ||
                  ('get' in desc
                      ? !m.__esModule
                      : desc.writable || desc.configurable)
              ) {
                  desc = {
                      enumerable: true,
                      get: function() {
                          return m[k];
                      },
                  };
              }
              Object.defineProperty(o, k2, desc);
          }
        : function(o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              o[k2] = m[k];
          });
var __setModuleDefault =
    (this && this.__setModuleDefault) ||
    (Object.create
        ? function(o, v) {
              Object.defineProperty(o, 'default', {
                  enumerable: true,
                  value: v,
              });
          }
        : function(o, v) {
              o['default'] = v;
          });
var __importStar =
    (this && this.__importStar) ||
    function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null)
            for (var k in mod)
                if (
                    k !== 'default' &&
                    Object.prototype.hasOwnProperty.call(mod, k)
                )
                    __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };
var __awaiter =
    (this && this.__awaiter) ||
    function(thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function(resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator['throw'](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done
                    ? resolve(result.value)
                    : adopt(result.value).then(fulfilled, rejected);
            }
            step(
                (generator = generator.apply(thisArg, _arguments || [])).next()
            );
        });
    };
Object.defineProperty(exports, '__esModule', { value: true });
exports.getAllPoolDataOnChain = getAllPoolDataOnChain;
const contracts_1 = require('@ethersproject/contracts');
const bmath = __importStar(require('./bmath'));
const abi_1 = require('@ethersproject/abi');
function getAllPoolDataOnChain(pools, multiAddress, provider) {
    return __awaiter(this, void 0, void 0, function*() {
        if (pools.pools.length === 0) throw Error('There are no pools.');
        const customMultiAbi = require('./abi/customMulticall.json');
        const contract = new contracts_1.Contract(
            multiAddress,
            customMultiAbi,
            provider
        );
        let addresses = [];
        let total = 0;
        for (let i = 0; i < pools.pools.length; i++) {
            let pool = pools.pools[i];
            addresses.push([pool.id]);
            total++;
            pool.tokens.forEach(token => {
                addresses[i].push(token.address);
                total++;
            });
        }
        const encodedData = abi_1.defaultAbiCoder.encode(
            ['address[][]'],
            [addresses]
        );
        // console.log('encodedData', encodedData);
        let results = yield contract.getPoolInfo(encodedData);
        let j = 0;
        let onChainPools = { pools: [] };
        for (let i = 0; i < pools.pools.length; i++) {
            let tokens = [];
            let p = {
                id: pools.pools[i].id,
                swapFee: bmath.scale(bmath.bnum(pools.pools[i].swapFee), 18),
                totalWeight: bmath.scale(
                    bmath.bnum(pools.pools[i].totalWeight),
                    18
                ),
                tokens: tokens,
                tokensList: pools.pools[i].tokensList,
            };
            pools.pools[i].tokens.forEach(token => {
                let bal = bmath.bnum(results[j]);
                j++;
                p.tokens.push({
                    address: token.address,
                    balance: bal,
                    decimals: Number(token.decimals),
                    denormWeight: bmath.scale(
                        bmath.bnum(token.denormWeight),
                        18
                    ),
                });
            });
            onChainPools.pools.push(p);
        }
        return onChainPools;
    });
}
