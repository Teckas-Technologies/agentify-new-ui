import * as markets from "@bgd-labs/aave-address-book";

export const marketConfigs = {
    "EthereumCore": {
        pool: markets.AaveV3Ethereum.POOL,
        wethGateway: markets.AaveV3Ethereum.WETH_GATEWAY,
        assets: markets.AaveV3Ethereum.ASSETS,
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
    },
    "Polygon": {
        pool: markets.AaveV3Polygon.POOL,
        wethGateway: markets.AaveV3Polygon.WETH_GATEWAY,
        assets: markets.AaveV3Polygon.ASSETS,
    },
    "Avalanche": {
        pool: markets.AaveV3Avalanche.POOL,
        wethGateway: markets.AaveV3Avalanche.WETH_GATEWAY,
        assets: markets.AaveV3Avalanche.ASSETS,
    },
    "Arbitrum": {
        pool: markets.AaveV3Arbitrum.POOL,
        wethGateway: markets.AaveV3Arbitrum.WETH_GATEWAY,
        assets: markets.AaveV3Arbitrum.ASSETS,
    },
    "Optimism": {
        pool: markets.AaveV3Optimism.POOL,
        wethGateway: markets.AaveV3Optimism.WETH_GATEWAY,
        assets: markets.AaveV3Optimism.ASSETS,
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
    },
    "Gnosis": {
        pool: markets.AaveV3Gnosis.POOL,
        wethGateway: markets.AaveV3Gnosis.WETH_GATEWAY,
        assets: markets.AaveV3Gnosis.ASSETS,
    },
    "Scroll": {
        pool: markets.AaveV3Scroll.POOL,
        wethGateway: markets.AaveV3Scroll.WETH_GATEWAY,
        assets: markets.AaveV3Scroll.ASSETS,
    },
    "BNB": {
        pool: markets.AaveV3BNB.POOL,
        wethGateway: markets.AaveV3BNB.WETH_GATEWAY,
        assets: markets.AaveV3BNB.ASSETS,
    },
    "ZKsync": {
        pool: markets.AaveV3ZkSync.POOL,
        wethGateway: markets.AaveV3ZkSync.WETH_GATEWAY,
        assets: markets.AaveV3ZkSync.ASSETS,
    },
    "Linea": {
        pool: markets.AaveV3Linea.POOL,
        wethGateway: markets.AaveV3Linea.WETH_GATEWAY,
        assets: markets.AaveV3Linea.ASSETS,
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
    },
};

const testnetMarketConfig = {
    "Sepolia": {
        pool: markets.AaveV3Sepolia.POOL,
        wethGateway: markets.AaveV3Sepolia.WETH_GATEWAY,
        assets: markets.AaveV3Sepolia.ASSETS,
    },
}