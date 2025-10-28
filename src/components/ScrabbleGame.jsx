import React, { useEffect, useMemo, useState } from 'react';

// Minimal scaffold; wordlist to be expanded from server/CDN later
const seedWords = ['blockchain','hedera','hashgraph','consensus','staking','sharding','evm','wallet','airdrop','validator','solidity','nft','mint','bridge','gas','rollup','zk','op','layer2','token'];

export default function ScrabbleGame() {
  const [letters, setLetters] = useState('');
  const [word, setWord] = useState('');
  const [score, setScore] = useState(0);

  useEffect(() => { setLetters(generateRack()); }, []);

  const dict = useMemo(() => new Set(seedWords), []);

  function submit() {
    const w = word.trim().toLowerCase();
    if (!w) return;
    if (!canForm(w, letters)) return alert('Use only given letters');
    if (!dict.has(w)) return alert('Not in dictionary');
    setScore(prev => prev + Math.max(5, w.length * 10));
    setLetters(generateRack());
    setWord('');
  }

  return (
    <div className="game-area">
      <div className="game-header">
        <h2>🔤 Web3 Word Scrabble</h2>
        <div>Score: {score}</div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 24, letterSpacing: 6, marginBottom: 12 }}>
          {letters.split('').map((c, i) => <span key={i}>{c.toUpperCase()}</span>)}
        </div>
        <input value={word} onChange={e => setWord(e.target.value)} placeholder="Enter a web3 word" style={{ padding: 8, width: 300 }} />
        <button onClick={submit} style={{ marginLeft: 8 }}>Submit</button>
        <p style={{ opacity: 0.8, marginTop: 10 }}>Make valid crypto/web3 terms using the letters above. Bigger words score more.</p>
      </div>
    </div>
  );
}

function generateRack() {
  const alphabet = 'abcdefghiijklmnopqrstuvwxyz';
  let s = '';
  for (let i = 0; i < 10; i++) s += alphabet[Math.floor(Math.random()*alphabet.length)];
  return s;
}
function canForm(w, rack) {
  const counts = {};
  for (const c of rack) counts[c] = (counts[c]||0)+1;
  for (const c of w) { if (!counts[c]) return false; counts[c]--; }
  return true;
}


