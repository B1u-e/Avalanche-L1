import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Web3Provider from './components/Web3Provider';
import Layout from './components/Layout';
import Home from './pages/Home';
import Faucet from './pages/Faucet';
import SBT from './pages/SBT';

function App() {
  // 清除可能存在的过期连接状态
  useEffect(() => {
    // 在页面加载时清除本地存储的连接状态，强制用户重新连接
    const clearStaleConnections = () => {
      // 只在页面首次加载时清除
      if (!sessionStorage.getItem('initialLoadDone')) {
        localStorage.removeItem('wagmi.connected');
        localStorage.removeItem('wagmi.store');
        localStorage.removeItem('wagmi.cache');
        localStorage.removeItem('lastConnectedWallet');
        console.log("已清除过期连接状态");
        sessionStorage.setItem('initialLoadDone', 'true');
      }
    };
    
    clearStaleConnections();
  }, []);

  return (
    <Web3Provider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/faucet" element={<Faucet />} />
            <Route path="/sbt" element={<SBT />} />
          </Routes>
        </Layout>
      </Router>
    </Web3Provider>
  );
}

export default App;
