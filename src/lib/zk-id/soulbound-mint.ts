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

/**
 * Mint a 1-supply Token-2022 NonTransferable reputation badge to `owner`.
 * `payer` signs rent + fees (authority or user).
 */
export async function mintSoulboundToken2022(opts: {
  connection?: Connection;
  payer: Keypair;
  owner: PublicKey;
  nullifierHash: string;
}): Promise<SoulboundMintResult> {
  const connection =
    opts.connection ||
    new Connection(
      (typeof process !== 'undefined' && process.env?.SOLANA_RPC_URL) || DEVNET_RPC,
      'confirmed'
    );
  const mintKeypair = Keypair.generate();
  const decimals = 0;
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
    SystemProgram.createAccount({
      fromPubkey: opts.payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeNonTransferableMintInstruction(
      mintKeypair.publicKey,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      opts.payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      opts.payer.publicKey,
      ownerAta,
      opts.owner,
      mintKeypair.publicKey,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    ),
    createMintToInstruction(
      mintKeypair.publicKey,
      ownerAta,
      opts.payer.publicKey,
      1,
      [],
      TOKEN_2022_PROGRAM_ID
    )
  );

  const signature = await sendAndConfirmTransaction(
    connection,
    tx,
    [opts.payer, mintKeypair],
    { commitment: 'confirmed' }
  );

  return {
    mintAddress: mintKeypair.publicKey.toBase58(),
    mintSignature: signature,
    badgePda: badgePda.toBase58(),
    ownerAta: ownerAta.toBase58(),
    mode: 'token2022',
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
