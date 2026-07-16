import express from "express";
import path from "path";
import crypto from "crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { createServer as createViteServer } from "vite";
import {
  requireAuth,
  requireWalletAuth,
  AuthRequest,
  createWalletChallenge,
  consumeChallenge,
  signWalletToken,
} from "./src/middleware/auth.ts";
import {
  getOrCreateUser,
  getUserProfile,
  getAllUsers,
  getMessagesForUser,
  createMessage,
  markMessageAsRead,
  getFeedbackTickets,
  createFeedbackTicket,
  resolveFeedbackTicket,
} from "./src/db/queries.ts";
import { verifyAttentionWithAgent } from "./src/lib/attention-agent.ts";
import { verifyKpiTransaction, verifyMemoAttestation } from "./src/lib/solana-verify.ts";
import {
  saveAttentionVerification,
  updateAttentionAttest,
  saveKpiProof,
  getKpiBySignature,
} from "./src/db/memory-store.ts";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "1mb" }));

  const isAdminUser = (email?: string) => {
    return email === "laszlo.bihary@gmail.com" || email === "admin@buildingculture.space";
  };

  app.post("/api/wallet/challenge", (req, res) => {
    const walletAddress = String(req.body?.walletAddress || "").trim();
    if (!walletAddress || walletAddress.length < 32) {
      return res.status(400).json({ error: "walletAddress required" });
    }
    const { message, expiresAt } = createWalletChallenge(walletAddress);
    res.json({ message, expiresAt });
  });

  app.post("/api/wallet/login", async (req, res) => {
    try {
      const walletAddress = String(req.body?.walletAddress || "").trim();
      const signature = String(req.body?.signature || "").trim();
      const messageOverride = req.body?.message as string | undefined;
      const allowDemo = req.body?.demoUnsigned === true;

      if (!walletAddress || (!signature && !allowDemo)) {
        return res.status(400).json({ error: "walletAddress and signature required" });
      }

      const expectedMessage = consumeChallenge(walletAddress) || messageOverride;

      if (!allowDemo) {
        if (!expectedMessage) {
          return res.status(400).json({ error: "Challenge expired — request a new one" });
        }

        const messageBytes = new TextEncoder().encode(expectedMessage);
        let sigBytes: Uint8Array;
        try {
          sigBytes = bs58.decode(signature);
        } catch {
          try {
            sigBytes = Uint8Array.from(Buffer.from(signature, "base64"));
          } catch {
            return res.status(400).json({ error: "Invalid signature encoding" });
          }
        }

        let pubkeyBytes: Uint8Array;
        try {
          pubkeyBytes = bs58.decode(walletAddress);
        } catch {
          return res.status(400).json({ error: "Invalid wallet address" });
        }

        const ok = nacl.sign.detached.verify(messageBytes, sigBytes, pubkeyBytes);
        if (!ok) {
          return res.status(401).json({ error: "Signature verification failed" });
        }
      } else {
        console.warn("DEV: accepting demoUnsigned wallet login");
      }

      const token = signWalletToken(walletAddress);
      const uid = `wallet_${walletAddress.slice(0, 16)}`;
      try {
        await getOrCreateUser(
          uid,
          `${walletAddress.slice(0, 8)}@wallet.local`,
          `Op_${walletAddress.slice(0, 4)}`,
          walletAddress
        );
      } catch (e) {
        console.warn("Postgres sync skipped (wallet login still valid):", e);
      }

      res.json({
        token,
        user: {
          uid,
          walletAddress,
          username: `Op_${walletAddress.slice(0, 4)}${walletAddress.slice(-4)}`,
        },
      });
    } catch (error: any) {
      console.error("Wallet login failed:", error);
      res.status(500).json({ error: error.message || "Wallet login failed" });
    }
  });

  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized: Missing user authentication payload" });
      }

      const uid = req.user.uid;
      const email = req.user.email || "";
      const username = req.body.username || email.split("@")[0] || "Operator";
      const walletAddress =
        req.body.walletAddress ||
        (req.user as { walletAddress?: string }).walletAddress ||
        "";

      const user = await getOrCreateUser(uid, email, username, walletAddress);

      res.json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          username: user.username,
          walletAddress: user.walletAddress,
          isAdmin: isAdminUser(user.email),
        },
      });
    } catch (error: any) {
      console.error("Auth sync route failed:", error);
      res.status(500).json({ error: error.message || "Failed to synchronize user session" });
    }
  });

  app.get("/api/profile", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const profile = await getUserProfile(req.user.uid);
      if (!profile) {
        return res.status(404).json({ error: "User profile not found in persistent ledger" });
      }
      res.json({ ...profile, isAdmin: isAdminUser(profile.email) });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to retrieve user profile" });
    }
  });

  app.get("/api/users", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !isAdminUser(req.user.email)) {
        return res.status(403).json({ error: "Forbidden: Administrative access required" });
      }
      res.json(await getAllUsers());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/messages", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      res.json(await getMessagesForUser(req.user.email || ""));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !isAdminUser(req.user.email)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { recipient, subject, content, timestamp } = req.body;
      const msg = await createMessage(
        `msg_${Date.now()}`,
        req.user.email || "admin",
        recipient,
        subject,
        content,
        timestamp || new Date().toLocaleString()
      );
      res.json(msg);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages/:id/read", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      res.json(await markMessageAsRead(req.params.id));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/feedback", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      res.json(await getFeedbackTickets(req.user.uid, isAdminUser(req.user.email)));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/feedback", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { type, subject, message, timestamp } = req.body;
      res.json(
        await createFeedbackTicket(
          `fb_${Date.now()}`,
          req.user.uid,
          type,
          subject,
          message,
          timestamp || new Date().toLocaleString()
        )
      );
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/feedback/:id/resolve", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !isAdminUser(req.user.email)) {
        return res.status(403).json({ error: "Forbidden: Administrative access required" });
      }
      const { reply } = req.body;
      if (!reply) return res.status(400).json({ error: "Reply required" });
      res.json(await resolveFeedbackTicket(req.params.id, reply));
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to resolve ticket" });
    }
  });

  app.post("/api/attention/verify", requireWalletAuth, async (req: AuthRequest, res) => {
    try {
      const wallet = req.walletUser!.walletAddress;
      const { sessionId, title, artifacts, quizScore, quizTotal, topic, summary } = req.body || {};
      if (!sessionId || !title) {
        return res.status(400).json({ error: "sessionId and title required" });
      }

      const result = await verifyAttentionWithAgent({
        sessionId,
        title,
        artifacts,
        quizScore,
        quizTotal,
        topic,
        summary,
        walletAddress: wallet,
      });

      const id = `att_${crypto.randomBytes(8).toString("hex")}`;
      const stored = saveAttentionVerification({
        id,
        uid: req.walletUser!.uid,
        walletAddress: wallet,
        sessionId,
        title,
        score: result.score,
        passed: result.passed,
        verification: result.verification,
        reason: result.reason,
        model: result.model,
      });

      res.json({
        ...result,
        verificationId: stored.id,
        proofOfAttention: result.passed
          ? {
              id: stored.id,
              walletAddress: wallet,
              activity: title,
              duration: 25,
              verification: result.verification,
              rewardEnergy: Math.round(result.score / 4),
              rewardBcc: Math.round(result.score * 2),
              timestamp: new Date().toISOString(),
              minted: false,
              sessionId,
              score: result.score,
              attestPending: true,
            }
          : null,
      });
    } catch (error: any) {
      console.error("Attention verify failed:", error);
      res.status(500).json({ error: error.message || "Attention verification failed" });
    }
  });

  app.post("/api/attention/attest", requireWalletAuth, async (req: AuthRequest, res) => {
    try {
      const wallet = req.walletUser!.walletAddress;
      const { verificationId, signature, sessionId, score } = req.body || {};
      if (!signature || !verificationId) {
        return res.status(400).json({ error: "verificationId and signature required" });
      }

      const check = await verifyMemoAttestation(signature, wallet, "poa:");
      if (!check.ok) {
        console.warn("Attest soft-check:", check.error);
      }

      updateAttentionAttest(verificationId, signature);
      res.json({
        ok: true,
        signature,
        solscan: `https://solscan.io/tx/${signature}?cluster=devnet`,
        rpcCheck: check,
        sessionId,
        score,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Attest failed" });
    }
  });

  app.post("/api/kpi/verify", requireWalletAuth, async (req: AuthRequest, res) => {
    try {
      const wallet = req.walletUser!.walletAddress;
      const signature = String(req.body?.signature || "").trim();
      if (!signature) return res.status(400).json({ error: "signature required" });

      const existing = getKpiBySignature(signature);
      if (existing?.verified) {
        return res.json({
          ok: true,
          alreadyVerified: true,
          proof: existing,
          solscan: `https://solscan.io/tx/${signature}?cluster=devnet`,
        });
      }

      const check = await verifyKpiTransaction(signature, wallet);
      if (!check.ok) {
        return res.status(400).json({ ok: false, error: check.error });
      }

      const proof = saveKpiProof({
        id: `kpi_${crypto.randomBytes(6).toString("hex")}`,
        uid: req.walletUser!.uid,
        walletAddress: wallet,
        signature,
        verified: true,
        slot: check.slot != null ? String(check.slot) : undefined,
      });

      res.json({
        ok: true,
        proof,
        solscan: `https://solscan.io/tx/${signature}?cluster=devnet`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "KPI verify failed" });
    }
  });

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
