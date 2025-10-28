import React from 'react';

const IframeGame = ({ title, src }) => {
  return (
    <div style={{ height: 'calc(100vh - 220px)', width: '100%' }}>
      <iframe
        title={title}
        src={src}
        style={{ border: 'none', width: '100%', height: '100%', borderRadius: 12, background: 'black' }}
      />
    </div>
  );
};

export default IframeGame;


