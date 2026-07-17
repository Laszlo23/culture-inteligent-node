/**
 * OKX OnchainOS market pulse — spawns the local `onchainos` CLI with fixed args.
 * Read-only; no user-controlled shell input.
 */
import { spawn } from "child_process";

export const WSOL_MINT = "So11111111111111111111111111111111111111112";

export type MarketPulseHotToken = {
  symbol: string;
  address: string;
  priceUsd?: number;
  name?: string;
};

export type MarketPulseOk = {
  available: true;
  sol: { priceUsd: number; change24h?: number };
  hot: MarketPulseHotToken[];
  source: "okx-onchainos";
  fetchedAt: string;
};

export type MarketPulseUnavailable = {
  available: false;
  reason: string;
  source: "okx-onchainos";
  fetchedAt: string;
};

export type MarketPulseResult = MarketPulseOk | MarketPulseUnavailable;

const CACHE_TTL_MS = 60_000;
const CLI_TIMEOUT_MS = 8_000;

let cache: { at: number; value: MarketPulseResult } | null = null;

function onchainosBin(): string {
  return process.env.ONCHAINOS_BIN?.trim() || "onchainos";
}

function runOnchainos(args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const child = spawn(onchainosBin(), args, {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
    }, CLI_TIMEOUT_MS);
    child.stdout.on("data", (d) => {
      stdout += String(d);
    });
    child.stderr.on("data", (d) => {
      stderr += String(d);
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: err.message, code: 127 });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });
  });
}

function extractJson(raw: string): unknown | null {
  const text = raw.trim();
  if (!text) return null;
  // CLI may print a human line before JSON
  const start = text.indexOf("{");
  const arrStart = text.indexOf("[");
  let slice = text;
  if (start >= 0 && (arrStart < 0 || start <= arrStart)) {
    slice = text.slice(start);
  } else if (arrStart >= 0) {
    slice = text.slice(arrStart);
  }
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

function unavailable(reason: string): MarketPulseUnavailable {
  return {
    available: false,
    reason,
    source: "okx-onchainos",
    fetchedAt: new Date().toISOString(),
  };
}

function parsePricePayload(json: unknown): number | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;
  if (root.confirming === true) return null;
  if (Array.isArray(root.notifications) && root.notifications.length > 0 && !root.data && !root.price) {
    return null;
  }
  const data = (root.data ?? root) as Record<string, unknown>;
  // data may be array of price rows
  if (Array.isArray(data)) {
    const first = data[0] as Record<string, unknown> | undefined;
    const p = first?.price ?? first?.priceUsd;
    const n = Number(p);
    return Number.isFinite(n) ? n : null;
  }
  if (Array.isArray(root.data)) {
    const first = (root.data as Record<string, unknown>[])[0];
    const p = first?.price ?? first?.priceUsd;
    const n = Number(p);
    return Number.isFinite(n) ? n : null;
  }
  const price = data.price ?? data.priceUsd ?? root.price;
  const n = Number(price);
  return Number.isFinite(n) ? n : null;
}

function sanitizeSymbol(raw: unknown): string {
  const s = String(raw ?? "?").slice(0, 24);
  // strip control chars
  return s.replace(/[\u0000-\u001f\u007f]/g, "") || "?";
}

function parseHotTokens(json: unknown): MarketPulseHotToken[] {
  if (!json || typeof json !== "object") return [];
  const root = json as Record<string, unknown>;
  if (root.confirming === true) return [];
  let rows: unknown[] = [];
  if (Array.isArray(root.data)) rows = root.data;
  else if (Array.isArray(root)) rows = root;
  else if (root.data && typeof root.data === "object") {
    const d = root.data as Record<string, unknown>;
    if (Array.isArray(d.list)) rows = d.list;
    else if (Array.isArray(d.tokens)) rows = d.tokens;
    else if (Array.isArray(d.items)) rows = d.items;
  }
  const out: MarketPulseHotToken[] = [];
  for (const row of rows.slice(0, 5)) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const address = String(
      r.tokenContractAddress ?? r.address ?? r.tokenAddress ?? r.mint ?? ""
    ).trim();
    if (!address) continue;
    const priceRaw = r.price ?? r.priceUsd ?? r.lastPrice;
    const priceUsd = priceRaw != null ? Number(priceRaw) : undefined;
    out.push({
      symbol: sanitizeSymbol(r.symbol ?? r.tokenSymbol ?? r.name),
      address: address.slice(0, 64),
      name: sanitizeSymbol(r.name ?? r.tokenName ?? "").slice(0, 48) || undefined,
      priceUsd: priceUsd != null && Number.isFinite(priceUsd) ? priceUsd : undefined,
    });
  }
  return out;
}

function quotaOrSessionReason(stdout: string, stderr: string): string | null {
  const blob = `${stdout}\n${stderr}`;
  if (/Session expired/i.test(blob) || /wallet login/i.test(blob)) {
    return "OnchainOS session expired — market pulse unavailable until wallet login on the host";
  }
  const json = extractJson(stdout);
  if (json && typeof json === "object") {
    const root = json as Record<string, unknown>;
    if (root.confirming === true || (Array.isArray(root.notifications) && root.notifications.length)) {
      const codes = Array.isArray(root.notifications)
        ? (root.notifications as { code?: string }[]).map((n) => n.code).filter(Boolean)
        : [];
      if (codes.some((c) => String(c).includes("OVER_QUOTA"))) {
        return "OKX Market API free quota exhausted — pulse degraded";
      }
      return "OKX Market API requires confirmation or payment — pulse degraded";
    }
  }
  return null;
}

async function fetchFreshPulse(): Promise<MarketPulseResult> {
  const priceRun = await runOnchainos([
    "market",
    "price",
    "--address",
    WSOL_MINT,
    "--chain",
    "solana",
  ]);

  if (priceRun.code === 127 || /ENOENT|not found/i.test(priceRun.stderr)) {
    return unavailable("onchainos binary not found (set ONCHAINOS_BIN or install CLI)");
  }

  const blocked = quotaOrSessionReason(priceRun.stdout, priceRun.stderr);
  if (blocked) return unavailable(blocked);

  const priceJson = extractJson(priceRun.stdout);
  const priceUsd = parsePricePayload(priceJson);
  if (priceUsd == null) {
    return unavailable(
      priceRun.stderr.trim() ||
        priceRun.stdout.trim().slice(0, 200) ||
        "Failed to parse SOL price from onchainos"
    );
  }

  const hotRun = await runOnchainos([
    "token",
    "hot-tokens",
    "--chain",
    "solana",
    "--rank-by",
    "5",
    "--time-frame",
    "4",
    "--limit",
    "5",
  ]);

  let hot: MarketPulseHotToken[] = [];
  const hotBlocked = quotaOrSessionReason(hotRun.stdout, hotRun.stderr);
  if (!hotBlocked) {
    hot = parseHotTokens(extractJson(hotRun.stdout));
  }

  return {
    available: true,
    sol: { priceUsd },
    hot,
    source: "okx-onchainos",
    fetchedAt: new Date().toISOString(),
  };
}

export async function getMarketPulse(opts?: { bypassCache?: boolean }): Promise<MarketPulseResult> {
  const now = Date.now();
  if (!opts?.bypassCache && cache && now - cache.at < CACHE_TTL_MS) {
    return cache.value;
  }
  const value = await fetchFreshPulse();
  cache = { at: now, value };
  return value;
}
