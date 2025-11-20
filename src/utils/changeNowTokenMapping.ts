/**
 * ChangeNow Token Mapping Configuration
 *
 * This file maps ChangeNow currency tickers to blockchain networks and token addresses.
 * It supports all chains configured in CustomWagmiProvider.
 */

export interface ChainConfig {
  chainId: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  changeNowSuffixes: string[]; // Network suffixes used by ChangeNow (e.g., "arb", "op", "base")
}

export interface TokenAddress {
  address: string;
  decimals: number;
}

/**
 * All supported chains with their native currency information
 * Matches chains from CustomWagmiProvider
 */
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  // Mainnet
  1: {
    chainId: 1,
    name: "Ethereum",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["", "erc20"], // "eth" or "etherc20"
  },

  // Layer 2s - Ethereum Based
  42161: {
    chainId: 42161,
    name: "Arbitrum",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["arb", "arbitrum"],
  },
  10: {
    chainId: 10,
    name: "Optimism",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["op", "optimism"],
  },
  8453: {
    chainId: 8453,
    name: "Base",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["base"],
  },
  81457: {
    chainId: 81457,
    name: "Blast",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["blast"],
  },
  534352: {
    chainId: 534352,
    name: "Scroll",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["scroll"],
  },
  59144: {
    chainId: 59144,
    name: "Linea",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["lna", "linea"],
  },
  324: {
    chainId: 324,
    name: "zkSync Era",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["zksync"],
  },
  1101: {
    chainId: 1101,
    name: "Polygon zkEVM",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["polygonzkevm", "zkevmpolygon"],
  },
  34443: {
    chainId: 34443,
    name: "Mode",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["mode"],
  },

  // Alternative L1s
  56: {
    chainId: 56,
    name: "BNB Smart Chain",
    nativeCurrency: { name: "BNB", symbol: "bnb", decimals: 18 },
    changeNowSuffixes: ["bsc", "bep20"],
  },
  137: {
    chainId: 137,
    name: "Polygon",
    nativeCurrency: { name: "MATIC", symbol: "matic", decimals: 18 },
    changeNowSuffixes: ["matic", "polygon"],
  },
  43114: {
    chainId: 43114,
    name: "Avalanche C-Chain",
    nativeCurrency: { name: "AVAX", symbol: "avax", decimals: 18 },
    changeNowSuffixes: ["avax", "avalanche", "arc20", "avaxc"],
  },
  250: {
    chainId: 250,
    name: "Fantom",
    nativeCurrency: { name: "FTM", symbol: "ftm", decimals: 18 },
    changeNowSuffixes: ["ftm", "fantom"],
  },
  100: {
    chainId: 100,
    name: "Gnosis",
    nativeCurrency: { name: "xDAI", symbol: "xdai", decimals: 18 },
    changeNowSuffixes: ["gnosis", "xdai"],
  },
  1088: {
    chainId: 1088,
    name: "Metis",
    nativeCurrency: { name: "Metis", symbol: "metis", decimals: 18 },
    changeNowSuffixes: ["metis"],
  },
  42220: {
    chainId: 42220,
    name: "Celo",
    nativeCurrency: { name: "CELO", symbol: "celo", decimals: 18 },
    changeNowSuffixes: ["celo"],
  },
  5000: {
    chainId: 5000,
    name: "Mantle",
    nativeCurrency: { name: "MNT", symbol: "mnt", decimals: 18 },
    changeNowSuffixes: ["mantle"],
  },

  // Moonbeam Ecosystem
  1284: {
    chainId: 1284,
    name: "Moonbeam",
    nativeCurrency: { name: "GLMR", symbol: "glmr", decimals: 18 },
    changeNowSuffixes: ["moonbeam"],
  },
  1285: {
    chainId: 1285,
    name: "Moonriver",
    nativeCurrency: { name: "MOVR", symbol: "movr", decimals: 18 },
    changeNowSuffixes: ["moonriver"],
  },

  // Others
  1313161554: {
    chainId: 1313161554,
    name: "Aurora",
    nativeCurrency: { name: "ETH", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["aurora"],
  },
  288: {
    chainId: 288,
    name: "Boba Network",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["boba"],
  },
  122: {
    chainId: 122,
    name: "Fuse",
    nativeCurrency: { name: "FUSE", symbol: "fuse", decimals: 18 },
    changeNowSuffixes: ["fuse"],
  },
  1135: {
    chainId: 1135,
    name: "Lisk",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["lisk"],
  },
  25: {
    chainId: 25,
    name: "Cronos",
    nativeCurrency: { name: "CRO", symbol: "cro", decimals: 18 },
    changeNowSuffixes: ["cronos", "cro"],
  },
  252: {
    chainId: 252,
    name: "Fraxtal",
    nativeCurrency: { name: "Frax Ether", symbol: "frxeth", decimals: 18 },
    changeNowSuffixes: ["fraxtal"],
  },
  30: {
    chainId: 30,
    name: "Rootstock",
    nativeCurrency: { name: "RSK", symbol: "rbtc", decimals: 18 },
    changeNowSuffixes: ["rootstock", "rsk"],
  },
  480: {
    chainId: 480,
    name: "World Chain",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["worldchain"],
  },
  13371: {
    chainId: 13371,
    name: "Immutable zkEVM",
    nativeCurrency: { name: "IMX", symbol: "imx", decimals: 18 },
    changeNowSuffixes: ["immutable", "imx"],
  },
  146: {
    chainId: 146,
    name: "Sonic",
    nativeCurrency: { name: "S", symbol: "s", decimals: 18 },
    changeNowSuffixes: ["sonic"],
  },
  1625: {
    chainId: 1625,
    name: "Gravity",
    nativeCurrency: { name: "G", symbol: "g", decimals: 18 },
    changeNowSuffixes: ["gravity"],
  },
  167000: {
    chainId: 167000,
    name: "Taiko",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["taiko"],
  },
  1946: {
    chainId: 1946,
    name: "Soneium",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["soneium"],
  },
  7887: {
    chainId: 7887,
    name: "Lens",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["lens"],
  },
  57073: {
    chainId: 57073,
    name: "Ink",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["ink"],
  },
  80094: {
    chainId: 80094,
    name: "Berachain",
    nativeCurrency: { name: "BERA", symbol: "bera", decimals: 18 },
    changeNowSuffixes: ["berachain", "bera"],
  },
  8217: {
    chainId: 8217,
    name: "Kaia",
    nativeCurrency: { name: "KAIA", symbol: "kaia", decimals: 18 },
    changeNowSuffixes: ["kaia"],
  },
  1301: {
    chainId: 1301,
    name: "Unichain",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["unichain"],
  },
  1329: {
    chainId: 1329,
    name: "Sei",
    nativeCurrency: { name: "SEI", symbol: "sei", decimals: 18 },
    changeNowSuffixes: ["sei"],
  },
  2741: {
    chainId: 2741,
    name: "Abstract",
    nativeCurrency: { name: "Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["abstract"],
  },

  // Testnet
  11155111: {
    chainId: 11155111,
    name: "Sepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "eth", decimals: 18 },
    changeNowSuffixes: ["sepolia"],
  },
};

/**
 * Token contract addresses across all supported chains
 * Format: { tokenSymbol: { chainId: { address, decimals } } }
 */
export const TOKEN_ADDRESSES: Record<string, Record<number, TokenAddress>> = {
  // USDC - USD Coin
  usdc: {
    1: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
    137: { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: 6 },
    56: { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 },
    42161: { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
    10: { address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6 },
    8453: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
    43114: { address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6 },
    250: { address: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75", decimals: 6 },
    100: { address: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83", decimals: 6 },
    42220: { address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", decimals: 6 },
    534352: { address: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4", decimals: 6 },
    59144: { address: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff", decimals: 6 },
    324: { address: "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4", decimals: 6 },
    1101: { address: "0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035", decimals: 6 },
    5000: { address: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9", decimals: 6 },
  },

  // USDT - Tether
  usdt: {
    1: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
    137: { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6 },
    56: { address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
    42161: { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6 },
    10: { address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", decimals: 6 },
    43114: { address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", decimals: 6 },
    250: { address: "0x049d68029688eAbF473097a2fC38ef61633A3C7A", decimals: 6 },
    100: { address: "0x4ECaBa5870353805a9F068101A40E0f32ed605C6", decimals: 6 },
    42220: { address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", decimals: 6 },
    534352: { address: "0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df", decimals: 6 },
  },

  // DAI - Dai Stablecoin
  dai: {
    1: { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
    137: { address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", decimals: 18 },
    56: { address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", decimals: 18 },
    42161: { address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", decimals: 18 },
    10: { address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", decimals: 18 },
    8453: { address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18 },
    43114: { address: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70", decimals: 18 },
    100: { address: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d", decimals: 18 },
  },

  // WETH - Wrapped Ether
  weth: {
    1: { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
    137: { address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", decimals: 18 },
    56: { address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", decimals: 18 },
    42161: { address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18 },
    10: { address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    8453: { address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    43114: { address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB", decimals: 18 },
    250: { address: "0x74b23882a30290451A17c44f4F05243b6b58C76d", decimals: 18 },
  },

  // WBTC - Wrapped Bitcoin
  wbtc: {
    1: { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8 },
    137: { address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8 },
    42161: { address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", decimals: 8 },
    10: { address: "0x68f180fcCe6836688e9084f035309E29Bf0A2095", decimals: 8 },
    43114: { address: "0x50b7545627a5162F82A992c33b87aDc75187B218", decimals: 8 },
  },
};

/**
 * Parse ChangeNow ticker and return chain ID + base token symbol
 *
 * @param changeNowTicker - Ticker from ChangeNow (e.g., "etharb", "usdcarb", "eth")
 * @returns { chainId, baseToken } or null if not supported
 */
export function parseChangeNowTicker(changeNowTicker: string): {
  chainId: number;
  baseToken: string;
} | null {
  const lowerTicker = changeNowTicker.toLowerCase();

  // Try to match with chain suffixes
  for (const [chainIdStr, config] of Object.entries(CHAIN_CONFIGS)) {
    const chainId = parseInt(chainIdStr);

    for (const suffix of config.changeNowSuffixes) {
      if (!suffix) {
        // Empty suffix means mainnet/default
        if (lowerTicker === config.nativeCurrency.symbol) {
          return { chainId, baseToken: config.nativeCurrency.symbol };
        }
        // Check ERC20 tokens on mainnet
        for (const tokenSymbol of Object.keys(TOKEN_ADDRESSES)) {
          if (lowerTicker === tokenSymbol || lowerTicker === `${tokenSymbol}erc20`) {
            return { chainId, baseToken: tokenSymbol };
          }
        }
      } else {
        // Check if ticker ends with this suffix
        if (lowerTicker.endsWith(suffix)) {
          const baseToken = lowerTicker.slice(0, -suffix.length);

          // Check if it's native currency
          if (baseToken === config.nativeCurrency.symbol) {
            return { chainId, baseToken };
          }

          // Check if it's a known ERC20 token
          if (TOKEN_ADDRESSES[baseToken]?.[chainId]) {
            return { chainId, baseToken };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Get token address for a specific chain
 *
 * @param baseToken - Base token symbol (e.g., "usdc", "usdt")
 * @param chainId - Chain ID
 * @returns Token address and decimals, or null if not found
 */
export function getTokenAddress(
  baseToken: string,
  chainId: number
): TokenAddress | null {
  const lowerToken = baseToken.toLowerCase();
  return TOKEN_ADDRESSES[lowerToken]?.[chainId] || null;
}

/**
 * Check if a token is a native currency on the given chain
 *
 * @param baseToken - Base token symbol (e.g., "eth", "matic")
 * @param chainId - Chain ID
 * @returns true if it's the native currency
 */
export function isNativeCurrency(baseToken: string, chainId: number): boolean {
  const config = CHAIN_CONFIGS[chainId];
  return config?.nativeCurrency.symbol === baseToken.toLowerCase();
}

/**
 * Get chain configuration by chain ID
 */
export function getChainConfig(chainId: number): ChainConfig | null {
  return CHAIN_CONFIGS[chainId] || null;
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.keys(CHAIN_CONFIGS).map(Number);
}

/**
 * Get native currency info for a chain
 */
export function getNativeCurrency(chainId: number) {
  return CHAIN_CONFIGS[chainId]?.nativeCurrency || null;
}
