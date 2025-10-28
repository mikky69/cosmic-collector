import React, { useEffect, useRef, useState } from 'react';
import { getPlayerNFTs } from '../utils/blockchain';

export default function SnakeGame({ walletAddress }) {
  const canvasRef = useRef(null);
  const loopRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [speedMs, setSpeedMs] = useState(120);
  const gameRef = useRef({
    grid: 20,
    tiles: 24,
    snake: [{ x: 12, y: 12 }],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: 5, y: 5 },
    boostMultiplier: 1,
  });

  // NFT boosts: simple read to apply passive multiplier
  useEffect(() => {
    let isMounted = true;
    async function loadBoosts() {
      if (!walletAddress) return;
      try {
        const nfts = await getPlayerNFTs(walletAddress);
        if (!isMounted) return;
        const hasRare = Array.isArray(nfts) && nfts.length >= 3; // placeholder rule
        gameRef.current.boostMultiplier = hasRare ? 1.2 : 1;
      } catch {}
    }
    loadBoosts();
    return () => { isMounted = false; };
  }, [walletAddress]);

  useEffect(() => {
    const handle = (e) => {
      const g = gameRef.current;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': if (g.dir.y === 0) g.nextDir = { x: 0, y: -1 }; break;
        case 'ArrowDown': case 's': case 'S': if (g.dir.y === 0) g.nextDir = { x: 0, y: 1 }; break;
        case 'ArrowLeft': case 'a': case 'A': if (g.dir.x === 0) g.nextDir = { x: -1, y: 0 }; break;
        case 'ArrowRight': case 'd': case 'D': if (g.dir.x === 0) g.nextDir = { x: 1, y: 0 }; break;
        default: break;
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  const start = () => {
    if (running) return;
    setScore(0);
    gameRef.current.snake = [{ x: 12, y: 12 }];
    gameRef.current.dir = { x: 1, y: 0 };
    gameRef.current.nextDir = { x: 1, y: 0 };
    gameRef.current.food = randomFood(gameRef.current);
    setRunning(true);
    tick();
  };

  const stop = () => {
    setRunning(false);
    if (loopRef.current) clearTimeout(loopRef.current);
  };

  function tick() {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const g = gameRef.current;
    g.dir = g.nextDir;
    const head = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y };
    // wrap
    head.x = (head.x + g.tiles) % g.tiles;
    head.y = (head.y + g.tiles) % g.tiles;

    // self hit
    if (g.snake.some(s => s.x === head.x && s.y === head.y)) {
      stop();
      render(ctx);
      return;
    }

    g.snake.unshift(head);
    if (head.x === g.food.x && head.y === g.food.y) {
      const inc = Math.floor(10 * g.boostMultiplier);
      setScore(prev => prev + inc);
      g.food = randomFood(g);
      setSpeedMs(prev => Math.max(60, prev - 2));
    } else {
      g.snake.pop();
    }

    render(ctx);
    loopRef.current = setTimeout(tick, speedMs);
  }

  function render(ctx) {
    const { grid, tiles, snake, food } = gameRef.current;
    const size = grid * tiles;
    ctx.canvas.width = Math.min(600, size);
    ctx.canvas.height = Math.min(600, size);
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i <= tiles; i++) {
      line(ctx, i * grid, 0, i * grid, tiles * grid);
      line(ctx, 0, i * grid, tiles * grid, i * grid);
    }
    // food
    ctx.fillStyle = '#ff00ff';
    dot(ctx, food.x * grid, food.y * grid, grid);
    // snake
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#00ff88' : '#00aa55';
      ctx.fillRect(s.x * grid + 1, s.y * grid + 1, grid - 2, grid - 2);
    });
  }

  return (
    <div className="game-area">
      <div className="game-header">
        <h2>🐍 Space Snake</h2>
        <div className="game-controls">
          {!running ? (
            <button className="game-button start" onClick={start}>Start</button>
          ) : (
            <button className="game-button stop" onClick={stop}>Stop</button>
          )}
          <div style={{ marginLeft: 12 }}>Score: {score}</div>
        </div>
      </div>
      <canvas ref={canvasRef} className="game-canvas" width={480} height={480} />
    </div>
  );
}

function randomFood(g) {
  let f;
  do {
    f = { x: Math.floor(Math.random() * g.tiles), y: Math.floor(Math.random() * g.tiles) };
  } while (g.snake.some(s => s.x === f.x && s.y === f.y));
  return f;
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function dot(ctx, x, y, size) {
  ctx.beginPath(); ctx.arc(x + size/2, y + size/2, size/2 - 2, 0, Math.PI*2); ctx.fill();
}


