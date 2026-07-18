/**
 * Culture Economy client — fetch Player PDA / token balances, build instructions.
 */

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  Keypair,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
} from '@solana/spl-token';
import {
  getEconomyProgramIdString,
  getBccMintString,
  getCgtMintString,
  skinFromByte,
  rarityFromByte,
  skinToByte,
  rarityToByte,
  ENERGY_MAX_BPS,
  MINER_MINT_COST_CGT,
} from './economy-ids';
import type { MinerNFT } from '../types';

const DEVNET_RPC =
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_SOLANA_RPC_URL) ||
  'https://api.devnet.solana.com';

/** sha256("global:"+name)[0..8] — precomputed for browser (no node crypto). */
const IX: Record<string, number[]> = {
  initialize_config: [175, 175, 109, 31, 13, 152, 155, 237],
  init_player: [17, 32, 215, 152, 157, 126, 31, 160],
  grant_energy: [0, 0, 0, 0, 0, 0, 0, 0], // filled at runtime below
  mint_bcc: [0, 0, 0, 0, 0, 0, 0, 0],
  mint_cgt: [0, 0, 0, 0, 0, 0, 0, 0],
  swap_bcc_to_cgt: [0, 0, 0, 0, 0, 0, 0, 0],
  claim_daily: [0, 0, 0, 0, 0, 0, 0, 0],
  mint_miner: [0, 0, 0, 0, 0, 0, 0, 0],
  list_miner: [0, 0, 0, 0, 0, 0, 0, 0],
  cancel_list: [0, 0, 0, 0, 0, 0, 0, 0],
  buy_miner: [0, 0, 0, 0, 0, 0, 0, 0],
  drain_energy: [0, 0, 0, 0, 0, 0, 0, 0],
  mint_soulbound_badge: [0, 0, 0, 0, 0, 0, 0, 0],
};

// Compute discriminators with SubtleCrypto-compatible sync hash via tweetnacl-style:
// We embed known Anchor discriminators computed offline for reliability.
async function sha256Bytes(msg: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(msg);
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const buf = await globalThis.crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(buf);
  }
  // Node fallback
  const { createHash } = await import('crypto');
  return new Uint8Array(createHash('sha256').update(msg).digest());
}

let discReady: Promise<void> | null = null;

export async function ensureDiscriminators(): Promise<void> {
  if (!discReady) {
    discReady = (async () => {
      const names = Object.keys(IX);
      for (const name of names) {
        const hash = await sha256Bytes(`global:${name}`);
        IX[name] = Array.from(hash.subarray(0, 8));
      }
    })();
  }
  await discReady;
}

function disc(name: string): Buffer {
  const d = IX[name];
  if (!d || d.every((x) => x === 0)) {
    throw new Error(`Discriminator not ready for ${name} — call ensureDiscriminators()`);
  }
  return Buffer.from(d);
}

export function getEconomyProgramId(): PublicKey {
  return new PublicKey(getEconomyProgramIdString());
}

export function getBccMint(): PublicKey | null {
  const m = getBccMintString();
  return m ? new PublicKey(m) : null;
}

export function getCgtMint(): PublicKey | null {
  const m = getCgtMintString();
  return m ? new PublicKey(m) : null;
}

export function isEconomyConfigured(): boolean {
  return Boolean(getEconomyProgramIdString() && getBccMintString() && getCgtMintString());
}
export function configPda(): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from('config')], getEconomyProgramId())[0];
}

export function playerPda(owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('player'), owner.toBuffer()],
    getEconomyProgramId()
  )[0];
}

export function minerPda(assetId: number | bigint): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(assetId));
  return PublicKey.findProgramAddressSync([Buffer.from('miner'), buf], getEconomyProgramId())[0];
}

export function listingPda(miner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('listing'), miner.toBuffer()],
    getEconomyProgramId()
  )[0];
}

export function getConnection(rpc = DEVNET_RPC): Connection {
  return new Connection(rpc, 'confirmed');
}

export interface OnChainPlayer {
  owner: string;
  energyBps: number;
  energyPercent: number;
  miningPower: number;
  streak: number;
  lastDailyTs: number;
}

export interface OnChainConfig {
  authority: string;
  bccMint: string;
  cgtMint: string;
  swapRateBps: number;
  energyMaxBps: number;
  minerCount: number;
  marketplaceFeeBps: number;
  feeTreasury: string;
}

/** Default protocol cut when config account predates fee fields */
export const DEFAULT_MARKETPLACE_FEE_BPS = 250;

export interface OnChainMiner {
  assetId: number;
  owner: string;
  mintAddress: string;
  skin: string;
  hashrate: number;
  level: number;
  maxLevel: number;
  rarity: string;
  isListed: boolean;
  listingPrice: number;
}

function readPubkey(buf: Buffer, offset: number): PublicKey {
  return new PublicKey(buf.subarray(offset, offset + 32));
}

export function decodeConfig(data: Buffer): OnChainConfig {
  let o = 8;
  const authority = readPubkey(data, o).toBase58();
  o += 32;
  const bccMint = readPubkey(data, o).toBase58();
  o += 32;
  const cgtMint = readPubkey(data, o).toBase58();
  o += 32;
  const swapRateBps = data.readUInt16LE(o);
  o += 2;
  const energyMaxBps = data.readUInt16LE(o);
  o += 2;
  const minerCount = Number(data.readBigUInt64LE(o));
  o += 8;
  // bump (1) then optional fee fields on upgraded configs
  o += 1;
  let marketplaceFeeBps = DEFAULT_MARKETPLACE_FEE_BPS;
  let feeTreasury = authority;
  if (data.length >= o + 2 + 32) {
    marketplaceFeeBps = data.readUInt16LE(o);
    o += 2;
    feeTreasury = readPubkey(data, o).toBase58();
  }
  return {
    authority,
    bccMint,
    cgtMint,
    swapRateBps,
    energyMaxBps,
    minerCount,
    marketplaceFeeBps,
    feeTreasury,
  };
}

export function decodePlayer(data: Buffer): OnChainPlayer {
  let o = 8;
  const owner = readPubkey(data, o).toBase58();
  o += 32;
  const energyBps = data.readUInt16LE(o);
  o += 2;
  const miningPower = Number(data.readBigUInt64LE(o));
  o += 8;
  const streak = data.readUInt32LE(o);
  o += 4;
  const lastDailyTs = Number(data.readBigInt64LE(o));
  return {
    owner,
    energyBps,
    energyPercent: Math.round((energyBps / ENERGY_MAX_BPS) * 1000) / 10,
    miningPower,
    streak,
    lastDailyTs,
  };
}

export function decodeMiner(data: Buffer, mintAddress: string): OnChainMiner {
  let o = 8;
  const assetId = Number(data.readBigUInt64LE(o));
  o += 8;
  const owner = readPubkey(data, o).toBase58();
  o += 32;
  const skin = skinFromByte(data.readUInt8(o));
  o += 1;
  const hashrate = data.readUInt32LE(o);
  o += 4;
  const level = data.readUInt8(o);
  o += 1;
  const maxLevel = data.readUInt8(o);
  o += 1;
  const rarity = rarityFromByte(data.readUInt8(o));
  return {
    assetId,
    owner,
    mintAddress,
    skin,
    hashrate,
    level,
    maxLevel,
    rarity,
    isListed: false,
    listingPrice: 0,
  };
}

/** MinerAsset account size including Anchor discriminator */
export const MINER_ACCOUNT_LEN = 8 + 8 + 32 + 1 + 4 + 1 + 1 + 1 + 1;
/** Listing account size including Anchor discriminator */
export const LISTING_ACCOUNT_LEN = 8 + 32 + 32 + 8 + 1;

export interface OnChainListing {
  miner: string;
  seller: string;
  priceCgt: number;
}

export function decodeListing(data: Buffer): OnChainListing {
  let o = 8;
  const miner = readPubkey(data, o).toBase58();
  o += 32;
  const seller = readPubkey(data, o).toBase58();
  o += 32;
  const priceCgt = Number(data.readBigUInt64LE(o));
  return { miner, seller, priceCgt };
}

export async function fetchListingForMiner(
  miner: PublicKey,
  connection = getConnection()
): Promise<OnChainListing | null> {
  const info = await connection.getAccountInfo(listingPda(miner));
  if (!info) return null;
  return decodeListing(Buffer.from(info.data));
}

/** Fetch MinerAssets owned by wallet; enrich with open listings. */
export async function fetchMinersOwnedBy(
  owner: PublicKey,
  connection = getConnection()
): Promise<OnChainMiner[]> {
  if (!isEconomyConfigured()) return [];
  const accounts = await connection.getProgramAccounts(getEconomyProgramId(), {
    filters: [
      { dataSize: MINER_ACCOUNT_LEN },
      { memcmp: { offset: 16, bytes: owner.toBase58() } },
    ],
  });
  const miners: OnChainMiner[] = [];
  for (const { pubkey, account } of accounts) {
    const m = decodeMiner(Buffer.from(account.data), pubkey.toBase58());
    const listing = await fetchListingForMiner(pubkey, connection);
    if (listing) {
      m.isListed = true;
      m.listingPrice = listing.priceCgt;
    }
    miners.push(m);
  }
  return miners.sort((a, b) => a.assetId - b.assetId);
}

/** Open market listings (on-chain only). */
export async function fetchOpenListings(
  connection = getConnection()
): Promise<Array<OnChainMiner & { seller: string }>> {
  if (!isEconomyConfigured()) return [];
  const listings = await connection.getProgramAccounts(getEconomyProgramId(), {
    filters: [{ dataSize: LISTING_ACCOUNT_LEN }],
  });
  const out: Array<OnChainMiner & { seller: string }> = [];
  for (const { account } of listings) {
    const listing = decodeListing(Buffer.from(account.data));
    const minerPk = new PublicKey(listing.miner);
    const minerInfo = await connection.getAccountInfo(minerPk);
    if (!minerInfo) continue;
    const m = decodeMiner(Buffer.from(minerInfo.data), listing.miner);
    m.isListed = true;
    m.listingPrice = listing.priceCgt;
    out.push({ ...m, seller: listing.seller });
  }
  return out;
}

export async function fetchConfig(connection = getConnection()): Promise<OnChainConfig | null> {
  const info = await connection.getAccountInfo(configPda());
  if (!info) return null;
  return decodeConfig(Buffer.from(info.data));
}

export async function fetchPlayer(
  owner: PublicKey,
  connection = getConnection()
): Promise<OnChainPlayer | null> {
  const info = await connection.getAccountInfo(playerPda(owner));
  if (!info) return null;
  return decodePlayer(Buffer.from(info.data));
}

export async function fetchTokenBalance(
  owner: PublicKey,
  mint: PublicKey,
  connection = getConnection()
): Promise<number> {
  const ata = getAssociatedTokenAddressSync(mint, owner);
  try {
    const bal = await connection.getTokenAccountBalance(ata);
    return Number(bal.value.amount);
  } catch {
    return 0;
  }
}

export interface EconomyLedger {
  player: OnChainPlayer | null;
  bcc: number;
  cgt: number;
  configured: boolean;
  config: OnChainConfig | null;
}

export async function fetchLedger(
  owner: PublicKey,
  connection = getConnection()
): Promise<EconomyLedger> {
  const configured = isEconomyConfigured();
  if (!configured) {
    return { player: null, bcc: 0, cgt: 0, configured: false, config: null };
  }
  const bccMint = getBccMint()!;
  const cgtMint = getCgtMint()!;
  const [player, bcc, cgt, config] = await Promise.all([
    fetchPlayer(owner, connection),
    fetchTokenBalance(owner, bccMint, connection),
    fetchTokenBalance(owner, cgtMint, connection),
    fetchConfig(connection),
  ]);
  return { player, bcc, cgt, configured: true, config };
}

export function ataIx(mint: PublicKey, owner: PublicKey, payer: PublicKey): TransactionInstruction {
  const ata = getAssociatedTokenAddressSync(mint, owner);
  return createAssociatedTokenAccountIdempotentInstruction(payer, ata, owner, mint);
}

export async function buildInitPlayerIx(owner: PublicKey): Promise<TransactionInstruction> {
  await ensureDiscriminators();
  return new TransactionInstruction({
    programId: getEconomyProgramId(),
    keys: [
      { pubkey: owner, isSigner: true, isWritable: true },
      { pubkey: playerPda(owner), isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: disc('init_player'),
  });
}

export async function buildGrantEnergyIx(
  authority: PublicKey,
  owner: PublicKey,
  energyBps: number
): Promise<TransactionInstruction> {
  await ensureDiscriminators();
  const data = Buffer.concat([disc('grant_energy'), Buffer.alloc(2)]);
  data.writeUInt16LE(energyBps, 8);
  return new TransactionInstruction({
    programId: getEconomyProgramId(),
    keys: [
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: configPda(), isSigner: false, isWritable: false },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: playerPda(owner), isSigner: false, isWritable: true },
    ],
    data,
  });
}

export async function buildMintBccIx(
  authority: PublicKey,
  owner: PublicKey,
  amount: number
): Promise<TransactionInstruction[]> {
  await ensureDiscriminators();
  const mint = getBccMint()!;
  const ata = getAssociatedTokenAddressSync(mint, owner);
  const data = Buffer.concat([disc('mint_bcc'), Buffer.alloc(8)]);
  data.writeBigUInt64LE(BigInt(amount), 8);
  return [
    ataIx(mint, owner, owner),
    new TransactionInstruction({
      programId: getEconomyProgramId(),
      keys: [
        { pubkey: authority, isSigner: true, isWritable: false },
        { pubkey: configPda(), isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: false, isWritable: false },
        { pubkey: playerPda(owner), isSigner: false, isWritable: false },
        { pubkey: ata, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data,
    }),
  ];
}

export async function buildMintCgtIx(
  authority: PublicKey,
  owner: PublicKey,
  amount: number,
  payer: PublicKey = owner
): Promise<TransactionInstruction[]> {
  await ensureDiscriminators();
  const mint = getCgtMint()!;
  const ata = getAssociatedTokenAddressSync(mint, owner);
  const data = Buffer.concat([disc('mint_cgt'), Buffer.alloc(8)]);
  data.writeBigUInt64LE(BigInt(amount), 8);
  return [
    ataIx(mint, owner, payer),
    new TransactionInstruction({
      programId: getEconomyProgramId(),
      keys: [
        { pubkey: authority, isSigner: true, isWritable: false },
        { pubkey: configPda(), isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: false, isWritable: false },
        { pubkey: playerPda(owner), isSigner: false, isWritable: false },
        { pubkey: ata, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data,
    }),
  ];
}

export async function buildSwapIx(owner: PublicKey, bccAmount: number): Promise<TransactionInstruction[]> {
  await ensureDiscriminators();
  const bcc = getBccMint()!;
  const cgt = getCgtMint()!;
  const data = Buffer.concat([disc('swap_bcc_to_cgt'), Buffer.alloc(8)]);
  data.writeBigUInt64LE(BigInt(bccAmount), 8);
  return [
    ataIx(bcc, owner, owner),
    ataIx(cgt, owner, owner),
    new TransactionInstruction({
      programId: getEconomyProgramId(),
      keys: [
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: configPda(), isSigner: false, isWritable: false },
        { pubkey: bcc, isSigner: false, isWritable: true },
        { pubkey: cgt, isSigner: false, isWritable: true },
        { pubkey: playerPda(owner), isSigner: false, isWritable: false },
        { pubkey: getAssociatedTokenAddressSync(bcc, owner), isSigner: false, isWritable: true },
        { pubkey: getAssociatedTokenAddressSync(cgt, owner), isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data,
    }),
  ];
}

export async function buildClaimDailyIx(owner: PublicKey): Promise<TransactionInstruction[]> {
  await ensureDiscriminators();
  const bcc = getBccMint()!;
  return [
    ataIx(bcc, owner, owner),
    new TransactionInstruction({
      programId: getEconomyProgramId(),
      keys: [
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: configPda(), isSigner: false, isWritable: false },
        { pubkey: bcc, isSigner: false, isWritable: true },
        { pubkey: playerPda(owner), isSigner: false, isWritable: true },
        { pubkey: getAssociatedTokenAddressSync(bcc, owner), isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data: disc('claim_daily'),
    }),
  ];
}

/** Owner-signed: reduce Player PDA energy_bps (reactor sync). */
export async function buildDrainEnergyIx(
  owner: PublicKey,
  energyBps: number
): Promise<TransactionInstruction> {
  await ensureDiscriminators();
  const bps = Math.max(1, Math.min(10_000, Math.floor(energyBps)));
  const data = Buffer.concat([disc('drain_energy'), Buffer.alloc(2)]);
  data.writeUInt16LE(bps, 8);
  return new TransactionInstruction({
    programId: getEconomyProgramId(),
    keys: [
      { pubkey: owner, isSigner: true, isWritable: false },
      { pubkey: playerPda(owner), isSigner: false, isWritable: true },
    ],
    data,
  });
}

export async function buildMintMinerIx(
  owner: PublicKey,
  assetId: number,
  skin: string,
  hashrate: number,
  rarity: string
): Promise<TransactionInstruction[]> {
  await ensureDiscriminators();
  const cgt = getCgtMint()!;
  const data = Buffer.alloc(8 + 8 + 1 + 4 + 1);
  disc('mint_miner').copy(data, 0);
  data.writeBigUInt64LE(BigInt(assetId), 8);
  data.writeUInt8(skinToByte(skin), 16);
  data.writeUInt32LE(hashrate, 17);
  data.writeUInt8(rarityToByte(rarity), 21);
  const miner = minerPda(assetId);
  return [
    ataIx(cgt, owner, owner),
    new TransactionInstruction({
      programId: getEconomyProgramId(),
      keys: [
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: configPda(), isSigner: false, isWritable: true },
        { pubkey: cgt, isSigner: false, isWritable: true },
        { pubkey: playerPda(owner), isSigner: false, isWritable: true },
        { pubkey: getAssociatedTokenAddressSync(cgt, owner), isSigner: false, isWritable: true },
        { pubkey: miner, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    }),
  ];
}

export async function buildListMinerIx(
  seller: PublicKey,
  miner: PublicKey,
  assetId: number,
  priceCgt: number
): Promise<TransactionInstruction> {
  await ensureDiscriminators();
  const data = Buffer.concat([disc('list_miner'), Buffer.alloc(8)]);
  data.writeBigUInt64LE(BigInt(priceCgt), 8);
  return new TransactionInstruction({
    programId: getEconomyProgramId(),
    keys: [
      { pubkey: seller, isSigner: true, isWritable: true },
      { pubkey: minerPda(assetId), isSigner: false, isWritable: false },
      { pubkey: listingPda(miner), isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export async function buildCancelListIx(
  seller: PublicKey,
  miner: PublicKey
): Promise<TransactionInstruction> {
  await ensureDiscriminators();
  return new TransactionInstruction({
    programId: getEconomyProgramId(),
    keys: [
      { pubkey: seller, isSigner: true, isWritable: true },
      { pubkey: listingPda(miner), isSigner: false, isWritable: true },
    ],
    data: disc('cancel_list'),
  });
}

export async function buildBuyMinerIx(
  buyer: PublicKey,
  seller: PublicKey,
  assetId: number,
  miner: PublicKey,
  feeTreasury?: PublicKey
): Promise<TransactionInstruction[]> {
  await ensureDiscriminators();
  const cgt = getCgtMint()!;
  const config = await fetchConfig();
  const treasury = feeTreasury
    || (config?.feeTreasury ? new PublicKey(config.feeTreasury) : null)
    || (config?.authority ? new PublicKey(config.authority) : null);
  if (!treasury) {
    throw new Error('fee_treasury unknown — fetch config / bootstrap economy');
  }
  return [
    ataIx(cgt, buyer, buyer),
    ataIx(cgt, seller, buyer),
    ataIx(cgt, treasury, buyer),
    new TransactionInstruction({
      programId: getEconomyProgramId(),
      keys: [
        { pubkey: buyer, isSigner: true, isWritable: true },
        { pubkey: configPda(), isSigner: false, isWritable: false },
        { pubkey: cgt, isSigner: false, isWritable: false },
        { pubkey: minerPda(assetId), isSigner: false, isWritable: true },
        { pubkey: listingPda(miner), isSigner: false, isWritable: true },
        { pubkey: seller, isSigner: false, isWritable: false },
        { pubkey: playerPda(seller), isSigner: false, isWritable: true },
        { pubkey: playerPda(buyer), isSigner: false, isWritable: true },
        { pubkey: getAssociatedTokenAddressSync(cgt, buyer), isSigner: false, isWritable: true },
        { pubkey: getAssociatedTokenAddressSync(cgt, seller), isSigner: false, isWritable: true },
        { pubkey: getAssociatedTokenAddressSync(cgt, treasury), isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data: disc('buy_miner'),
    }),
  ];
}

export function minerToGameNft(m: OnChainMiner, me: string): MinerNFT {
  const names: Record<string, string> = {
    obsidian: 'Obsidian Pulse-Core',
    helix: 'Helix Fusion-Cell',
    reactor: 'Reactor Core-Forge',
    quantum: 'Quantum Nexus-Shard',
  };
  return {
    id: `onchain_${m.assetId}`,
    name: names[m.skin] || `Miner #${m.assetId}`,
    image: m.skin,
    hashrate: m.hashrate,
    level: m.level,
    maxLevel: m.maxLevel,
    rarity: m.rarity as MinerNFT['rarity'],
    isListed: m.isListed,
    listingPrice: m.listingPrice,
    upgradeCost: 50 * m.level,
    mintAddress: m.mintAddress,
    owner: m.owner === me ? 'Me' : m.owner,
    description: `On-chain miner asset ${m.mintAddress.slice(0, 8)}…`,
  };
}

export async function initPlayerIfNeeded(
  owner: PublicKey,
  signAndSend: (tx: Transaction) => Promise<string>,
  connection = getConnection()
): Promise<{ created: boolean; signature?: string }> {
  await ensureDiscriminators();
  const existing = await fetchPlayer(owner, connection);
  if (existing) return { created: false };
  const tx = new Transaction().add(await buildInitPlayerIx(owner));
  const bcc = getBccMint();
  const cgt = getCgtMint();
  if (bcc) tx.add(ataIx(bcc, owner, owner));
  if (cgt) tx.add(ataIx(cgt, owner, owner));
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = owner;
  const signature = await signAndSend(tx);
  return { created: true, signature };
}

export function solscanTx(sig: string): string {
  return `https://solscan.io/tx/${sig}?cluster=devnet`;
}

export { MINER_MINT_COST_CGT, ASSOCIATED_TOKEN_PROGRAM_ID };

/** Server helper: load authority from ECONOMY_AUTHORITY_SECRET (base64 or JSON array). */
export function loadEconomyAuthorityFromEnv(): Keypair | null {
  if (typeof process === 'undefined' || !process.env) return null;
  const raw = process.env.ECONOMY_AUTHORITY_SECRET;
  if (!raw) return null;
  try {
    if (raw.trim().startsWith('[')) {
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
    }
    return Keypair.fromSecretKey(Buffer.from(raw, 'base64'));
  } catch {
    return null;
  }
}
