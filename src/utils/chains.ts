export const chains = [
    {
        "key": "eth",
        "chainType": "EVM",
        "name": "Ethereum",
        "coin": "ETH",
        "id": 1,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/ethereum.svg",
        "tokenlistUrl": "https://gateway.ipfs.io/ipns/tokens.uniswap.org",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "relayerSupported": true,
        "metamask": {
            "chainId": "0x1",
            "blockExplorerUrls": [
                "https://etherscan.io/"
            ],
            "chainName": "Ethereum Mainnet",
            "nativeCurrency": {
                "name": "ETH",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://ethereum-rpc.publicnode.com",
                "https://eth.drpc.org",
                "https://eth.public-rpc.com",
                "https://rpc.ankr.com/eth"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 1,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1602.55577535"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
        "permit2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
        "permit2Proxy": "0x6307119078556Fc8aD77781DFC67df20d75FB4f9"
    },
    {
        "key": "bsc",
        "chainType": "EVM",
        "name": "BSC",
        "coin": "BNB",
        "id": 56,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/bsc.svg",
        "tokenlistUrl": "https://tokens.pancakeswap.finance/pancakeswap-extended.json",
        "faucetUrls": [
            "https://stakely.io/faucet/bsc-chain-bnb"
        ],
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "relayerSupported": true,
        "metamask": {
            "chainId": "0x38",
            "blockExplorerUrls": [
                "https://bscscan.com/"
            ],
            "chainName": "BNB Smart Chain Mainnet",
            "nativeCurrency": {
                "name": "BNB",
                "symbol": "BNB",
                "decimals": 18
            },
            "rpcUrls": [
                "https://bsc-dataseed.binance.org",
                "https://bsc-dataseed.bnbchain.org",
                "https://bsc-rpc.publicnode.com",
                "https://bsc-dataseed1.defibit.io",
                "https://bsc-dataseed1.ninicoin.io"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 56,
            "symbol": "BNB",
            "decimals": 18,
            "name": "BNB",
            "coinKey": "BNB",
            "logoURI": "https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png?1547034615",
            "priceUSD": "594.89917"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
        "permit2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
        "permit2Proxy": "0x6307119078556Fc8aD77781DFC67df20d75FB4f9"
    },
    {
        "key": "arb",
        "chainType": "EVM",
        "name": "Arbitrum",
        "coin": "ETH",
        "id": 42161,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/arbitrum.svg",
        "tokenlistUrl": "https://raw.githubusercontent.com/sushiswap/default-token-list/master/tokens/arbitrum.json",
        "faucetUrls": [
            "https://bridge.arbitrum.io/"
        ],
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "relayerSupported": true,
        "metamask": {
            "chainId": "0xa4b1",
            "blockExplorerUrls": [
                "https://arbiscan.io/"
            ],
            "chainName": "Arbitrum One",
            "nativeCurrency": {
                "name": "ETH",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://arb1.arbitrum.io/rpc",
                "https://arbitrum-one-rpc.publicnode.com",
                "https://arbitrum.drpc.org",
                "https://rpc.ankr.com/arbitrum"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 42161,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1602.55577535"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
        "permit2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
        "permit2Proxy": "0x6307119078556Fc8aD77781DFC67df20d75FB4f9"
    },
    {
        "key": "bas",
        "chainType": "EVM",
        "name": "Base",
        "coin": "ETH",
        "id": 8453,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/base.svg",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "relayerSupported": true,
        "metamask": {
            "chainId": "0x2105",
            "blockExplorerUrls": [
                "https://basescan.org/"
            ],
            "chainName": "Base",
            "nativeCurrency": {
                "name": "Ethereum",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://mainnet.base.org",
                "https://base-rpc.publicnode.com",
                "https://base.drpc.org",
                "https://rpc.ankr.com/base"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 8453,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1602.55577535"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
        "permit2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
        "permit2Proxy": "0x6307119078556Fc8aD77781DFC67df20d75FB4f9"
    },
    {
        "key": "bls",
        "chainType": "EVM",
        "name": "Blast",
        "coin": "ETH",
        "id": 81457,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/blast.png",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "relayerSupported": true,
        "metamask": {
            "chainId": "0x13e31",
            "blockExplorerUrls": [
                "https://blastscan.io/",
                "https://blastexplorer.io/"
            ],
            "chainName": "Blast",
            "nativeCurrency": {
                "name": "Ethereum",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.blast.io",
                "https://blast-rpc.publicnode.com",
                "https://blast.drpc.org",
                "https://rpc.ankr.com/blast"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 81457,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1602.43506"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
        "permit2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
        "permit2Proxy": "0x6307119078556Fc8aD77781DFC67df20d75FB4f9"
    },
    {
        "key": "ava",
        "chainType": "EVM",
        "name": "Avalanche",
        "coin": "AVAX",
        "id": 43114,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/avalanche.svg",
        "tokenlistUrl": "https://raw.githubusercontent.com/sushiswap/default-token-list/master/tokens/avalanche.json",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "relayerSupported": true,
        "metamask": {
            "chainId": "0xa86a",
            "blockExplorerUrls": [
                "https://snowtrace.io/"
            ],
            "chainName": "Avalanche C-Chain",
            "nativeCurrency": {
                "name": "AVAX",
                "symbol": "AVAX",
                "decimals": 18
            },
            "rpcUrls": [
                "https://api.avax.network/ext/bc/C/rpc",
                "https://avalanche-c-chain-rpc.publicnode.com",
                "https://avalanche.drpc.org",
                "https://avalanche.public-rpc.com",
                "https://rpc.ankr.com/avalanche"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 43114,
            "symbol": "AVAX",
            "decimals": 18,
            "name": "AVAX",
            "coinKey": "AVAX",
            "logoURI": "https://static.debank.com/image/avax_token/logo_url/avax/0b9c84359c84d6bdd5bfda9c2d4c4a82.png",
            "priceUSD": "19.117132"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
        "permit2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
        "permit2Proxy": "0x6307119078556Fc8aD77781DFC67df20d75FB4f9"
    },
    {
        "key": "pol",
        "chainType": "EVM",
        "name": "Polygon",
        "coin": "POL",
        "id": 137,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/polygon.svg",
        "tokenlistUrl": "https://unpkg.com/quickswap-default-token-list@1.0.71/build/quickswap-default.tokenlist.json",
        "faucetUrls": [
            "https://stakely.io/faucet/polygon-matic"
        ],
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "relayerSupported": true,
        "metamask": {
            "chainId": "0x89",
            "blockExplorerUrls": [
                "https://polygonscan.com/"
            ],
            "chainName": "Polygon Mainnet",
            "nativeCurrency": {
                "name": "Polygon Ecosystem Token",
                "symbol": "POL",
                "decimals": 18
            },
            "rpcUrls": [
                "https://polygon-bor-rpc.publicnode.com",
                "https://polygon.drpc.org",
                "https://polygon-rpc.com",
                "https://rpc.ankr.com/polygon"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 137,
            "symbol": "POL",
            "decimals": 18,
            "name": "Polygon Ecosystem Token",
            "coinKey": "POL",
            "logoURI": "https://static.debank.com/image/matic_token/logo_url/matic/6f5a6b6f0732a7a235131bd7804d357c.png",
            "priceUSD": "0.1898"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
        "permit2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
        "permit2Proxy": "0x6307119078556Fc8aD77781DFC67df20d75FB4f9"
    },
    {
        "key": "scl",
        "chainType": "EVM",
        "name": "Scroll",
        "coin": "ETH",
        "id": 534352,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/scroll.png",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x82750",
            "blockExplorerUrls": [
                "https://scrollscan.com/"
            ],
            "chainName": "Scroll",
            "nativeCurrency": {
                "name": "ETH",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.scroll.io",
                "https://scroll.drpc.org",
                "https://scroll-mainnet.public.blastapi.io",
                "https://1rpc.io/scroll"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 534352,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1602.43506"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "opt",
        "chainType": "EVM",
        "name": "Optimism",
        "coin": "ETH",
        "id": 10,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/optimism.svg",
        "tokenlistUrl": "https://static.optimism.io/optimism.tokenlist.json",
        "faucetUrls": [
            "https://gateway.optimism.io/"
        ],
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "relayerSupported": true,
        "metamask": {
            "chainId": "0xa",
            "blockExplorerUrls": [
                "https://optimistic.etherscan.io/"
            ],
            "chainName": "OP Mainnet",
            "nativeCurrency": {
                "name": "ETH",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://mainnet.optimism.io/",
                "https://optimism-rpc.publicnode.com",
                "https://optimism.drpc.org",
                "https://rpc.ankr.com/optimism"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 10,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1602.55577535"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
        "permit2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
        "permit2Proxy": "0x6307119078556Fc8aD77781DFC67df20d75FB4f9"
    },
    {
        "key": "lna",
        "chainType": "EVM",
        "name": "Linea",
        "coin": "ETH",
        "id": 59144,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/linea.svg",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0xe708",
            "blockExplorerUrls": [
                "https://lineascan.build/"
            ],
            "chainName": "Linea",
            "nativeCurrency": {
                "name": "ETH",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.linea.build"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 59144,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1602.43506"
        },
        "diamondAddress": "0xde1e598b81620773454588b85d6b5d4eec32573e"
    },
    {
        "key": "era",
        "chainType": "EVM",
        "name": "zkSync",
        "coin": "ETH",
        "id": 324,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/zksync.svg",
        "multicallAddress": "0xF9cda624FBC7e059355ce98a31693d299FACd963",
        "relayerSupported": true,
        "metamask": {
            "chainId": "0x144",
            "blockExplorerUrls": [
                "https://explorer.zksync.io/"
            ],
            "chainName": "zkSync Mainnet",
            "nativeCurrency": {
                "name": "ETH",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://mainnet.era.zksync.io"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 324,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1602.43506"
        },
        "diamondAddress": "0x341e94069f53234fe6dabef707ad424830525715",
        "permit2": "0x0000000000225e31D15943971F47aD3022F714Fa",
        "permit2Proxy": "0x6275f6631c955DC5dA9fBe8Dc7f24a3A5919443A"
    },
    {
        "key": "pze",
        "chainType": "EVM",
        "name": "Polygon zkEVM",
        "coin": "ETH",
        "id": 1101,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/zkevm.png",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x44d",
            "blockExplorerUrls": [
                "https://zkevm.polygonscan.com/"
            ],
            "chainName": "Polygon zkEVM",
            "nativeCurrency": {
                "name": "ETH",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://zkevm-rpc.com",
                "https://polygon-zkevm.drpc.org"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 1101,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1602.43506"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "dai",
        "chainType": "EVM",
        "name": "Gnosis",
        "coin": "DAI",
        "id": 100,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/gnosis.svg",
        "tokenlistUrl": "https://tokens.honeyswap.org/",
        "faucetUrls": [
            "https://stakely.io/faucet/xdai-chain"
        ],
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x64",
            "blockExplorerUrls": [
                "https://gnosis.blockscout.com/"
            ],
            "chainName": "Gnosis",
            "nativeCurrency": {
                "name": "XDAI",
                "symbol": "XDAI",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.gnosischain.com",
                "https://gnosis-rpc.publicnode.com",
                "https://gnosis.drpc.org",
                "https://rpc.ankr.com/gnosis"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 100,
            "symbol": "xDAI",
            "decimals": 18,
            "name": "xDAI Native Token",
            "coinKey": "DAI",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png",
            "priceUSD": "1.0000266"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    // {
    //     "key": "ftm",
    //     "chainType": "EVM",
    //     "name": "Fantom",
    //     "coin": "FTM",
    //     "id": 250,
    //     "mainnet": true,
    //     "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/fantom.svg",
    //     "tokenlistUrl": "https://raw.githubusercontent.com/SpookySwap/spooky-info/master/src/constants/token/spookyswap.json",
    //     "faucetUrls": [
    //         "https://stakely.io/faucet/fantom-blockchain-ftm",
    //         "https://docs.spookyswap.finance/getting-started/how-to-get-fantom-gas"
    //     ],
    //     "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
    //     "metamask": {
    //         "chainId": "0xfa",
    //         "blockExplorerUrls": [
    //             "https://ftmscan.com/"
    //         ],
    //         "chainName": "Fantom Opera",
    //         "nativeCurrency": {
    //             "name": "FTM",
    //             "symbol": "FTM",
    //             "decimals": 18
    //         },
    //         "rpcUrls": [
    //             "https://rpcapi.fantom.network",
    //             "https://rpc.fantom.network",
    //             "https://fantom-rpc.publicnode.com",
    //             "https://fantom.drpc.org",
    //             "https://rpc.ftm.tools"
    //         ]
    //     },
    //     "nativeToken": {
    //         "address": "0x0000000000000000000000000000000000000000",
    //         "chainId": 250,
    //         "symbol": "FTM",
    //         "decimals": 18,
    //         "name": "FTM",
    //         "coinKey": "FTM",
    //         "logoURI": "https://static.debank.com/image/ftm_token/logo_url/ftm/33fdb9c5067e94f3a1b9e78f6fa86984.png",
    //         "priceUSD": "0.46364537"
    //     },
    //     "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    // },
    {
        "key": "mor",
        "chainType": "EVM",
        "name": "Moonriver",
        "coin": "MOVR",
        "id": 1285,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/moonriver.svg",
        "tokenlistUrl": "https://raw.githubusercontent.com/sushiswap/default-token-list/master/tokens/moonriver.json",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x505",
            "blockExplorerUrls": [
                "https://moonriver.moonscan.io/"
            ],
            "chainName": "Moonriver",
            "nativeCurrency": {
                "name": "Moonriver",
                "symbol": "MOVR",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.api.moonriver.moonbeam.network",
                "https://moonriver-rpc.publicnode.com",
                "https://moonriver.drpc.org"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 1285,
            "symbol": "MOVR",
            "decimals": 18,
            "name": "MOVR",
            "coinKey": "MOVR",
            "logoURI": "https://assets.coingecko.com/coins/images/17984/small/9285.png",
            "priceUSD": "5.143"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "moo",
        "chainType": "EVM",
        "name": "Moonbeam",
        "coin": "GLMR",
        "id": 1284,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/moonbeam.svg",
        "tokenlistUrl": "https://raw.githubusercontent.com/BeamSwap/beamswap-tokenlist/main/tokenlist.json",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x504",
            "blockExplorerUrls": [
                "https://moonbeam.moonscan.io/"
            ],
            "chainName": "Moonbeam",
            "nativeCurrency": {
                "name": "GLMR",
                "symbol": "GLMR",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.api.moonbeam.network",
                "https://moonbeam-rpc.publicnode.com",
                "https://moonbeam.drpc.org"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 1284,
            "symbol": "GLMR",
            "decimals": 18,
            "name": "GLMR",
            "coinKey": "GLMR",
            "logoURI": "https://s2.coinmarketcap.com/static/img/coins/64x64/6836.png",
            "priceUSD": "0.066825"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "fus",
        "chainType": "EVM",
        "name": "FUSE",
        "coin": "FUSE",
        "id": 122,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/fuse.svg",
        "tokenlistUrl": "https://raw.githubusercontent.com/sushiswap/default-token-list/master/tokens/fuse.json",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x7a",
            "blockExplorerUrls": [
                "https://explorer.fuse.io/"
            ],
            "chainName": "Fuse Mainnet",
            "nativeCurrency": {
                "name": "FUSE",
                "symbol": "FUSE",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.fuse.io",
                "https://fuse.drpc.org"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 122,
            "symbol": "FUSE",
            "decimals": 18,
            "name": "FUSE",
            "coinKey": "FUSE",
            "logoURI": "https://s2.coinmarketcap.com/static/img/coins/64x64/5634.png",
            "priceUSD": "0.01189"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "bob",
        "chainType": "EVM",
        "name": "Boba",
        "coin": "ETH",
        "id": 288,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/boba.png",
        "tokenlistUrl": "https://raw.githubusercontent.com/OolongSwap/boba-community-token-list/main/build/boba.tokenlist.json",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x120",
            "blockExplorerUrls": [
                "https://bobascan.com/"
            ],
            "chainName": "Boba Network",
            "nativeCurrency": {
                "name": "ETH",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://mainnet.boba.network",
                "https://replica.boba.network"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 288,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1603.77"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "mod",
        "chainType": "EVM",
        "name": "Mode",
        "coin": "ETH",
        "id": 34443,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/mode.png",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x868b",
            "blockExplorerUrls": [
                "https://explorer.mode.network/",
                "https://modescan.io/"
            ],
            "chainName": "Mode",
            "nativeCurrency": {
                "name": "ETH",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://mainnet.mode.network",
                "https://mode.drpc.org"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 34443,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1602.43506"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "mam",
        "chainType": "EVM",
        "name": "Metis",
        "coin": "METIS",
        "id": 1088,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/metis.svg",
        "tokenlistUrl": "https://raw.githubusercontent.com/digitalnativeinc/default-token-list/dnf/tokens/metis.json",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x440",
            "blockExplorerUrls": [
                "https://andromeda-explorer.metis.io/"
            ],
            "chainName": "Metis Andromeda Mainnet",
            "nativeCurrency": {
                "name": "METIS",
                "symbol": "METIS",
                "decimals": 18
            },
            "rpcUrls": [
                "https://andromeda.metis.io",
                "https://metis.drpc.org"
            ]
        },
        "nativeToken": {
            "address": "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000",
            "chainId": 1088,
            "symbol": "METIS",
            "decimals": 18,
            "name": "METIS",
            "coinKey": "METIS",
            "logoURI": "https://s2.coinmarketcap.com/static/img/coins/64x64/9640.png",
            "priceUSD": "13.63506397"
        },
        "diamondAddress": "0x24ca98fB6972F5eE05f0dB00595c7f68D9FaFd68"
    },
    {
        "key": "lsk",
        "chainType": "EVM",
        "name": "Lisk",
        "coin": "ETH",
        "id": 1135,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/lisk.svg",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x46f",
            "blockExplorerUrls": [
                "https://blockscout.lisk.com/"
            ],
            "chainName": "Lisk",
            "nativeCurrency": {
                "name": "Ethereum",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.api.lisk.com",
                "https://lisk.drpc.org"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 1135,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1603.77"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "uni",
        "chainType": "EVM",
        "name": "Unichain",
        "coin": "ETH",
        "id": 130,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/unichain.svg",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "relayerSupported": true,
        "metamask": {
            "chainId": "0x82",
            "blockExplorerUrls": [
                "https://unichain.blockscout.com/",
                "https://uniscan.xyz/"
            ],
            "chainName": "Unichain",
            "nativeCurrency": {
                "name": "Ether",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://mainnet.unichain.org"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 130,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1602.43506"
        },
        "diamondAddress": "0x864b314D4C5a0399368609581d3E8933a63b9232",
        "permit2Proxy": "0x4BDB8cb372AeF4047626869dD5580536DBA9b053"
    },
    {
        "key": "aur",
        "chainType": "EVM",
        "name": "Aurora",
        "coin": "ETH",
        "id": 1313161554,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/aurora.png",
        "tokenlistUrl": "https://aurora.dev/tokens.json",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x4e454152",
            "blockExplorerUrls": [
                "https://explorer.aurora.dev/"
            ],
            "chainName": "Aurora Mainnet",
            "nativeCurrency": {
                "name": "ETH",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://mainnet.aurora.dev"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 1313161554,
            "symbol": "AETH",
            "decimals": 18,
            "name": "AETH",
            "coinKey": "AETH",
            "logoURI": "https://static.debank.com/image/aurora_token/logo_url/aurora/d61441782d4a08a7479d54aea211679e.png",
            "priceUSD": "2487.36"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "sei",
        "chainType": "EVM",
        "name": "Sei",
        "coin": "SEI",
        "id": 1329,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/sei.svg",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x531",
            "blockExplorerUrls": [
                "https://seitrace.com/",
                "https://seistream.app/"
            ],
            "chainName": "Sei Network",
            "nativeCurrency": {
                "name": "SEI",
                "symbol": "SEI",
                "decimals": 18
            },
            "rpcUrls": [
                "https://evm-rpc.sei-apis.com"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 1329,
            "symbol": "SEI",
            "decimals": 18,
            "name": "SEI",
            "coinKey": "SEI",
            "logoURI": "https://cdn.sei.io/sei-app/sei-icon.png",
            "priceUSD": "0.1711"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "imx",
        "chainType": "EVM",
        "name": "Immutable zkEVM",
        "coin": "IMX",
        "id": 13371,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/imx.svg",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x343b",
            "blockExplorerUrls": [
                "https://immutable-mainnet.blockscout.com/",
                "https://explorer.immutable.com/"
            ],
            "chainName": "Immutable",
            "nativeCurrency": {
                "name": "ImmutableX",
                "symbol": "IMX",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.immutable.com/",
                "https://immutable-zkevm.drpc.org"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 13371,
            "symbol": "IMX",
            "decimals": 18,
            "name": "IMX",
            "coinKey": "IMX",
            "logoURI": "https://static.debank.com/image/eth_token/logo_url/0xf57e7e7c23978c3caec3c3548e3d615c346e79ff/7a875818146ec0508d3e5f5b14f1b4eb.png",
            "priceUSD": "0.47045274"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "son",
        "chainType": "EVM",
        "name": "Sonic",
        "coin": "S",
        "id": 146,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/sonic.svg",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x92",
            "blockExplorerUrls": [
                "https://explorer.soniclabs.com/",
                "https://sonicscan.org/"
            ],
            "chainName": "Sonic Network",
            "nativeCurrency": {
                "name": "Sonic",
                "symbol": "S",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.soniclabs.com",
                "https://sonic.drpc.org"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 146,
            "symbol": "S",
            "decimals": 18,
            "name": "S",
            "coinKey": "S",
            "logoURI": "https://static.debank.com/image/sonic_token/logo_url/0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38/b4cc70d040518a88adac18d906fcbfff.png",
            "priceUSD": "0.46364537"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "gra",
        "chainType": "EVM",
        "name": "Gravity",
        "coin": "G",
        "id": 1625,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/gravity.svg",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x659",
            "blockExplorerUrls": [
                "https://explorer.gravity.xyz/"
            ],
            "chainName": "Gravity Alpha Mainnet",
            "nativeCurrency": {
                "name": "G",
                "symbol": "G",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.gravity.xyz/"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 1625,
            "symbol": "G",
            "decimals": 18,
            "name": "G",
            "coinKey": "G",
            "logoURI": "https://assets.gravity.xyz/token_logo.png",
            "priceUSD": "0.01446"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "tai",
        "chainType": "EVM",
        "name": "Taiko",
        "coin": "ETH",
        "id": 167000,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/taiko.png",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x28c58",
            "blockExplorerUrls": [
                "https://taikoscan.io/"
            ],
            "chainName": "Taiko Mainnet",
            "nativeCurrency": {
                "name": "Ethereum",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.mainnet.taiko.xyz",
                "https://rpc.taiko.xyz",
                "https://rpc.taiko.tools"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 167000,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1602.43506"
        },
        "diamondAddress": "0x3A9A5dBa8FE1C4Da98187cE4755701BCA182f63b"
    },
    {
        "key": "soe",
        "chainType": "EVM",
        "name": "Soneium",
        "coin": "ETH",
        "id": 1868,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/soneium.svg",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x74c",
            "blockExplorerUrls": [
                "https://soneium.blockscout.com/"
            ],
            "chainName": "Soneium",
            "nativeCurrency": {
                "name": "Ether",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.soneium.org/"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 1868,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1603.77"
        },
        "diamondAddress": "0x864b314D4C5a0399368609581d3E8933a63b9232",
        "permit2Proxy": "0x4BDB8cb372AeF4047626869dD5580536DBA9b053"
    },
    {
        "key": "lns",
        "chainType": "EVM",
        "name": "Lens",
        "coin": "GHO",
        "id": 232,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/lens.svg",
        "multicallAddress": "0xeee5a340Cdc9c179Db25dea45AcfD5FE8d4d3eB8",
        "relayerSupported": false,
        "metamask": {
            "chainId": "0xe8",
            "blockExplorerUrls": [
                "https://explorer.lens.xyz/"
            ],
            "chainName": "Lens",
            "nativeCurrency": {
                "name": "GHO",
                "symbol": "GHO",
                "decimals": 18
            },
            "rpcUrls": [
                "https://api.lens.matterhosted.dev"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 232,
            "symbol": "GHO",
            "decimals": 18,
            "name": "GHO",
            "coinKey": "GHO",
            "logoURI": "https://s2.coinmarketcap.com/static/img/coins/64x64/23508.png",
            "priceUSD": "0.9995408312961295"
        },
        "diamondAddress": "0xF3B20515d9B193531c48E47c18aF16d1e5d28f9a"
    },
    {
        "key": "cro",
        "chainType": "EVM",
        "name": "Cronos",
        "coin": "CRO",
        "id": 25,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/cronos.svg",
        "tokenlistUrl": "https://raw.githubusercontent.com/cronaswap/default-token-list/refs/heads/main/assets/tokens/cronos.json",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x19",
            "blockExplorerUrls": [
                "https://explorer.cronos.org/",
                "https://cronoscan.com/"
            ],
            "chainName": "Cronos Mainnet",
            "nativeCurrency": {
                "name": "Cronos",
                "symbol": "CRO",
                "decimals": 18
            },
            "rpcUrls": [
                "https://evm.cronos.org",
                "https://cronos.drpc.org"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 25,
            "symbol": "CRO",
            "decimals": 18,
            "name": "CRO",
            "coinKey": "CRO",
            "logoURI": "https://s2.coinmarketcap.com/static/img/coins/64x64/3635.png",
            "priceUSD": "0.08483"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "fra",
        "chainType": "EVM",
        "name": "Fraxtal",
        "coin": "frxETH",
        "id": 252,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/fraxtal.svg",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0xfc",
            "blockExplorerUrls": [
                "https://fraxscan.com/"
            ],
            "chainName": "Fraxtal",
            "nativeCurrency": {
                "name": "Frax Ethereum",
                "symbol": "frxETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.frax.com"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 252,
            "symbol": "frxETH",
            "decimals": 18,
            "name": "frxETH",
            "coinKey": "frxETH",
            "logoURI": "https://assets.coingecko.com/coins/images/28284/standard/frxETH_icon.png",
            "priceUSD": "1602.43506"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "abs",
        "chainType": "EVM",
        "name": "Abstract",
        "coin": "ETH",
        "id": 2741,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/abstract.svg",
        "multicallAddress": "0xAa4De41dba0Ca5dCBb288b7cC6b708F3aaC759E7",
        "metamask": {
            "chainId": "0xab5",
            "blockExplorerUrls": [
                "https://abscan.org/"
            ],
            "chainName": "Abstract",
            "nativeCurrency": {
                "name": "Ethereum",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.fsd.adfasd32442ds.com"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 2741,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1602.43506"
        },
        "diamondAddress": "0x4f8C9056bb8A3616693a76922FA35d53C056E5b3"
    },
    {
        "key": "rsk",
        "chainType": "EVM",
        "name": "Rootstock",
        "coin": "RBTC",
        "id": 30,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/rootstock.svg",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x1e",
            "blockExplorerUrls": [
                "https://explorer.rootstock.io/"
            ],
            "chainName": "Rootstock Mainnet",
            "nativeCurrency": {
                "name": "Rootstock Smart Bitcoin",
                "symbol": "RBTC",
                "decimals": 18
            },
            "rpcUrls": [
                "https://public-node.rsk.co",
                "https://mycrypto.rsk.co"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 30,
            "symbol": "RBTC",
            "decimals": 18,
            "name": "Rootstock Smart Bitcoin",
            "coinKey": "RBTC",
            "logoURI": "https://static.debank.com/image/rsk_token/logo_url/0x542fda317318ebf1d3deaf76e0b632741a7e677d/4785a26ef5bb5df987e67ad49fc62137.png",
            "priceUSD": "85046.18492359"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "cel",
        "chainType": "EVM",
        "name": "Celo",
        "coin": "CELO",
        "id": 42220,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/celo.svg",
        "tokenlistUrl": "https://raw.githubusercontent.com/sushiswap/default-token-list/master/tokens/celo.json",
        "faucetUrls": [
            "https://stakely.io/faucet/celo-platform",
            "https://free-online-app.com/faucet-for-eth-evm-chains/"
        ],
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0xa4ec",
            "blockExplorerUrls": [
                "https://celoscan.io/"
            ],
            "chainName": "Celo Mainnet",
            "nativeCurrency": {
                "name": "CELO",
                "symbol": "CELO",
                "decimals": 18
            },
            "rpcUrls": [
                "https://forno.celo.org",
                "https://celo.drpc.org",
                "https://rpc.ankr.com/celo"
            ]
        },
        "nativeToken": {
            "address": "0x471EcE3750Da237f93B8E339c536989b8978a438",
            "chainId": 42220,
            "symbol": "CELO",
            "decimals": 18,
            "name": "Celo native asset",
            "coinKey": "CELO",
            "logoURI": "https://s2.coinmarketcap.com/static/img/coins/64x64/5567.png",
            "priceUSD": "0.30436377"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
        "permit2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
        "permit2Proxy": "0x6307119078556Fc8aD77781DFC67df20d75FB4f9"
    },
    {
        "key": "wcc",
        "chainType": "EVM",
        "name": "World Chain",
        "coin": "ETH",
        "id": 480,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/world.svg",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x1e0",
            "blockExplorerUrls": [
                "https://worldscan.org/"
            ],
            "chainName": "Worldchain Mainnet",
            "nativeCurrency": {
                "name": "Ethereum",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://worldchain-mainnet.g.alchemy.com/public",
                "https://worldchain-mainnet.gateway.tenderly.co"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 480,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1602.43506"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "mnt",
        "chainType": "EVM",
        "name": "Mantle",
        "coin": "MNT",
        "id": 5000,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/mantle.png",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x1388",
            "blockExplorerUrls": [
                "https://explorer.mantle.xyz/",
                "https://mantlescan.xyz/"
            ],
            "chainName": "Mantle",
            "nativeCurrency": {
                "name": "Mantle",
                "symbol": "MNT",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.mantle.xyz",
                "https://mantle-rpc.publicnode.com",
                "https://mantle.drpc.org",
                "https://mantle.public-rpc.com"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 5000,
            "symbol": "MNT",
            "decimals": 18,
            "name": "MNT",
            "coinKey": "MNT",
            "logoURI": "https://static.debank.com/image/mnt_token/logo_url/0x78c1b0c915c4faa5fffa6cabf0219da63d7f4cb8/a443c78c33704d48f06e5686bb87f85e.png",
            "priceUSD": "0.65984774"
        },
        "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"
    },
    {
        "key": "ink",
        "chainType": "EVM",
        "name": "Ink",
        "coin": "ETH",
        "id": 57073,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/ink.svg",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "relayerSupported": true,
        "metamask": {
            "chainId": "0xdef7",
            "blockExplorerUrls": [
                "https://explorer.inkonchain.com/"
            ],
            "chainName": "Ink",
            "nativeCurrency": {
                "name": "Ether",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc-gel.inkonchain.com"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 57073,
            "symbol": "ETH",
            "decimals": 18,
            "name": "ETH",
            "coinKey": "ETH",
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
            "priceUSD": "1602.43506"
        },
        "diamondAddress": "0x864b314D4C5a0399368609581d3E8933a63b9232",
        "permit2Proxy": "0x4BDB8cb372AeF4047626869dD5580536DBA9b053"
    },
    {
        "key": "ber",
        "chainType": "EVM",
        "name": "Berachain",
        "coin": "BERA",
        "id": 80094,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/bera.svg",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "relayerSupported": true,
        "metamask": {
            "chainId": "0x138de",
            "blockExplorerUrls": [
                "https://berascan.com/",
                "https://beratrail.io/"
            ],
            "chainName": "Berachain",
            "nativeCurrency": {
                "name": "Bera",
                "symbol": "BERA",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.berachain.com"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 80094,
            "symbol": "BERA",
            "decimals": 18,
            "name": "BERA",
            "coinKey": "BERA",
            "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/tokens/bera.svg",
            "priceUSD": "3.41326303"
        },
        "diamondAddress": "0xf909c4Ae16622898b885B89d7F839E0244851c66",
        "permit2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
        "permit2Proxy": "0x6602DFf46cfFf22a24Ef3C4e68BAc2F4bcc83D0f"
    },
    {
        "key": "kai",
        "chainType": "EVM",
        "name": "Kaia",
        "coin": "KLAY",
        "id": 8217,
        "mainnet": true,
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/kaia.svg",
        "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
        "metamask": {
            "chainId": "0x2019",
            "blockExplorerUrls": [
                "https://kaiascan.io/",
                "https://kaiascope.com/"
            ],
            "chainName": "Kaia Mainnet",
            "nativeCurrency": {
                "name": "KAIA",
                "symbol": "KAIA",
                "decimals": 18
            },
            "rpcUrls": [
                "https://public-en.node.kaia.io",
                "https://klaytn-pokt.nodies.app"
            ]
        },
        "nativeToken": {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 8217,
            "symbol": "KLAY",
            "decimals": 18,
            "name": "KLAY",
            "coinKey": "KLAY",
            "logoURI": "https://static.debank.com/image/klay_token/logo_url/0x19aac5f612f524b754ca7e7c41cbfa2e981a4432/1866fc790849a903e0594ce0f55b758d.png",
            "priceUSD": "0.1009"
        },
        "diamondAddress": "0x1255d17c1bc2f764d087536410879f2d0d8772fd"
    }
]