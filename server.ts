import express from "express";
import path from "path";
import crypto from "crypto";
import nacl from "tweetnacl";
import bs58Import from "bs58";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

// bs58 v6 ESM/CJS interop (Node require returns { default: { encode, decode } })
const bs58 = (bs58Import as any)?.default?.decode
  ? (bs58Import as any).default
  : (bs58Import as any);
import {
  requireAuth,
  requireWalletAuth,
  AuthRequest,
  createWalletChallenge,
  consumeChallenge,
  signWalletToken,
  verifyWalletToken,
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
  listVoidAsks,
  listVoidReplies,
  createVoidAsk,
  createVoidReply,
  VOID_STORED_FIELDS,
  VOID_FORBIDDEN_FIELDS,
  ensureVoidTables,
  getZkBindingByNullifier,
  getZkBindingByWallet,
  upsertZkBinding,
  markZkMinted,
} from "./src/db/queries.ts";
import {
  verifyZkPassportPayload,
  serverZkDevMode,
  serverZkScope,
} from "./src/lib/zk-id/server-verify.ts";
import {
  mintSoulboundToken2022,
  recordSoulboundPlaceholder,
  getSoulboundBadgePda,
} from "./src/lib/zk-id/soulbound-mint.ts";
import { loadEconomyAuthorityFromEnv } from "./src/lib/solana-economy.ts";
import { Connection, PublicKey } from "@solana/web3.js";
import { verifyAttentionWithAgent } from "./src/lib/attention-agent.ts";
import { verifyKpiTransaction, verifyMemoAttestation } from "./src/lib/solana-verify.ts";
import { researchWeeklySession } from "./src/lib/session-research-agent.ts";
import { CORE_ATTENTION_SESSIONS, isoWeekKey } from "./src/content/attention-intelligence.ts";
import {
  saveAttentionVerification,
  updateAttentionAttest,
  saveKpiProof,
  getKpiBySignature,
  saveCurriculumDraft,
  listCurriculumDrafts,
  getCurriculumDraft,
  publishCurriculumDraft,
  rejectCurriculumDraft,
  listPublishedCurriculum,
  saveTollPayment,
  getTollBySignature,
  getTollStats,
} from "./src/db/memory-store.ts";
import { getMarketPulse } from "./src/lib/market-pulse.ts";
import {
  buildGrantEnergyTransaction,
  buildRewardTransaction,
  economyReady,
} from "./src/lib/economy-server.ts";
import { listAttentionForUid, getKpiByWallet } from "./src/db/memory-store.ts";
import { KPI_BCC_REWARD, KPI_ENERGY_BPS } from "./src/lib/economy-rewards.ts";
import {
  TOLL_SKUS,
  getTollSku,
  tollPriceMicroUsdc,
  resolveTollEnv,
} from "./src/lib/toll-catalog.ts";
import { verifyUsdcTollTransfer, entitlementFromSku } from "./src/lib/toll-verify.ts";

const SERVER_STARTED_AT = Date.now();

function curriculumAdminWallets(): Set<string> {
  const raw = process.env.CURRICULUM_ADMIN_WALLETS || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

function isCurriculumAdmin(walletAddress?: string): boolean {
  if (!walletAddress) return false;
  const allow = curriculumAdminWallets();
  // Fail closed unless explicitly opened for local labs.
  if (allow.size === 0) {
    return process.env.DEV_OPEN_ADMIN === "1" && process.env.NODE_ENV !== "production";
  }
  return allow.has(walletAddress);
}

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
      const allowDemo =
        req.body?.demoUnsigned === true &&
        process.env.NODE_ENV !== "production" &&
        process.env.ALLOW_DEMO_UNSIGNED === "1";

      if (!walletAddress || (!signature && !allowDemo)) {
        return res.status(400).json({ error: "walletAddress and signature required" });
      }

      // Always consume server challenge — never trust client message alone in real login.
      const expectedMessage = consumeChallenge(walletAddress);
      if (!allowDemo && !expectedMessage) {
        return res.status(400).json({ error: "Challenge expired — request a new one" });
      }
      void messageOverride;

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

  /**
   * The Void — completely anonymous asks.
   * Proof: these routes REJECT Authorization; DB has no identity columns.
   */
  const rejectVoidAuth = (req: express.Request, res: express.Response): boolean => {
    if (req.headers.authorization || req.headers['x-wallet-token']) {
      res.status(400).json({
        error:
          'Void refuses identity. Remove Authorization / wallet token — anonymity is enforced, not optional.',
        proof: {
          authPolicy: 'reject-if-authorization-present',
          forbiddenFields: VOID_FORBIDDEN_FIELDS,
        },
      });
      return true;
    }
    return false;
  };

  const verifyVoidPow = (body: string, nonce: string, contentHash: string): boolean => {
    const expected = crypto.createHash('sha256').update(body.trim()).digest('hex');
    if (expected !== contentHash) return false;
    const work = crypto.createHash('sha256').update(`${body.trim()}:${nonce}`).digest('hex');
    return work.startsWith('000') || work.startsWith('00'); // accept light difficulty
  };

  app.get('/api/void/manifest', async (_req, res) => {
    res.json({
      name: 'The Void',
      claim:
        'Posts are accepted only without Authorization. Schema stores no user_id, wallet, email, or IP.',
      endpoint: '/api/void/asks',
      storedFields: VOID_STORED_FIELDS,
      forbiddenFields: VOID_FORBIDDEN_FIELDS,
      authPolicy: 'reject-if-authorization-present',
      howToVerify: [
        'Inspect this manifest',
        'POST with Authorization → must get HTTP 400',
        'POST without Authorization → stored fields only',
        'Check src/db/schema.ts voidAsks — no identity columns',
      ],
    });
  });

  app.get('/api/void/asks', async (req, res) => {
    if (rejectVoidAuth(req, res)) return;
    try {
      await ensureVoidTables();
      res.json(await listVoidAsks(50));
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Void unavailable' });
    }
  });

  app.post('/api/void/asks', async (req, res) => {
    if (rejectVoidAuth(req, res)) return;
    try {
      const { body, contentHash, powNonce } = req.body || {};
      if (!body || typeof body !== 'string') {
        return res.status(400).json({ error: 'body required' });
      }
      const trimmed = body.trim();
      if (trimmed.length < 8 || trimmed.length > 2000) {
        return res.status(400).json({ error: 'body must be 8–2000 characters' });
      }
      if (!contentHash || !powNonce || !verifyVoidPow(trimmed, String(powNonce), contentHash)) {
        return res.status(400).json({ error: 'Invalid content hash or proof-of-work' });
      }
      const id = `void_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const row = await createVoidAsk(id, trimmed, contentHash);
      res.json({
        ...row,
        receipt: {
          postId: id,
          contentHash,
          powNonce: String(powNonce),
          authHeaderSent: false,
          walletTokenSent: false,
          storedFields: VOID_STORED_FIELDS,
          forbiddenFieldsAbsent: VOID_FORBIDDEN_FIELDS,
          serverMode: 'live',
          issuedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Void ask failed' });
    }
  });

  app.get('/api/void/asks/:id/replies', async (req, res) => {
    if (rejectVoidAuth(req, res)) return;
    try {
      res.json(await listVoidReplies(req.params.id));
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Void replies unavailable' });
    }
  });

  app.post('/api/void/asks/:id/replies', async (req, res) => {
    if (rejectVoidAuth(req, res)) return;
    try {
      const { body, contentHash, powNonce } = req.body || {};
      if (!body || typeof body !== 'string') {
        return res.status(400).json({ error: 'body required' });
      }
      const trimmed = body.trim();
      if (trimmed.length < 2 || trimmed.length > 1500) {
        return res.status(400).json({ error: 'reply must be 2–1500 characters' });
      }
      if (!contentHash || !powNonce || !verifyVoidPow(trimmed, String(powNonce), contentHash)) {
        return res.status(400).json({ error: 'Invalid content hash or proof-of-work' });
      }
      const id = `void_r_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const row = await createVoidReply(id, req.params.id, trimmed, contentHash);
      res.json({
        ...row,
        receipt: {
          postId: id,
          contentHash,
          powNonce: String(powNonce),
          authHeaderSent: false,
          walletTokenSent: false,
          storedFields: ['id', 'ask_id', 'body', 'content_hash', 'created_at'],
          forbiddenFieldsAbsent: VOID_FORBIDDEN_FIELDS,
          serverMode: 'live',
          issuedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Void reply failed' });
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

      let economyTx: string | undefined;
      if (economyReady()) {
        const grant = await buildRewardTransaction({
          walletAddress: wallet,
          bcc: KPI_BCC_REWARD,
          energyBps: KPI_ENERGY_BPS,
        });
        if (grant.ok) economyTx = grant.serialized;
      }

      res.json({
        ok: true,
        proof,
        solscan: `https://solscan.io/tx/${signature}?cluster=devnet`,
        economyTx,
        economyReady: economyReady(),
        rewards: { bcc: KPI_BCC_REWARD, energyBps: KPI_ENERGY_BPS },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "KPI verify failed" });
    }
  });

  /** Attention Toll catalog — 1¢ USDC micropayments */
  app.get("/api/toll/catalog", (_req, res) => {
    const env = resolveTollEnv();
    res.json({
      skus: TOLL_SKUS,
      usdcMint: env.usdcMint,
      treasury: env.treasury,
      configured: env.configured,
      unit: "micro_usdc",
      centMicroUsdc: 10_000,
      note: "Free forever: first Academy pass, claim_daily, basic reactor. Tolls accelerate / retry / list.",
    });
  });

  app.get("/api/toll/stats", (_req, res) => {
    res.json({ ok: true, ...getTollStats(), marketplaceFeeBps: 250 });
  });

  app.post("/api/toll/verify", requireWalletAuth, async (req: AuthRequest, res) => {
    try {
      const wallet = req.walletUser!.walletAddress;
      const signature = String(req.body?.signature || "").trim();
      const skuId = String(req.body?.sku || "").trim();
      const quantity = Math.max(1, Math.min(100, Number(req.body?.quantity) || 1));
      const practice = Boolean(req.body?.practice);

      const sku = getTollSku(skuId);
      if (!sku) return res.status(400).json({ error: "Unknown toll SKU" });
      if (!signature && !practice) {
        return res.status(400).json({ error: "signature required" });
      }

      const env = resolveTollEnv();
      const minAmount = tollPriceMicroUsdc(sku, quantity);
      const entitlement = entitlementFromSku(sku, quantity);

      if (practice) {
        if (process.env.NODE_ENV === "production" && env.configured) {
          return res.status(400).json({
            error: "Practice tolls disabled when treasury is configured in production",
          });
        }
        const practiceSig = signature || `practice_${sku.id}_${wallet}_${Date.now()}`;
        const existingPractice = getTollBySignature(practiceSig);
        if (existingPractice?.verified) {
          return res.json({
            ok: true,
            alreadyVerified: true,
            payment: existingPractice,
            entitlement,
            practice: true,
          });
        }
        const payment = saveTollPayment({
          id: `toll_${crypto.randomBytes(6).toString("hex")}`,
          uid: req.walletUser!.uid,
          walletAddress: wallet,
          signature: practiceSig,
          sku: sku.id,
          quantity,
          amountMicro: minAmount,
          priceCents: sku.priceCents * quantity,
          verified: true,
          slot: undefined,
        });
        return res.json({
          ok: true,
          payment,
          entitlement,
          practice: true,
          economyReady: economyReady(),
          solscan: null,
        });
      }

      if (!env.configured) {
        return res.status(400).json({
          error: "Toll treasury not configured — set VITE_TOLL_TREASURY or use practice:true in non-prod",
        });
      }

      const existing = getTollBySignature(signature);
      if (existing?.verified) {
        return res.json({
          ok: true,
          alreadyVerified: true,
          payment: existing,
          entitlement: entitlementFromSku(sku, existing.quantity),
          solscan: `https://solscan.io/tx/${signature}?cluster=devnet`,
        });
      }

      const check = await verifyUsdcTollTransfer({
        signature,
        expectedWallet: wallet,
        minAmountMicro: minAmount,
      });
      if (!check.ok) {
        return res.status(400).json({ ok: false, error: check.error });
      }

      const payment = saveTollPayment({
        id: `toll_${crypto.randomBytes(6).toString("hex")}`,
        uid: req.walletUser!.uid,
        walletAddress: wallet,
        signature,
        sku: sku.id,
        quantity,
        amountMicro: check.amount ?? minAmount,
        priceCents: sku.priceCents * quantity,
        verified: true,
        slot: check.slot != null ? String(check.slot) : undefined,
      });

      let economyTx: string | undefined;
      if (economyReady() && entitlement.energyBps > 0) {
        const grant = await buildGrantEnergyTransaction({
          walletAddress: wallet,
          energyBps: entitlement.energyBps,
        });
        if (grant.ok) economyTx = grant.serialized;
      }

      res.json({
        ok: true,
        payment,
        entitlement,
        economyTx,
        economyReady: economyReady(),
        solscan: `https://solscan.io/tx/${signature}?cluster=devnet`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Toll verify failed" });
    }
  });

  /** Liveness — process is up */
  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      uptimeSec: Math.floor((Date.now() - SERVER_STARTED_AT) / 1000),
      ts: new Date().toISOString(),
    });
  });

  /**
   * Farcaster Mini App webhook — accepts notification / event payloads.
   * Wire NEYNAR_WEBHOOK_SECRET + handlers when push notifs go live.
   * See docs/FARCASTER_GROWTH.md
   */
  app.post("/api/farcaster/webhook", (req, res) => {
    const event = typeof req.body?.event === "string" ? req.body.event : "unknown";
    console.info("[farcaster.webhook]", event, {
      keys: req.body && typeof req.body === "object" ? Object.keys(req.body) : [],
    });
    res.status(200).json({ ok: true, received: event });
  });

  /**
   * Growth loop ledger — Discover → Claim → Spark → Spread → Return.
   * File-backed connections graph (invite codes). See docs/COMMUNITY.md
   */
  app.post("/api/growth/event", async (req, res) => {
    try {
      const type = String(req.body?.type || "").trim();
      const allowed = ["land", "claim", "spread", "spark", "return"] as const;
      if (!(allowed as readonly string[]).includes(type)) {
        return res.status(400).json({ error: "invalid_type" });
      }
      const { ingestGrowthEvent } = await import("./src/lib/growth-network.ts");
      const result = await ingestGrowthEvent({
        type: type as (typeof allowed)[number],
        inviteCode: req.body?.inviteCode,
        actorCode: req.body?.actorCode,
        nonce: req.body?.nonce,
      });
      return res.json(result);
    } catch (error: any) {
      console.error("[growth.event]", error?.message || error);
      return res.status(500).json({ error: "growth_ingest_failed" });
    }
  });

  app.get("/api/growth/pulse", async (_req, res) => {
    try {
      const { getGrowthPulse } = await import("./src/lib/growth-network.ts");
      return res.json(await getGrowthPulse());
    } catch (error: any) {
      console.error("[growth.pulse]", error?.message || error);
      return res.status(500).json({ error: "growth_pulse_failed" });
    }
  });

  app.get("/api/growth/stats", async (req, res) => {
    try {
      const code = String(req.query?.code || "").trim();
      if (!code) return res.status(400).json({ error: "code_required" });
      const { getMemberGrowthStats } = await import("./src/lib/growth-network.ts");
      const stats = await getMemberGrowthStats(code);
      if (!stats) return res.status(400).json({ error: "invalid_code" });
      return res.json(stats);
    } catch (error: any) {
      console.error("[growth.stats]", error?.message || error);
      return res.status(500).json({ error: "growth_stats_failed" });
    }
  });

  /** Hearing Mode — neural Gemini TTS status */
  app.get("/api/hearing/voice", async (_req, res) => {
    const { neuralTtsReady, HEARING_VOICES } = await import("./src/lib/hearing/gemini-tts.ts");
    const { getGeminiApiKey } = await import("./src/lib/gemini-key.ts");
    const ready = neuralTtsReady();
    res.json({
      ready,
      voice: process.env.HEARING_VOICE?.trim() || HEARING_VOICES.guide,
      model: process.env.HEARING_TTS_MODEL?.trim() || "gemini-2.5-flash-preview-tts",
      hasKey: Boolean(getGeminiApiKey()),
    });
  });

  /**
   * Hearing Mode — synthesize warm neural speech (WAV).
   * Body: { text: string, style?: 'guide' | 'soft' | 'clear' }
   */
  app.post("/api/hearing/speak", async (req, res) => {
    try {
      const text = String(req.body?.text || "").trim();
      const styleRaw = String(req.body?.style || "guide");
      const style =
        styleRaw === "soft" || styleRaw === "clear" || styleRaw === "guide" ? styleRaw : "guide";
      if (!text) return res.status(400).json({ error: "text required" });
      if (text.length > 2800) return res.status(400).json({ error: "text too long" });

      const { synthesizeHearingSpeech, neuralTtsReady } = await import(
        "./src/lib/hearing/gemini-tts.ts"
      );
      if (!neuralTtsReady()) {
        return res.status(503).json({
          error: "neural_voice_unavailable",
          hint: "Set GEMINI_API_KEY or GENERATIVE_AI_API_KEY on the server.",
        });
      }

      const result = await synthesizeHearingSpeech(text, style);
      res.setHeader("Content-Type", "audio/wav");
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.setHeader("X-Hearing-Voice", result.voice);
      res.setHeader("X-Hearing-Model", result.model);
      res.setHeader("X-Hearing-Cached", result.cached ? "1" : "0");
      return res.send(result.wav);
    } catch (error: any) {
      console.error("[hearing.speak]", error?.message || error);
      return res.status(500).json({
        error: "tts_failed",
        detail: error?.message || "unknown",
      });
    }
  });

  /**
   * Readiness — settlement can co-sign when economy env is present.
   * 503 when mints/authority are set but authority fails to load (misconfig).
   * 200 with ready:false when bootstrap incomplete (practice mode OK).
   */
  app.get("/api/ready", async (_req, res) => {
    const bccMint = process.env.VITE_BCC_MINT || process.env.BCC_MINT || null;
    const cgtMint = process.env.VITE_CGT_MINT || process.env.CGT_MINT || null;
    const hasAuthorityEnv = Boolean(process.env.ECONOMY_AUTHORITY_SECRET);
    const ready = economyReady();
    const configured = Boolean(bccMint && cgtMint);
    const reasons: string[] = [];
    if (!bccMint || !cgtMint) reasons.push("mints_missing");
    if (!hasAuthorityEnv) reasons.push("authority_secret_missing");
    if (configured && hasAuthorityEnv && !ready) reasons.push("authority_load_failed");

    let postgres: "ok" | "skipped" | "error" = "skipped";
    if (process.env.SQL_HOST && process.env.SQL_DB_NAME) {
      try {
        const { createPool } = await import("./src/db/index.ts");
        const pool = createPool();
        await pool.query("select 1");
        await pool.end();
        postgres = "ok";
      } catch {
        postgres = "error";
        reasons.push("postgres_unreachable");
      }
    }

    const misconfigured = configured && hasAuthorityEnv && !ready;
    const body = {
      ok: !misconfigured && postgres !== "error",
      ready,
      configured,
      hasAuthority: hasAuthorityEnv && ready,
      postgres,
      reasons,
      ts: new Date().toISOString(),
    };
    if (misconfigured || postgres === "error") {
      return res.status(503).json(body);
    }
    res.json(body);
  });

  /** Short-lived ZK verify sessions: wallet → nullifierHash */
  const zkPendingVerify = new Map<
    string,
    { nullifierHash: string; mode: string; expiresAt: number }
  >();

  /** ZKPassport uniqueness verify — returns scoped nullifier hash (no PII). */
  app.post("/api/zk/verify", requireWalletAuth, async (req: AuthRequest, res) => {
    try {
      const wallet = req.walletUser!.walletAddress;
      const result = await verifyZkPassportPayload({
        walletAddress: wallet,
        uniqueIdentifier: req.body?.uniqueIdentifier,
        verified: req.body?.verified !== false,
        mode: req.body?.mode,
        proofs: req.body?.proofs,
        originalQuery: req.body?.originalQuery,
        queryResult: req.body?.queryResult,
      });
      if (!result.ok || !result.nullifierHash) {
        return res.status(400).json({ error: result.error || "ZK verify failed" });
      }
      const existing = await getZkBindingByNullifier(result.nullifierHash);
      if (existing && existing.walletAddress.toLowerCase() !== wallet.toLowerCase()) {
        return res.status(409).json({
          error: "This identity is already bound to another wallet",
          boundWallet: `${existing.walletAddress.slice(0, 4)}…${existing.walletAddress.slice(-4)}`,
        });
      }
      zkPendingVerify.set(wallet, {
        nullifierHash: result.nullifierHash,
        mode: result.mode,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });
      res.json({
        verified: true,
        nullifierHash: result.nullifierHash,
        mode: result.mode,
        scope: serverZkScope(),
        alreadyBound: Boolean(existing),
      });
    } catch (err: any) {
      console.error("zk verify", err);
      res.status(500).json({ error: err?.message || "ZK verify error" });
    }
  });

  /** Bind verified nullifier → wallet (once). */
  app.post("/api/zk/bind", requireWalletAuth, async (req: AuthRequest, res) => {
    try {
      const wallet = req.walletUser!.walletAddress;
      const pending = zkPendingVerify.get(wallet);
      const nullifierHash =
        (req.body?.nullifierHash as string) || pending?.nullifierHash;
      if (!nullifierHash) {
        return res.status(400).json({
          error: "No verified nullifier — complete /api/zk/verify first",
        });
      }
      if (pending && pending.expiresAt < Date.now()) {
        zkPendingVerify.delete(wallet);
        return res.status(400).json({ error: "ZK verify expired — prove again" });
      }
      if (pending && pending.nullifierHash !== nullifierHash) {
        return res.status(400).json({ error: "Nullifier mismatch with verify session" });
      }

      const byN = await getZkBindingByNullifier(nullifierHash);
      if (byN && byN.walletAddress.toLowerCase() !== wallet.toLowerCase()) {
        return res.status(409).json({
          error: "Nullifier already bound to another wallet",
        });
      }
      const byW = await getZkBindingByWallet(wallet);
      if (byW && byW.nullifierHash !== nullifierHash) {
        return res.status(409).json({
          error: "Wallet already bound to a different identity",
        });
      }

      const now = new Date().toISOString();
      const [badgePda] = getSoulboundBadgePda(nullifierHash);
      const row = await upsertZkBinding({
        nullifierHash,
        walletAddress: wallet,
        zkProvider: "zkpassport",
        verifiedAt: byN?.verifiedAt || now,
        boundAt: byN?.boundAt || now,
        mintAddress: byN?.mintAddress,
        mintSignature: byN?.mintSignature,
        badgePda: byN?.badgePda || badgePda.toBase58(),
        soulboundMinted: byN?.soulboundMinted || false,
      });
      zkPendingVerify.delete(wallet);
      res.json({
        bound: true,
        nullifierHash: row.nullifierHash,
        mintable: !row.soulboundMinted,
        soulboundMinted: row.soulboundMinted,
        badgePda: row.badgePda,
        zkProvider: row.zkProvider,
      });
    } catch (err: any) {
      console.error("zk bind", err);
      res.status(500).json({ error: err?.message || "ZK bind error" });
    }
  });

  app.get("/api/zk/status", requireWalletAuth, async (req: AuthRequest, res) => {
    try {
      const wallet = req.walletUser!.walletAddress;
      const row = await getZkBindingByWallet(wallet);
      const pending = zkPendingVerify.get(wallet);
      res.json({
        bound: Boolean(row),
        mintable: Boolean(row && !row.soulboundMinted),
        soulboundMinted: Boolean(row?.soulboundMinted),
        nullifierHash: row?.nullifierHash,
        mintAddress: row?.mintAddress,
        mintSignature: row?.mintSignature,
        badgePda: row?.badgePda,
        verifiedAt: row?.verifiedAt,
        zkProvider: row?.zkProvider,
        pendingVerify: Boolean(pending && pending.expiresAt > Date.now()),
        devMode: serverZkDevMode(),
        scope: serverZkScope(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "ZK status error" });
    }
  });

  /** Mint Token-2022 NonTransferable soulbound badge (authority-assisted when configured). */
  app.post("/api/zk/mint", requireWalletAuth, async (req: AuthRequest, res) => {
    try {
      const wallet = req.walletUser!.walletAddress;
      const row = await getZkBindingByWallet(wallet);
      if (!row) {
        return res.status(400).json({
          error: "Bind ZKPassport identity before minting soulbound reputation",
        });
      }
      if (row.soulboundMinted && row.mintAddress) {
        return res.json({
          alreadyMinted: true,
          mintAddress: row.mintAddress,
          mintSignature: row.mintSignature,
          badgePda: row.badgePda,
          mode: "existing",
        });
      }

      const owner = new PublicKey(wallet);
      const authority = loadEconomyAuthorityFromEnv();
      let mintResult;
      let mode: string;

      if (authority) {
        try {
          const connection = new Connection(
            process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
            "confirmed"
          );
          mintResult = await mintSoulboundToken2022({
            connection,
            payer: authority,
            owner,
            nullifierHash: row.nullifierHash,
          });
          mode = "token2022";
        } catch (mintErr: any) {
          console.warn("Token-2022 mint failed, recording placeholder", mintErr?.message);
          mintResult = recordSoulboundPlaceholder(row.nullifierHash, wallet);
          mode = "recorded";
        }
      } else {
        mintResult = recordSoulboundPlaceholder(row.nullifierHash, wallet);
        mode = "recorded";
      }

      const updated = await markZkMinted(row.nullifierHash, {
        mintAddress: mintResult.mintAddress,
        mintSignature: mintResult.mintSignature,
        badgePda: mintResult.badgePda,
      });

      res.json({
        soulboundMinted: true,
        mintAddress: mintResult.mintAddress,
        mintSignature: mintResult.mintSignature,
        badgePda: mintResult.badgePda,
        ownerAta: mintResult.ownerAta,
        mode,
        nonTransferable: mode === "token2022",
        note:
          mode === "token2022"
            ? "Soulbound · ZKPassport-bound · Token-2022 NonTransferable"
            : "Soulbound record gated by ZKPassport — Token-2022 mint pending ECONOMY_AUTHORITY_SECRET / SOL",
        binding: updated,
      });
    } catch (err: any) {
      console.error("zk mint", err);
      res.status(500).json({ error: err?.message || "ZK mint error" });
    }
  });

  /** Status of on-chain economy authority + mints */
  app.get("/api/economy/status", (_req, res) => {
    const bccMint = process.env.VITE_BCC_MINT || process.env.BCC_MINT || null;
    const cgtMint = process.env.VITE_CGT_MINT || process.env.CGT_MINT || null;
    const hasAuthority = Boolean(process.env.ECONOMY_AUTHORITY_SECRET);
    const configured = Boolean(bccMint && cgtMint);
    const ready = economyReady();
    const reasons: string[] = [];
    if (!bccMint || !cgtMint) {
      reasons.push("Missing VITE_BCC_MINT / VITE_CGT_MINT — run npx tsx scripts/devnet-bootstrap.ts");
    }
    if (!hasAuthority) {
      reasons.push("Missing ECONOMY_AUTHORITY_SECRET (server-only base64 keypair)");
    }
    if (configured && hasAuthority && !ready) {
      reasons.push("Economy configured but authority key failed to load");
    }
    res.json({
      ready,
      configured,
      hasAuthority,
      programId: process.env.VITE_ECONOMY_PROGRAM_ID || "AS7E1nsKf3VJGfQPyU5Ekz9iJBNGzZ5sT8P6mGqzbqpZ",
      bccMint,
      cgtMint,
      reasons,
      bootstrapHint:
        "cd culture-economy && anchor deploy --provider.cluster devnet && cd .. && npx tsx scripts/devnet-bootstrap.ts",
    });
  });

  /**
   * After Academy / PoA pass — authority co-signs grant_energy (+ optional BCC).
   * Client must sign as fee payer and send the returned base64 tx.
   */
  app.post("/api/economy/grant-energy", requireWalletAuth, async (req: AuthRequest, res) => {
    try {
      const wallet = req.walletUser!.walletAddress;
      const uid = req.walletUser!.uid;
      const energyBps = Math.min(5000, Math.max(1, Number(req.body?.energyBps) || 2000));
      // Cap BCC per grant — sessions never need uncapped client-chosen mints
      const bccReward = Math.min(500, Math.max(0, Number(req.body?.bccReward) || 0));
      const verificationId = req.body?.verificationId as string | undefined;

      const recent = listAttentionForUid(uid).filter((r) => r.passed);
      const kpiOk = getKpiByWallet(wallet).length > 0;
      const hasProof =
        Boolean(verificationId && recent.some((r) => r.id === verificationId)) ||
        recent.length > 0 ||
        kpiOk;

      if (!hasProof) {
        return res.status(400).json({
          ok: false,
          error: "No verified Academy/KPI proof for this wallet — complete a session first",
        });
      }

      const result = await buildGrantEnergyTransaction({
        walletAddress: wallet,
        energyBps,
        bccReward,
        ensurePlayer: true,
      });

      if (!result.ok) {
        return res.status(503).json(result);
      }

      res.json({
        ok: true,
        serialized: result.serialized,
        energyBps: result.energyBps,
        bccReward: result.bccReward,
        note: "Partial-signed by economy authority — wallet must sign and send",
      });
    } catch (error: any) {
      console.error("grant-energy failed:", error);
      res.status(500).json({ error: error.message || "grant-energy failed" });
    }
  });

  /** Mint BCC/CGT / energy after mission or wheel (requires prior PoA or KPI). */
  app.post("/api/economy/reward", requireWalletAuth, async (req: AuthRequest, res) => {
    try {
      const wallet = req.walletUser!.walletAddress;
      const uid = req.walletUser!.uid;
      const bcc = Math.max(0, Number(req.body?.bcc) || 0);
      const cgt = Math.max(0, Number(req.body?.cgt) || 0);
      const energyBps = Math.max(0, Number(req.body?.energyBps) || 0);
      const reason = String(req.body?.reason || "reward");

      const recent = listAttentionForUid(uid).filter((r) => r.passed);
      const kpiOk = getKpiByWallet(wallet).length > 0;
      if (reason === "bootstrap" && process.env.NODE_ENV === "production") {
        return res.status(400).json({
          ok: false,
          error: "bootstrap rewards disabled in production",
        });
      }
      if (recent.length === 0 && !kpiOk && reason !== "bootstrap") {
        return res.status(400).json({
          ok: false,
          error: "Rewards require a prior Academy pass or KPI proof",
        });
      }

      // Cap per-call to limit abuse
      if (bcc > 500 || cgt > 200 || energyBps > 3000) {
        return res.status(400).json({ ok: false, error: "Reward exceeds per-call cap" });
      }

      const result = await buildRewardTransaction({
        walletAddress: wallet,
        bcc,
        cgt,
        energyBps,
      });

      if (!result.ok) {
        return res.status(503).json(result);
      }

      res.json({ ok: true, serialized: result.serialized, reason });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "reward failed" });
    }
  });

  app.get("/api/curriculum", async (req, res) => {
    let wallet: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const user = verifyWalletToken(authHeader.slice(7));
      wallet = user?.walletAddress;
    }
    const { hasGeminiApiKey } = await import("./src/lib/gemini-key.ts");
    const geminiConfigured = hasGeminiApiKey();
    res.json({
      core: CORE_ATTENTION_SESSIONS,
      published: listPublishedCurriculum(),
      isAdmin: isCurriculumAdmin(wallet),
      geminiConfigured,
    });
  });

  app.get("/api/curriculum/drafts", requireWalletAuth, (req: AuthRequest, res) => {
    if (!isCurriculumAdmin(req.walletUser!.walletAddress)) {
      return res.status(403).json({ error: "Curriculum admin only" });
    }
    res.json({ drafts: listCurriculumDrafts() });
  });

  app.post("/api/curriculum/research", requireWalletAuth, async (req: AuthRequest, res) => {
    try {
      if (!isCurriculumAdmin(req.walletUser!.walletAddress)) {
        return res.status(403).json({ error: "Curriculum admin only" });
      }
      const published = listPublishedCurriculum();
      const drafts = listCurriculumDrafts();
      const existingTitles = [
        ...published.map((s) => s.title),
        ...drafts.map((s) => s.title),
      ];
      let scienceContext = '';
      try {
        const { getScienceSignalDesk, signalDeskAsContext } = await import(
          './src/lib/science-signal.ts'
        );
        const desk = await getScienceSignalDesk();
        scienceContext = signalDeskAsContext(desk);
      } catch {
        // optional
      }
      const draft = await researchWeeklySession({ existingTitles, scienceContext });
      const stored = saveCurriculumDraft(draft);
      res.json({ draft: stored });
    } catch (error: any) {
      console.error("Curriculum research failed:", error);
      res.status(500).json({ error: error.message || "Curriculum research failed" });
    }
  });

  app.post("/api/curriculum/publish", requireWalletAuth, (req: AuthRequest, res) => {
    if (!isCurriculumAdmin(req.walletUser!.walletAddress)) {
      return res.status(403).json({ error: "Curriculum admin only" });
    }
    const draftId = String(req.body?.draftId || "").trim();
    if (!draftId) return res.status(400).json({ error: "draftId required" });
    if (!getCurriculumDraft(draftId)) {
      return res.status(404).json({ error: "Draft not found" });
    }
    const published = publishCurriculumDraft(draftId, isoWeekKey());
    res.json({ published });
  });

  app.post("/api/curriculum/reject", requireWalletAuth, (req: AuthRequest, res) => {
    if (!isCurriculumAdmin(req.walletUser!.walletAddress)) {
      return res.status(403).json({ error: "Curriculum admin only" });
    }
    const draftId = String(req.body?.draftId || "").trim();
    if (!draftId) return res.status(400).json({ error: "draftId required" });
    const ok = rejectCurriculumDraft(draftId);
    if (!ok) return res.status(404).json({ error: "Draft not found" });
    res.json({ ok: true });
  });

  // Live Solana market pulse via OKX OnchainOS CLI (read-only, cached 60s)
  app.get("/api/signal/desk", async (_req, res) => {
    try {
      const { getScienceSignalDesk } = await import("./src/lib/science-signal.ts");
      const desk = await getScienceSignalDesk();
      res.json(desk);
    } catch (err: any) {
      console.error("signal desk error", err);
      res.status(503).json({
        available: false,
        fetchedAt: new Date().toISOString(),
        mode: "seeded-pulse",
        signals: [],
        note: err?.message || "Signal desk failed",
      });
    }
  });

  app.get("/api/market/pulse", async (_req, res) => {
    try {
      const pulse = await getMarketPulse();
      if (!pulse.available) {
        return res.status(503).json(pulse);
      }
      res.json(pulse);
    } catch (err) {
      console.error("market pulse error", err);
      res.status(503).json({
        available: false,
        reason: "Market pulse failed",
        source: "okx-onchainos",
        fetchedAt: new Date().toISOString(),
      });
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
