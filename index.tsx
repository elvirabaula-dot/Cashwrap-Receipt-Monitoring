import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './app/globals.css';

/**
 * Enterprise Receipt Monitoring System
 * Initialization with MongoDB Pool configuration
 */
const mongoConfig = {
  appName: "devrel.vercel.integration",
  maxIdleTimeMS: 5000,
  uri: process.env.MONGODB_URI
};

console.log(`[System] Initializing session for: ${mongoConfig.appName}`);

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}