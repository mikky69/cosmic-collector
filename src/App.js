import React, { useState, useEffect } from 'react';
import './styles/Game.css';
import GameArea from './components/GameArea';
import AsteroidMiner from './components/AsteroidMiner';
import SnakeGame from './components/SnakeGame';
import PlayerStats from './components/PlayerStats';
import Inventory from './components/Inventory';
import Leaderboard from './components/Leaderboard';
import Marketplace from './components/Marketplace';
import TokenBattle from './games/TokenBattle';
import ScrabbleGame from './components/ScrabbleGame';
import { initializeBlockchain, getWalletAddress, isUsingMockContracts, getCurrentContractAddresses } from './utils/blockchain';

function App() {
  const [currentView, setCurrentView] = useState('collector');
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [usingMockContracts, setUsingMockContracts] = useState(false);

  useEffect(() => {
    // Auto-connect on load
    connectWallet();
    setUsingMockContracts(isUsingMockContracts());
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const success = await initializeBlockchain();
      if (success) {
        const address = await getWalletAddress();
        setWalletAddress(address);
        setUsingMockContracts(isUsingMockContracts());
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
    setIsConnecting(false);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'collector':
        return <GameArea walletAddress={walletAddress} />;
      case 'inventory':
        return <Inventory walletAddress={walletAddress} />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'marketplace':
        return <Marketplace walletAddress={walletAddress} />;
      case 'tokenbattle':
        return <TokenBattle />;
      case 'asteroid':
        return <AsteroidMiner walletAddress={walletAddress} />;
      case 'snake':
        return <SnakeGame walletAddress={walletAddress} />;
      case 'scrabble':
        return <ScrabbleGame />;
      default:
        return <GameArea walletAddress={walletAddress} />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="game-title">🌌 Cosmic Collector</h1>
          <div className="header-right">
            {usingMockContracts && (
              <div className="dev-mode-badge">
                🧪 Demo Mode - Mock Contracts
              </div>
            )}
            <div className="wallet-section">
              {walletAddress ? (
                <div className="wallet-info">
                  <span className="wallet-address">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                  <div className={`connection-status ${usingMockContracts ? 'demo' : 'connected'}`}>
                    {usingMockContracts ? 'Demo' : 'Connected'}
                  </div>
                </div>
              ) : (
                <button
                  className="connect-button"
                  onClick={connectWallet}
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Connecting...' : usingMockContracts ? 'Start Demo' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {usingMockContracts && (
        <div className="demo-banner">
          <div className="demo-banner-content">
            <span className="demo-icon">🎮</span>
            <div className="demo-text">
              <strong>Demo Mode Active:</strong> You're playing with simulated blockchain functionality. 
              All your progress is temporary and for demonstration purposes.
            </div>
            <div className="demo-actions">
              <button 
                className="deploy-button"
                onClick={() => {
                  alert('To deploy real contracts:\n\n1. Open terminal\n2. cd contracts\n3. bash deploy-easy.sh\n\nThis will guide you through the deployment process!');
                }}
              >
                Deploy Real Contracts
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="app-nav">
        <button
          className={currentView === 'collector' ? 'nav-button active' : 'nav-button'}
          onClick={() => setCurrentView('collector')}
        >
          🚀 Cosmic Collector
        </button>
        <button
          className={currentView === 'tokenbattle' ? 'nav-button active' : 'nav-button'}
          onClick={() => setCurrentView('tokenbattle')}
        >
          ⚔️ Token Battle
        </button>
        <button
          className={currentView === 'asteroid' ? 'nav-button active' : 'nav-button'}
          onClick={() => setCurrentView('asteroid')}
        >
          ⛏️ Asteroid Miner
        </button>
        <button
          className={currentView === 'snake' ? 'nav-button active' : 'nav-button'}
          onClick={() => setCurrentView('snake')}
        >
          🐍 Space Snake
        </button>
        <button
          className={currentView === 'scrabble' ? 'nav-button active' : 'nav-button'}
          onClick={() => setCurrentView('scrabble')}
        >
          🔤 Word Scrabble
        </button>
        <button
          className={currentView === 'inventory' ? 'nav-button active' : 'nav-button'}
          onClick={() => setCurrentView('inventory')}
        >
          🎒 Inventory
        </button>
        <button
          className={currentView === 'leaderboard' ? 'nav-button active' : 'nav-button'}
          onClick={() => setCurrentView('leaderboard')}
        >
          🏆 Leaderboard
        </button>
        <button
          className={currentView === 'marketplace' ? 'nav-button active' : 'nav-button'}
          onClick={() => setCurrentView('marketplace')}
        >
          🛒 Marketplace
        </button>
      </nav>

      <main className="app-main">
        <div className="main-content">
          <div className="game-section">
            {renderCurrentView()}
          </div>
          {currentView !== 'tokenbattle' && (
            <div className="sidebar">
              <PlayerStats walletAddress={walletAddress} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;