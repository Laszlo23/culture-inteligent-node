/**
 * Catch render crashes so phones / Mini Apps never stay on a blank root.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[app] render crash', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100dvh',
          background: '#050608',
          color: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.25rem',
          textAlign: 'center',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <img
          src="/icon-192.png"
          alt=""
          width={72}
          height={72}
          style={{ borderRadius: 16, marginBottom: 20 }}
        />
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#22d3ee',
            fontWeight: 800,
            margin: 0,
          }}
        >
          Building Culture
        </p>
        <h1 style={{ fontSize: '1.5rem', margin: '12px 0 8px', color: '#fff' }}>
          Something paused the Human Economy
        </h1>
        <p style={{ color: '#94a3b8', maxWidth: 360, lineHeight: 1.5, margin: 0 }}>
          The app hit a snag on this device. Reload to continue — your passport stays in this
          browser.
        </p>
        <a
          href="/?fc=1"
          style={{
            marginTop: 24,
            display: 'inline-block',
            padding: '12px 20px',
            borderRadius: 12,
            background: '#22d3ee',
            color: '#000',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          Reload app
        </a>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem('culture_hearing_v1');
            } catch {
              /* ignore */
            }
            window.location.href = '/?fc=1&fresh=1';
          }}
          style={{
            marginTop: 12,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#94a3b8',
            borderRadius: 12,
            padding: '10px 16px',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Soft reset & reload
        </button>
      </div>
    );
  }
}
