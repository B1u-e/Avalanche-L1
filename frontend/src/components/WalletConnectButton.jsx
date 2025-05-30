import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import './WalletConnectButton.css';

export default function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isLoading, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionInProgress, setConnectionInProgress] = useState(false);

  // 检查可用的连接器
  useEffect(() => {
    console.log("可用连接器:", connectors.map(c => ({ id: c.id, name: c.name })));
  }, [connectors]);

  // 处理错误信息
  useEffect(() => {
    if (error) {
      console.error("钱包连接错误:", error);
      setErrorMessage(error.message || '连接失败');
      setConnectionInProgress(false);
    } else {
      setErrorMessage('');
    }
  }, [error]);

  // 监听连接状态变化
  useEffect(() => {
    if (isConnected && connectionInProgress) {
      setConnectionInProgress(false);
      setShowModal(false);
    }
  }, [isConnected, connectionInProgress]);

  // 检测 MetaMask 是否安装
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && 
           typeof window.ethereum !== 'undefined' && 
           window.ethereum.isMetaMask;
  };

  // 检测 OKX 钱包是否安装
  const isOKXWalletInstalled = () => {
    return typeof window !== 'undefined' && 
           (typeof window.okxwallet !== 'undefined' || 
            (typeof window.ethereum !== 'undefined' && window.ethereum.isOkxWallet));
  };

  // 格式化地址显示
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // 打开钱包选择模态框
  const openWalletModal = () => {
    setShowModal(true);
    setErrorMessage('');
  };

  // 关闭钱包选择模态框
  const closeWalletModal = () => {
    if (!connectionInProgress) {
      setShowModal(false);
    }
  };

  // 切换下拉菜单
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // 关闭下拉菜单
  const closeDropdown = () => {
    setShowDropdown(false);
  };

  // 添加点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.wallet-info')) {
        closeDropdown();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  // 断开连接
  const handleDisconnect = () => {
    try {
      disconnect();
      localStorage.removeItem('lastConnectedWallet');
      console.log("已断开连接");
    } catch (err) {
      console.error("断开连接出错:", err);
    }
    setShowDropdown(false);
  };

  // 连接钱包
  const handleConnect = async (connector) => {
    console.log("尝试连接钱包:", connector.id, connector.name);
    setErrorMessage('');
    setConnectionInProgress(true);
    
    try {
      // 先断开现有连接
      if (isConnected) {
        await disconnect();
      }
      
      // 连接新钱包
      await connect({ 
        connector,
        chainId: 337 // 确保连接到正确的链
      });
      
      console.log("连接请求已发送");
    } catch (err) {
      console.error("连接钱包失败:", err);
      setErrorMessage(err.message || '连接失败');
      setConnectionInProgress(false);
    }
  };

  // 获取MetaMask连接器
  const getMetaMaskConnector = () => {
    // 首先尝试查找id为metaMask的连接器
    const metaMaskConnector = connectors.find(c => c.id === 'metaMask');
    if (metaMaskConnector) return metaMaskConnector;
    
    // 如果没有找到，尝试查找target为metaMask的injected连接器
    const injectedMetaMask = connectors.find(c => 
      c.id === 'injected' && c.target === 'metaMask'
    );
    if (injectedMetaMask) return injectedMetaMask;
    
    // 最后回退到普通的injected连接器
    return connectors.find(c => c.id === 'injected');
  };

  // 连接 MetaMask
  const connectMetaMask = async () => {
    const connector = getMetaMaskConnector();
    if (connector) {
      await handleConnect(connector);
    } else {
      setErrorMessage('未找到MetaMask连接器');
      setConnectionInProgress(false);
    }
  };

  // 连接浏览器钱包
  const connectBrowserWallet = async () => {
    const injectedConnector = connectors.find(c => c.id === 'injected');
    if (injectedConnector) {
      await handleConnect(injectedConnector);
    } else {
      setErrorMessage('浏览器钱包连接器不可用');
      setConnectionInProgress(false);
    }
  };

  return (
    <div className="wallet-connect-container">
      {!isConnected ? (
        <button className="connect-wallet-button" onClick={openWalletModal}>
          连接钱包
        </button>
      ) : (
        <div className="wallet-info">
          <button className="wallet-address-button" onClick={toggleDropdown}>
            {formatAddress(address)}
          </button>
          {showDropdown && (
            <div className="wallet-dropdown">
              <button onClick={openWalletModal}>切换钱包</button>
              <button onClick={handleDisconnect}>断开连接</button>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="wallet-modal-overlay" onClick={closeWalletModal}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-header">
              <h3>选择钱包</h3>
              <button className="close-button" onClick={closeWalletModal} disabled={connectionInProgress}>×</button>
            </div>
            <div className="wallet-modal-content">
              {errorMessage && <div className="wallet-error">{errorMessage}</div>}
              
              {isMetaMaskInstalled() && (
                <button
                  className="wallet-option"
                  onClick={connectMetaMask}
                  disabled={isLoading || connectionInProgress}
                >
                  <div className="wallet-icon metamask-icon"></div>
                  <span>MetaMask</span>
                  {(isLoading || connectionInProgress) && <span className="loading-spinner"></span>}
                </button>
              )}
              
              <button
                className="wallet-option"
                onClick={connectBrowserWallet}
                disabled={isLoading || connectionInProgress}
              >
                <div className="wallet-icon browser-wallet-icon"></div>
                <span>浏览器钱包</span>
                {(isLoading || connectionInProgress) && <span className="loading-spinner"></span>}
              </button>
              
              {!isMetaMaskInstalled() && (
                <div className="wallet-install-hint">
                  <p>没有安装钱包插件？</p>
                  <a 
                    href="https://metamask.io/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="wallet-install-link"
                  >
                    点击安装 MetaMask
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 