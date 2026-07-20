import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { parseHearingCommand } from './commands.ts';
import {
  dispatchHearingAdvance,
  dispatchHearingDictation,
  isHearingDictationActive,
  setHearingDictationHandler,
  setHearingSessionHandler,
  dispatchHearingSessionCommand,
} from './session-bridge.ts';
import {
  beatsReady,
  canAdvanceBeat,
  formatDialogueJoined,
  formatFirstContributionJoined,
  formatHookMirrorJoined,
  isDictationAdvancePhrase,
  isDictationEscapeCommand,
  signalStrengthPercent,
  type ProofBeatDef,
} from './conversational-proof.ts';

const BEATS: ProofBeatDef[] = [
  { id: 'a', prompt: 'A?', minLen: 8 },
  { id: 'b', prompt: 'B?', minLen: 8 },
  { id: 'c', prompt: 'C?', minLen: 8 },
];

describe('formatFirstContributionJoined', () => {
  it('joins turns with spaces for eval API', () => {
    const joined = formatFirstContributionJoined([
      '  Attention is scarce.  ',
      'It shifted how I plan.',
      'I will batch deep work.',
    ]);
    assert.equal(
      joined,
      'Attention is scarce. It shifted how I plan. I will batch deep work.'
    );
    assert.ok(joined.length >= 40);
  });
});

describe('formatHookMirrorJoined', () => {
  it('keeps Hook/Notice/Why artifact shape', () => {
    const joined = formatHookMirrorJoined([
      'TikTok boredom bait',
      'thumb already moving',
      'relief from silence',
    ]);
    assert.equal(
      joined,
      'Hook: TikTok boredom bait\nNotice: thumb already moving\nWhy: relief from silence'
    );
  });
});

describe('formatDialogueJoined + readiness', () => {
  it('newline-joins dialogue and tracks ready/signal', () => {
    const answers = ['short ok', '', ''];
    assert.equal(formatDialogueJoined(answers), 'short ok');
    assert.equal(canAdvanceBeat(answers, BEATS, 0), true);
    assert.equal(beatsReady(answers, BEATS), false);
    assert.ok(signalStrengthPercent(answers, BEATS) > 0);
    assert.ok(signalStrengthPercent(answers, BEATS) < 100);

    const full = ['aaaaaaaa', 'bbbbbbbb', 'cccccccc'];
    assert.equal(beatsReady(full, BEATS), true);
    assert.equal(signalStrengthPercent(full, BEATS), 100);
  });
});

describe('dictation phrase helpers', () => {
  it('detects advance phrases used by Hearing Mode', () => {
    assert.equal(isDictationAdvancePhrase('next'), true);
    assert.equal(isDictationAdvancePhrase('I am done'), true);
    assert.equal(isDictationAdvancePhrase('ready'), true);
    assert.equal(isDictationAdvancePhrase('continue please'), true);
    assert.equal(isDictationAdvancePhrase('attention is fuel'), false);
  });

  it('maps advance phrases to next command', () => {
    assert.equal(parseHearingCommand('next'), 'next');
    assert.equal(parseHearingCommand('done'), 'next');
    assert.equal(parseHearingCommand('ready'), 'next');
    assert.equal(parseHearingCommand('continue'), 'next');
  });

  it('keeps escape commands distinct', () => {
    assert.equal(isDictationEscapeCommand('stop'), true);
    assert.equal(isDictationEscapeCommand('help'), true);
    assert.equal(isDictationEscapeCommand('next'), false);
    assert.equal(parseHearingCommand('stop talking'), 'stop');
  });
});

describe('hearing dictation bridge', () => {
  beforeEach(() => {
    setHearingDictationHandler(null);
    setHearingSessionHandler(null);
  });

  it('routes free speech into the active beat', () => {
    const lines: string[] = [];
    setHearingDictationHandler({
      onTranscript: (t) => {
        lines.push(t);
        return true;
      },
      onAdvance: () => true,
    });
    assert.equal(isHearingDictationActive(), true);
    assert.equal(dispatchHearingDictation('hooks me every night'), true);
    assert.deepEqual(lines, ['hooks me every night']);
  });

  it('advances without falling through when next is spoken', async () => {
    let advanced = 0;
    setHearingDictationHandler({
      onTranscript: () => {
        throw new Error('should not dictate next');
      },
      onAdvance: () => {
        advanced += 1;
        return true;
      },
    });
    assert.equal(await dispatchHearingAdvance(), true);
    assert.equal(advanced, 1);
  });

  it('session handler still works when dictation is off', async () => {
    let hit = false;
    setHearingSessionHandler((cmd) => {
      if (cmd === 'option_1') {
        hit = true;
        return true;
      }
      return false;
    });
    assert.equal(isHearingDictationActive(), false);
    assert.equal(await dispatchHearingSessionCommand('option_1'), true);
    assert.equal(hit, true);
  });
});
