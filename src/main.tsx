import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initAnalytics, track } from './lib/analytics';
import './index.css';

initAnalytics();

// New vs returning: a persisted marker survives across sessions on-device, so
// app_opened can split first-ever opens from repeat visits without any PII.
function isReturningVisitor(): boolean {
  try {
    const seen = localStorage.getItem('soma_seen');
    if (seen) return true;
    localStorage.setItem('soma_seen', new Date().toISOString());
    return false;
  } catch {
    // Private mode / storage disabled — treat as new, never throw.
    return false;
  }
}

track('app_opened', { returning: isReturningVisitor() });

// Acquisition signal: the user added Soma to their home screen (PWA install).
if (typeof window !== 'undefined') {
  window.addEventListener('appinstalled', () => track('pwa_installed'));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
