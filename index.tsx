
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './app/globals.css';

/**
 * Enterprise Receipt Monitoring System
 * Vercel + Supabase Deployment Context
 */
console.log(`[System] Initializing Cashwrap Enterprise Session...`);
console.log(`[System] Integration: Supabase Cloud Connectivity Active.`);

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
