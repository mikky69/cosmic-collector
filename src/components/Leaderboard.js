import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../utils/blockchain';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
    setLoading(false);
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getRankClass = (rank) => {
    switch (rank) {
      case 1: return 'rank-gold';
      case 2: return 'rank-silver';
      case 3: return 'rank-bronze';
      default: return 'rank-normal';
    }
  };

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h2>🏆 Cosmic Leaderboard</h2>
        <button className="refresh-button" onClick={loadLeaderboard}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="leaderboard-loading">
          <p>Loading cosmic champions...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="leaderboard-empty">
          <div className="empty-icon">🌌</div>
          <h3>No cosmic champions yet</h3>
          <p>Be the first to reach the stars and claim your place in cosmic history!</p>
        </div>
      ) : (
        <div className="leaderboard-content">
          <div className="leaderboard-stats">
            <span>Total Players: {leaderboard.length}</span>
            <span>Top Score: {leaderboard[0]?.score?.toLocaleString() || 0}</span>
          </div>

          <div className="leaderboard-list">
            {leaderboard.map((player, index) => {
              const rank = index + 1;
              return (
                <div key={player.address} className={`leaderboard-item ${getRankClass(rank)}`}>
                  <div className="rank-section">
                    <span className="rank-emoji">{getRankEmoji(rank)}</span>
                    <span className="rank-number">#{rank}</span>
                  </div>

                  <div className="player-section">
                    <span className="player-address">{formatAddress(player.address)}</span>
                    {rank <= 3 && (
                      <span className="player-title">
                        {rank === 1 && "Cosmic Emperor"}
                        {rank === 2 && "Star Admiral"}
                        {rank === 3 && "Galaxy Captain"}
                      </span>
                    )}
                  </div>

                  <div className="score-section">
                    <span className="score">{player.score.toLocaleString()}</span>
                    <span className="score-label">points</span>
                  </div>

                  {player.level && (
                    <div className="level-section">
                      <span className="level">Lv.{player.level}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {leaderboard.length >= 10 && (
            <div className="leaderboard-footer">
              <p>🌟 Only top 10 cosmic champions are shown</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;