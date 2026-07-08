import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initAnalytics, track } from './lib/analytics';
import './index.css';

initAnalytics();
track('app_opened');

// Acquisition signal: the user added Soma to their home screen (PWA install).
if (typeof window !== 'undefined') {
  window.addEventListener('appinstalled', () => track('pwa_installed'));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
