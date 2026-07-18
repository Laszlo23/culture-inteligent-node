/**
 * Bootstrap Culture Economy on Solana Devnet:
 * 1) Create BCC + CGT mints (mint authority = config PDA)
 * 2) Initialize config (requires deployed program)
 * 3) Print .env lines
 *
 * Prerequisites:
 *   solana config set --url devnet
 *   solana airdrop 2
 *   cd culture-economy && anchor deploy --provider.cluster devnet
 *
 * Usage: npx tsx scripts/devnet-bootstrap.ts
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
  TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
} from '@solana/spl-token';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createHash } from 'crypto';

const PROGRAM_ID = new PublicKey(
  process.env.VITE_ECONOMY_PROGRAM_ID || 'AS7E1nsKf3VJGfQPyU5Ekz9iJBNGzZ5sT8P6mGqzbqpZ'
);
const RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const DECIMALS = 0; // whole-unit BCC/CGT for facility demo

function ixDisc(name: string): Buffer {
  return Buffer.from(createHash('sha256').update(`global:${name}`).digest().subarray(0, 8));
}

function loadWallet(): Keypair {
  const p = process.env.ANCHOR_WALLET || path.join(os.homedir(), '.config/solana/id.json');
  const secret = JSON.parse(fs.readFileSync(p, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

async function main() {
  const connection = new Connection(RPC, 'confirmed');
  const authority = loadWallet();
  console.log('Authority:', authority.publicKey.toBase58());
  console.log('Program:', PROGRAM_ID.toBase58());

  const bal = await connection.getBalance(authority.publicKey);
  console.log('SOL balance:', bal / 1e9);
  if (bal < 0.05 * 1e9) {
    console.warn('Low SOL — run: solana airdrop 2');
  }

  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID);
  console.log('Config PDA:', configPda.toBase58());

  // Create mints with mint authority = config PDA
  const bccMint = Keypair.generate();
  const cgtMint = Keypair.generate();
  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  const createMints = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: authority.publicKey,
      newAccountPubkey: bccMint.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(bccMint.publicKey, DECIMALS, configPda, null),
    SystemProgram.createAccount({
      fromPubkey: authority.publicKey,
      newAccountPubkey: cgtMint.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(cgtMint.publicKey, DECIMALS, configPda, null)
  );

  await sendAndConfirmTransaction(connection, createMints, [authority, bccMint, cgtMint]);
  console.log('BCC mint:', bccMint.publicKey.toBase58());
  console.log('CGT mint:', cgtMint.publicKey.toBase58());

  // initialize_config(swap_rate_bps = 10000)
  const data = Buffer.concat([ixDisc('initialize_config'), Buffer.alloc(2)]);
  data.writeUInt16LE(10000, 8);

  const initIx = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority.publicKey, isSigner: true, isWritable: true },
      { pubkey: configPda, isSigner: false, isWritable: true },
      { pubkey: bccMint.publicKey, isSigner: false, isWritable: false },
      { pubkey: cgtMint.publicKey, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  };

  try {
    const sig = await sendAndConfirmTransaction(
      connection,
      new Transaction().add(initIx),
      [authority]
    );
    console.log('initialize_config:', sig);
  } catch (e: any) {
    console.error('initialize_config failed (is program deployed?):', e.message || e);
    console.log('Mints still created — set env and redeploy/init later.');
  }

  const secretB64 = Buffer.from(authority.secretKey).toString('base64');
  const envBlock = `
# Culture Economy (Devnet) — from scripts/devnet-bootstrap.ts
VITE_ECONOMY_PROGRAM_ID=${PROGRAM_ID.toBase58()}
VITE_BCC_MINT=${bccMint.publicKey.toBase58()}
VITE_CGT_MINT=${cgtMint.publicKey.toBase58()}
ECONOMY_AUTHORITY_SECRET="${secretB64}"
`.trim();

  const outPath = path.join(process.cwd(), 'culture-economy', 'bootstrap-env.txt');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, envBlock + '\n');
  console.log('\nWrote', outPath);
  // Never echo ECONOMY_AUTHORITY_SECRET — only public ids
  console.log(`VITE_ECONOMY_PROGRAM_ID=${PROGRAM_ID.toBase58()}`);
  console.log(`VITE_BCC_MINT=${bccMint.publicKey.toBase58()}`);
  console.log(`VITE_CGT_MINT=${cgtMint.publicKey.toBase58()}`);
  console.log('ECONOMY_AUTHORITY_SECRET=<redacted — see bootstrap-env.txt>');
  console.log(
    'Backup: store bootstrap-env.txt / authority keypair offline (password manager). Never commit. Never prefix with VITE_.'
  );

  // Also update economy-ids defaults file for local reference
  const idsPath = path.join(process.cwd(), 'culture-economy', 'deployed-ids.json');
  fs.writeFileSync(
    idsPath,
    JSON.stringify(
      {
        programId: PROGRAM_ID.toBase58(),
        configPda: configPda.toBase58(),
        bccMint: bccMint.publicKey.toBase58(),
        cgtMint: cgtMint.publicKey.toBase58(),
        authority: authority.publicKey.toBase58(),
        cluster: 'devnet',
      },
      null,
      2
    )
  );
  console.log('Wrote', idsPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
