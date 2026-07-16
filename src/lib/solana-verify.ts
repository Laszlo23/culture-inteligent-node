import { Connection, PublicKey } from '@solana/web3.js';

const DEVNET_RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
export const KPI_DESTINATION = '9Wz5979GjujvG8qAJE9bdfGAvXPMYFCZks3fQ17Y3f2F';
export const KPI_MIN_LAMPORTS = Math.round(0.05 * 1_000_000_000);
export const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

export function getDevnetConnection(): Connection {
  return new Connection(DEVNET_RPC, 'confirmed');
}

export async function verifyKpiTransaction(
  signature: string,
  expectedWallet: string
): Promise<{ ok: boolean; error?: string; slot?: number }> {
  const connection = getDevnetConnection();
  try {
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    if (!tx || tx.meta?.err) {
      return { ok: false, error: 'Transaction not found or failed on Devnet' };
    }

    const accountKeys =
      tx.transaction.message.getAccountKeys?.().staticAccountKeys?.map((k) =>
        k.toBase58()
      ) ||
      // legacy
      (tx.transaction.message as { accountKeys?: PublicKey[] }).accountKeys?.map((k) =>
        typeof k === 'string' ? k : k.toBase58()
      ) ||
      [];

    const walletOk = accountKeys.some((k) => k === expectedWallet);
    if (!walletOk) {
      return { ok: false, error: 'Wallet not present in transaction account keys' };
    }

    // Inspect balance changes for destination
    const keys = accountKeys;
    const destIndex = keys.indexOf(KPI_DESTINATION);
    if (destIndex < 0) {
      return { ok: false, error: 'KPI destination pubkey not in transaction' };
    }

    const pre = tx.meta?.preBalances?.[destIndex] ?? 0;
    const post = tx.meta?.postBalances?.[destIndex] ?? 0;
    const delta = post - pre;
    if (delta < KPI_MIN_LAMPORTS) {
      return {
        ok: false,
        error: `Destination received ${delta} lamports; need ≥ ${KPI_MIN_LAMPORTS}`,
      };
    }

    return { ok: true, slot: tx.slot };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'RPC verification failed' };
  }
}

export async function verifyMemoAttestation(
  signature: string,
  expectedWallet: string,
  memoPrefix: string
): Promise<{ ok: boolean; error?: string; memo?: string }> {
  const connection = getDevnetConnection();
  try {
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    if (!tx || tx.meta?.err) {
      return { ok: false, error: 'Attestation tx not found or failed' };
    }

    const accountKeys =
      tx.transaction.message.getAccountKeys?.().staticAccountKeys?.map((k) =>
        k.toBase58()
      ) ||
      (tx.transaction.message as { accountKeys?: PublicKey[] }).accountKeys?.map((k) =>
        typeof k === 'string' ? k : k.toBase58()
      ) ||
      [];

    if (!accountKeys.includes(expectedWallet)) {
      return { ok: false, error: 'Wallet mismatch on attestation tx' };
    }

    // Parse memo from log messages
    const logs = tx.meta?.logMessages || [];
    const memoLog = logs.find((l) => l.includes('Memo') || l.includes(memoPrefix));
    const raw = JSON.stringify(tx.transaction.message);
    if (!raw.includes(memoPrefix) && !memoLog?.includes(memoPrefix)) {
      // Also check inner instructions / compiled for memo program
      if (!accountKeys.includes(MEMO_PROGRAM_ID) && !raw.includes('Memo')) {
        return { ok: false, error: 'Memo program / prefix not found in transaction' };
      }
    }

    return { ok: true, memo: memoPrefix };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Attestation RPC failed' };
  }
}
