import React, { useState, useEffect, useRef } from 'react';
import TokenBattleAPI from '../utils/tokenBattleAPI';
import './TokenBattle.css';

const TokenBattle = () => {
  const [gameState, setGameState] = useState('menu'); // menu, loading, playing, result, gameOver
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [battleAnimation, setBattleAnimation] = useState(false);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [powerUps, setPowerUps] = useState({ timeFreeze: 0, doublePoints: 0, skipQuestion: 0 });
  const [liveTokenData, setLiveTokenData] = useState(null);
  const [useLiveData, setUseLiveData] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const apiRef = useRef(new TokenBattleAPI());

  // Extensive token database with real crypto projects
  const tokenDatabase = {
    'BTC': {
      name: 'Bitcoin',
      symbol: 'BTC',
      marketCap: 1200000000000,
      volume24h: 25000000000,
      socialScore: 95,
      githubCommits: 25000,
      holders: 45000000,
      age: 15,
      color: '#F7931A',
      logo: '₿',
      description: 'The original cryptocurrency'
    },
    'ETH': {
      name: 'Ethereum',
      symbol: 'ETH',
      marketCap: 400000000000,
      volume24h: 15000000000,
      socialScore: 92,
      githubCommits: 18000,
      holders: 120000000,
      age: 9,
      color: '#627EEA',
      logo: 'Ξ',
      description: 'Smart contract platform'
    },
    'BNB': {
      name: 'BNB',
      symbol: 'BNB',
      marketCap: 80000000000,
      volume24h: 2000000000,
      socialScore: 85,
      githubCommits: 8000,
      holders: 170000000,
      age: 6,
      color: '#F3BA2F',
      logo: 'B',
      description: 'Binance ecosystem token'
    },
    'SOL': {
      name: 'Solana',
      symbol: 'SOL',
      marketCap: 60000000000,
      volume24h: 3000000000,
      socialScore: 88,
      githubCommits: 12000,
      holders: 4500000,
      age: 4,
      color: '#9945FF',
      logo: 'S',
      description: 'High-speed blockchain'
    },
    'ADA': {
      name: 'Cardano',
      symbol: 'ADA',
      marketCap: 35000000000,
      volume24h: 800000000,
      socialScore: 80,
      githubCommits: 15000,
      holders: 4200000,
      age: 7,
      color: '#0033AD',
      logo: 'A',
      description: 'Research-driven blockchain'
    },
    'DOGE': {
      name: 'Dogecoin',
      symbol: 'DOGE',
      marketCap: 25000000000,
      volume24h: 1200000000,
      socialScore: 90,
      githubCommits: 3000,
      holders: 5000000,
      age: 10,
      color: '#C2A633',
      logo: 'Ð',
      description: 'The meme coin'
    },
    'MATIC': {
      name: 'Polygon',
      symbol: 'MATIC',
      marketCap: 20000000000,
      volume24h: 600000000,
      socialScore: 82,
      githubCommits: 9000,
      holders: 350000,
      age: 5,
      color: '#8247E5',
      logo: 'M',
      description: 'Ethereum scaling solution'
    },
    'DOT': {
      name: 'Polkadot',
      symbol: 'DOT',
      marketCap: 18000000000,
      volume24h: 500000000,
      socialScore: 78,
      githubCommits: 11000,
      holders: 1200000,
      age: 4,
      color: '#E6007A',
      logo: '●',
      description: 'Interoperable blockchain'
    },
    'SHIB': {
      name: 'Shiba Inu',
      symbol: 'SHIB',
      marketCap: 15000000000,
      volume24h: 900000000,
      socialScore: 85,
      githubCommits: 500,
      holders: 1300000,
      age: 3,
      color: '#FFA409',
      logo: '🐕',
      description: 'Dogecoin killer'
    },
    'AVAX': {
      name: 'Avalanche',
      symbol: 'AVAX',
      marketCap: 14000000000,
      volume24h: 400000000,
      socialScore: 79,
      githubCommits: 7000,
      holders: 2000000,
      age: 4,
      color: '#E84142',
      logo: 'A',
      description: 'Fast smart contracts platform'
    },
    'UNI': {
      name: 'Uniswap',
      symbol: 'UNI',
      marketCap: 12000000000,
      volume24h: 300000000,
      socialScore: 83,
      githubCommits: 2500,
      holders: 300000,
      age: 4,
      color: '#FF007A',
      logo: 'U',
      description: 'Decentralized exchange'
    },
    'LINK': {
      name: 'Chainlink',
      symbol: 'LINK',
      marketCap: 11000000000,
      volume24h: 350000000,
      socialScore: 81,
      githubCommits: 6000,
      holders: 700000,
      age: 6,
      color: '#375BD2',
      logo: 'L',
      description: 'Oracle network'
    },
    'ATOM': {
      name: 'Cosmos',
      symbol: 'ATOM',
      marketCap: 8000000000,
      volume24h: 200000000,
      socialScore: 76,
      githubCommits: 8500,
      holders: 280000,
      age: 6,
      color: '#2E3148',
      logo: 'C',
      description: 'Internet of blockchains'
    },
    'ALGO': {
      name: 'Algorand',
      symbol: 'ALGO',
      marketCap: 7000000000,
      volume24h: 150000000,
      socialScore: 74,
      githubCommits: 4000,
      holders: 200000,
      age: 5,
      color: '#000000',
      logo: 'A',
      description: 'Pure proof of stake'
    },
    'MANA': {
      name: 'Decentraland',
      symbol: 'MANA',
      marketCap: 6000000000,
      volume24h: 180000000,
      socialScore: 77,
      githubCommits: 1500,
      holders: 150000,
      age: 6,
      color: '#FF2D55',
      logo: 'M',
      description: 'Virtual reality platform'
    }
  };

  // Comprehensive question bank with different categories and weights
  const questionTypes = [
    {
      type: 'marketCap',
      weight: 3,
      templates: [
        'Which token has a higher market capitalization?',
        'Which project has more total value locked?',
        'Which token is worth more in total market value?',
        'Which cryptocurrency has a bigger market cap?'
      ]
    },
    {
      type: 'volume',
      weight: 2,
      templates: [
        'Which token has higher 24h trading volume?',
        'Which coin is traded more actively?',
        'Which token has more daily trading activity?',
        'Which cryptocurrency has higher liquidity?'
      ]
    },
    {
      type: 'socialScore',
      weight: 2,
      templates: [
        'Which token has stronger social media presence?',
        'Which project has more community engagement?',
        'Which coin has better social sentiment?',
        'Which token is more popular on social platforms?'
      ]
    },
    {
      type: 'githubCommits',
      weight: 2,
      templates: [
        'Which project has more GitHub commits?',
        'Which token has more active development?',
        'Which project shows more coding activity?',
        'Which cryptocurrency has more developer contributions?'
      ]
    },
    {
      type: 'holders',
      weight: 2,
      templates: [
        'Which token has more holders?',
        'Which coin has a larger user base?',
        'Which project has more wallet addresses?',
        'Which token is held by more people?'
      ]
    },
    {
      type: 'age',
      weight: 1,
      templates: [
        'Which token has been around longer?',
        'Which project is older?',
        'Which cryptocurrency was launched first?',
        'Which token has more years in the market?'
      ]
    }
  ];

  // Generate a random question
  const generateQuestion = () => {
    if (useLiveData && liveTokenData) {
      const liveQuestion = apiRef.current.generateLiveQuestion(liveTokenData);
      if (liveQuestion) return liveQuestion;
    }
    
    // Fallback to static data
    const tokens = Object.keys(tokenDatabase);
    const token1 = tokens[Math.floor(Math.random() * tokens.length)];
    let token2 = tokens[Math.floor(Math.random() * tokens.length)];
    
    // Ensure different tokens
    while (token2 === token1) {
      token2 = tokens[Math.floor(Math.random() * tokens.length)];
    }

    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    const template = questionType.templates[Math.floor(Math.random() * questionType.templates.length)];
    
    const token1Data = tokenDatabase[token1];
    const token2Data = tokenDatabase[token2];
    
    const correctAnswer = token1Data[questionType.type] > token2Data[questionType.type] ? token1 : token2;
    
    return {
      question: template,
      token1: token1,
      token2: token2,
      token1Data: token1Data,
      token2Data: token2Data,
      correctAnswer: correctAnswer,
      type: questionType.type,
      weight: questionType.weight,
      difficulty: Math.abs(token1Data[questionType.type] - token2Data[questionType.type]) < 
                  (token1Data[questionType.type] + token2Data[questionType.type]) * 0.1 ? 'hard' : 'easy',
      isLiveData: false
    };
  };

  // Load live data
  const loadLiveData = async () => {
    try {
      setGameState('loading');
      setLoadingMessage('🌐 Connecting to crypto markets...');
      
      // Get trending tokens
      const trending = await apiRef.current.fetchTrendingTokens(30);
      
      setLoadingMessage('📊 Loading market data...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause for UX
      
      setLiveTokenData(trending);
      setUseLiveData(true);
      setLoadingMessage('✅ Live data loaded!');
      
      setTimeout(() => {
        setGameState('playing');
        generateNewQuestion();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to load live data:', error);
      setLoadingMessage('⚠️ Using offline data...');
      setUseLiveData(false);
      
      setTimeout(() => {
        setGameState('playing');
        generateNewQuestion();
      }, 1500);
    }
  };

  // Start the game
  const startGame = (withLiveData = false) => {
    setScore(0);
    setStreak(0);
    setLevel(1);
    setQuestionsAnswered(0);
    setComboMultiplier(1);
    setPowerUps({ timeFreeze: 1, doublePoints: 1, skipQuestion: 1 });
    
    if (withLiveData) {
      loadLiveData();
    } else {
      setUseLiveData(false);
      setGameState('playing');
      generateNewQuestion();
    }
  };

  // Generate new question
  const generateNewQuestion = () => {
    const question = generateQuestion();
    setCurrentQuestion(question);
    setTimeLeft(30 - Math.floor(level / 3)); // Decrease time as level increases
    setSelectedAnswer(null);
    setShowResult(false);
    setBattleAnimation(true);
    
    setTimeout(() => setBattleAnimation(false), 1000);
  };

  // Handle answer selection
  const selectAnswer = (answer) => {
    if (selectedAnswer || showResult) return;
    
    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      const basePoints = currentQuestion.weight * 100;
      const timeBonus = Math.floor(timeLeft * 10);
      const streakBonus = streak * 50;
      const difficultyBonus = currentQuestion.difficulty === 'hard' ? 200 : 0;
      const levelBonus = level * 25;
      
      const totalPoints = (basePoints + timeBonus + streakBonus + difficultyBonus + levelBonus) * comboMultiplier;
      
      setScore(prev => prev + totalPoints);
      setStreak(prev => prev + 1);
      
      if (streak > 0 && streak % 3 === 0) {
        setComboMultiplier(prev => Math.min(prev + 0.5, 5));
      }
    } else {
      setStreak(0);
      setComboMultiplier(1);
    }
    
    setShowResult(true);
    
    setTimeout(() => {
      setQuestionsAnswered(prev => prev + 1);
      
      if (questionsAnswered + 1 >= level * 5) {
        setLevel(prev => prev + 1);
        // Award power-up every 3 levels
        if ((level + 1) % 3 === 0) {
          setPowerUps(prev => ({
            ...prev,
            [Object.keys(prev)[Math.floor(Math.random() * 3)]]: prev[Object.keys(prev)[Math.floor(Math.random() * 3)]] + 1
          }));
        }
      }
      
      if (questionsAnswered + 1 >= 50) {
        endGame();
      } else {
        generateNewQuestion();
      }
    }, 2000);
  };

  // Use power-up
  const usePowerUp = (type) => {
    if (powerUps[type] <= 0) return;
    
    setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
    
    switch (type) {
      case 'timeFreeze':
        setTimeLeft(prev => prev + 15);
        break;
      case 'doublePoints':
        setComboMultiplier(prev => prev * 2);
        setTimeout(() => setComboMultiplier(prev => prev / 2), 5000);
        break;
      case 'skipQuestion':
        generateNewQuestion();
        break;
    }
  };

  // End game
  const endGame = () => {
    setGameState('gameOver');
    clearInterval(timerRef.current);
  };

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      endGame();
    }
    
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, gameState]);

  // Render token card
  const renderToken = (tokenSymbol, tokenData, isSelected, isCorrect) => (
    <div 
      className={`token-card ${isSelected ? 'selected' : ''} ${isSelected && isCorrect === true ? 'correct' : ''} ${isSelected && isCorrect === false ? 'incorrect' : ''} ${battleAnimation ? 'battle-animation' : ''}`}
      onClick={() => selectAnswer(tokenSymbol)}
    >
      <div className="token-logo" style={{ backgroundColor: tokenData.color }}>
        {tokenData.logo}
      </div>
      <div className="token-info">
        <h3>{tokenData.name}</h3>
        <p className="token-symbol">{tokenData.symbol}</p>
        <p className="token-description">{tokenData.description}</p>
      </div>
      <div className="token-stats">
        <div className="stat">
          <span className="stat-label">Market Cap</span>
          <span className="stat-value">${(tokenData.marketCap / 1000000000).toFixed(1)}B</span>
        </div>
        <div className="stat">
          <span className="stat-label">Volume 24h</span>
          <span className="stat-value">${(tokenData.volume24h / 1000000).toFixed(0)}M</span>
        </div>
      </div>
      {isSelected && (
        <div className="selection-indicator">
          {isCorrect ? '✓' : '✗'}
        </div>
      )}
    </div>
  );

  if (gameState === 'loading') {
    return (
      <div className="token-battle-container">
        <div className="loading-screen">
          <div className="loading-content">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <h2 className="loading-title">Preparing Battle Arena</h2>
            <p className="loading-message">{loadingMessage}</p>
            <div className="loading-progress">
              <div className="progress-bar"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'menu') {
    return (
      <div className="token-battle-container">
        <div className="game-menu">
          <div className="menu-header">
            <h1 className="game-title">
              <span className="title-icon">⚔️</span>
              CRYPTO BATTLE ARENA
              <span className="title-icon">⚔️</span>
            </h1>
            <p className="game-subtitle">Test your crypto knowledge in epic token battles!</p>
          </div>
          
          <div className="menu-features">
            <div className="feature">
              <span className="feature-icon">⏱️</span>
              <span>30-second rapid rounds</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🚀</span>
              <span>Real market data battles</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🎯</span>
              <span>Power-ups & combo system</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🏆</span>
              <span>Progressive difficulty</span>
            </div>
          </div>
          
          <div className="game-mode-selection">
            <button className="start-button live-mode" onClick={() => startGame(true)}>
              <span className="button-text">BATTLE WITH LIVE DATA</span>
              <span className="button-icon">🌐</span>
            </button>
            
            <button className="start-button demo-mode" onClick={() => startGame(false)}>
              <span className="button-text">DEMO MODE</span>
              <span className="button-icon">⚡</span>
            </button>
          </div>
          
          <div className="game-rules">
            <h3>How to Play:</h3>
            <ul>
              <li>Choose the token that better matches the question</li>
              <li>Answer quickly for time bonuses</li>
              <li>Build streaks for combo multipliers</li>
              <li>Use power-ups strategically</li>
              <li>Survive 50 questions to become a Crypto Master!</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    return (
      <div className="token-battle-container">
        <div className="game-header">
          <div className="game-stats">
            <div className="stat-item">
              <span className="stat-label">Score</span>
              <span className="stat-value">{score.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Level</span>
              <span className="stat-value">{level}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Streak</span>
              <span className="stat-value">{streak}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Questions</span>
              <span className="stat-value">{questionsAnswered}/50</span>
            </div>
          </div>
          
          <div className="center-section">
            <div className="timer-container">
              <div className={`timer ${timeLeft <= 10 ? 'warning' : ''} ${timeLeft <= 5 ? 'critical' : ''}`}>
                <div className="timer-text">{timeLeft}s</div>
                <div 
                  className="timer-bar" 
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {useLiveData && (
              <div className="live-data-indicator">
                <span className="live-icon">🌐</span>
                <span>LIVE DATA</span>
              </div>
            )}
          </div>
          
          <div className="power-ups">
            <button 
              className={`power-up ${powerUps.timeFreeze <= 0 ? 'disabled' : ''}`}
              onClick={() => usePowerUp('timeFreeze')}
              disabled={powerUps.timeFreeze <= 0}
              title="Add 15 seconds"
            >
              ❄️ {powerUps.timeFreeze}
            </button>
            <button 
              className={`power-up ${powerUps.doublePoints <= 0 ? 'disabled' : ''}`}
              onClick={() => usePowerUp('doublePoints')}
              disabled={powerUps.doublePoints <= 0}
              title="Double points for 5 seconds"
            >
              ⭐ {powerUps.doublePoints}
            </button>
            <button 
              className={`power-up ${powerUps.skipQuestion <= 0 ? 'disabled' : ''}`}
              onClick={() => usePowerUp('skipQuestion')}
              disabled={powerUps.skipQuestion <= 0}
              title="Skip this question"
            >
              ⏭️ {powerUps.skipQuestion}
            </button>
          </div>
        </div>

        <div className="question-container">
          <h2 className="question-text">{currentQuestion.question}</h2>
          {comboMultiplier > 1 && (
            <div className="combo-indicator">
              <span className="combo-text">COMBO x{comboMultiplier}</span>
            </div>
          )}
        </div>

        <div className="battle-arena">
          <div className="vs-indicator">VS</div>
          
          <div className="tokens-container">
            {renderToken(
              currentQuestion.token1, 
              currentQuestion.token1Data, 
              selectedAnswer === currentQuestion.token1,
              showResult ? selectedAnswer === currentQuestion.token1 && isCorrect : null
            )}
            
            {renderToken(
              currentQuestion.token2, 
              currentQuestion.token2Data, 
              selectedAnswer === currentQuestion.token2,
              showResult ? selectedAnswer === currentQuestion.token2 && isCorrect : null
            )}
          </div>
        </div>

        {showResult && (
          <div className={`result-banner ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="result-text">
              {isCorrect ? '🎉 CORRECT!' : '❌ WRONG!'}
            </div>
            <div className="result-details">
              {isCorrect 
                ? `+${((currentQuestion.weight * 100 + Math.floor(timeLeft * 10) + streak * 50 + (currentQuestion.difficulty === 'hard' ? 200 : 0) + level * 25) * comboMultiplier).toLocaleString()} points!`
                : `Correct answer: ${tokenDatabase[currentQuestion.correctAnswer].name}`
              }
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameState === 'gameOver') {
    const rank = score > 50000 ? 'Crypto Master 🏆' : 
                 score > 30000 ? 'Token Expert 🥇' :
                 score > 15000 ? 'Market Analyst 🥈' :
                 score > 5000 ? 'Crypto Enthusiast 🥉' : 'Crypto Newbie 📚';
    
    return (
      <div className="token-battle-container">
        <div className="game-over">
          <h1 className="game-over-title">BATTLE COMPLETE!</h1>
          
          <div className="final-stats">
            <div className="rank-badge">
              <h2>{rank}</h2>
            </div>
            
            <div className="stats-grid">
              <div className="final-stat">
                <span className="stat-label">Final Score</span>
                <span className="stat-value">{score.toLocaleString()}</span>
              </div>
              <div className="final-stat">
                <span className="stat-label">Level Reached</span>
                <span className="stat-value">{level}</span>
              </div>
              <div className="final-stat">
                <span className="stat-label">Best Streak</span>
                <span className="stat-value">{streak}</span>
              </div>
              <div className="final-stat">
                <span className="stat-label">Questions Answered</span>
                <span className="stat-value">{questionsAnswered}</span>
              </div>
            </div>
          </div>
          
          <div className="game-over-actions">
            <button className="play-again-button" onClick={() => startGame(useLiveData)}>
              <span>BATTLE AGAIN</span>
              <span>⚔️</span>
            </button>
            <button className="menu-button" onClick={() => setGameState('menu')}>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default TokenBattle;
