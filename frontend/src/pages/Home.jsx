import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import WalletConnectButton from '../components/WalletConnectButton';

function Home() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  
  return (
    <div className="home-container">
      <div className="home-content">
      <h1 className="home-title">欢迎使用 AvaxL1 DApp</h1>
      <p className="home-subtitle">
        这是一个基于Avalanche的去中心化应用，提供SBT铸造和代币领取功能
      </p>
      <div className="btn-group">
          {!isConnected ? (
            <WalletConnectButton />
        ) : (
          <button className="primary-btn" onClick={() => navigate('/faucet')}>
            开始使用 → Faucet
          </button>
        )}
        </div>
      </div>
    </div>
  );
}

export default Home;
