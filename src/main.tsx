import './buffer-polyfill';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AppErrorBoundary from './components/AppErrorBoundary';
import { SoundProvider } from './lib/sound/SoundContext';
import { signalMiniAppReady, signalMiniAppReadySoon } from './lib/farcaster/miniapp-ready';
import './index.css';

// Farcaster Mini App: dismiss host splash ASAP (otherwise infinite load)
signalMiniAppReadySoon();

const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.innerHTML =
    '<main style="min-height:100dvh;background:#050608;color:#fff;display:flex;align-items:center;justify-content:center;font-family:sans-serif;padding:2rem;text-align:center"><div><p>Building Culture</p><p style="color:#94a3b8">Missing app root — <a href="/?fc=1" style="color:#22d3ee">reload</a></p></div></main>';
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <AppErrorBoundary>
        <SoundProvider>
          <App />
        </SoundProvider>
      </AppErrorBoundary>
    </StrictMode>
  );

  // After first paint, ensure Mini App host hides splash
  requestAnimationFrame(() => {
    void signalMiniAppReady('paint');
  });
  window.setTimeout(() => {
    void signalMiniAppReady('settled');
  }, 400);
}

const viteEnv = (import.meta as ImportMeta & { env?: { PROD?: boolean } }).env;
if (viteEnv?.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Install still works without SW on some hosts; ignore registration failures
    });
  });
}
