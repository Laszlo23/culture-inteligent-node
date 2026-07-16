import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';

const WALLET_JWT_SECRET =
  process.env.WALLET_JWT_SECRET || 'building-culture-devnet-wallet-secret-v1';
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const challenges = new Map<string, { message: string; expiresAt: number }>();

export interface WalletAuthUser {
  uid: string;
  walletAddress: string;
  authType: 'wallet';
  email?: string;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken | (WalletAuthUser & { email?: string });
  walletUser?: WalletAuthUser;
}

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function b64urlJson(obj: unknown): string {
  return b64url(JSON.stringify(obj));
}

export function createWalletChallenge(walletAddress: string): { message: string; expiresAt: number } {
  const nonce = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;
  const message =
    `Building Culture Devnet login\nWallet: ${walletAddress}\nNonce: ${nonce}\nExpires: ${new Date(expiresAt).toISOString()}`;
  challenges.set(walletAddress, { message, expiresAt });
  return { message, expiresAt };
}

export function consumeChallenge(walletAddress: string): string | null {
  const entry = challenges.get(walletAddress);
  challenges.delete(walletAddress);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.message;
}

export function signWalletToken(walletAddress: string): string {
  const header = b64urlJson({ alg: 'HS256', typ: 'JWT' });
  const payload = b64urlJson({
    sub: `wallet:${walletAddress}`,
    wallet: walletAddress,
    uid: `wallet_${walletAddress.slice(0, 16)}`,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + TOKEN_TTL_MS) / 1000),
  });
  const data = `${header}.${payload}`;
  const sig = crypto.createHmac('sha256', WALLET_JWT_SECRET).update(data).digest();
  return `${data}.${b64url(sig)}`;
}

export function verifyWalletToken(token: string): WalletAuthUser | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;
  const expected = b64url(
    crypto.createHmac('sha256', WALLET_JWT_SECRET).update(data).digest()
  );
  if (expected !== signature) return null;
  try {
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
    if (!json.wallet || !json.exp || json.exp * 1000 < Date.now()) return null;
    return {
      uid: json.uid || `wallet_${json.wallet.slice(0, 16)}`,
      walletAddress: json.wallet,
      authType: 'wallet',
      email: `${json.wallet.slice(0, 8)}@wallet.local`,
    };
  } catch {
    return null;
  }
}

/** Accept Firebase Bearer OR wallet JWT */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];

  const walletUser = verifyWalletToken(token);
  if (walletUser) {
    req.walletUser = walletUser;
    req.user = {
      uid: walletUser.uid,
      email: walletUser.email,
      walletAddress: walletUser.walletAddress,
      authType: 'wallet',
    } as AuthRequest['user'];
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

/** Wallet JWT required (for attention / kpi routes) */
export const requireWalletAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing wallet token' });
  }
  const token = authHeader.split('Bearer ')[1];
  const walletUser = verifyWalletToken(token);
  if (!walletUser) {
    return res.status(401).json({ error: 'Unauthorized: Wallet session required' });
  }
  req.walletUser = walletUser;
  req.user = {
    uid: walletUser.uid,
    email: walletUser.email,
    walletAddress: walletUser.walletAddress,
    authType: 'wallet',
  } as AuthRequest['user'];
  next();
};
