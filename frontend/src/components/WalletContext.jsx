import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

// 创建上下文
const WalletContext = createContext(null);

// 提供者组件
export function WalletProvider({ children }) {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isLoading, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 处理错误信息
  useEffect(() => {
    if (error) {
      console.error("钱包连接错误:", error);
      setErrorMessage(error.message || '连接失败');
    } else {
      setErrorMessage('');
    }
  }, [error]);

  // 打开钱包选择模态框
  const openWalletModal = () => {
    setShowModal(true);
    setErrorMessage('');
  };

  // 关闭钱包选择模态框
  const closeWalletModal = () => {
    setShowModal(false);
  };

  // 连接钱包
  const handleConnect = async (connector) => {
    console.log("尝试连接钱包:", connector.name);
    try {
      await connect({ connector });
      if (!error) {
        setTimeout(() => {
          setShowModal(false);
        }, 1000);
      }
    } catch (err) {
      console.error("连接钱包失败:", err);
      setErrorMessage(err.message || '连接失败');
    }
  };

  // 断开连接
  const handleDisconnect = () => {
    disconnect();
  };

  // 格式化地址显示
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // 上下文值
  const contextValue = {
    address,
    isConnected,
    chainId,
    connectors,
    isLoading,
    error,
    errorMessage,
    showModal,
    openWalletModal,
    closeWalletModal,
    connectWallet: handleConnect,
    disconnectWallet: handleDisconnect,
    formatAddress,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// 自定义钩子
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet 必须在 WalletProvider 内使用');
  }
  return context;
};

export default WalletProvider; 