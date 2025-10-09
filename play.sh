#!/bin/bash

# 🌌 Cosmic Collector - Instant Setup & Launch Script
# This script sets up everything and launches your game in seconds!

echo "🌌 COSMIC COLLECTOR - INSTANT SETUP"
echo "===================================="
echo ""

# Step 1: Setup React package.json
echo "📦 Setting up React dependencies..."
cp react-package.json package.json

# Step 2: Install dependencies
echo "⚡ Installing game dependencies..."
npm install --silent

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎮 COSMIC COLLECTOR READY TO LAUNCH!"
echo "====================================="
echo ""
echo "🚀 Your game features:"
echo "   • Space adventure with cosmic ship"
echo "   • Collect rare items and mint NFTs" 
echo "   • Player inventory and marketplace"
echo "   • Leaderboard and statistics"
echo "   • Mock blockchain (works immediately!)"
echo ""
echo "🎯 Starting game server..."
echo "   Game will open at: http://localhost:3000"
echo ""
echo "🎮 How to play:"
echo "   1. Click 'Start Demo' to begin"
echo "   2. Use arrow keys or WASD to fly"
echo "   3. Collect cosmic items for points"
echo "   4. Rare items automatically mint NFTs!"
echo ""
echo "⚡ Launching Cosmic Collector..."
echo ""

# Step 3: Launch the game
npm start