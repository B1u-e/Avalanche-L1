import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Web3Provider from './components/Web3Provider';
import Layout from './components/Layout';
import Home from './pages/Home';
import Faucet from './pages/Faucet';
import SBT from './pages/SBT';
import './App.css';

function App() {
  console.log("App 组件已加载");
  
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