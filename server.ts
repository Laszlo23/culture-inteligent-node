import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { 
  getOrCreateUser, 
  getUserProfile, 
  getAllUsers,
  getMessagesForUser, 
  createMessage, 
  markMessageAsRead,
  getFeedbackTickets, 
  createFeedbackTicket, 
  resolveFeedbackTicket 
} from "./src/db/queries.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper check for Admin permissions
  const isAdminUser = (email?: string) => {
    return email === "laszlo.bihary@gmail.com" || email === "admin@buildingculture.space";
  };

  // ==================== DATABASE & AUTH SYNC API ====================

  // Synchronize authenticated user with Postgres database
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized: Missing user authentication payload" });
      }

      const uid = req.user.uid;
      const email = req.user.email || "";
      const username = req.body.username || email.split("@")[0] || "Operator";
      const walletAddress = req.body.walletAddress || "";

      console.log(`Syncing user to database: ${email} (${uid})`);
      const user = await getOrCreateUser(uid, email, username, walletAddress);

      res.json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          username: user.username,
          walletAddress: user.walletAddress,
          isAdmin: isAdminUser(user.email)
        }
      });
    } catch (error: any) {
      console.error("Auth sync route failed:", error);
      res.status(500).json({ error: error.message || "Failed to synchronize user session" });
    }
  });

  // Fetch active user profile
  app.get("/api/profile", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const profile = await getUserProfile(req.user.uid);
      if (!profile) {
        return res.status(404).json({ error: "User profile not found in persistent ledger" });
      }
      res.json({
        ...profile,
        isAdmin: isAdminUser(profile.email)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to retrieve user profile" });
    }
  });

  // Admin route to retrieve all registered ecosystem users
  app.get("/api/users", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !isAdminUser(req.user.email)) {
        return res.status(403).json({ error: "Forbidden: Administrative access required" });
      }
      const users = await getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== COMMUNICATIONS & MESSAGES API ====================

  // Fetch announcements/messages received by the authenticated user
  app.get("/api/messages", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      
      const email = req.user.email || "";
      const announcements = await getMessagesForUser(email);
      res.json(announcements);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch announcements" });
    }
  });

  // Post/Broadcast a new Admin Announcement message
  app.post("/api/messages", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !isAdminUser(req.user.email)) {
        return res.status(403).json({ error: "Forbidden: Administrative privilege required to broadcast" });
      }

      const { id, recipient, subject, content, timestamp } = req.body;
      if (!subject || !content) {
        return res.status(400).json({ error: "Missing required announcement headers or body content" });
      }

      const messageId = id || "msg_" + Date.now();
      const finalTimestamp = timestamp || new Date().toLocaleString();
      const sender = "System Admin";

      const createdMsg = await createMessage(messageId, sender, recipient || "all", subject, content, finalTimestamp);
      res.status(201).json(createdMsg);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to broadcast message" });
    }
  });

  // Mark message/announcement as read
  app.post("/api/messages/:id/read", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { id } = req.params;
      const updated = await markMessageAsRead(id);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to mark message as read" });
    }
  });

  // ==================== HELP DESK & FEEDBACK TICKETS API ====================

  // Retrieve feedback tickets (all if admin, only user's if regular user)
  app.get("/api/feedback", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const email = req.user.email || "";
      const uid = req.user.uid;
      const isAdmin = isAdminUser(email);

      const tickets = await getFeedbackTickets(uid, isAdmin);
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch tickets" });
    }
  });

  // Lodge a new feedback ticket
  app.post("/api/feedback", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { id, type, subject, message, timestamp } = req.body;
      if (!subject || !message) {
        return res.status(400).json({ error: "Subject and detailed message content are required" });
      }

      const ticketId = id || "fb_" + Date.now();
      const finalTimestamp = timestamp || new Date().toLocaleString();
      const uid = req.user.uid;

      const ticket = await createFeedbackTicket(ticketId, uid, type || "Feedback", subject, message, finalTimestamp);
      res.status(201).json(ticket);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to log feedback ticket" });
    }
  });

  // Admin response/resolve feedback ticket
  app.post("/api/feedback/:id/resolve", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !isAdminUser(req.user.email)) {
        return res.status(403).json({ error: "Forbidden: Administrative access required" });
      }

      const { id } = req.params;
      const { reply } = req.body;
      if (!reply) {
        return res.status(400).json({ error: "Reply resolution body content is required" });
      }

      const resolved = await resolveFeedbackTicket(id, reply);
      res.json(resolved);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to resolve ticket" });
    }
  });

  // ==================== VITE DEVELOPMENT / PRODUCTION MIDDLEWARE ====================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ecosystem Server booted on host 0.0.0.0 port ${PORT}`);
  });
}

startServer();
