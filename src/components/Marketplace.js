import React, { useState, useEffect } from 'react';
import { getMarketplaceListings, buyNFT, getPlayerNFTs, mintNFT, listNFTForSale } from '../utils/blockchain';

const Marketplace = ({ walletAddress }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(null);
  const [minting, setMinting] = useState(false);
  const [listing, setListing] = useState(false);
  const [mintForm, setMintForm] = useState({ type: 'star', rarity: 'common', name: 'Cosmic Ship', uri: 'ipfs://example' });
  const [listForm, setListForm] = useState({ tokenId: '', price: '' });

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      const marketplaceListings = await getMarketplaceListings();
      setListings(marketplaceListings);
    } catch (error) {
      console.error('Error loading marketplace listings:', error);
    }
    setLoading(false);
  };

  const handleBuyNFT = async (listing) => {
    if (!walletAddress) {
      alert('Please connect your wallet first!');
      return;
    }

    setBuying(listing.listingId);
    try {
      const success = await buyNFT(listing.listingId, listing.price);
      if (success) {
        alert('NFT purchased successfully!');
        loadListings(); // Refresh listings
      } else {
        alert('Failed to purchase NFT');
      }
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert('Error purchasing NFT');
    }
    setBuying(null);
  };

  const handleMint = async () => {
    if (!walletAddress) { alert('Connect wallet'); return; }
    setMinting(true);
    try {
      const res = await mintNFT(mintForm.type, mintForm.rarity);
      if (res?.success) alert(`Minted NFT #${res.tokenId}`);
      else alert('Mint failed');
    } finally { setMinting(false); }
  };

  const handleList = async () => {
    if (!walletAddress) { alert('Connect wallet'); return; }
    if (!listForm.tokenId || !listForm.price) { alert('TokenId and price required'); return; }
    setListing(true);
    try {
      const ok = await listNFTForSale(Number(listForm.tokenId), Number(listForm.price));
      if (ok) { alert('Listed'); loadListings(); }
      else alert('List failed');
    } finally { setListing(false); }
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

  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
  };

  const formatSeller = (seller) => {
    return `${seller.slice(0, 6)}...${seller.slice(-4)}`;
  };

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <h2>🛒 Cosmic Marketplace</h2>
        <button className="refresh-button" onClick={loadListings}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="marketplace-loading">
          <p>Loading cosmic treasures for sale...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="marketplace-empty">
          <div className="empty-icon">🏪</div>
          <h3>No items for sale</h3>
          <p>Be the first cosmic trader! Collect rare items and list them for sale.</p>
        </div>
      ) : (
        <div className="marketplace-content">
          <div className="marketplace-stats">
            <span>Items for Sale: {listings.length}</span>
            <span>Average Price: {(listings.reduce((sum, item) => sum + parseFloat(item.price), 0) / listings.length).toFixed(2)} HBAR</span>
          </div>

          <div className="listings-grid">
            {listings.map((listing, index) => (
              <div key={listing.listingId || index} className="listing-card">
                <div className="listing-image">
                  <span className="listing-type-emoji">
                    {getTypeEmoji(listing.itemType)}
                  </span>
                  <span className="listing-rarity-badge" style={{ color: getRarityColor(listing.rarity) }}>
                    {getRarityEmoji(listing.rarity)}
                  </span>
                </div>

                <div className="listing-info">
                  <h4>{listing.name || `${listing.itemType} #${listing.tokenId}`}</h4>
                  <p className="listing-type">{listing.itemType}</p>
                  <p className="listing-rarity" style={{ color: getRarityColor(listing.rarity) }}>
                    {listing.rarity}
                  </p>
                  
                  {listing.attributes && (
                    <div className="listing-attributes">
                      {listing.attributes.slice(0, 2).map((attr, i) => (
                        <span key={i} className="attribute">
                          {attr.trait_type}: {attr.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="listing-details">
                  <div className="seller-info">
                    <span className="seller-label">Seller:</span>
                    <span className="seller-address">{formatSeller(listing.seller)}</span>
                  </div>

                  <div className="price-section">
                    <span className="price">{formatPrice(listing.price)} HBAR</span>
                    <span className="price-usd">≈ $0.06</span>
                  </div>

                  <button
                    className="buy-button"
                    onClick={() => handleBuyNFT(listing)}
                    disabled={!walletAddress || buying === listing.listingId}
                  >
                    {buying === listing.listingId ? (
                      '🔄 Buying...'
                    ) : !walletAddress ? (
                      '🔒 Connect Wallet'
                    ) : (
                      '💰 Buy Now'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="marketplace-actions" style={{ marginTop: 24 }}>
            <h3>Mint a Game NFT</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select value={mintForm.type} onChange={e => setMintForm({ ...mintForm, type: e.target.value })}>
                <option value="star">Star</option>
                <option value="crystal">Crystal</option>
                <option value="plasma">Plasma</option>
                <option value="quantum">Quantum</option>
              </select>
              <select value={mintForm.rarity} onChange={e => setMintForm({ ...mintForm, rarity: e.target.value })}>
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
              <button onClick={handleMint} disabled={minting || !walletAddress}>{minting ? 'Minting...' : 'Mint'}</button>
            </div>

            <h3 style={{ marginTop: 16 }}>List Your NFT</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input placeholder="Token ID" value={listForm.tokenId} onChange={e => setListForm({ ...listForm, tokenId: e.target.value })} />
              <input placeholder="Price (HBAR)" value={listForm.price} onChange={e => setListForm({ ...listForm, price: e.target.value })} />
              <button onClick={handleList} disabled={listing || !walletAddress}>{listing ? 'Listing...' : 'List'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="marketplace-info">
        <h3>🌟 About the Cosmic Marketplace</h3>
        <ul>
          <li>Trade rare cosmic collectibles with other players</li>
          <li>All transactions are secured by smart contracts</li>
          <li>Prices are set by sellers in HBAR</li>
          <li>NFT ownership is verified on the Hedera network</li>
        </ul>
      </div>
    </div>
  );
};

export default Marketplace;