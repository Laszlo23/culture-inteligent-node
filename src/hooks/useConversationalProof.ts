/**
 * Multi-beat conversational proof capture — short turns, voice or chat.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { setHearingDictationHandler } from '../lib/hearing/session-bridge';
import {
  beatsReady,
  canAdvanceBeat,
  formatDialogueJoined,
  signalStrengthPercent,
  type ProofBeatDef,
} from '../lib/hearing/conversational-proof';

export type ProofBeat = ProofBeatDef;

export type ConversationalProofState = {
  turnIndex: number;
  answers: string[];
  currentAnswer: string;
  setCurrentAnswer: (text: string) => void;
  canAdvance: boolean;
  ready: boolean;
  allDone: boolean;
  advance: () => void;
  goTo: (index: number) => void;
  joined: string;
  totalMin: number;
  signalStrength: number;
  beat: ProofBeat;
};

type Options = {
  formatJoined?: (answers: string[], beats: ProofBeat[]) => string;
  hearingActive?: boolean;
  disabled?: boolean;
  onAnswersChange?: (answers: string[], ready: boolean, joined: string) => void;
  onComplete?: (joined: string) => void;
};

export function useConversationalProof(
  beats: ProofBeat[],
  opts: Options = {}
): ConversationalProofState {
  const {
    formatJoined = (answers) => formatDialogueJoined(answers),
    hearingActive = false,
    disabled = false,
    onAnswersChange,
    onComplete,
  } = opts;

  const [turnIndex, setTurnIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => beats.map(() => ''));
  const [allDone, setAllDone] = useState(false);

  const answersRef = useRef(answers);
  const turnRef = useRef(turnIndex);
  const beatsRef = useRef(beats);
  answersRef.current = answers;
  turnRef.current = turnIndex;
  beatsRef.current = beats;

  // Reset when beat set identity changes (session switch)
  const beatKey = beats.map((b) => b.id).join('|');
  useEffect(() => {
    setTurnIndex(0);
    setAnswers(beats.map(() => ''));
    setAllDone(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when beat ids change
  }, [beatKey]);

  const totalMin = useMemo(() => beats.reduce((s, b) => s + b.minLen, 0), [beats]);

  const joined = useMemo(
    () => formatJoined(answers, beats),
    [answers, beats, formatJoined]
  );

  const ready = useMemo(() => beatsReady(answers, beats), [answers, beats]);

  const signalStrength = useMemo(
    () => signalStrengthPercent(answers, beats),
    [answers, beats]
  );

  const beat = beats[Math.min(turnIndex, beats.length - 1)] ?? beats[0];
  const currentAnswer = answers[turnIndex] ?? '';
  const canAdvance = canAdvanceBeat(answers, beats, turnIndex) && !disabled;

  const setCurrentAnswer = useCallback(
    (text: string) => {
      if (disabled || allDone) return;
      setAnswers((prev) => {
        const next = [...prev];
        while (next.length < beats.length) next.push('');
        next[turnIndex] = text;
        return next;
      });
    },
    [disabled, allDone, beats.length, turnIndex]
  );

  const advance = useCallback(() => {
    if (disabled) return;
    const idx = turnRef.current;
    const list = beatsRef.current;
    const cur = (answersRef.current[idx] || '').trim();
    if (cur.length < (list[idx]?.minLen ?? 0)) return;

    if (idx >= list.length - 1) {
      setAllDone(true);
      const finalJoined = formatJoined(answersRef.current, list);
      onComplete?.(finalJoined);
      return;
    }
    setTurnIndex(idx + 1);
  }, [disabled, formatJoined, onComplete]);

  const goTo = useCallback(
    (index: number) => {
      if (disabled || allDone) return;
      if (index < 0 || index >= beats.length) return;
      // Only allow revisiting completed or current beat
      if (index > turnIndex) return;
      setTurnIndex(index);
    },
    [disabled, allDone, beats.length, turnIndex]
  );

  useEffect(() => {
    onAnswersChange?.(answers, ready, joined);
  }, [answers, ready, joined, onAnswersChange]);

  // Hearing: free-speech → current beat; next/done advances
  useEffect(() => {
    if (!hearingActive || disabled) {
      setHearingDictationHandler(null);
      return;
    }

    setHearingDictationHandler({
      onTranscript: (transcript) => {
        const line = transcript.trim();
        if (!line) return false;
        const idx = turnRef.current;
        const prev = (answersRef.current[idx] || '').trim();
        const next = prev ? `${prev} ${line}` : line;
        setAnswers((a) => {
          const copy = [...a];
          while (copy.length < beatsRef.current.length) copy.push('');
          copy[idx] = next;
          return copy;
        });
        return true;
      },
      onAdvance: () => {
        const idx = turnRef.current;
        if (!canAdvanceBeat(answersRef.current, beatsRef.current, idx)) return false;
        advance();
        return true;
      },
    });

    return () => setHearingDictationHandler(null);
  }, [hearingActive, disabled, advance]);

  return {
    turnIndex,
    answers,
    currentAnswer,
    setCurrentAnswer,
    canAdvance,
    ready,
    allDone,
    advance,
    goTo,
    joined,
    totalMin,
    signalStrength,
    beat,
  };
}
