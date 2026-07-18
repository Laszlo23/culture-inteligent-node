import { pgTable, text, boolean, timestamp, serial, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  username: text('username'),
  walletAddress: text('wallet_address'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  sender: text('sender').notNull(),
  recipient: text('recipient').notNull(),
  subject: text('subject').notNull(),
  content: text('content').notNull(),
  timestamp: text('timestamp').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
});

export const feedback = pgTable('feedback', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  type: text('type').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  timestamp: text('timestamp').notNull(),
  status: text('status').notNull(),
  reply: text('reply'),
});

export const attentionVerifications = pgTable('attention_verifications', {
  id: text('id').primaryKey(),
  uid: text('uid').notNull(),
  walletAddress: text('wallet_address'),
  sessionId: text('session_id').notNull(),
  title: text('title').notNull(),
  score: integer('score').notNull(),
  passed: boolean('passed').notNull(),
  verification: text('verification').notNull(),
  reason: text('reason').notNull(),
  model: text('model'),
  attestSignature: text('attest_signature'),
  /** True after grant-energy partial-tx was issued for this proof (retry window still allowed). */
  energyGranted: boolean('energy_granted').default(false).notNull(),
  energyGrantedAt: timestamp('energy_granted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const kpiProofs = pgTable('kpi_proofs', {
  id: text('id').primaryKey(),
  uid: text('uid').notNull(),
  walletAddress: text('wallet_address').notNull(),
  signature: text('signature').notNull().unique(),
  verified: boolean('verified').notNull(),
  slot: text('slot'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tollPayments = pgTable('toll_payments', {
  id: text('id').primaryKey(),
  uid: text('uid').notNull(),
  walletAddress: text('wallet_address').notNull(),
  signature: text('signature').notNull().unique(),
  sku: text('sku').notNull(),
  quantity: integer('quantity').notNull(),
  amountMicro: integer('amount_micro').notNull(),
  priceCents: integer('price_cents').notNull(),
  verified: boolean('verified').notNull(),
  slot: text('slot'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * The Void — anonymous asks. Intentionally NO user_id / wallet / IP columns.
 * Anonymity proof: schema + /api/void/* rejects Authorization headers.
 */
export const voidAsks = pgTable('void_asks', {
  id: text('id').primaryKey(),
  body: text('body').notNull(),
  contentHash: text('content_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  replyCount: integer('reply_count').default(0).notNull(),
});

export const voidReplies = pgTable('void_replies', {
  id: text('id').primaryKey(),
  askId: text('ask_id').notNull(),
  body: text('body').notNull(),
  contentHash: text('content_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * ZKPassport-bound soulbound reputation — nullifier hash only (no PII).
 */
export const zkBindings = pgTable('zk_bindings', {
  nullifierHash: text('nullifier_hash').primaryKey(),
  walletAddress: text('wallet_address').notNull().unique(),
  zkProvider: text('zk_provider').notNull(),
  verifiedAt: timestamp('verified_at').notNull(),
  boundAt: timestamp('bound_at').defaultNow().notNull(),
  mintAddress: text('mint_address'),
  mintSignature: text('mint_signature'),
  badgePda: text('badge_pda'),
  soulboundMinted: boolean('soulbound_minted').default(false).notNull(),
});
