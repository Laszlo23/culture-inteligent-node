import { db, createPool } from './index.ts';
import { users, messages, feedback, voidAsks, voidReplies, zkBindings } from './schema.ts';
import { eq, or, and, desc } from 'drizzle-orm';
import {
  getZkBindingByNullifier as memByNullifier,
  getZkBindingByWallet as memByWallet,
  upsertZkBinding as memUpsert,
  markZkMinted as memMarkMinted,
  type StoredZkBinding,
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
