import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#e5e7eb' }}>
      <div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Новый проект Wexa</h1>
        <p style={{ textAlign: 'center', opacity: 0.8 }}>
          Frontend + backend ещё пустые. Можно начинать с нуля.
        </p>
      </div>
    </div>
  );
};

export default App;

