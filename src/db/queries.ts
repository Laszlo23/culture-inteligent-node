import { db, createPool } from './index.ts';
import {
  users,
  messages,
  feedback,
  voidAsks,
  voidReplies,
  zkBindings,
  attentionVerifications,
  kpiProofs,
  tollPayments,
} from './schema.ts';
import { eq, or, and, desc } from 'drizzle-orm';
import {
  getZkBindingByNullifier as memByNullifier,
  getZkBindingByWallet as memByWallet,
  upsertZkBinding as memUpsert,
  markZkMinted as memMarkMinted,
  saveAttentionVerification as memSaveAttention,
  updateAttentionAttest as memUpdateAttest,
  markAttentionEnergyGranted as memMarkEnergyGranted,
  listAttentionForUid as memListAttention,
  getAttentionById as memGetAttention,
  saveKpiProof as memSaveKpi,
  getKpiBySignature as memGetKpiBySig,
  getKpiByWallet as memGetKpiByWallet,
  saveTollPayment as memSaveToll,
  getTollBySignature as memGetTollBySig,
  getTollStats as memGetTollStats,
  listTollPayments as memListTollPayments,
  type StoredZkBinding,
  type StoredAttentionVerification,
  type StoredKpiProof,
  type StoredTollPayment,
} from './memory-store.ts';

let voidTablesReady: Promise<void> | null = null;

/** Ensure Void tables exist (no identity columns by design). */
export async function ensureVoidTables() {
  if (!voidTablesReady) {
    voidTablesReady = (async () => {
      const pool = createPool();
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS void_asks (
            id text PRIMARY KEY,
            body text NOT NULL,
            content_hash text NOT NULL,
            created_at timestamp DEFAULT now(),
            reply_count integer DEFAULT 0 NOT NULL
          );
          CREATE TABLE IF NOT EXISTS void_replies (
            id text PRIMARY KEY,
            ask_id text NOT NULL,
            body text NOT NULL,
            content_hash text NOT NULL,
            created_at timestamp DEFAULT now()
          );
        `);
      } finally {
        await pool.end();
      }
    })().catch((err) => {
      voidTablesReady = null;
      throw err;
    });
  }
  return voidTablesReady;
}

export async function getOrCreateUser(uid: string, email: string, username?: string, walletAddress?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        username: username || email.split('@')[0],
        walletAddress: walletAddress || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          username: username || email.split('@')[0],
          walletAddress: walletAddress || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database user creation failed:", error);
    throw new Error("Database operation failed. Unable to authenticate user.", { cause: error });
  }
}

export async function getUserProfile(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid));
    return result[0] || null;
  } catch (error) {
    console.error("Database fetch user profile failed:", error);
    throw new Error("Database query failed. Unable to retrieve profile.", { cause: error });
  }
}

export async function getAllUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error("Database fetch all users failed:", error);
    throw new Error("Database query failed. Unable to retrieve users.", { cause: error });
  }
}

export async function getMessagesForUser(userEmailOrUsername: string) {
  try {
    // Return messages where recipient is the user, or 'all' for broadcasts
    return await db.select()
      .from(messages)
      .where(or(
        eq(messages.recipient, userEmailOrUsername),
        eq(messages.recipient, 'all')
      ));
  } catch (error) {
    console.error("Database fetch messages failed:", error);
    throw new Error("Database query failed. Unable to retrieve announcements.", { cause: error });
  }
}

export async function createMessage(
  id: string,
  sender: string,
  recipient: string,
  subject: string,
  content: string,
  timestamp: string
) {
  try {
    const result = await db.insert(messages)
      .values({
        id,
        sender,
        recipient,
        subject,
        content,
        timestamp,
        isRead: false,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database create message failed:", error);
    throw new Error("Database operation failed. Unable to dispatch announcement.", { cause: error });
  }
}

export async function markMessageAsRead(id: string) {
  try {
    const result = await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database update message read state failed:", error);
    throw new Error("Database operation failed. Unable to update read status.", { cause: error });
  }
}

export async function getFeedbackTickets(uid: string, isAdmin: boolean) {
  try {
    if (isAdmin) {
      return await db.select().from(feedback);
    } else {
      return await db.select().from(feedback).where(eq(feedback.userId, uid));
    }
  } catch (error) {
    console.error("Database fetch feedback failed:", error);
    throw new Error("Database query failed. Unable to retrieve tickets.", { cause: error });
  }
}

export async function createFeedbackTicket(
  id: string,
  userId: string,
  type: string,
  subject: string,
  message: string,
  timestamp: string
) {
  try {
    const result = await db.insert(feedback)
      .values({
        id,
        userId,
        type,
        subject,
        message,
        timestamp,
        status: 'Open',
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database create ticket failed:", error);
    throw new Error("Database operation failed. Unable to register feedback ticket.", { cause: error });
  }
}

export async function resolveFeedbackTicket(id: string, reply: string) {
  try {
    const result = await db.update(feedback)
      .set({ status: 'Resolved', reply })
      .where(eq(feedback.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database resolve ticket failed:", error);
    throw new Error("Database operation failed. Unable to update feedback ticket.", { cause: error });
  }
}

export const VOID_STORED_FIELDS = ['id', 'body', 'content_hash', 'created_at', 'reply_count'] as const;
export const VOID_FORBIDDEN_FIELDS = [
  'user_id',
  'uid',
  'wallet',
  'wallet_address',
  'email',
  'username',
  'ip',
  'authorization',
] as const;

export async function listVoidAsks(limit = 40) {
  await ensureVoidTables();
  return db.select().from(voidAsks).orderBy(desc(voidAsks.createdAt)).limit(limit);
}

export async function listVoidReplies(askId: string) {
  await ensureVoidTables();
  return db
    .select()
    .from(voidReplies)
    .where(eq(voidReplies.askId, askId))
    .orderBy(desc(voidReplies.createdAt));
}

export async function createVoidAsk(id: string, body: string, contentHash: string) {
  await ensureVoidTables();
  const result = await db
    .insert(voidAsks)
    .values({ id, body, contentHash, replyCount: 0 })
    .returning();
  return result[0];
}

export async function createVoidReply(
  id: string,
  askId: string,
  body: string,
  contentHash: string
) {
  await ensureVoidTables();
  const result = await db
    .insert(voidReplies)
    .values({ id, askId, body, contentHash })
    .returning();
  const ask = await db.select().from(voidAsks).where(eq(voidAsks.id, askId));
  if (ask[0]) {
    await db
      .update(voidAsks)
      .set({ replyCount: (ask[0].replyCount || 0) + 1 })
      .where(eq(voidAsks.id, askId));
  }
  return result[0];
}

let zkTablesReady: Promise<void> | null = null;

export async function ensureZkTables() {
  if (!zkTablesReady) {
    zkTablesReady = (async () => {
      const pool = createPool();
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS zk_bindings (
            nullifier_hash text PRIMARY KEY,
            wallet_address text NOT NULL UNIQUE,
            zk_provider text NOT NULL,
            verified_at timestamp NOT NULL,
            bound_at timestamp DEFAULT now() NOT NULL,
            mint_address text,
            mint_signature text,
            badge_pda text,
            soulbound_minted boolean DEFAULT false NOT NULL
          );
        `);
      } finally {
        await pool.end();
      }
    })().catch((err) => {
      zkTablesReady = null;
      throw err;
    });
  }
  return zkTablesReady;
}

function rowToBinding(r: typeof zkBindings.$inferSelect): StoredZkBinding {
  return {
    nullifierHash: r.nullifierHash,
    walletAddress: r.walletAddress,
    zkProvider: r.zkProvider as StoredZkBinding['zkProvider'],
    verifiedAt:
      r.verifiedAt instanceof Date ? r.verifiedAt.toISOString() : String(r.verifiedAt),
    boundAt: r.boundAt instanceof Date ? r.boundAt.toISOString() : String(r.boundAt),
    mintAddress: r.mintAddress || undefined,
    mintSignature: r.mintSignature || undefined,
    badgePda: r.badgePda || undefined,
    soulboundMinted: Boolean(r.soulboundMinted),
  };
}

export async function getZkBindingByNullifier(
  nullifierHash: string
): Promise<StoredZkBinding | null> {
  try {
    await ensureZkTables();
    const rows = await db
      .select()
      .from(zkBindings)
      .where(eq(zkBindings.nullifierHash, nullifierHash))
      .limit(1);
    if (rows[0]) return rowToBinding(rows[0]);
  } catch {
    // Postgres unavailable — memory
  }
  return memByNullifier(nullifierHash);
}

export async function getZkBindingByWallet(
  walletAddress: string
): Promise<StoredZkBinding | null> {
  try {
    await ensureZkTables();
    const rows = await db
      .select()
      .from(zkBindings)
      .where(eq(zkBindings.walletAddress, walletAddress))
      .limit(1);
    if (rows[0]) return rowToBinding(rows[0]);
  } catch {
    // fall through
  }
  return memByWallet(walletAddress);
}

export async function upsertZkBinding(row: StoredZkBinding): Promise<StoredZkBinding> {
  memUpsert(row);
  try {
    await ensureZkTables();
    await db
      .insert(zkBindings)
      .values({
        nullifierHash: row.nullifierHash,
        walletAddress: row.walletAddress,
        zkProvider: row.zkProvider,
        verifiedAt: new Date(row.verifiedAt),
        boundAt: new Date(row.boundAt),
        mintAddress: row.mintAddress || null,
        mintSignature: row.mintSignature || null,
        badgePda: row.badgePda || null,
        soulboundMinted: row.soulboundMinted,
      })
      .onConflictDoUpdate({
        target: zkBindings.nullifierHash,
        set: {
          walletAddress: row.walletAddress,
          verifiedAt: new Date(row.verifiedAt),
          mintAddress: row.mintAddress || null,
          mintSignature: row.mintSignature || null,
          badgePda: row.badgePda || null,
          soulboundMinted: row.soulboundMinted,
        },
      });
  } catch (err) {
    console.warn('zk_bindings postgres upsert failed — memory only', err);
  }
  return row;
}

export async function markZkMinted(
  nullifierHash: string,
  patch: { mintAddress: string; mintSignature?: string; badgePda?: string }
): Promise<StoredZkBinding | null> {
  const mem = memMarkMinted(nullifierHash, patch);
  try {
    await ensureZkTables();
    await db
      .update(zkBindings)
      .set({
        mintAddress: patch.mintAddress,
        mintSignature: patch.mintSignature || null,
        badgePda: patch.badgePda || null,
        soulboundMinted: true,
      })
      .where(eq(zkBindings.nullifierHash, nullifierHash));
  } catch (err) {
    console.warn('zk_bindings mark minted postgres failed — memory only', err);
  }
  return mem || (await getZkBindingByNullifier(nullifierHash));
}

/* ─── Economy proofs (attention / KPI / toll) — Postgres + memory fallback ─── */

let economyProofTablesReady: Promise<void> | null = null;

export async function ensureEconomyProofTables() {
  if (!economyProofTablesReady) {
    economyProofTablesReady = (async () => {
      const pool = createPool();
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS attention_verifications (
            id text PRIMARY KEY,
            uid text NOT NULL,
            wallet_address text,
            session_id text NOT NULL,
            title text NOT NULL,
            score integer NOT NULL,
            passed boolean NOT NULL,
            verification text NOT NULL,
            reason text NOT NULL,
            model text,
            attest_signature text,
            energy_granted boolean DEFAULT false NOT NULL,
            created_at timestamp DEFAULT now()
          );
          ALTER TABLE attention_verifications
            ADD COLUMN IF NOT EXISTS energy_granted boolean DEFAULT false NOT NULL;
          ALTER TABLE attention_verifications
            ADD COLUMN IF NOT EXISTS energy_granted_at timestamp;
          CREATE TABLE IF NOT EXISTS kpi_proofs (
            id text PRIMARY KEY,
            uid text NOT NULL,
            wallet_address text NOT NULL,
            signature text NOT NULL UNIQUE,
            verified boolean NOT NULL,
            slot text,
            created_at timestamp DEFAULT now()
          );
          CREATE TABLE IF NOT EXISTS toll_payments (
            id text PRIMARY KEY,
            uid text NOT NULL,
            wallet_address text NOT NULL,
            signature text NOT NULL UNIQUE,
            sku text NOT NULL,
            quantity integer NOT NULL,
            amount_micro integer NOT NULL,
            price_cents integer NOT NULL,
            verified boolean NOT NULL,
            slot text,
            created_at timestamp DEFAULT now()
          );
        `);
      } finally {
        await pool.end();
      }
    })().catch((err) => {
      economyProofTablesReady = null;
      throw err;
    });
  }
  return economyProofTablesReady;
}

function rowToAttention(r: typeof attentionVerifications.$inferSelect): StoredAttentionVerification {
  return {
    id: r.id,
    uid: r.uid,
    walletAddress: r.walletAddress || undefined,
    sessionId: r.sessionId,
    title: r.title,
    score: r.score,
    passed: r.passed,
    verification: r.verification,
    reason: r.reason,
    model: r.model || undefined,
    attestSignature: r.attestSignature || undefined,
    energyGranted: Boolean(r.energyGranted),
    energyGrantedAt: r.energyGrantedAt
      ? r.energyGrantedAt instanceof Date
        ? r.energyGrantedAt.toISOString()
        : String(r.energyGrantedAt)
      : undefined,
    createdAt:
      r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt || new Date().toISOString()),
  };
}

export async function saveAttentionVerification(
  row: Omit<StoredAttentionVerification, 'createdAt'> & { createdAt?: string }
): Promise<StoredAttentionVerification> {
  const full = memSaveAttention(row);
  try {
    await ensureEconomyProofTables();
    await db
      .insert(attentionVerifications)
      .values({
        id: full.id,
        uid: full.uid,
        walletAddress: full.walletAddress || null,
        sessionId: full.sessionId,
        title: full.title,
        score: full.score,
        passed: full.passed,
        verification: full.verification,
        reason: full.reason,
        model: full.model || null,
        attestSignature: full.attestSignature || null,
        energyGranted: Boolean(full.energyGranted),
        createdAt: new Date(full.createdAt),
      })
      .onConflictDoNothing();
  } catch (err) {
    console.warn('attention_verifications postgres save failed — memory only', err);
  }
  return full;
}

export async function updateAttentionAttest(id: string, attestSignature: string) {
  const mem = memUpdateAttest(id, attestSignature);
  try {
    await ensureEconomyProofTables();
    await db
      .update(attentionVerifications)
      .set({ attestSignature })
      .where(eq(attentionVerifications.id, id));
  } catch (err) {
    console.warn('attention attest postgres update failed — memory only', err);
  }
  return mem;
}

export async function markAttentionEnergyGranted(id: string) {
  const mem = memMarkEnergyGranted(id);
  const grantedAt = mem?.energyGrantedAt ? new Date(mem.energyGrantedAt) : new Date();
  try {
    await ensureEconomyProofTables();
    await db
      .update(attentionVerifications)
      .set({ energyGranted: true, energyGrantedAt: grantedAt })
      .where(eq(attentionVerifications.id, id));
  } catch (err) {
    console.warn('attention energy_granted postgres update failed — memory only', err);
  }
  return mem;
}

export async function listAttentionForUid(uid: string): Promise<StoredAttentionVerification[]> {
  const memRows = memListAttention(uid);
  try {
    await ensureEconomyProofTables();
    const rows = await db
      .select()
      .from(attentionVerifications)
      .where(eq(attentionVerifications.uid, uid))
      .orderBy(desc(attentionVerifications.createdAt));
    if (rows.length === 0) return memRows;
    const byId = new Map<string, StoredAttentionVerification>();
    for (const r of memRows) byId.set(r.id, r);
    for (const r of rows) {
      const mapped = rowToAttention(r);
      const existing = byId.get(mapped.id);
      byId.set(mapped.id, existing ? { ...mapped, ...existing, energyGranted: existing.energyGranted || mapped.energyGranted } : mapped);
    }
    return [...byId.values()];
  } catch {
    return memRows;
  }
}

export async function getAttentionById(id: string): Promise<StoredAttentionVerification | null> {
  const mem = memGetAttention(id);
  if (mem) return mem;
  try {
    await ensureEconomyProofTables();
    const rows = await db
      .select()
      .from(attentionVerifications)
      .where(eq(attentionVerifications.id, id))
      .limit(1);
    if (rows[0]) {
      const mapped = rowToAttention(rows[0]);
      memSaveAttention(mapped);
      return mapped;
    }
  } catch {
    /* memory only */
  }
  return null;
}

export async function saveKpiProof(
  row: Omit<StoredKpiProof, 'createdAt'> & { createdAt?: string }
): Promise<StoredKpiProof> {
  const full = memSaveKpi(row);
  try {
    await ensureEconomyProofTables();
    await db
      .insert(kpiProofs)
      .values({
        id: full.id,
        uid: full.uid,
        walletAddress: full.walletAddress,
        signature: full.signature,
        verified: full.verified,
        slot: full.slot || null,
        createdAt: new Date(full.createdAt),
      })
      .onConflictDoNothing();
  } catch (err) {
    console.warn('kpi_proofs postgres save failed — memory only', err);
  }
  return full;
}

export async function getKpiBySignature(signature: string): Promise<StoredKpiProof | null> {
  const mem = memGetKpiBySig(signature);
  if (mem) return mem;
  try {
    await ensureEconomyProofTables();
    const rows = await db
      .select()
      .from(kpiProofs)
      .where(eq(kpiProofs.signature, signature))
      .limit(1);
    if (rows[0]) {
      const mapped: StoredKpiProof = {
        id: rows[0].id,
        uid: rows[0].uid,
        walletAddress: rows[0].walletAddress,
        signature: rows[0].signature,
        verified: rows[0].verified,
        slot: rows[0].slot || undefined,
        createdAt:
          rows[0].createdAt instanceof Date
            ? rows[0].createdAt.toISOString()
            : String(rows[0].createdAt || new Date().toISOString()),
      };
      memSaveKpi(mapped);
      return mapped;
    }
  } catch {
    /* memory */
  }
  return null;
}

export async function getKpiByWallet(walletAddress: string): Promise<StoredKpiProof[]> {
  const mem = memGetKpiByWallet(walletAddress);
  try {
    await ensureEconomyProofTables();
    const rows = await db
      .select()
      .from(kpiProofs)
      .where(and(eq(kpiProofs.walletAddress, walletAddress), eq(kpiProofs.verified, true)));
    if (rows.length === 0) return mem;
    const bySig = new Map<string, StoredKpiProof>();
    for (const m of mem) bySig.set(m.signature, m);
    for (const r of rows) {
      bySig.set(r.signature, {
        id: r.id,
        uid: r.uid,
        walletAddress: r.walletAddress,
        signature: r.signature,
        verified: r.verified,
        slot: r.slot || undefined,
        createdAt:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : String(r.createdAt || new Date().toISOString()),
      });
    }
    return [...bySig.values()];
  } catch {
    return mem;
  }
}

export async function saveTollPayment(
  row: Omit<StoredTollPayment, 'createdAt'> & { createdAt?: string }
): Promise<StoredTollPayment> {
  const full = memSaveToll(row);
  try {
    await ensureEconomyProofTables();
    await db
      .insert(tollPayments)
      .values({
        id: full.id,
        uid: full.uid,
        walletAddress: full.walletAddress,
        signature: full.signature,
        sku: full.sku,
        quantity: full.quantity,
        amountMicro: full.amountMicro,
        priceCents: full.priceCents,
        verified: full.verified,
        slot: full.slot || null,
        createdAt: new Date(full.createdAt),
      })
      .onConflictDoNothing();
  } catch (err) {
    console.warn('toll_payments postgres save failed — memory only', err);
  }
  return full;
}

export async function getTollBySignature(signature: string): Promise<StoredTollPayment | null> {
  const mem = memGetTollBySig(signature);
  if (mem) return mem;
  try {
    await ensureEconomyProofTables();
    const rows = await db
      .select()
      .from(tollPayments)
      .where(eq(tollPayments.signature, signature))
      .limit(1);
    if (rows[0]) {
      const mapped: StoredTollPayment = {
        id: rows[0].id,
        uid: rows[0].uid,
        walletAddress: rows[0].walletAddress,
        signature: rows[0].signature,
        sku: rows[0].sku,
        quantity: rows[0].quantity,
        amountMicro: rows[0].amountMicro,
        priceCents: rows[0].priceCents,
        verified: rows[0].verified,
        slot: rows[0].slot || undefined,
        createdAt:
          rows[0].createdAt instanceof Date
            ? rows[0].createdAt.toISOString()
            : String(rows[0].createdAt || new Date().toISOString()),
      };
      memSaveToll(mapped);
      return mapped;
    }
  } catch {
    /* memory */
  }
  return null;
}

/** Stats: merge memory + postgres (dedupe by signature). */
export async function getTollStats() {
  const memStats = memGetTollStats();
  try {
    await ensureEconomyProofTables();
    const rows = await db.select().from(tollPayments);
    if (rows.length === 0) return memStats;

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const seen = new Set<string>();
    let allTimeCents = 0;
    let todayCents = 0;
    let todayCount = 0;
    let allTimeCount = 0;
    const bySku: Record<string, { count: number; cents: number }> = {};

    const consider = (t: {
      signature: string;
      verified: boolean;
      priceCents: number;
      quantity: number;
      sku: string;
      createdAt: string;
    }) => {
      if (!t.verified || seen.has(t.signature)) return;
      seen.add(t.signature);
      const cents = t.priceCents * Math.max(1, t.quantity);
      allTimeCents += cents;
      allTimeCount += 1;
      const ts = Date.parse(t.createdAt);
      if (!Number.isNaN(ts) && ts >= dayAgo) {
        todayCents += cents;
        todayCount += 1;
      }
      const bucket = bySku[t.sku] || { count: 0, cents: 0 };
      bucket.count += 1;
      bucket.cents += cents;
      bySku[t.sku] = bucket;
    };

    for (const r of rows) {
      consider({
        signature: r.signature,
        verified: r.verified,
        priceCents: r.priceCents,
        quantity: r.quantity,
        sku: r.sku,
        createdAt:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : String(r.createdAt || new Date().toISOString()),
      });
    }
    // Include any in-memory-only practice tolls
    for (const t of memListTollPayments()) {
      consider(t);
    }

    const topSkus = Object.entries(bySku)
      .map(([sku, v]) => ({ sku, count: v.count, cents: v.cents }))
      .sort((a, b) => b.cents - a.cents)
      .slice(0, 8);

    return {
      allTimeCents,
      todayCents,
      todayCount,
      allTimeCount,
      topSkus,
      extrapolatedAnnualCents: todayCents * 365,
      note: 'Extrapolated annual is a model from the last 24h rate — not a guarantee.',
    };
  } catch {
    return memStats;
  }
}
