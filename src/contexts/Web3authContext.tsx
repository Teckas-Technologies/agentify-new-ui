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
import { WalletConnectV2Adapter } from "@web3auth/wallet-connect-v2-adapter"; // ✅ import this

let web3AuthInstance: Web3Auth;

export function getWeb3AuthInstance() {
  return web3AuthInstance;
}

export default async function Web3AuthConnectorInstance(chains: Chain[]) {
  const name = "My App Name";
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
      logoLight: "https://web3auth.io/images/web3authlog.png",
      logoDark: "https://web3auth.io/images/web3authlogodark.png",
      uxMode: "redirect",
      mode: "light",
    },
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    enableLogging: true,
  });

  // ✅ Add WalletConnectV2Adapter manually with projectId
  const walletConnectV2Adapter = new WalletConnectV2Adapter({
    adapterSettings: {
      walletConnectInitOptions: {
        projectId: "3314f39613059cb687432d249f1658d2", // ✅ Required
       
      },
    },
  });

  web3AuthInstance.configureAdapter(walletConnectV2Adapter); // ✅ required

  // ✅ Optional: Add wallet services plugin
  const walletServicesPlugin = new WalletServicesPlugin({
    walletInitOptions: {
      whiteLabel: {
        showWidgetButton: true,
      },
    },
  });

  web3AuthInstance.addPlugin(walletServicesPlugin);

  // ✅ Configure other external adapters
  const externalAdapters = await getDefaultExternalAdapters({
    options: web3AuthInstance.options,
  });
  
  // Avoid duplicate WalletConnectV2Adapter
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