/**
 * Soulbound reputation mint — Token-2022 NonTransferable + Anchor PDA seeds.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { getEconomyProgramIdString } from '../economy-ids';
import { nullifierHashToBytes } from './nullifier';

const DEVNET_RPC =
  (typeof process !== 'undefined' && process.env?.SOLANA_RPC_URL) ||
  'https://api.devnet.solana.com';

export function getSoulboundBadgePda(
  nullifierHash: string,
  programId = new PublicKey(getEconomyProgramIdString())
): [PublicKey, number] {
  const seed = nullifierHashToBytes(nullifierHash);
  return PublicKey.findProgramAddressSync([Buffer.from('sbt'), Buffer.from(seed)], programId);
}

export type SoulboundMintResult = {
  mintAddress: string;
  mintSignature: string;
  badgePda: string;
  ownerAta: string;
  mode: 'token2022' | 'recorded';
};

/** Lamports we want on the fee payer before attempting Token-2022 mint (~mint+ATA+fees). */
export const SOULBOUND_MINT_MIN_LAMPORTS = 4_500_000;

function buildSoulboundIx(opts: {
  payer: PublicKey;
  owner: PublicKey;
  mint: PublicKey;
  mintAuthority: PublicKey;
  mintLen: number;
  lamports: number;
  ownerAta: PublicKey;
}) {
  return [
    SystemProgram.createAccount({
      fromPubkey: opts.payer,
      newAccountPubkey: opts.mint,
      space: opts.mintLen,
      lamports: opts.lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeNonTransferableMintInstruction(opts.mint, TOKEN_2022_PROGRAM_ID),
    createInitializeMintInstruction(
      opts.mint,
      0,
      opts.mintAuthority,
      null,
      TOKEN_2022_PROGRAM_ID
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      opts.payer,
      opts.ownerAta,
      opts.owner,
      opts.mint,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    ),
    createMintToInstruction(
      opts.mint,
      opts.ownerAta,
      opts.mintAuthority,
      1,
      [],
      TOKEN_2022_PROGRAM_ID
    ),
  ];
}

/**
 * Mint a 1-supply Token-2022 NonTransferable reputation badge to `owner`.
 * `payer` signs rent + fees (authority or user).
 * `mintAuthority` defaults to payer (legacy); pass economy authority when user pays fees.
 */
export async function mintSoulboundToken2022(opts: {
  connection?: Connection;
  payer: Keypair;
  owner: PublicKey;
  nullifierHash: string;
  /** When user pays fees, authority still controls the mint */
  mintAuthority?: Keypair;
}): Promise<SoulboundMintResult> {
  const connection =
    opts.connection ||
    new Connection(
      (typeof process !== 'undefined' && process.env?.SOLANA_RPC_URL) || DEVNET_RPC,
      'confirmed'
    );
  const mintAuthority = opts.mintAuthority || opts.payer;
  const mintKeypair = Keypair.generate();
  const extensions = [ExtensionType.NonTransferable];
  const mintLen = getMintLen(extensions);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  const [badgePda] = getSoulboundBadgePda(opts.nullifierHash);
  const ownerAta = getAssociatedTokenAddressSync(
    mintKeypair.publicKey,
    opts.owner,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const tx = new Transaction().add(
    ...buildSoulboundIx({
      payer: opts.payer.publicKey,
      owner: opts.owner,
      mint: mintKeypair.publicKey,
      mintAuthority: mintAuthority.publicKey,
      mintLen,
      lamports,
      ownerAta,
    })
  );

  const signers = [opts.payer, mintKeypair];
  if (mintAuthority !== opts.payer) signers.push(mintAuthority);

  const signature = await sendAndConfirmTransaction(connection, tx, signers, {
    commitment: 'confirmed',
  });

  return {
    mintAddress: mintKeypair.publicKey.toBase58(),
    mintSignature: signature,
    badgePda: badgePda.toBase58(),
    ownerAta: ownerAta.toBase58(),
    mode: 'token2022',
  };
}

/**
 * Partially-signed mint tx: user is fee payer, economy authority is mint authority.
 * Client must sign as fee payer then send (or POST confirm after send).
 */
export async function buildSoulboundMintForUserFee(opts: {
  connection?: Connection;
  mintAuthority: Keypair;
  owner: PublicKey;
  nullifierHash: string;
}): Promise<{
  serializedBase64: string;
  mintAddress: string;
  badgePda: string;
  ownerAta: string;
}> {
  const connection =
    opts.connection ||
    new Connection(
      (typeof process !== 'undefined' && process.env?.SOLANA_RPC_URL) || DEVNET_RPC,
      'confirmed'
    );
  const mintKeypair = Keypair.generate();
  const extensions = [ExtensionType.NonTransferable];
  const mintLen = getMintLen(extensions);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);
  const [badgePda] = getSoulboundBadgePda(opts.nullifierHash);
  const ownerAta = getAssociatedTokenAddressSync(
    mintKeypair.publicKey,
    opts.owner,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction().add(
    ...buildSoulboundIx({
      payer: opts.owner,
      owner: opts.owner,
      mint: mintKeypair.publicKey,
      mintAuthority: opts.mintAuthority.publicKey,
      mintLen,
      lamports,
      ownerAta,
    })
  );
  tx.feePayer = opts.owner;
  tx.recentBlockhash = blockhash;
  tx.partialSign(opts.mintAuthority, mintKeypair);

  return {
    serializedBase64: tx
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString('base64'),
    mintAddress: mintKeypair.publicKey.toBase58(),
    badgePda: badgePda.toBase58(),
    ownerAta: ownerAta.toBase58(),
  };
}

/**
 * When chain mint is unavailable (no SOL / no authority), record a deterministic
 * off-chain placeholder mint id — still gated by ZK bind. UI must label honestly.
 */
export function recordSoulboundPlaceholder(nullifierHash: string, owner: string): SoulboundMintResult {
  const [badgePda] = getSoulboundBadgePda(nullifierHash);
  const mintAddress = `sbt-pending:${nullifierHash.slice(0, 16)}:${owner.slice(0, 8)}`;
  return {
    mintAddress,
    mintSignature: `local:${Date.now()}`,
    badgePda: badgePda.toBase58(),
    ownerAta: '',
    mode: 'recorded',
  };
}
