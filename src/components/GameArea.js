import React, { useState, useEffect, useRef } from 'react';
import { updatePlayerScore, collectItem, mintNFT, getPlayerStats } from '../utils/blockchain';

const GameArea = ({ walletAddress }) => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef({
    ship: { x: 400, y: 300, angle: 0, velocity: { x: 0, y: 0 } },
    collectibles: [],
    score: 0,
    gameRunning: false,
    keys: {},
    lastSpawn: 0
  });

  const [gameStats, setGameStats] = useState({ score: 0, items: 0 });
  const [gameRunning, setGameRunning] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      loadPlayerStats();
    }
  }, [walletAddress]);

  const loadPlayerStats = async () => {
    if (!walletAddress) return;
    try {
      const stats = await getPlayerStats(walletAddress);
      setGameStats({ score: stats.score, items: stats.itemsCollected });
    } catch (error) {
      console.error('Error loading player stats:', error);
    }
  };

  const generateCollectible = () => {
    const types = ['star', 'crystal', 'plasma', 'quantum'];
    const rarities = ['common', 'rare', 'epic', 'legendary'];
    const colors = {
      star: '#FFD700',
      crystal: '#00FFFF',
      plasma: '#FF6B6B',
      quantum: '#9B59B6'
    };

    const type = types[Math.floor(Math.random() * types.length)];
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    const value = (rarities.indexOf(rarity) + 1) * 10;

    return {
      id: Math.random(),
      x: Math.random() * 750 + 50,
      y: Math.random() * 550 + 50,
      type,
      rarity,
      value,
      color: colors[type],
      collected: false,
      pulse: 0
    };
  };

  const handleCollectItem = async (collectible) => {
    try {
      await collectItem(collectible.type, collectible.value);
      
      // Update local score
      gameStateRef.current.score += collectible.value * 10;
      setGameStats(prev => ({
        score: prev.score + collectible.value * 10,
        items: prev.items + 1
      }));

      // Tightened minting: only after reaching score thresholds to prevent free spam
      if ((gameStateRef.current.score % 1000) === 0 && collectible.rarity === 'legendary') {
        const mintResult = await mintNFT(collectible.type, collectible.rarity);
        if (mintResult.success) showNotification(`🎉 Minted ${collectible.rarity} ${collectible.type} NFT!`);
      }

    } catch (error) {
      console.error('Error collecting item:', error);
    }
  };

  const showNotification = (message) => {
    // Simple notification - you can enhance this
    const notification = document.createElement('div');
    notification.className = 'game-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  const gameLoop = (timestamp) => {
    if (!gameStateRef.current.gameRunning) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = gameStateRef.current;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 20, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars background
    for (let i = 0; i < 100; i++) {
      const x = (i * 137.5) % canvas.width;
      const y = (i * 131.7) % canvas.height;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Update ship movement
    if (state.keys['ArrowLeft'] || state.keys['a']) state.ship.angle -= 0.1;
    if (state.keys['ArrowRight'] || state.keys['d']) state.ship.angle += 0.1;
    if (state.keys['ArrowUp'] || state.keys['w']) {
      state.ship.velocity.x += Math.cos(state.ship.angle) * 0.3;
      state.ship.velocity.y += Math.sin(state.ship.angle) * 0.3;
    }

    // Apply friction and update position
    state.ship.velocity.x *= 0.98;
    state.ship.velocity.y *= 0.98;
    state.ship.x += state.ship.velocity.x;
    state.ship.y += state.ship.velocity.y;

    // Keep ship in bounds
    state.ship.x = Math.max(20, Math.min(canvas.width - 20, state.ship.x));
    state.ship.y = Math.max(20, Math.min(canvas.height - 20, state.ship.y));

    // Draw ship
    ctx.save();
    ctx.translate(state.ship.x, state.ship.y);
    ctx.rotate(state.ship.angle);
    ctx.fillStyle = '#00FFFF';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Spawn collectibles
    if (timestamp - state.lastSpawn > 2000 && state.collectibles.length < 5) {
      state.collectibles.push(generateCollectible());
      state.lastSpawn = timestamp;
    }

    // Update and draw collectibles
    state.collectibles.forEach((collectible, index) => {
      if (collectible.collected) return;

      collectible.pulse += 0.1;
      const pulseSize = Math.sin(collectible.pulse) * 3 + 15;

      // Check collision with ship
      const dx = state.ship.x - collectible.x;
      const dy = state.ship.y - collectible.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 25) {
        collectible.collected = true;
        handleCollectItem(collectible);
        state.collectibles.splice(index, 1);
        return;
      }

      // Draw collectible
      ctx.save();
      ctx.translate(collectible.x, collectible.y);
      ctx.rotate(collectible.pulse);
      
      // Glow effect
      ctx.shadowColor = collectible.color;
      ctx.shadowBlur = 15;
      
      ctx.fillStyle = collectible.color;
      ctx.beginPath();
      if (collectible.type === 'star') {
        // Draw star shape
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? pulseSize : pulseSize / 2;
          const angle = (i * Math.PI) / 5;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      } else {
        // Draw circle for other types
        ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();

      // Draw rarity indicator
      ctx.fillStyle = collectible.color;
      ctx.font = '12px Arial';
      ctx.fillText(collectible.rarity, collectible.x - 20, collectible.y + 35);
    });

    // Draw UI
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${state.score}`, 20, 40);
    ctx.fillText(`Items: ${state.collectibles.length}`, 20, 70);

    requestAnimationFrame(gameLoop);
  };

  const startGame = () => {
    if (!walletAddress) {
      alert('Please connect your wallet first!');
      return;
    }

    gameStateRef.current.gameRunning = true;
    gameStateRef.current.collectibles = [];
    gameStateRef.current.lastSpawn = 0;
    setGameRunning(true);
    requestAnimationFrame(gameLoop);
  };

  const stopGame = async () => {
    gameStateRef.current.gameRunning = false;
    setGameRunning(false);

    // Update score on blockchain
    if (gameStateRef.current.score > 0) {
      await updatePlayerScore(gameStateRef.current.score);
      await loadPlayerStats(); // Refresh stats
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      gameStateRef.current.keys[e.key] = true;
    };

    const handleKeyUp = (e) => {
      gameStateRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="game-area">
      <div className="game-header">
        <h2>🚀 Cosmic Collection Mission</h2>
        <div className="game-controls">
          {!gameRunning ? (
            <button className="game-button start" onClick={startGame}>
              Start Mission
            </button>
          ) : (
            <button className="game-button stop" onClick={stopGame}>
              End Mission
            </button>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="game-canvas"
      />

      <div className="game-instructions">
        <p><strong>Controls:</strong> Arrow Keys or WASD to navigate your cosmic ship</p>
        <p><strong>Mission:</strong> Collect cosmic items to earn points and mint rare NFTs!</p>
        <p><strong>Tip:</strong> Epic and Legendary items have a chance to mint special NFTs</p>
      </div>
    </div>
  );
};

export default GameArea;