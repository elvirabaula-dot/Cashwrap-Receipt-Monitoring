import React from 'react';
import Home from './app/page';

/**
 * Root Application Component
 * Handles the high-level layout and state distribution.
 */
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Home />
    </div>
  );
};

export default App;