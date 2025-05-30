// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletConnectButton from './WalletConnectButton';

function Navbar() {
  const location = useLocation();
  
  // 判断当前路径是否激活
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="logo">AvaxL1 DApp</div>
      </div>
        <div className="nav-tabs">
        <Link to="/" className={`nav-tab ${isActive('/')}`}>首页</Link>
        <Link to="/faucet" className={`nav-tab ${isActive('/faucet')}`}>Faucet</Link>
        <Link to="/sbt" className={`nav-tab ${isActive('/sbt')}`}>SBT</Link>
        </div>
      <div className="navbar-right">
        <WalletConnectButton />
      </div>
    </nav>
  );
}

export default Navbar;