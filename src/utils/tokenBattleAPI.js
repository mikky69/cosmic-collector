// Token Battle API Service - Real Crypto Data Integration
// This service can fetch live data from various crypto APIs

class TokenBattleAPI {
  constructor() {
    this.baseUrls = {
      coinGecko: 'https://api.coingecko.com/api/v3',
      coinMarketCap: 'https://pro-api.coinmarketcap.com/v1', // Requires API key
      dexScreener: 'https://api.dexscreener.com/latest/dex',
      messari: 'https://data.messari.io/api/v1'
    };
    
    this.rateLimits = {
      coinGecko: { requests: 100, window: 60000 }, // 100 requests per minute
      lastRequest: 0,
      requestCount: 0
    };
    
    // Cache for API responses
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Rate limiting helper
  async checkRateLimit(service = 'coinGecko') {
    const now = Date.now();
    const limit = this.rateLimits[service];
    
    if (now - this.rateLimits.lastRequest > limit.window) {
      this.rateLimits.requestCount = 0;
      this.rateLimits.lastRequest = now;
    }
    
    if (this.rateLimits.requestCount >= limit.requests) {
      const waitTime = limit.window - (now - this.rateLimits.lastRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.rateLimits.requestCount++;
  }

  // Cache management
  getCacheKey(endpoint, params = {}) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  getFromCache(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCache(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  // Fetch comprehensive token data
  async fetchTokenData(tokenIds = []) {
    const cacheKey = this.getCacheKey('token_data', tokenIds);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      await this.checkRateLimit();
      
      // Use CoinGecko's comprehensive endpoint
      const idsString = tokenIds.join(',');
      const response = await fetch(
        `${this.baseUrls.coinGecko}/coins/markets?vs_currency=usd&ids=${idsString}&order=market_cap_desc&per_page=250&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d&locale=en`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      const processedData = this.processTokenData(data);
      
      this.setCache(cacheKey, processedData);
      return processedData;
    } catch (error) {
      console.warn('Failed to fetch live data, using fallback:', error);
      return this.getFallbackData(tokenIds);
    }
  }

  // Process raw API data into game format
  processTokenData(apiData) {
    return apiData.reduce((acc, token) => {
      acc[token.symbol.toUpperCase()] = {
        name: token.name,
        symbol: token.symbol.toUpperCase(),
        marketCap: token.market_cap || 0,
        volume24h: token.total_volume || 0,
        price: token.current_price || 0,
        priceChange24h: token.price_change_percentage_24h || 0,
        priceChange7d: token.price_change_percentage_7d_in_currency || 0,
        rank: token.market_cap_rank || 999,
        totalSupply: token.total_supply || 0,
        circulatingSupply: token.circulating_supply || 0,
        athPrice: token.ath || 0,
        atlPrice: token.atl || 0,
        sparkline: token.sparkline_in_7d?.price || [],
        lastUpdated: new Date().toISOString(),
        
        // Additional calculated metrics
        holders: this.estimateHolders(token.market_cap, token.current_price),
        socialScore: this.calculateSocialScore(token),
        githubCommits: this.estimateGithubActivity(token.name, token.symbol),
        age: this.estimateTokenAge(token.name),
        
        // Visual properties
        color: this.getTokenColor(token.symbol.toUpperCase()),
        logo: this.getTokenLogo(token.symbol.toUpperCase()),
        description: this.getTokenDescription(token.name, token.symbol.toUpperCase())
      };
    }, {});
  }

  // Estimate holders based on market cap and price
  estimateHolders(marketCap, price) {
    if (!marketCap || !price) return 0;
    
    // Rough estimation: higher market cap = more holders, but with diminishing returns
    const baseHolders = Math.sqrt(marketCap / 1000000) * 10000;
    const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
    return Math.floor(baseHolders * (1 + variation));
  }

  // Calculate social score based on market metrics
  calculateSocialScore(token) {
    let score = 50; // Base score
    
    // Market cap influence (0-25 points)
    if (token.market_cap > 100000000000) score += 25; // >100B
    else if (token.market_cap > 50000000000) score += 20; // >50B
    else if (token.market_cap > 10000000000) score += 15; // >10B
    else if (token.market_cap > 1000000000) score += 10; // >1B
    else if (token.market_cap > 100000000) score += 5; // >100M
    
    // Volume influence (0-15 points)
    const volumeToMcapRatio = token.total_volume / token.market_cap;
    if (volumeToMcapRatio > 0.1) score += 15;
    else if (volumeToMcapRatio > 0.05) score += 10;
    else if (volumeToMcapRatio > 0.02) score += 5;
    
    // Price performance influence (0-10 points)
    if (token.price_change_percentage_24h > 10) score += 10;
    else if (token.price_change_percentage_24h > 5) score += 5;
    else if (token.price_change_percentage_24h < -10) score -= 5;
    
    return Math.min(100, Math.max(0, score));
  }

  // Estimate GitHub activity
  estimateGithubActivity(name, symbol) {
    const knownProjects = {
      'BITCOIN': 25000,
      'ETHEREUM': 18000,
      'CARDANO': 15000,
      'POLKADOT': 11000,
      'CHAINLINK': 6000,
      'SOLANA': 12000,
      'POLYGON': 9000,
      'ALGORAND': 4000,
      'COSMOS': 8500,
      'AVALANCHE': 7000
    };
    
    if (knownProjects[symbol]) {
      return knownProjects[symbol];
    }
    
    // Estimate based on market position and type
    const baseCommits = Math.random() * 3000 + 500;
    return Math.floor(baseCommits);
  }

  // Estimate token age
  estimateTokenAge(name) {
    const knownAges = {
      'Bitcoin': 15,
      'Ethereum': 9,
      'Cardano': 7,
      'Dogecoin': 10,
      'Chainlink': 6,
      'Polkadot': 4,
      'Solana': 4,
      'Polygon': 5,
      'Cosmos': 6,
      'Avalanche': 4
    };
    
    if (knownAges[name]) {
      return knownAges[name];
    }
    
    // Default estimation
    return Math.floor(Math.random() * 6) + 2; // 2-8 years
  }

  // Get token colors
  getTokenColor(symbol) {
    const colors = {
      'BTC': '#F7931A',
      'ETH': '#627EEA',
      'BNB': '#F3BA2F',
      'SOL': '#9945FF',
      'ADA': '#0033AD',
      'DOGE': '#C2A633',
      'MATIC': '#8247E5',
      'DOT': '#E6007A',
      'SHIB': '#FFA409',
      'AVAX': '#E84142',
      'UNI': '#FF007A',
      'LINK': '#375BD2',
      'ATOM': '#2E3148',
      'ALGO': '#000000',
      'MANA': '#FF2D55'
    };
    
    return colors[symbol] || this.generateRandomColor();
  }

  // Generate random color for unknown tokens
  generateRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Get token logos
  getTokenLogo(symbol) {
    const logos = {
      'BTC': '₿',
      'ETH': 'Ξ',
      'BNB': 'B',
      'SOL': 'S',
      'ADA': 'A',
      'DOGE': 'Ð',
      'MATIC': 'M',
      'DOT': '●',
      'SHIB': '🐕',
      'AVAX': 'A',
      'UNI': 'U',
      'LINK': 'L',
      'ATOM': 'C',
      'ALGO': 'A',
      'MANA': 'M'
    };
    
    return logos[symbol] || symbol.charAt(0);
  }

  // Get token descriptions
  getTokenDescription(name, symbol) {
    const descriptions = {
      'Bitcoin': 'The original cryptocurrency',
      'Ethereum': 'Smart contract platform',
      'BNB': 'Binance ecosystem token',
      'Solana': 'High-speed blockchain',
      'Cardano': 'Research-driven blockchain',
      'Dogecoin': 'The meme coin',
      'Polygon': 'Ethereum scaling solution',
      'Polkadot': 'Interoperable blockchain',
      'Shiba Inu': 'Dogecoin killer',
      'Avalanche': 'Fast smart contracts platform',
      'Uniswap': 'Decentralized exchange',
      'Chainlink': 'Oracle network',
      'Cosmos': 'Internet of blockchains',
      'Algorand': 'Pure proof of stake',
      'Decentraland': 'Virtual reality platform'
    };
    
    return descriptions[name] || `${name} token`;
  }

  // Fallback data when API fails
  getFallbackData(requestedTokens) {
    const fallbackData = {
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
      }
      // ... other fallback data
    };

    return requestedTokens.reduce((acc, tokenId) => {
      const symbol = tokenId.toUpperCase();
      if (fallbackData[symbol]) {
        acc[symbol] = fallbackData[symbol];
      }
      return acc;
    }, {});
  }

  // Fetch trending tokens
  async fetchTrendingTokens(limit = 20) {
    const cacheKey = this.getCacheKey('trending', { limit });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      await this.checkRateLimit();
      
      const response = await fetch(
        `${this.baseUrls.coinGecko}/coins/markets?vs_currency=usd&order=volume_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      const processed = this.processTokenData(data);
      
      this.setCache(cacheKey, processed);
      return processed;
    } catch (error) {
      console.warn('Failed to fetch trending tokens:', error);
      return this.getFallbackData(['BTC', 'ETH', 'BNB', 'SOL']);
    }
  }

  // Generate enhanced questions with live data
  generateLiveQuestion(tokenData) {
    const tokens = Object.keys(tokenData);
    if (tokens.length < 2) return null;

    const token1 = tokens[Math.floor(Math.random() * tokens.length)];
    let token2 = tokens[Math.floor(Math.random() * tokens.length)];
    
    while (token2 === token1) {
      token2 = tokens[Math.floor(Math.random() * tokens.length)];
    }

    const questionTypes = [
      {
        type: 'marketCap',
        weight: 3,
        templates: [
          'Which token has a higher market capitalization?',
          'Which cryptocurrency has more total market value?',
          'Which token is worth more in total?'
        ],
        dataKey: 'marketCap'
      },
      {
        type: 'volume',
        weight: 2,
        templates: [
          'Which token has higher 24h trading volume?',
          'Which coin is traded more actively today?',
          'Which token has more liquidity?'
        ],
        dataKey: 'volume24h'
      },
      {
        type: 'price',
        weight: 2,
        templates: [
          'Which token has a higher current price?',
          'Which cryptocurrency costs more per token?',
          'Which coin is more expensive to buy?'
        ],
        dataKey: 'price'
      },
      {
        type: 'performance',
        weight: 3,
        templates: [
          'Which token has better 24h performance?',
          'Which coin gained more value today?',
          'Which token is performing better?'
        ],
        dataKey: 'priceChange24h'
      },
      {
        type: 'rank',
        weight: 2,
        templates: [
          'Which token has a better market cap rank?',
          'Which cryptocurrency ranks higher?',
          'Which token is ranked better by market cap?'
        ],
        dataKey: 'rank',
        reverse: true // Lower rank number is better
      }
    ];

    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    const template = questionType.templates[Math.floor(Math.random() * questionType.templates.length)];
    
    const token1Data = tokenData[token1];
    const token2Data = tokenData[token2];
    
    let correctAnswer;
    if (questionType.reverse) {
      correctAnswer = token1Data[questionType.dataKey] < token2Data[questionType.dataKey] ? token1 : token2;
    } else {
      correctAnswer = token1Data[questionType.dataKey] > token2Data[questionType.dataKey] ? token1 : token2;
    }
    
    return {
      question: template,
      token1: token1,
      token2: token2,
      token1Data: token1Data,
      token2Data: token2Data,
      correctAnswer: correctAnswer,
      type: questionType.type,
      weight: questionType.weight,
      isLiveData: true,
      timestamp: Date.now()
    };
  }

  // Clean up old cache entries
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }
}

export default TokenBattleAPI;
