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
