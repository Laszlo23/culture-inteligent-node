/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Shield, FileText, Scale, ArrowLeft, ChevronDown } from 'lucide-react';

export type LegalPageId = 'legal-privacy' | 'legal-terms' | 'legal-disclaimer';

interface LegalPagesProps {
  page: LegalPageId;
  onBack: () => void;
}

type LegalDoc = {
  title: string;
  icon: React.ReactNode;
  updated: string;
  /** One plain-language lead — not a second essay */
  lead: string;
  sections: { h: string; p: string }[];
};

const COPY: Record<LegalPageId, LegalDoc> = {
  'legal-privacy': {
    title: 'Privacy Policy',
    icon: <Shield className="w-5 h-5 text-cyan-400" />,
    updated: 'July 2026',
    lead: 'We keep facility progress in your browser, use wallet addresses for Devnet proofs, and never ask The Void for your identity.',
    sections: [
      {
        h: 'What we store locally',
        p: 'Facility progress, wallet session metadata, and Proof-of-Attention records may be stored in your browser (localStorage). Clearing site data removes them.',
      },
      {
        h: 'Wallet addresses',
        p: 'When you connect Phantom or a local Devnet keypair, your public address is used for login, KPI verification, and optional memo attestations on Solana Devnet.',
      },
      {
        h: 'Server processing',
        p: 'Confidential Proof of Attention pass/fail uses the Arcium threshold policy (encrypted score + artifact length bucket). Optional AI coaching (e.g. Gemini) may receive session artifacts for narrative feedback only — it does not gate energy grants. Do not submit personal data you do not want processed.',
      },
      {
        h: 'The Void (anonymous asks)',
        p: 'The Void accepts questions only without Authorization or wallet tokens — the API returns HTTP 400 if identity headers are present. Stored fields are limited to id, body, content hash, timestamps, and reply counts. No user_id, wallet, email, or IP columns exist on void_asks. Verify via GET /api/void/manifest. Do not put information in The Void that could identify you in the text itself.',
      },
      {
        h: 'Contact',
        p: 'Questions: support via the in-app Feedback panel or the Building Culture ecosystem sites linked from Ecosystem Hub.',
      },
    ],
  },
  'legal-terms': {
    title: 'Terms of Use',
    icon: <FileText className="w-5 h-5 text-cyan-400" />,
    updated: 'July 2026',
    lead: 'This is an experimental Solana Devnet demo. Simulated features are game-layer only — not financial products.',
    sections: [
      {
        h: 'Devnet demo product',
        p: 'Building Culture Node is an experimental Solana Devnet application. Features marked Simulated are game-layer only and are not financial products.',
      },
      {
        h: 'No investment advice',
        p: 'Credits (CP/BCC), CGT playground balances, and NFT-style items in the UI are not transferable mainnet assets unless explicitly launched later as SPL tokens.',
      },
      {
        h: 'Acceptable use',
        p: 'Do not abuse faucets, spam verification endpoints, or attempt to forge on-chain proofs. Jury and community use should follow Superteam Earn and Solana Devnet norms.',
      },
      {
        h: 'Availability',
        p: 'The service may change or go offline without notice. You use it as-is during the grant / demo period.',
      },
    ],
  },
  'legal-disclaimer': {
    title: 'Disclaimer',
    icon: <Scale className="w-5 h-5 text-cyan-400" />,
    updated: 'July 2026',
    lead: 'Some flows hit Solana Devnet for real; cosmetics and practice loops stay client-side. Always verify signatures yourself.',
    sections: [
      {
        h: 'What is real on-chain (Devnet)',
        p: 'Wallet connect, Devnet SOL faucet, KPI 0.05 SOL transfer, PoA memo attestations, and — when bootstrapped — the culture_economy program: Player PDA energy, SPL BCC/CGT mints, swap_bcc_to_cgt, claim_daily, PDA miner assets, listing escrow, and a 2.5% marketplace fee to fee_treasury on buy_miner. See docs/SOLANA_ECONOMY.md.',
      },
      {
        h: 'Attention Toll (Penny Protocol)',
        p: 'Optional ~1¢ SPL USDC micropayments to VITE_TOLL_TREASURY for Spark Refills, Academy Retakes, List Slots, and packs. When the treasury env is unset, the shop may credit practice entitlements for demo only. Devnet USDC is not mainnet cash; printer stats and annual extrapolations are models, not revenue guarantees or investment advice.',
      },
      {
        h: 'What remains client-side',
        p: 'Room unlock cosmetics, hardware/AI worker UI, Lucky Wheel presentation, guild selection, practice missions labeled [Practice], and NFT gallery CSS mining loops. If economy mints are not configured, energy/BCC fall back locally with an honesty log.',
      },
      {
        h: 'AI verification',
        p: 'Attention agent verification works with a local heuristic if GEMINI_API_KEY is not set. Adding a Gemini key later improves scoring quality; it is not required to use the Academy.',
      },
      {
        h: 'No warranties',
        p: 'We provide no warranty of fitness, uptime, or future mainnet launch. Always verify signatures yourself on a block explorer.',
      },
    ],
  },
};

export default function LegalPages({ page, onBack }: LegalPagesProps) {
  const doc = COPY[page];
  const [openId, setOpenId] = useState<string | null>(doc.sections[0]?.h ?? null);

  useEffect(() => {
    setOpenId(COPY[page].sections[0]?.h ?? null);
  }, [page]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-cyan-400 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to map
      </button>

      <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          {doc.icon}
          <h2 className="text-lg font-bold text-white tracking-tight">{doc.title}</h2>
        </div>
        <p className="font-mono text-[9px] tracking-widest uppercase text-slate-600 mb-3">
          Building Culture · Updated {doc.updated} · Devnet
        </p>
        <p className="text-sm leading-relaxed text-slate-300 mb-6">{doc.lead}</p>

        <div className="space-y-2" role="list">
          {doc.sections.map((s) => {
            const open = openId === s.h;
            return (
              <div
                key={s.h}
                role="listitem"
                className="rounded-xl border border-white/8 bg-black/30 overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : s.h)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer hover:bg-white/[0.03]"
                >
                  <h3 className="text-xs font-bold text-slate-200">{s.h}</h3>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                      open ? 'rotate-180 text-cyan-400/80' : ''
                    }`}
                  />
                </button>
                {open && (
                  <p className="border-t border-white/5 px-4 py-3 text-[12px] text-slate-400 font-sans leading-relaxed">
                    {s.p}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
