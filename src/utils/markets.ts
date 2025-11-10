import * as markets from "@bgd-labs/aave-address-book";

export const marketConfigs = {
    "EthereumCore": {
        pool: markets.AaveV3Ethereum.POOL,
        wethGateway: markets.AaveV3Ethereum.WETH_GATEWAY,
        assets: markets.AaveV3Ethereum.ASSETS,
        chainId: markets.AaveV3Ethereum.CHAIN_ID,
        uiPoolDataProvider: markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
        poolAddressesProvider: markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER
    },
    // "EthereumPrime": {                                       // TODO
    //     pool: markets.AaveV3EthereumLido.POOL,
    //     wethGateway: markets.AaveV3EthereumLido.WETH_GATEWAY,
    //     assets: markets.AaveV3EthereumLido.ASSETS,
    // },
    "EthereumEtherFi": {
        pool: markets.AaveV3EthereumEtherFi.POOL,
        wethGateway: markets.AaveV3EthereumEtherFi.WETH_GATEWAY,
        assets: markets.AaveV3EthereumEtherFi.ASSETS,
        chainId: markets.AaveV3EthereumEtherFi.CHAIN_ID,
        uiPoolDataProvider: markets.AaveV3EthereumEtherFi.UI_POOL_DATA_PROVIDER,
        poolAddressesProvider: markets.AaveV3EthereumEtherFi.POOL_ADDRESSES_PROVIDER
    },
    "Polygon": {
        pool: markets.AaveV3Polygon.POOL,
        wethGateway: markets.AaveV3Polygon.WETH_GATEWAY,
        assets: markets.AaveV3Polygon.ASSETS,
        chainId: markets.AaveV3Polygon.CHAIN_ID,
        uiPoolDataProvider: markets.AaveV3Polygon.UI_POOL_DATA_PROVIDER,
        poolAddressesProvider: markets.AaveV3Polygon.POOL_ADDRESSES_PROVIDER
    },
    "Avalanche": {
        pool: markets.AaveV3Avalanche.POOL,
        wethGateway: markets.AaveV3Avalanche.WETH_GATEWAY,
        assets: markets.AaveV3Avalanche.ASSETS,
        chainId: markets.AaveV3Avalanche.CHAIN_ID,
        uiPoolDataProvider: markets.AaveV3Avalanche.UI_POOL_DATA_PROVIDER,
        poolAddressesProvider: markets.AaveV3Avalanche.POOL_ADDRESSES_PROVIDER
    },
    "Arbitrum": {
        pool: markets.AaveV3Arbitrum.POOL,
        wethGateway: markets.AaveV3Arbitrum.WETH_GATEWAY,
        assets: markets.AaveV3Arbitrum.ASSETS,
        chainId: markets.AaveV3Arbitrum.CHAIN_ID,
        uiPoolDataProvider: markets.AaveV3Arbitrum.UI_POOL_DATA_PROVIDER,
        poolAddressesProvider: markets.AaveV3Arbitrum.POOL_ADDRESSES_PROVIDER
    },
    "Optimism": {
        pool: markets.AaveV3Optimism.POOL,
        wethGateway: markets.AaveV3Optimism.WETH_GATEWAY,
        assets: markets.AaveV3Optimism.ASSETS,
        chainId: markets.AaveV3Optimism.CHAIN_ID,
        uiPoolDataProvider: markets.AaveV3Optimism.UI_POOL_DATA_PROVIDER,
        poolAddressesProvider: markets.AaveV3Optimism.POOL_ADDRESSES_PROVIDER
    },
    // "Harmony": {                                            // TODO
    //     pool: markets.AaveV3Optimism.POOL,
    //     wethGateway: markets.AaveV3Optimism.WETH_GATEWAY,
    //     assets: markets.AaveV3Optimism.ASSETS,
    // },
    // "Fantom": {                                             // TODO
    //     pool: markets.AaveV3Optimism.POOL,
    //     wethGateway: markets.AaveV3Optimism.WETH_GATEWAY,
    //     assets: markets.AaveV3Optimism.ASSETS,
    // },
    // "Metis": {
    //     pool: markets.AaveV3Metis.POOL,
    //     wethGateway: markets.AaveV3Metis.,
    //     assets: markets.AaveV3Metis.ASSETS,
    // },
    "Base": {
        pool: markets.AaveV3Base.POOL,
        wethGateway: markets.AaveV3Base.WETH_GATEWAY,
        assets: markets.AaveV3Base.ASSETS,
        chainId: markets.AaveV3Base.CHAIN_ID,
        uiPoolDataProvider: markets.AaveV3Base.UI_POOL_DATA_PROVIDER,
        poolAddressesProvider: markets.AaveV3Base.POOL_ADDRESSES_PROVIDER
    },
    "Gnosis": {
        pool: markets.AaveV3Gnosis.POOL,
        wethGateway: markets.AaveV3Gnosis.WETH_GATEWAY,
        assets: markets.AaveV3Gnosis.ASSETS,
        chainId: markets.AaveV3Gnosis.CHAIN_ID,
        uiPoolDataProvider: markets.AaveV3Gnosis.UI_POOL_DATA_PROVIDER,
        poolAddressesProvider: markets.AaveV3Gnosis.POOL_ADDRESSES_PROVIDER
    },
    "Scroll": {
        pool: markets.AaveV3Scroll.POOL,
        wethGateway: markets.AaveV3Scroll.WETH_GATEWAY,
        assets: markets.AaveV3Scroll.ASSETS,
        chainId: markets.AaveV3Scroll.CHAIN_ID,
        uiPoolDataProvider: markets.AaveV3Scroll.UI_POOL_DATA_PROVIDER,
        poolAddressesProvider: markets.AaveV3Scroll.POOL_ADDRESSES_PROVIDER
    },
    "BNB": {
        pool: markets.AaveV3BNB.POOL,
        wethGateway: markets.AaveV3BNB.WETH_GATEWAY,
        assets: markets.AaveV3BNB.ASSETS,
        chainId: markets.AaveV3BNB.CHAIN_ID,
        uiPoolDataProvider: markets.AaveV3BNB.UI_POOL_DATA_PROVIDER,
        poolAddressesProvider: markets.AaveV3BNB.POOL_ADDRESSES_PROVIDER
    },
    "ZKsync": {
        pool: markets.AaveV3ZkSync.POOL,
        wethGateway: markets.AaveV3ZkSync.WETH_GATEWAY,
        assets: markets.AaveV3ZkSync.ASSETS,
        chainId: markets.AaveV3ZkSync.CHAIN_ID,
        uiPoolDataProvider: markets.AaveV3ZkSync.UI_POOL_DATA_PROVIDER,
        poolAddressesProvider: markets.AaveV3ZkSync.POOL_ADDRESSES_PROVIDER
    },
    "Linea": {
        pool: markets.AaveV3Linea.POOL,
        wethGateway: markets.AaveV3Linea.WETH_GATEWAY,
        assets: markets.AaveV3Linea.ASSETS,
        chainId: markets.AaveV3Linea.CHAIN_ID,
        uiPoolDataProvider: markets.AaveV3Linea.UI_POOL_DATA_PROVIDER,
        poolAddressesProvider: markets.AaveV3Linea.POOL_ADDRESSES_PROVIDER
    },
    // "Celo": {
    //     pool: markets.AaveV3Celo.POOL,
    //     wethGateway: markets.AaveV3Celo,
    //     assets: markets.AaveV3Celo.ASSETS,
    // },
    "Sepolia": {
        pool: markets.AaveV3Sepolia.POOL,
        wethGateway: markets.AaveV3Sepolia.WETH_GATEWAY,
        assets: markets.AaveV3Sepolia.ASSETS,
        chainId: markets.AaveV3Sepolia.CHAIN_ID
    },
};

const testnetMarketConfig = {
    "Sepolia": {
        pool: markets.AaveV3Sepolia.POOL,
        wethGateway: markets.AaveV3Sepolia.WETH_GATEWAY,
        assets: markets.AaveV3Sepolia.ASSETS,
        chainId: markets.AaveV3Sepolia.CHAIN_ID
    },
}