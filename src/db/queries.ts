import { db } from './index.ts';
import { users, messages, feedback } from './schema.ts';
import { eq, or, and } from 'drizzle-orm';

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
