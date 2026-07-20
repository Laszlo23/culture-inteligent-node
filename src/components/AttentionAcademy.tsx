/**
 * Attention Academy — catalog-driven Sessions 1–8 + weekly published + admin curriculum lab.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Lock,
  Check,
  Award,
  ShieldCheck,
  Clock,
  ArrowRight,
  Map,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { GameState, ProofOfAttention, SoulboundReputation } from '../types';
import SoulboundRitualOverlay from './SoulboundRitualOverlay';
import {
  CORE_ATTENTION_SESSIONS,
  FIRST_SPARK_SESSION,
  HOOK_MIRROR_SESSION,
  AttentionSession,
  SessionQuizItem,
  mergeCatalog,
} from '../content/attention-intelligence';
import AttentionSessionPlayer from './AttentionSessionPlayer';
import CurriculumLabPanel from './CurriculumLabPanel';
import {
  verifyAttentionSession,
  ensureWalletApiSession,
  getWalletToken,
  fetchCurriculum,
  attestAttentionProof,
} from '../lib/api.ts';
import { Keypair } from '@solana/web3.js';
import { sendAttentionProofMemo, type AttentionProofKind } from '../lib/poa-chain';
import { markEnergySurge, CinematicBackdrop } from './fx';
import {
  verifyAttentionWithArcium,
  type ArciumThresholdResult,
} from '../lib/arcium-poa';
import {
  completeFirstRitual,
  isFirstRitualPending,
} from '../lib/first-run';
import { spendSparkCredit } from './AttentionTollShop';
import ZenDecisionGate from './ZenDecisionGate';
import {
  getZenDecision,
  isZenMode,
  saveZenDecision,
  zenDecisionPrompt,
  zenMachineChosenScript,
  zenMindChosenScript,
  type LearningDecision,
} from '../lib/zen-duality';
import { setZenDecisionHandler } from '../lib/hearing/zen-bridge';
import { useHearing } from '../lib/hearing/context';
import { track } from '../lib/attention-metrics';
import { inviteCodeFromWallet, reportGrowthEvent } from '../lib/growth-loop';
import {
  orderCoreSessions,
  PATH_LABELS,
  readGrowthPath,
  type GrowthPathId,
} from '../lib/growth-path';
import { friendlyFailureDetail, thrownToUserError } from '../lib/user-errors';
import PersonalHookGate from './PersonalHookGate';

interface AttentionAcademyProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  onOpenRoadmap?: () => void;
  onFirstRitualComplete?: (detail?: { from: number; to: number }) => void;
  /** Hook Mirror (or other awareness session) sealed — hand off to loop */
  onAwarenessSessionComplete?: (sessionId: string) => void;
  /** Open Treasury Attention Toll shop (e.g. academy_retake) */
  onOpenTollShop?: (sku?: 'academy_retake' | 'spark_refill') => void;
  /** Request facility Focus Mode (dim chrome) */
  onRequestFocus?: (on: boolean) => void;
  /** Zen Mind/Machine chosen — return to Loop Stage */
  onZenDecision?: (decision: LearningDecision) => void;
}

export default function AttentionAcademy({
  state,
  setState,
  addLog,
  onOpenRoadmap,
  onFirstRitualComplete,
  onAwarenessSessionComplete,
  onOpenTollShop,
  onRequestFocus,
  onZenDecision,
}: AttentionAcademyProps) {
  const [published, setPublished] = useState<AttentionSession[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<string[]>(() => {
    const saved = localStorage.getItem('kronos_academy_completed');
    const raw: string[] = saved ? JSON.parse(saved) : [];
    const legacy: Record<string, string> = {
      s1: 'ai_s01',
      s2: 'ai_s02',
      s3: 'ai_s03',
      s4: 'ai_s04',
      s5: 'ai_s05',
    };
    return [...new Set(raw.map((id) => legacy[id] || id))];
  });
  const [activeSessionIdx, setActiveSessionIdx] = useState(0);
  const [exerciseReady, setExerciseReady] = useState(false);
  const [artifacts, setArtifacts] = useState('');
  const [justUpgraded, setJustUpgraded] = useState(false);
  const [fuelProofToast, setFuelProofToast] = useState(false);

  const [activeQuizQuestions, setActiveQuizQuestions] = useState<SessionQuizItem[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizState, setQuizState] = useState<'idle' | 'quiz' | 'passed' | 'failed'>('idle');
  const [grantRetry, setGrantRetry] = useState<{
    index: number;
    agent?: {
      verification: string;
      score: number;
      proof?: ProofOfAttention | null;
      verificationId?: string;
      arcium?: ArciumThresholdResult;
    };
  } | null>(null);
  const [isScanningOverlay, setIsScanningOverlay] = useState(false);
  const [agentVerifyMsg, setAgentVerifyMsg] = useState('');
  const [arciumStatus, setArciumStatus] = useState<{
    state: 'idle' | 'verifying' | 'passed' | 'failed';
    detail?: string;
    band?: number;
    mode?: ArciumThresholdResult['mode'];
  }>({ state: 'idle' });
  const [pendingAttestId, setPendingAttestId] = useState<string | null>(null);
  const [showSoulboundRitual, setShowSoulboundRitual] = useState(false);
  const [ritualWallet, setRitualWallet] = useState<{
    address: string;
    walletType: 'extension' | 'local';
    localKeypair: Keypair | null;
  } | null>(null);
  const [pendingSessionIdx, setPendingSessionIdx] = useState<number | null>(null);
  const [ritualPending, setRitualPending] = useState(() => isFirstRitualPending());
  const hearing = useHearing();
  const [zenModeOn, setZenModeOn] = useState(() => isZenMode());
  const [learningDecision, setLearningDecision] = useState<LearningDecision | null>(null);
  const zenPromptedRef = React.useRef<string | null>(null);
  const [growthPath, setGrowthPath] = useState<GrowthPathId | null>(() => readGrowthPath());
  const [showPathGate, setShowPathGate] = useState(false);

  const catalog = useMemo(
    () => orderCoreSessions(mergeCatalog(published), growthPath),
    [published, growthPath]
  );

  /** Soft gate: Hook Mirror is recommended after First Spark but does not hard-lock the core series. */
  const isSessionLocked = useCallback(
    (idx: number) => {
      if (idx <= 0) return false;
      const session = catalog[idx];
      const prev = catalog[idx - 1];
      if (!session || !prev) return false;
      if (session.id === HOOK_MIRROR_SESSION.id) {
        return !completedSessions.includes(FIRST_SPARK_SESSION.id);
      }
      if (prev.id === HOOK_MIRROR_SESSION.id) {
        return !completedSessions.includes(FIRST_SPARK_SESSION.id);
      }
      return !completedSessions.includes(prev.id);
    },
    [catalog, completedSessions]
  );

  const refreshCurriculum = useCallback(async () => {
    try {
      const data = await fetchCurriculum();
      setPublished(data.published || []);
      setIsAdmin(!!data.isAdmin);
    } catch {
      setPublished([]);
    }
  }, []);

  useEffect(() => {
    void refreshCurriculum();
  }, [refreshCurriculum]);

  useEffect(() => {
    localStorage.setItem('kronos_academy_completed', JSON.stringify(completedSessions));
  }, [completedSessions]);

  useEffect(() => {
    if (ritualPending) {
      const sparkIdx = catalog.findIndex((s) => s.id === FIRST_SPARK_SESSION.id);
      if (sparkIdx >= 0 && !completedSessions.includes(FIRST_SPARK_SESSION.id)) {
        setActiveSessionIdx(sparkIdx);
        return;
      }
    }
    const nextIncompleteIdx = catalog.findIndex((s) => !completedSessions.includes(s.id));
    if (nextIncompleteIdx === -1) return;
    if (ritualPending) {
      setActiveSessionIdx(nextIncompleteIdx);
      return;
    }
    const current = catalog[activeSessionIdx];
    const currentDone = Boolean(current && completedSessions.includes(current.id));
    const isCurrentLocked = isSessionLocked(activeSessionIdx);
    // Advance past completed sessions so Zen → Hook Mirror self-chains
    if (currentDone || isCurrentLocked || activeSessionIdx >= catalog.length) {
      setActiveSessionIdx(nextIncompleteIdx);
    }
  }, [completedSessions, catalog, ritualPending, activeSessionIdx, isSessionLocked]);

  const onReadyChange = useCallback((ready: boolean, art: string) => {
    setExerciseReady(ready);
    setArtifacts(art);
  }, []);

  const activeSession = catalog[activeSessionIdx];
  const isMaster = CORE_ATTENTION_SESSIONS.every((s) => completedSessions.includes(s.id));
  const weekly = catalog.filter((s) => s.status === 'published');

  // Sync Zen decision with active session (duality break is per session)
  useEffect(() => {
    if (!activeSession) {
      setLearningDecision(null);
      return;
    }
    setLearningDecision(getZenDecision(activeSession.id));
    zenPromptedRef.current = null;
    setZenModeOn(isZenMode());
  }, [activeSession?.id]);

  const applyLearningDecision = useCallback(
    async (decision: LearningDecision) => {
      if (!activeSession) return;
      saveZenDecision(activeSession.id, decision);
      setLearningDecision(decision);
      track('zen_decision', { sessionId: activeSession.id, decision });
      if (decision === 'hold_knowledge') {
        addLog('Mind · knowledge held. Sit with it — fuel can wait.', 'system');
        if (hearing?.active && hearing.speakLine) {
          await hearing.speakLine(zenMindChosenScript());
        }
      } else {
        addLog('Machine · convert when ready. Neural Snap is unlocked for you.', 'success');
        if (hearing?.active && hearing.speakLine) {
          await hearing.speakLine(zenMachineChosenScript());
        }
        // On-chain intent receipt — you chose Machine (attention → fuel)
        void sendAttentionProofMemo({
          kind: 'zen_machine',
          parts: { session: activeSession.id },
        }).then((res) => {
          if ('signature' in res) {
            addLog(`Zen Machine choice on Devnet — ${res.solscan}`, 'success');
          }
        });
      }
      onZenDecision?.(decision);
    },
    [activeSession, addLog, hearing, onZenDecision]
  );

  const academyStartedRef = React.useRef<string | null>(null);

  // Full focus while an incomplete session is on screen
  useEffect(() => {
    if (!activeSession || completedSessions.includes(activeSession.id)) {
      onRequestFocus?.(false);
      return;
    }
    onRequestFocus?.(true);
    if (academyStartedRef.current !== activeSession.id) {
      academyStartedRef.current = activeSession.id;
      track('academy_start', { sessionId: activeSession.id, title: activeSession.title });
    }
    return () => onRequestFocus?.(false);
  }, [activeSession?.id, completedSessions, onRequestFocus, activeSession]);

  // Hearing Mode: announce Zen break when exercise becomes ready
  useEffect(() => {
    if (!exerciseReady || !activeSession || completedSessions.includes(activeSession.id)) return;
    if (!hearing?.active || !hearing.speakLine) return;
    if (learningDecision === 'convert_fuel') return;
    if (zenPromptedRef.current === activeSession.id) return;
    zenPromptedRef.current = activeSession.id;
    void hearing.speakLine(zenDecisionPrompt(activeSession.title));
  }, [
    exerciseReady,
    activeSession,
    completedSessions,
    hearing,
    learningDecision,
  ]);

  // Voice: Mind / Machine at the Zen gate
  useEffect(() => {
    if (!exerciseReady || !activeSession || completedSessions.includes(activeSession.id)) {
      setZenDecisionHandler(null);
      return;
    }
    setZenDecisionHandler(async (decision) => {
      await applyLearningDecision(decision);
      return true;
    });
    return () => setZenDecisionHandler(null);
  }, [exerciseReady, activeSession, completedSessions, applyLearningDecision]);

  const recommendedIdx = useMemo(() => {
    if (ritualPending) {
      const sparkIdx = catalog.findIndex(
        (s) => s.id === FIRST_SPARK_SESSION.id && !completedSessions.includes(s.id)
      );
      if (sparkIdx >= 0) return sparkIdx;
    }
    // Soft gate: Hook Mirror next after First Spark
    const sparkDone = completedSessions.includes(FIRST_SPARK_SESSION.id);
    const mirrorDone = completedSessions.includes(HOOK_MIRROR_SESSION.id);
    if (sparkDone && !mirrorDone) {
      const mirrorIdx = catalog.findIndex((s) => s.id === HOOK_MIRROR_SESSION.id);
      if (mirrorIdx >= 0) return mirrorIdx;
    }
    const next = catalog.findIndex((s) => !completedSessions.includes(s.id));
    return next === -1 ? null : next;
  }, [catalog, completedSessions, ritualPending]);
  const recommendedSession = recommendedIdx != null ? catalog[recommendedIdx] : null;
  const hookMirrorPending =
    completedSessions.includes(FIRST_SPARK_SESSION.id) &&
    !completedSessions.includes(HOOK_MIRROR_SESSION.id);
  const showMentor =
    ritualPending ||
    hookMirrorPending ||
    (!!recommendedSession && (state.energy < 55 || state.efficiency < 1.15));

  const settleSessionFuel = async (
    index: number,
    agent?: {
      verification: string;
      score: number;
      proof?: ProofOfAttention | null;
      verificationId?: string;
      arcium?: ArciumThresholdResult;
    },
    opts?: { retryOnly?: boolean }
  ) => {
    const session = catalog[index];
    if (!session) return;

    const from = state.energy;
    let fuelApplied = false;
    let onChainFuel = false;
    let to = from;

    try {
      const { fetchEconomyStatus } = await import('../lib/api');
      const { grantEnergyOnChain, syncLedgerToState } = await import('../lib/economy-actions');
      const status = await fetchEconomyStatus();

      if (!status.ready) {
        to = Math.min(100, from + session.rewards.energy);
        setState((prev) => ({
          ...prev,
          energy: Math.min(100, prev.energy + session.rewards.energy),
          credits: prev.credits + session.rewards.cp,
        }));
        markEnergySurge();
        fuelApplied = true;
        addLog(
          `ACADEMY [LOCAL PRACTICE]: +${session.rewards.energy}% fuel / +${session.rewards.cp} BCC — not on-chain settlement.`,
          'warn'
        );
      } else {
        const result = await grantEnergyOnChain({
          energyPercent: session.rewards.energy,
          bccReward: session.rewards.cp,
          verificationId: agent?.verificationId,
        });
        if ('skipped' in result) {
          setGrantRetry({ index, agent });
          addLog(
            `ACADEMY GRANT BLOCKED: ${result.reason}. Fuel not applied — tap Retry grant below.`,
            'warn'
          );
        } else {
          await syncLedgerToState(setState);
          markEnergySurge();
          to = Math.min(100, from + session.rewards.energy);
          fuelApplied = true;
          onChainFuel = true;
          setGrantRetry(null);
          addLog(`On-chain fuel landed — grant_energy. ${result.solscan}`, 'success');

          // Mandatory PoA memo receipt (second signature) — proves this session on Devnet
          const kind: AttentionProofKind =
            session.id === FIRST_SPARK_SESSION.id
              ? 'first_spark'
              : session.id === HOOK_MIRROR_SESSION.id
                ? 'hook_mirror'
                : 'academy';
          addLog('Sign the PoA receipt — one more signature seals attention on Devnet…', 'info');
          const memoRes = await sendAttentionProofMemo({
            kind,
            parts: {
              session: session.id,
              score: agent?.score ?? 0,
              grant: result.signature.slice(0, 12),
              energy: session.rewards.energy,
              bcc: session.rewards.cp,
            },
          });
          if ('signature' in memoRes) {
            if (agent?.verificationId) {
              try {
                await attestAttentionProof({
                  verificationId: agent.verificationId,
                  signature: memoRes.signature,
                  sessionId: session.id,
                  score: agent?.score,
                });
              } catch {
                /* server record best-effort */
              }
            }
            setState((prev) => ({
              ...prev,
              proofOfAttentions: (prev.proofOfAttentions || []).map((p, i) =>
                i === 0 || p.sessionId === session.id
                  ? {
                      ...p,
                      minted: true,
                      attested: true,
                      signature: memoRes.signature,
                      attestPending: false,
                    }
                  : p
              ),
            }));
            setPendingAttestId(null);
            addLog(`PoA sealed on Devnet — ${memoRes.solscan}`, 'success');
          } else {
            setPendingAttestId(agent?.verificationId || `poa_${session.id}`);
            addLog(
              `PoA receipt needed — tap Attest memo (${memoRes.reason}). Fuel is already on-chain.`,
              'warn'
            );
          }
        }
      }
    } catch (e: any) {
      setGrantRetry({ index, agent });
      addLog(
        `Energy grant failed — ${friendlyFailureDetail(e)}. Tap Retry grant so fuel lands on-chain.`,
        'warn'
      );
    }

    if (isFirstRitualPending() || ritualPending) {
      if (fuelApplied) {
        completeFirstRitual();
        setRitualPending(false);
        setFuelProofToast(true);
        onFirstRitualComplete?.({ from, to });
        track('first_spark_complete', {
          sessionId: session.id,
          onChain: onChainFuel,
        });
        try {
          const sessionRaw = localStorage.getItem('solana_current_user_session_v1');
          const sessionUser = sessionRaw ? JSON.parse(sessionRaw) : null;
          const actor = inviteCodeFromWallet(sessionUser?.walletAddress);
          if (actor) {
            void reportGrowthEvent({
              type: 'spark',
              actorCode: actor,
              nonce: `spark:${actor}:${session.id}`,
            });
          }
        } catch {
          // growth report optional
        }
        addLog(
          onChainFuel
            ? 'First Spark proved on-chain — your node has fuel.'
            : 'Proof accepted — practice fuel for now; settlement brings on-chain next.',
          'success'
        );
      } else if (!opts?.retryOnly) {
        addLog(
          'First Spark quiz passed — finish the energy grant (Retry) so your node gets fuel.',
          'warn'
        );
      }
    }

    if (fuelApplied && !opts?.retryOnly) {
      track('session_complete', {
        sessionId: session.id,
        onChain: onChainFuel,
      });
      if (session.id === HOOK_MIRROR_SESSION.id) {
        track('hook_mirror_complete', {
          sessionId: session.id,
          onChain: onChainFuel,
        });
        addLog(
          onChainFuel
            ? 'Hook Mirror sealed on-chain — bait, notice, why you stay.'
            : 'HOOK MIRROR: Proof of Hook Awareness sealed — bait, notice, why you stay.',
          'success'
        );
        onAwarenessSessionComplete?.(session.id);
      }

      // Practice mode: still try a PoA memo when a wallet is present (cheap attention proof)
      if (!onChainFuel) {
        const kind: AttentionProofKind =
          session.id === FIRST_SPARK_SESSION.id
            ? 'first_spark'
            : session.id === HOOK_MIRROR_SESSION.id
              ? 'hook_mirror'
              : 'academy';
        const memoRes = await sendAttentionProofMemo({
          kind,
          parts: {
            session: session.id,
            score: agent?.score ?? 0,
            mode: 'practice',
            energy: session.rewards.energy,
          },
        });
        if ('signature' in memoRes) {
          addLog(`Practice PoA memo on Devnet — ${memoRes.solscan}`, 'success');
          setState((prev) => ({
            ...prev,
            proofOfAttentions: (prev.proofOfAttentions || []).map((p, i) =>
              i === 0 || p.sessionId === session.id
                ? {
                    ...p,
                    minted: true,
                    attested: true,
                    signature: memoRes.signature,
                    attestPending: false,
                  }
                : p
            ),
          }));
          setPendingAttestId(null);
        }
      }
    }

    if (fuelApplied && !opts?.retryOnly && index < catalog.length - 1) {
      setActiveSessionIdx(index + 1);
    }
    setPendingSessionIdx(null);
  };

  const applyPendingRewards = (
    index: number,
    agent?: {
      verification: string;
      score: number;
      proof?: ProofOfAttention | null;
      verificationId?: string;
      arcium?: ArciumThresholdResult;
    }
  ) => {
    const session = catalog[index];
    if (!session || completedSessions.includes(session.id)) return;

    setJustUpgraded(true);
    setTimeout(() => {
      setJustUpgraded(false);
      setFuelProofToast(false);
    }, 4000);

    setState((prev) => {
      const nextEfficiency = parseFloat((prev.efficiency + session.rewards.efficiency).toFixed(3));
      const proofs = [...(prev.proofOfAttentions || [])];
      const arciumFields = agent?.arcium
        ? {
            arciumPassed: agent.arcium.passed,
            arciumScoreBand: agent.arcium.scoreBand,
            arciumMode: agent.arcium.mode,
            arciumComputationOffset: agent.arcium.computationOffset,
            arciumTxSignature: agent.arcium.txSignature,
          }
        : {};
      const activityLabel =
        session.id === HOOK_MIRROR_SESSION.id
          ? 'Proof of Hook Awareness'
          : session.title;
      if (agent?.proof) {
        proofs.unshift({
          ...agent.proof,
          activity: session.id === HOOK_MIRROR_SESSION.id ? activityLabel : agent.proof.activity,
          ...arciumFields,
        });
      } else if (agent) {
        proofs.unshift({
          id: `poa_local_${Date.now()}`,
          walletAddress:
            (typeof window !== 'undefined' &&
              JSON.parse(localStorage.getItem('solana_current_user_session_v1') || '{}')
                ?.walletAddress) ||
            'unknown',
          activity: activityLabel,
          duration: session.durationMin,
          verification: agent.verification,
          rewardEnergy: session.rewards.energy,
          rewardBcc: session.rewards.cp,
          timestamp: new Date().toISOString(),
          minted: false,
          sessionId: session.id,
          score: agent.score,
          attestPending: true,
          ...arciumFields,
        });
      }
      return {
        ...prev,
        efficiency: nextEfficiency,
        proofOfAttentions: proofs,
        dailyMissions: prev.dailyMissions.map((m) =>
          m.id === 'm_spark' || m.id === 'm_academy' ? { ...m, completed: true } : m
        ),
      };
    });

    if (agent?.verificationId) setPendingAttestId(agent.verificationId);

    setCompletedSessions((prev) => {
      if (prev.includes(session.id)) return prev;
      const updated = [...prev, session.id];
      localStorage.setItem('kronos_academy_completed', JSON.stringify(updated));
      return updated;
    });

    addLog(
      `CONFIDENTIAL PASS: ${session.title} — Arcium band ${agent?.arcium?.scoreBand ?? '?'} · ${agent?.verification || 'local'}.`,
      'success'
    );

    void settleSessionFuel(index, agent);
  };

  const runAgentVerification = async (index: number, quizScoreValue: number, quizTotal: number) => {
    const session = catalog[index];
    if (!session) return;
    setAgentVerifyMsg('Confidential verify (Arcium)…');
    setArciumStatus({ state: 'verifying' });
    setIsScanningOverlay(true);

    const pctScore = Math.round((quizScoreValue / Math.max(1, quizTotal)) * 100);
    const artifactText =
      artifacts || `Completed Neural Snap ${quizScoreValue}/${quizTotal} for ${session.title}`;

    let arcium: ArciumThresholdResult;
    try {
      arcium = await verifyAttentionWithArcium({
        quizScore: pctScore,
        artifactLen: artifactText.length,
        sessionId: session.id,
      });
    } catch (err: any) {
      setIsScanningOverlay(false);
      setArciumStatus({ state: 'failed', detail: err?.message || 'Arcium unavailable' });
      setAgentVerifyMsg(err?.message || 'Confidential verify failed');
      setQuizState('failed');
      addLog(`ARCIUM VERIFY FAILED: ${err?.message || err}`, 'warn');
      return;
    }

    if (!arcium.passed) {
      setIsScanningOverlay(false);
      setArciumStatus({
        state: 'failed',
        detail: `band ${arcium.scoreBand} · bucket ${arcium.artifactLenBucket}`,
        band: arcium.scoreBand,
        mode: arcium.mode,
      });
      setAgentVerifyMsg(
        `Confidential threshold rejected (score ${arcium.quizScore}, band ${arcium.scoreBand}). Coach skipped.`
      );
      setQuizState('failed');
      addLog(
        `ARCIUM REJECTED: score=${arcium.quizScore} bucket=${arcium.artifactLenBucket} band=${arcium.scoreBand}`,
        'warn'
      );
      return;
    }

    setArciumStatus({
      state: 'passed',
      detail: `band ${arcium.scoreBand} · ${arcium.mode}`,
      band: arcium.scoreBand,
      mode: arcium.mode,
    });
    setAgentVerifyMsg('Arcium pass — contacting AI coach…');

    try {
      const sessionRaw = localStorage.getItem('solana_current_user_session_v1');
      const sessionUser = sessionRaw ? JSON.parse(sessionRaw) : null;
      const walletAddress = sessionUser?.walletAddress;
      const walletType = sessionUser?.walletType || 'local';

      if (walletAddress && !getWalletToken()) {
        let localKeypair: Keypair | null = null;
        const secret = localStorage.getItem('solana_local_secret');
        if (secret && walletType === 'local') {
          localKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
        }
        await ensureWalletApiSession({ walletAddress, walletType, localKeypair });
      }

      const result = await verifyAttentionSession({
        sessionId: session.id,
        title: session.title,
        artifacts: artifactText,
        quizScore: quizScoreValue,
        quizTotal,
      });

      setIsScanningOverlay(false);

      // Gemini is coach copy only — Arcium already gated the pass.
      const coachLine = result.passed
        ? result.verification
        : result.reason || 'Coach notes incomplete; confidential pass still stands.';

      setAgentVerifyMsg(coachLine);
      setQuizState('passed');
      applyPendingRewards(index, {
        verification: coachLine,
        score: result.score ?? pctScore,
        proof: result.proofOfAttention,
        verificationId: result.verificationId,
        arcium,
      });
    } catch (err: any) {
      setIsScanningOverlay(false);
      const coachMsg = thrownToUserError(err, 'coach');
      const fallback = `Confidential pass (Arcium band ${arcium.scoreBand}). ${coachMsg}`;
      setAgentVerifyMsg(fallback);
      addLog(`COACH: ${coachMsg}`, 'warn');
      applyPendingRewards(index, {
        verification: fallback,
        score: pctScore,
        arcium,
      });
      setQuizState('passed');
    }
  };

  const claimSessionRewards = (index: number) => {
    const session = catalog[index];
    if (!session || completedSessions.includes(session.id) || !exerciseReady) return;
    if (getZenDecision(session.id) !== 'convert_fuel' && learningDecision !== 'convert_fuel') {
      addLog('Sit with Mind a moment — or tap Machine when you’re ready to prove it.', 'info');
      if (hearing?.active && hearing.speakLine) {
        void hearing.speakLine(zenDecisionPrompt(session.title));
      }
      return;
    }

    const pool = session.quiz.length ? session.quiz : [];
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const count = Math.min(shuffled.length, Math.max(1, Math.min(3, shuffled.length)));
    const selected = shuffled.slice(0, count);

    setPendingSessionIdx(index);
    setActiveQuizQuestions(selected);
    setCurrentQuizIdx(0);
    setSelectedQuizAnswer(null);
    setQuizScore(0);
    setQuizState('quiz');
    onRequestFocus?.(true);
    track('neural_snap_start', { sessionId: session.id, questions: count });
    addLog(`NEURAL SNAP: ${count} question(s) for "${session.title}".`, 'info');
  };

  const attestPendingPoa = async () => {
    if (!pendingAttestId) return;
    try {
      const poa = (state.proofOfAttentions || []).find((p) => p.id === pendingAttestId);
      const kind: AttentionProofKind =
        poa?.sessionId === FIRST_SPARK_SESSION.id
          ? 'first_spark'
          : poa?.sessionId === HOOK_MIRROR_SESSION.id
            ? 'hook_mirror'
            : 'academy';
      const memoRes = await sendAttentionProofMemo({
        kind,
        parts: {
          session: poa?.sessionId || pendingAttestId,
          score: poa?.score ?? 0,
        },
      });
      if ('skipped' in memoRes) {
        addLog(`Attest blocked — ${memoRes.reason}`, 'warn');
        return;
      }
      await attestAttentionProof({
        verificationId: pendingAttestId,
        signature: memoRes.signature,
        sessionId: poa?.sessionId,
        score: poa?.score,
      });
      setState((prev) => ({
        ...prev,
        proofOfAttentions: (prev.proofOfAttentions || []).map((p) =>
          p.id === pendingAttestId
            ? {
                ...p,
                minted: true,
                attested: true,
                signature: memoRes.signature,
                attestPending: false,
              }
            : p
        ),
      }));
      setPendingAttestId(null);
      addLog(`PoA sealed on Devnet — ${memoRes.solscan}`, 'success');
    } catch (err: any) {
      addLog(`Attest failed — ${err?.message || err}`, 'warn');
    }
  };

  const openSoulboundRitual = () => {
    try {
      const sessionRaw = localStorage.getItem('solana_current_user_session_v1');
      const sessionUser = sessionRaw ? JSON.parse(sessionRaw) : null;
      if (!sessionUser?.walletAddress) {
        addLog('SOULBOUND: Connect a wallet first.', 'warn');
        return;
      }
      let localKeypair: Keypair | null = null;
      if (sessionUser.walletType === 'local') {
        const secret = localStorage.getItem('solana_local_secret');
        if (secret) localKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
      }
      setRitualWallet({
        address: sessionUser.walletAddress,
        walletType: sessionUser.walletType === 'extension' ? 'extension' : 'local',
        localKeypair,
      });
      setShowSoulboundRitual(true);
      onRequestFocus?.(true);
    } catch {
      addLog('SOULBOUND: Could not read wallet session.', 'warn');
    }
  };

  const onSoulboundComplete = (rep: SoulboundReputation) => {
    setState((prev) => ({
      ...prev,
      soulboundReputation: rep,
      proofOfAttentions: (prev.proofOfAttentions || []).map((p) => ({
        ...p,
        soulboundMinted: true,
        soulbound: rep,
      })),
    }));
    onRequestFocus?.(false);
  };

  if (!activeSession) {
    return (
      <p className="text-slate-400 text-sm font-sans">
        Curriculum catching up — give it a moment, then refresh.
      </p>
    );
  }

  const isLocked = isSessionLocked(activeSessionIdx);

  return (
    <div className="space-y-6">
      {showMentor && recommendedSession && recommendedIdx != null && (
        <div
          className={`rounded-2xl border p-4 relative overflow-hidden ${
            ritualPending
              ? 'border-cyan-400/40 bg-[#080a10]/70'
              : 'border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 via-[#0a0a0c] to-emerald-500/10'
          }`}
        >
          <div className="absolute inset-0 opacity-95">
            <CinematicBackdrop variant={ritualPending ? 'ritual' : 'duality'} />
          </div>
          <div className="relative flex flex-wrap items-center gap-2 mb-1.5">
            <p className="text-[10px] font-mono text-cyan-400 tracking-[0.22em] uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />{' '}
              {ritualPending
                ? 'Proof of Attention · Knowledge challenge'
                : hookMirrorPending
                  ? 'Hook Mirror · why you scroll again'
                  : 'AI mentor · attention → fuel'}
            </p>
            <span
              className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                arciumStatus.state === 'passed'
                  ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                  : arciumStatus.state === 'failed'
                    ? 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                    : arciumStatus.state === 'verifying'
                      ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200 animate-pulse'
                      : 'border-white/15 bg-white/5 text-slate-400'
              }`}
              title={arciumStatus.detail || 'Arcium confidential threshold'}
            >
              Confidential verify (Arcium)
              {arciumStatus.state === 'passed'
                ? ` · pass${arciumStatus.band != null ? ` · band ${arciumStatus.band}` : ''}`
                : arciumStatus.state === 'failed'
                  ? ' · fail'
                  : arciumStatus.state === 'verifying'
                    ? ' · …'
                    : ''}
            </span>
          </div>
          <p className="text-sm text-slate-100 mt-1.5 relative leading-relaxed">
            {ritualPending ? (
              <>
                We&apos;re here for attention — not empty hashes. Pass a short snap, leave one honest
                line, watch knowledge become fuel. That&apos;s Proof of Attention.{' '}
                {recommendedSession ? (
                  <>
                    <span className="text-amber-300 font-semibold">{recommendedSession.title}</span>
                    {' '}(~{recommendedSession.durationMin} min).
                  </>
                ) : null}
              </>
            ) : hookMirrorPending ? (
              <>
                This is why the Human Passport exists — name what hooks you, what you notice when
                you&apos;re doomscrolling again, and why you keep going. Then Zen: Mind or Machine.{' '}
                {recommendedSession ? (
                  <>
                    <span className="text-amber-300 font-semibold">{recommendedSession.title}</span>
                    {' '}(~{recommendedSession.durationMin} min).
                  </>
                ) : null}
              </>
            ) : (
              <>
                Reserves at{' '}
                <span className="text-cyan-300 font-mono font-bold">{state.energy}%</span>.{' '}
                {recommendedSession ? (
                  <>
                    <span className="text-fuchsia-300 font-semibold">{recommendedSession.title}</span>{' '}
                    can restore ~{recommendedSession.rewards.energy}% energy in ~
                    {recommendedSession.durationMin} min.
                  </>
                ) : null}
              </>
            )}
          </p>
          {recommendedIdx != null && (
            <button
              type="button"
              onClick={() => setActiveSessionIdx(recommendedIdx)}
              className="mt-3 relative text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-black hover:bg-cyan-400 cursor-pointer"
            >
              {ritualPending
                ? 'Start Proof of Attention →'
                : hookMirrorPending
                  ? 'Start Hook Mirror →'
                  : 'Start recommended session →'}
            </button>
          )}
        </div>
      )}

      {!showMentor && arciumStatus.state !== 'idle' && (
        <div className="flex justify-end">
          <span
            className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${
              arciumStatus.state === 'passed'
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                : arciumStatus.state === 'failed'
                  ? 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                  : 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200 animate-pulse'
            }`}
          >
            Confidential verify (Arcium)
            {arciumStatus.state === 'passed'
              ? ` · pass${arciumStatus.band != null ? ` · band ${arciumStatus.band}` : ''}`
              : arciumStatus.state === 'failed'
                ? ' · fail'
                : ' · …'}
          </span>
        </div>
      )}

      {!ritualPending && (
        <button
          type="button"
          onClick={onOpenRoadmap}
          className="w-full text-left rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-violet-500/10 px-4 py-3 flex items-center justify-between gap-3 hover:border-emerald-400/40 transition-colors"
        >
          <div>
            <p className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase">
              Roadmap · 4 films
            </p>
            <p className="text-sm text-slate-200">
              2D mining → weekly intelligence → creator labs → AR — each chapter has its own video
            </p>
          </div>
          <Map className="w-4 h-4 text-emerald-400 shrink-0" />
        </button>
      )}

      {!ritualPending && weekly.length > 0 && (
        <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-4">
          <p className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> This week&apos;s drop
          </p>
          {weekly.map((w) => (
            <p key={w.id} className="text-sm text-slate-200">
              {w.title}
              {w.week ? <span className="text-slate-500 font-mono text-xs ml-2">{w.week}</span> : null}
            </p>
          ))}
          <p className="text-[11px] text-slate-500 mt-1">Research-assisted · human-approved</p>
        </div>
      )}

      {!ritualPending && isAdmin && (
        <CurriculumLabPanel
          addLog={addLog}
          onPublished={() => void refreshCurriculum()}
        />
      )}

      <div className={`grid grid-cols-1 gap-6 ${ritualPending ? '' : 'lg:grid-cols-3'}`}>
        {!ritualPending && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/5 bg-[#0a0a0c] p-4">
            <p className="text-[10px] font-mono text-fuchsia-400 tracking-widest mb-3">SERIES PROGRESS</p>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all"
                style={{
                  width: `${Math.max(
                    4,
                    (completedSessions.filter((id) => CORE_ATTENTION_SESSIONS.some((s) => s.id === id)).length /
                      CORE_ATTENTION_SESSIONS.length) *
                      100
                  )}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              {completedSessions.filter((id) => CORE_ATTENTION_SESSIONS.some((s) => s.id === id)).length} /{' '}
              {CORE_ATTENTION_SESSIONS.length} CORE
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-cyan-300/90">
                {PATH_LABELS[growthPath ?? 'balanced']}
              </p>
              <button
                type="button"
                onClick={() => setShowPathGate((v) => !v)}
                className="text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-cyan-300 cursor-pointer"
              >
                {showPathGate ? 'Close' : 'Change path'}
              </button>
            </div>
            {isMaster && (
              <p className="mt-2 text-xs text-amber-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Core series mastered
              </p>
            )}
          </div>

          {showPathGate && (
            <PersonalHookGate
              compact
              initialPath={growthPath}
              onChosen={(path) => {
                setGrowthPath(path);
                setShowPathGate(false);
                addLog(`GROWTH PATH: ${PATH_LABELS[path]} — catalog reordered.`, 'info');
              }}
            />
          )}

          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
            {catalog.map((session, idx) => {
              const done = completedSessions.includes(session.id);
              const locked = isSessionLocked(idx);
              const recommended = recommendedIdx === idx && !done && !locked;
              return (
                <button
                  key={session.id}
                  type="button"
                  disabled={locked}
                  onClick={() => setActiveSessionIdx(idx)}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                    recommended
                      ? 'border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_24px_rgba(34,211,238,0.15)]'
                      : activeSessionIdx === idx
                        ? 'border-fuchsia-400/40 bg-fuchsia-500/10'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                  } ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {done ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : locked ? (
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                    ) : (
                      <Brain className="w-3.5 h-3.5 text-fuchsia-400" />
                    )}
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {session.seriesOrder}. {session.title}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      +{session.rewards.energy}% FUEL
                    </span>
                    <span className="text-[9px] font-mono text-amber-400/80">+{session.rewards.cp} CP</span>
                    {recommended && (
                      <span className="text-[8px] font-mono text-cyan-300 tracking-wider uppercase">Recommended</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        )}

        <div className={`${ritualPending ? '' : 'lg:col-span-2'} rounded-2xl border border-white/10 bg-[#0a0a0c]/80 p-5 relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-80">
            <CinematicBackdrop variant="duality" />
          </div>
          {justUpgraded && (
            <div className="absolute inset-x-0 top-0 bg-emerald-500/20 text-emerald-300 text-center text-[11px] font-mono py-1.5 z-10">
              {fuelProofToast
                ? 'PROOF ACCEPTED — YOUR NODE HAS FUEL'
                : 'NEURAL REWIRE SECURED · ENERGY ROUTED TO REACTOR'}
            </div>
          )}

          <div className="relative z-[1] flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] font-mono text-amber-300/90 tracking-widest">
                SESSION {String(activeSession.seriesOrder).padStart(2, '0')} · MIND ↔ MACHINE
              </p>
              <h3 className="text-lg font-bold text-white mt-1">{activeSession.title}</h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/80 shrink-0">
              EST {activeSession.durationMin} MIN
            </span>
          </div>

          <div className="relative z-[1]">
          {isLocked ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Lock className="w-8 h-8 mb-3" />
              <p className="text-sm">Complete the previous session to unlock.</p>
            </div>
          ) : (
            <>
              <AttentionSessionPlayer
                key={activeSession.id}
                session={activeSession}
                completed={completedSessions.includes(activeSession.id)}
                onReadyChange={onReadyChange}
                addLog={addLog}
              />

              <p className="mt-4 text-[11px] text-slate-400 italic">{activeSession.nextHook}</p>

              {exerciseReady && !completedSessions.includes(activeSession.id) && (
                <ZenDecisionGate
                  sessionTitle={activeSession.title}
                  decision={learningDecision}
                  onDecide={(d) => void applyLearningDecision(d)}
                  zenMode={zenModeOn}
                />
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                {!completedSessions.includes(activeSession.id) && (
                  <button
                    type="button"
                    disabled={!exerciseReady || learningDecision !== 'convert_fuel'}
                    onClick={() => claimSessionRewards(activeSessionIdx)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-cyan-500/25 border border-cyan-400/40 text-cyan-100 text-xs font-bold disabled:opacity-40"
                  >
                    Prove it · Neural Snap <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {pendingAttestId && (
                  <button
                    type="button"
                    onClick={() => void attestPendingPoa()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-bold"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Seal PoA on Devnet
                  </button>
                )}
                {!state.soulboundReputation?.soulboundMinted && (
                  <button
                    type="button"
                    onClick={openSoulboundRitual}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/45 text-cyan-100 text-xs font-bold"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> SEAL SOULBOUND · ZK
                  </button>
                )}
              </div>
              <p className="mt-3 text-[10px] text-slate-500">
                Rewards: +{activeSession.rewards.cp} CP · +{activeSession.rewards.energy}% energy · +
                {activeSession.rewards.efficiency} efficiency
              </p>
            </>
          )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {quizState === 'quiz' && activeQuizQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 opacity-50 pointer-events-none">
              <CinematicBackdrop variant="duality" />
            </div>
            <div className="relative z-[1] w-full max-w-lg rounded-2xl border border-cyan-400/30 bg-[#0c0c12]/90 p-6 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 opacity-40 pointer-events-none">
                <CinematicBackdrop variant="duality" />
              </div>
              <div className="relative z-[1]">
              <p className="text-[10px] font-mono text-amber-300 tracking-widest mb-2">
                NEURAL SNAP · MIND ↔ MACHINE
              </p>
              <p className="text-sm text-slate-200 mb-4">
                {activeQuizQuestions[currentQuizIdx].question}
              </p>
              <div className="space-y-2">
                {activeQuizQuestions[currentQuizIdx].options.map((opt, oi) => (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => setSelectedQuizAnswer(oi)}
                    className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border ${
                      selectedQuizAnswer === oi
                        ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-100'
                        : 'border-white/10 text-slate-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={selectedQuizAnswer == null || isScanningOverlay}
                onClick={() => {
                  const q = activeQuizQuestions[currentQuizIdx];
                  const correct = selectedQuizAnswer === q.correctIdx;
                  const nextScore = quizScore + (correct ? 1 : 0);
                  if (currentQuizIdx < activeQuizQuestions.length - 1) {
                    setQuizScore(nextScore);
                    setCurrentQuizIdx((i) => i + 1);
                    setSelectedQuizAnswer(null);
                  } else {
                    const total = activeQuizQuestions.length;
                    const finalScore = nextScore;
                    if (finalScore < total) {
                      setQuizScore(finalScore);
                      setQuizState('failed');
                      setAgentVerifyMsg(`Need 100% on Neural Snap (${finalScore}/${total}).`);
                      track('neural_snap_fail', {
                        score: finalScore,
                        total,
                        sessionId: activeSession?.id,
                      });
                      return;
                    }
                    setQuizScore(finalScore);
                    track('neural_snap_pass', {
                      score: finalScore,
                      total,
                      sessionId: activeSession?.id,
                    });
                    if (pendingSessionIdx != null) {
                      void runAgentVerification(pendingSessionIdx, finalScore, total);
                    }
                  }
                }}
                className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/30 to-cyan-500/30 border border-cyan-400/40 text-cyan-50 text-xs font-bold disabled:opacity-40"
              >
                {isScanningOverlay
                  ? 'CONFIDENTIAL VERIFY…'
                  : currentQuizIdx < activeQuizQuestions.length - 1
                    ? 'NEXT'
                    : 'VERIFY (ARCIUM + COACH)'}
              </button>
              {agentVerifyMsg && (
                <p className="mt-2 text-[11px] text-slate-500">{agentVerifyMsg}</p>
              )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {grantRetry && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-amber-100 leading-relaxed">
            Energy grant didn&apos;t land. Stay here — retry so your node gets fuel (don&apos;t leave
            empty-handed).
          </p>
          <button
            type="button"
            onClick={() => {
              const pending = grantRetry;
              setGrantRetry(null);
              void settleSessionFuel(pending.index, pending.agent, { retryOnly: true });
            }}
            className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer shrink-0"
          >
            Retry grant →
          </button>
        </div>
      )}

      {(quizState === 'failed' || quizState === 'passed') && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-2 ${
            quizState === 'passed'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
          }`}
        >
          {quizState === 'failed' ? (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div>
            <p>
              {agentVerifyMsg ||
                (quizState === 'passed' ? 'Session verified.' : 'Retry Neural Snap — you are still here.')}
            </p>
            {quizState === 'failed' && (
              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
                  onClick={() => {
                    const spent = spendSparkCredit('retake');
                    if (!spent.ok) {
                      addLog(
                        'RETAKE TOLL: First fail needs a 1¢ Academy Retake (or spark credit). Opening Penny Protocol…',
                        'warn'
                      );
                      onOpenTollShop?.('academy_retake');
                      return;
                    }
                    setState((prev) => ({
                      ...prev,
                      sparkCredits: spent.inv.sparkCredits,
                      academyRetakeCredits: spent.inv.academyRetakeCredits,
                      listSlotCredits: spent.inv.listSlotCredits,
                    }));
                    addLog('RETAKE UNLOCKED: 1¢ toll credit spent — Neural Snap retry armed.', 'success');
                    setQuizState('quiz');
                    setAgentVerifyMsg('');
                    setArciumStatus({ state: 'idle' });
                  }}
                >
                  Retry Neural Snap (1¢) →
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-amber-400/40 text-amber-100 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
                  onClick={() => onOpenTollShop?.('academy_retake')}
                >
                  Buy retake in Treasury
                </button>
                <button
                  type="button"
                  className="text-xs underline text-amber-200/80 cursor-pointer"
                  onClick={() => {
                    setQuizState('idle');
                    setAgentVerifyMsg('');
                  }}
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {ritualWallet && (
        <SoulboundRitualOverlay
          open={showSoulboundRitual}
          onClose={() => {
            setShowSoulboundRitual(false);
            onRequestFocus?.(false);
          }}
          walletAddress={ritualWallet.address}
          walletType={ritualWallet.walletType}
          localKeypair={ritualWallet.localKeypair}
          addLog={addLog}
          onComplete={onSoulboundComplete}
        />
      )}
    </div>
  );
}
