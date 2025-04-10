import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector";
import { Web3Auth } from "@web3auth/modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import {
  CHAIN_NAMESPACES,
  WEB3AUTH_NETWORK,
  WALLET_ADAPTERS,
  IAdapter,
} from "@web3auth/base";
import { Chain } from "wagmi/chains";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { getDefaultExternalAdapters } from "@web3auth/default-evm-adapter";
import { WalletConnectV2Adapter } from "@web3auth/wallet-connect-v2-adapter";

let web3AuthInstance: Web3Auth;
let walletServicesPluginInstance: WalletServicesPlugin; // ✅ Store plugin instance

export function getWeb3AuthInstance() {
  return web3AuthInstance;
}

export function getWalletServicesPluginInstance() {
  return walletServicesPluginInstance; // ✅ Expose plugin instance
}

export default async function Web3AuthConnectorInstance(chains: Chain[]) {
  console.log("Chains from wgmi --------------- ...",chains);
  
  const name = "Agentify";
  const chain =  "https://mainnet.infura.io/v3/7bb6501ed7b74d1e91fdd69ddfe59ce8";
  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x" + chains[0].id.toString(16),
    rpcTarget: chains[0].rpcUrls.default.http[0],
    displayName: chains[0].name,
    tickerName: chains[0].nativeCurrency?.name,
    ticker: chains[0].nativeCurrency?.symbol,
    blockExplorerUrl: chains[0].blockExplorers?.default.url,
  };

  const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

  web3AuthInstance = new Web3Auth({
    clientId: "BBtch9ADWLB7T0061mzT0HugKNuDViTOjGl07APGxk0yd3679EAi-_DZ9A5HxnpwgS4ouHLOqqauC1q0MSfJoWU",
    chainConfig,
    privateKeyProvider,
    uiConfig: {
      appName: name,
      loginMethodsOrder: ["google"],
      defaultLanguage: "en",
      modalZIndex: "2147483647",
      logoLight: "https://gfxvsstorage.blob.core.windows.net/gfxvscontainer/agentify-logo.png",
      logoDark: "https://gfxvsstorage.blob.core.windows.net/gfxvscontainer/agentify-logo.png",
      uxMode: "redirect",
      mode: "dark",
    },
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    enableLogging: true,
  });

  const walletConnectV2Adapter = new WalletConnectV2Adapter({
    adapterSettings: {
      walletConnectInitOptions: {
        projectId: "3314f39613059cb687432d249f1658d2",
      },
    },
  });

  web3AuthInstance.configureAdapter(walletConnectV2Adapter);

  // ✅ Create WalletServicesPlugin instance and save it
  walletServicesPluginInstance = new WalletServicesPlugin({
    wsEmbedOpts: {
      web3AuthClientId: "BBtch9ADWLB7T0061mzT0HugKNuDViTOjGl07APGxk0yd3679EAi-_DZ9A5HxnpwgS4ouHLOqqauC1q0MSfJoWU",
      web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    },
    walletInitOptions: {
      whiteLabel: {
        showWidgetButton: true,
        buttonPosition: "bottom-left",
        hideNftDisplay: false,
        hideTokenDisplay: false,
        hideTransfers: false,
        hideTopup: false,
        hideReceive: false,
        hideSwap: true,
        defaultPortfolio: "token",
      },
    },
  });

  web3AuthInstance.addPlugin(walletServicesPluginInstance); // ✅ Add plugin

  const externalAdapters = await getDefaultExternalAdapters({
    options: web3AuthInstance.options,
  });

  externalAdapters
    .filter((adapter: IAdapter<unknown>) => adapter.name !== WALLET_ADAPTERS.WALLET_CONNECT_V2)
    .forEach((adapter: IAdapter<unknown>) => {
      web3AuthInstance.configureAdapter(adapter);
    });

  const modalConfig = {
    [WALLET_ADAPTERS.AUTH]: {
      label: "openlogin",
      loginMethods: {
        facebook: {
          name: "facebook login",
          showOnModal: false,
        },
      },
      showOnModal: true,
    },
  };

  return Web3AuthConnector({
    web3AuthInstance,
    modalConfig,
  });
}