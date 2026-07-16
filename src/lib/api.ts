import { auth } from './firebase.ts';

// Helper to get authorization headers with Firebase ID Token
async function getAuthHeaders(): Promise<HeadersInit> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return {
      'Content-Type': 'application/json'
    };
  }
  try {
    const token = await currentUser.getIdToken(true);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  } catch (error) {
    console.error("Failed to retrieve Firebase ID Token:", error);
    return {
      'Content-Type': 'application/json'
    };
  }
}

export interface ApiUser {
  uid: string;
  email: string;
  username: string;
  walletAddress?: string;
  isAdmin: boolean;
}

export interface ApiMessage {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ApiTicket {
  id: string;
  userId: string;
  type: string;
  subject: string;
  message: string;
  timestamp: string;
  status: 'Open' | 'Resolved';
  reply?: string;
}

export const api = {
  // Synchronize authenticated user with Postgres database
  async syncUser(username: string, walletAddress?: string): Promise<ApiUser> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/auth/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, walletAddress }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to synchronize user session with the database');
    }

    const data = await response.json();
    return data.user;
  },

  // Fetch active user profile
  async getProfile(): Promise<ApiUser> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/profile', {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch user profile');
    }

    return response.json();
  },

  // Admin route: Fetch all registered users
  async getAllUsers(): Promise<ApiUser[]> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/users', {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch registered ecosystem users');
    }

    return response.json();
  },

  // Fetch messages/announcements
  async getMessages(): Promise<ApiMessage[]> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/messages', {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch messages');
    }

    return response.json();
  },

  // Admin: Broadcast new announcement
  async broadcastMessage(recipient: string, subject: string, content: string): Promise<ApiMessage> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        recipient,
        subject,
        content,
        timestamp: new Date().toLocaleString(),
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to broadcast announcement');
    }

    return response.json();
  },

  // Mark announcement as read
  async markMessageAsRead(id: string): Promise<ApiMessage> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/messages/${id}/read`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update message status');
    }

    return response.json();
  },

  // Fetch support / feedback tickets
  async getTickets(): Promise<ApiTicket[]> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/feedback', {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch tickets');
    }

    return response.json();
  },

  // Submit a feedback ticket
  async submitTicket(type: string, subject: string, message: string): Promise<ApiTicket> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type,
        subject,
        message,
        timestamp: new Date().toLocaleString(),
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit feedback ticket');
    }

    return response.json();
  },

  // Admin response: Resolve feedback ticket
  async resolveTicket(id: string, reply: string): Promise<ApiTicket> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/feedback/${id}/resolve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reply }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to resolve feedback ticket');
    }

    return response.json();
  }
};
