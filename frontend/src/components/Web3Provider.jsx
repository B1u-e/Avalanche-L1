import React from 'react';
import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected, metaMask, walletConnect } from "wagmi/connectors";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 定义 Avalanche 链配置
const avalanche = {
  id: 337,
  name: 'mytestbc',
  network: 'mytestbc',
  nativeCurrency: {
    decimals: 18,
    name: 'test Token',
    symbol: 'test',
  },
  rpcUrls: {
    public: { http: ['http://127.0.0.1:38561/ext/bc/h2BZHAsqc5c1af6dAHzMHYS5NGmHGmRhUZr9QtaVFXzDqtETu/rpc'] },
    default: { http: ['http://127.0.0.1:38561/ext/bc/h2BZHAsqc5c1af6dAHzMHYS5NGmHGmRhUZr9QtaVFXzDqtETu/rpc'] },
  },
  blockExplorers: {
    default: { name: 'SnowTrace', url: 'https://snowtrace.io' },
  },
};

// 检测MetaMask是否安装
const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && 
         typeof window.ethereum !== 'undefined' && 
         window.ethereum.isMetaMask;
};

// 创建 wagmi 配置
const config = createConfig({
  chains: [avalanche, mainnet],
  transports: {
    [avalanche.id]: http('http://127.0.0.1:38561/ext/bc/h2BZHAsqc5c1af6dAHzMHYS5NGmHGmRhUZr9QtaVFXzDqtETu/rpc'),
    [mainnet.id]: http(),
  },
  connectors: [
    // 使用injected连接器作为MetaMask
    injected({
      target: "metaMask",
      shimDisconnect: true,
    }),
    // 备用注入连接器
    injected({
      shimDisconnect: true,
    }),
    // WalletConnect连接器
    walletConnect({
      projectId: "4b59fdc55d26515fe6806e32c9b9da1b",
      showQrModal: true,
    }),
  ],
});

// 创建 QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0, // 禁用自动重试
      refetchOnWindowFocus: false, // 禁用窗口聚焦时重新获取
    },
  },
});

// Web3 提供者组件
export function Web3Provider({ children }) {
  console.log("Web3Provider 已加载，配置:", config);
  console.log("MetaMask已安装:", isMetaMaskInstalled());
  console.log("RPC URL:", avalanche.rpcUrls.default.http[0]);
  console.log("链ID:", avalanche.id);
  
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default Web3Provider; 