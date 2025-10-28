import React, { useEffect, useRef, useState } from 'react';
import { getPlayerNFTs } from '../utils/blockchain';

export default function AsteroidMiner({ walletAddress }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const stateRef = useRef({
    ship: { x: 300, y: 240, a: 0, vx: 0, vy: 0 },
    asteroids: [],
    mining: null,
    boost: 1,
    keys: {},
  });

  useEffect(() => {
    const onKey = (e) => { stateRef.current.keys[e.key.toLowerCase()] = e.type === 'keydown'; };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!walletAddress) return;
      try {
        const nfts = await getPlayerNFTs(walletAddress);
        if (!mounted) return;
        stateRef.current.boost = Array.isArray(nfts) && nfts.length ? 1.15 : 1;
      } catch {}
    }
    load();
    return () => { mounted = false; };
  }, [walletAddress]);

  const start = () => {
    setScore(0);
    stateRef.current.asteroids = spawnAsteroids(10);
    setRunning(true);
    rafRef.current = requestAnimationFrame(loop);
  };
  const stop = () => { setRunning(false); cancelAnimationFrame(rafRef.current); };

  function loop() {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;
    // physics
    const thrust = s.keys['w'] || s.keys['arrowup'];
    if (s.keys['a'] || s.keys['arrowleft']) s.ship.a -= 0.05;
    if (s.keys['d'] || s.keys['arrowright']) s.ship.a += 0.05;
    if (thrust) { s.ship.vx += Math.cos(s.ship.a) * 0.2; s.ship.vy += Math.sin(s.ship.a) * 0.2; }
    s.ship.vx *= 0.99; s.ship.vy *= 0.99;
    s.ship.x = (s.ship.x + s.ship.vx + 600) % 600;
    s.ship.y = (s.ship.y + s.ship.vy + 480) % 480;

    // mining on Space
    if (s.keys[' '] && !s.mining) {
      const target = s.asteroids.find(a => dist(a.x, a.y, s.ship.x, s.ship.y) < 40);
      if (target) s.mining = { target, p: 0 };
    }
    if (!s.keys[' ']) s.mining = null;
    if (s.mining) {
      s.mining.p += 0.02 * s.boost;
      if (s.mining.p >= 1) {
        setScore(prev => prev + Math.floor(s.mining.target.value * s.boost));
        s.asteroids = s.asteroids.filter(a => a !== s.mining.target);
        s.mining = null;
        if (s.asteroids.length < 8) s.asteroids.push(spawnAsteroids(1)[0]);
      }
    }

    // render
    ctx.fillStyle = '#000011'; ctx.fillRect(0, 0, 600, 480);
    // stars
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 120; i++) ctx.fillRect((i*37)%600, (i*53)%480, 1, 1);
    // asteroids
    s.asteroids.forEach(a => { ctx.fillStyle = a.color; poly(ctx, a.x, a.y, a.size); });
    // ship
    ctx.save(); ctx.translate(s.ship.x, s.ship.y); ctx.rotate(s.ship.a);
    ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.moveTo(15,0); ctx.lineTo(-10,-8); ctx.lineTo(-5,0); ctx.lineTo(-10,8); ctx.closePath(); ctx.fill(); ctx.restore();
    // mining beam
    if (s.mining) { ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s.ship.x, s.ship.y); ctx.lineTo(s.mining.target.x, s.mining.target.y); ctx.stroke(); }

    if (running) rafRef.current = requestAnimationFrame(loop);
  }

  return (
    <div className="game-area">
      <div className="game-header">
        <h2>⛏️ Asteroid Miner</h2>
        <div className="game-controls">
          {!running ? (
            <button className="game-button start" onClick={start}>Start</button>
          ) : (
            <button className="game-button stop" onClick={stop}>Stop</button>
          )}
          <div style={{ marginLeft: 12 }}>Score: {score}</div>
        </div>
      </div>
      <canvas ref={canvasRef} className="game-canvas" width={600} height={480} />
      <div className="game-instructions">
        <p><strong>Controls:</strong> WASD/Arrows to steer, Space to mine near an asteroid.</p>
      </div>
    </div>
  );
}

function spawnAsteroids(n) {
  const ores = [
    { color: '#8B4513', value: 15 },
    { color: '#FFD700', value: 50 },
    { color: '#E5E4E2', value: 100 },
  ];
  return Array.from({ length: n }).map(() => ({
    x: Math.random() * 600,
    y: Math.random() * 480,
    size: 18 + Math.random() * 24,
    ...ores[Math.floor(Math.random()*ores.length)],
  }));
}
function poly(ctx, x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i/8) * Math.PI * 2; const rr = r * (0.8 + Math.sin(i*3)*0.2);
    const px = Math.cos(ang) * rr; const py = Math.sin(ang) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function dist(x1,y1,x2,y2){ const dx=x2-x1, dy=y2-y1; return Math.sqrt(dx*dx+dy*dy); }


