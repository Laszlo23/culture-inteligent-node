/**
 * PWA install CTA — Android beforeinstallprompt; iOS Share → Add to Home Screen tip.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Share, X } from 'lucide-react';

const DISMISS_KEY = 'culture_pwa_install_dismissed_v1';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const notCriOS = !/CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit && notCriOS;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      // ignore
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    if (isIosSafari()) {
      setShowIos(true);
      setVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      // ignore
    }
    setDeferred(null);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (deferred || showIos) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-[max(4.5rem,env(safe-area-inset-bottom))] left-3 right-3 sm:left-auto sm:right-4 sm:w-80 z-[85] pointer-events-auto"
        >
          <div className="rounded-2xl border border-cyan-500/30 bg-[#0a0a0c]/96 backdrop-blur-md shadow-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono font-black uppercase tracking-wider text-slate-100">
                  Install Culture Node
                </p>
                {deferred ? (
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans">
                    Add the Proof of Attention OS to your home screen — works offline for the shell.
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans flex items-start gap-1">
                    <Share className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                    Tap Share, then <span className="text-cyan-300 font-semibold">Add to Home Screen</span>.
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  {deferred && (
                    <button
                      type="button"
                      onClick={install}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-mono font-black uppercase tracking-wider cursor-pointer"
                    >
                      Install
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={dismiss}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Not now
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss"
                className="text-slate-500 hover:text-slate-300 cursor-pointer p-0.5 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
