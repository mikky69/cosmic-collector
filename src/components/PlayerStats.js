import React, { useState, useEffect } from 'react';
import { getPlayerStats, getWalletBalance } from '../utils/blockchain';

const PlayerStats = ({ walletAddress }) => {
  const [stats, setStats] = useState({
    score: 0,
    level: 1,
    cosmicEnergy: 100,
    itemsCollected: 0
  });
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      loadStats();
    }
  }, [walletAddress]);

  const loadStats = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      const [playerStats, walletBalance] = await Promise.all([
        getPlayerStats(walletAddress),
        getWalletBalance()
      ]);
      
      setStats(playerStats);
      setBalance(walletBalance);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    setLoading(false);
  };

  const formatBalance = (balance) => {
    const num = parseFloat(balance);
    return num.toFixed(4);
  };

  const getProgressToNextLevel = () => {
    const currentLevelScore = (stats.level - 1) * 1000;
    const nextLevelScore = stats.level * 1000;
    const progress = ((stats.score - currentLevelScore) / (nextLevelScore - currentLevelScore)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <div className="player-stats">
      <h3>👨‍🚀 Player Stats</h3>
      
      {!walletAddress ? (
        <div className="stats-placeholder">
          <p>Connect wallet to view stats</p>
        </div>
      ) : loading ? (
        <div className="stats-loading">
          <p>Loading stats...</p>
        </div>
      ) : (
        <div className="stats-content">
          <div className="stat-item">
            <span className="stat-label">🎯 Score</span>
            <span className="stat-value">{stats.score.toLocaleString()}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">⭐ Level</span>
            <span className="stat-value">{stats.level}</span>
          </div>

          <div className="level-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getProgressToNextLevel()}%` }}
              ></div>
            </div>
            <span className="progress-text">
              {Math.round(getProgressToNextLevel())}% to Level {stats.level + 1}
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">⚡ Cosmic Energy</span>
            <span className="stat-value">{stats.cosmicEnergy}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">🔮 Items Collected</span>
            <span className="stat-value">{stats.itemsCollected}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">💰 HBAR Balance</span>
            <span className="stat-value">{formatBalance(balance)}</span>
          </div>

          <button className="refresh-button" onClick={loadStats}>
            🔄 Refresh Stats
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerStats;