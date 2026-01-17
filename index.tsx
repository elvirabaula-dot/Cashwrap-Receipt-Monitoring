
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './app/globals.css';

/**
 * MongoDB Atlas Connection Configuration (Conceptual for Frontend Integration)
 * Following the provided screenshot structure for 'cashwrap-receipt'
 */
const mongoConfig = {
  appName: "devrel.vercel.integration",
  maxIdleTimeMS: 5000,
  uri: "MONGODB_URI" // Placeholder for process.env.MONGODB_URI
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}