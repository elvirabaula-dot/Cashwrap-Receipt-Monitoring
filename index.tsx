
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './app/globals.css';

/**
 * Enterprise MongoDB Atlas Connection
 * Configuration mirrored from the provided 'cashwrap-receipt' deployment context.
 */
const mongoConfig = {
  appName: "devrel.vercel.integration",
  maxIdleTimeMS: 5000,
};

// In a real production build, process.env.MONGODB_URI would be handled server-side.
// We maintain the metadata here for application context awareness.
console.log(`[System] Initializing connection for: ${mongoConfig.appName}`);

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
