import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletConnectButton from './WalletConnectButton';
import { useAccount } from 'wagmi';

function Layout({ children }) {
  const location = useLocation();
  const { isConnected, address } = useAccount();

  // 检查当前路径是否活跃
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  // 监听钱包连接状态变化
  useEffect(() => {
    console.log("钱包连接状态:", isConnected ? "已连接" : "未连接");
    if (isConnected && address) {
      console.log("当前连接地址:", address);
    }
  }, [isConnected, address]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <Link to="/">AvaxL1 DApp</Link>
          </div>
        </div>
        
        <div className="header-center">
          <nav className="main-nav">
            <ul>
              <li className={isActive('/')}>
                <Link to="/">首页</Link>
              </li>
              <li className={isActive('/faucet')}>
                <Link to="/faucet">Faucet</Link>
              </li>
              <li className={isActive('/sbt')}>
                <Link to="/sbt">SBT</Link>
              </li>
            </ul>
          </nav>
        </div>
        
        <div className="header-right">
          <div className="wallet-section">
            <WalletConnectButton />
          </div>
        </div>
      </header>
      
      <main className="app-content">
        {children}
      </main>
      
      <footer className="app-footer">
        <p> AvaxL1 DApp - 基于Avalanche构建</p>
      </footer>
    </div>
  );
}

export default Layout; 