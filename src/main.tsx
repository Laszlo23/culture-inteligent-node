import './buffer-polyfill';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

const viteEnv = (import.meta as ImportMeta & { env?: { PROD?: boolean } }).env;
if (viteEnv?.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Install still works without SW on some hosts; ignore registration failures
    });
  });
}
