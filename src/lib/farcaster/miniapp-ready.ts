/**
 * Dismiss Farcaster Mini App splash — required or users see infinite loading.
 * Safe no-op outside Warpcast / Farcaster clients.
 */

let readySucceeded = false;

export async function signalMiniAppReady(reason = 'boot'): Promise<void> {
  if (readySucceeded) return;
  try {
    const { sdk } = await import('@farcaster/miniapp-sdk');
    await sdk.actions.ready();
    readySucceeded = true;
    if (typeof console !== 'undefined') {
      console.info('[miniapp] ready', reason);
    }
  } catch (err) {
    // Not in a Mini App host, or SDK unavailable — fine for normal browsers
    if (typeof console !== 'undefined') {
      console.info('[miniapp] ready skipped', reason, err instanceof Error ? err.message : err);
    }
  }
}

/** Fire-and-forget as early as possible (+ one retry for slow host bridge). */
export function signalMiniAppReadySoon(): void {
  void signalMiniAppReady('soon');
  window.setTimeout(() => {
    void signalMiniAppReady('retry');
  }, 1200);
}
