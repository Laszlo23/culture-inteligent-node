/**
 * Read Mini App viewer identity when hosted in Farcaster / Warpcast.
 */

export type MiniAppViewer = {
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
};

let cached: MiniAppViewer | null | undefined;

export async function readMiniAppViewer(): Promise<MiniAppViewer | null> {
  if (cached !== undefined) return cached;
  try {
    const { sdk } = await import('@farcaster/miniapp-sdk');
    const context = await sdk.context;
    const user = context?.user;
    if (!user || typeof user.fid !== 'number') {
      cached = null;
      return null;
    }
    cached = {
      fid: user.fid,
      username: String(user.username || '').replace(/^@/, ''),
      displayName: user.displayName ? String(user.displayName) : undefined,
      pfpUrl: user.pfpUrl ? String(user.pfpUrl) : undefined,
    };
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

/** Test / reset helper */
export function clearMiniAppViewerCache(): void {
  cached = undefined;
}
