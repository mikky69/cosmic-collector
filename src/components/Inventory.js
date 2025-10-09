import React, { useState, useEffect } from 'react';
import { getPlayerNFTs, listNFTForSale } from '../utils/blockchain';

const Inventory = ({ walletAddress }) => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [listingPrice, setListingPrice] = useState('');

  useEffect(() => {
    if (walletAddress) {
      loadNFTs();
    }
  }, [walletAddress]);

  const loadNFTs = async () => {
    if (!walletAddress) return;

    setLoading(true);
    try {
      const playerNFTs = await getPlayerNFTs(walletAddress);
      setNfts(playerNFTs);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    }
    setLoading(false);
  };

  const handleListNFT = async () => {
    if (!selectedNFT || !listingPrice) return;

    try {
      const success = await listNFTForSale(selectedNFT.tokenId, parseFloat(listingPrice));
      if (success) {
        alert('NFT listed for sale successfully!');
        setSelectedNFT(null);
        setListingPrice('');
        loadNFTs(); // Refresh NFTs
      } else {
        alert('Failed to list NFT for sale');
      }
    } catch (error) {
      console.error('Error listing NFT:', error);
      alert('Error listing NFT for sale');
    }
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#CCCCCC',
      rare: '#4A90E2',
      epic: '#9B59B6',
      legendary: '#F39C12'
    };
    return colors[rarity] || '#CCCCCC';
  };

  const getRarityEmoji = (rarity) => {
    const emojis = {
      common: '⚪',
      rare: '🔵',
      epic: '🟣',
      legendary: '🟡'
    };
    return emojis[rarity] || '⚪';
  };

  const getTypeEmoji = (type) => {
    const emojis = {
      star: '⭐',
      crystal: '💎',
      plasma: '🔥',
      quantum: '🌀'
    };
    return emojis[type] || '🔮';
  };

  return (
    <div className="inventory">
      <div className="inventory-header">
        <h2>🎒 Cosmic Inventory</h2>
        <button className="refresh-button" onClick={loadNFTs}>
          🔄 Refresh
        </button>
      </div>

      {!walletAddress ? (
        <div className="inventory-placeholder">
          <p>Connect your wallet to view your cosmic collectibles</p>
        </div>
      ) : loading ? (
        <div className="inventory-loading">
          <p>Loading your cosmic treasures...</p>
        </div>
      ) : nfts.length === 0 ? (
        <div className="inventory-empty">
          <div className="empty-icon">🌌</div>
          <h3>Your inventory is empty</h3>
          <p>Start playing the game to collect cosmic items and mint NFTs!</p>
        </div>
      ) : (
        <div className="inventory-content">
          <div className="inventory-stats">
            <span>Total NFTs: {nfts.length}</span>
            <span>Unique Types: {new Set(nfts.map(nft => nft.itemType)).size}</span>
          </div>

          <div className="nft-grid">
            {nfts.map((nft, index) => (
              <div 
                key={nft.tokenId || index} 
                className={`nft-card ${selectedNFT?.tokenId === nft.tokenId ? 'selected' : ''}`}
                onClick={() => setSelectedNFT(nft)}
              >
                <div className="nft-image">
                  <span className="nft-type-emoji">
                    {getTypeEmoji(nft.itemType)}
                  </span>
                  <span className="nft-rarity-badge" style={{ color: getRarityColor(nft.rarity) }}>
                    {getRarityEmoji(nft.rarity)}
                  </span>
                </div>
                
                <div className="nft-info">
                  <h4>{nft.metadata?.name || `${nft.itemType} #${nft.tokenId}`}</h4>
                  <p className="nft-type">{nft.itemType}</p>
                  <p className="nft-rarity" style={{ color: getRarityColor(nft.rarity) }}>
                    {nft.rarity}
                  </p>
                  {nft.metadata?.attributes && (
                    <div className="nft-attributes">
                      {nft.metadata.attributes.map((attr, i) => (
                        <span key={i} className="attribute">
                          {attr.trait_type}: {attr.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedNFT && (
            <div className="nft-actions">
              <h3>🏪 List for Sale</h3>
              <div className="listing-form">
                <div className="selected-nft-info">
                  <span>{getTypeEmoji(selectedNFT.itemType)} {selectedNFT.metadata?.name}</span>
                  <span style={{ color: getRarityColor(selectedNFT.rarity) }}>
                    {getRarityEmoji(selectedNFT.rarity)} {selectedNFT.rarity}
                  </span>
                </div>
                
                <div className="price-input">
                  <input
                    type="number"
                    placeholder="Price in HBAR"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    step="0.1"
                    min="0.1"
                  />
                  <span className="currency">HBAR</span>
                </div>

                <div className="action-buttons">
                  <button 
                    className="list-button"
                    onClick={handleListNFT}
                    disabled={!listingPrice || parseFloat(listingPrice) <= 0}
                  >
                    🏷️ List for Sale
                  </button>
                  <button 
                    className="cancel-button"
                    onClick={() => {
                      setSelectedNFT(null);
                      setListingPrice('');
                    }}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Inventory;