import { pgTable, text, boolean, timestamp, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
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
  type: text('type').notNull(), // 'Bug' | 'Feature' | 'Feedback'
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  timestamp: text('timestamp').notNull(),
  status: text('status').notNull(), // 'Open' | 'Resolved'
  reply: text('reply'),
});
