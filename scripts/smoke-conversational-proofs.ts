/**
 * Smoke: conversational proof join shapes + command routing for PoC QA.
 * Run: npx tsx scripts/smoke-conversational-proofs.ts
 */

import assert from 'node:assert/strict';
import { parseHearingCommand } from '../src/lib/hearing/commands.ts';
import {
  beatsReady,
  formatFirstContributionJoined,
  formatHookMirrorJoined,
  isDictationAdvancePhrase,
  signalStrengthPercent,
} from '../src/lib/hearing/conversational-proof.ts';

function ok(label: string) {
  console.log(`  ✓ ${label}`);
}

console.log('Conversational proofs smoke\n');

// First Contribution — 3 turns → eval-ready string
{
  const answers = [
    'Focused attention beats empty hashes for me.',
    'It shifted how I value my evenings.',
    'I will do one Proof of Attention this week.',
  ];
  const joined = formatFirstContributionJoined(answers);
  assert.ok(joined.length >= 40, 'first contribution min length');
  assert.ok(!joined.includes('\n'), 'space-joined for API');
  ok(`First Contribution join (${joined.length} chars)`);
}

// Hook Mirror artifact
{
  const joined = formatHookMirrorJoined([
    'Instagram reels when bored',
    'Jaw tight, then another swipe',
    'I am avoiding starting real work',
  ]);
  assert.match(joined, /^Hook: .+\nNotice: .+\nWhy: .+$/);
  ok('Hook Mirror Hook/Notice/Why shape');
}

// First Spark journal readiness
{
  const beats = [{ id: 'j', prompt: 'Reflect', minLen: 8 }];
  const answers = ['Attention moves fuel'];
  assert.equal(beatsReady(answers, beats), true);
  assert.equal(signalStrengthPercent(answers, beats), 100);
  ok('First Spark journal beat ready');
}

// Hearing advance phrases
{
  for (const phrase of ['next', 'done', 'ready', 'continue']) {
    assert.equal(parseHearingCommand(phrase), 'next', phrase);
    assert.equal(isDictationAdvancePhrase(phrase), true, phrase);
  }
  assert.equal(parseHearingCommand('option one'), 'option_1');
  assert.equal(isDictationAdvancePhrase('the feed hooks me'), false);
  ok('Hearing next/done + MC option_1 routing');
}

console.log('\nAll conversational proof smokes passed.');
console.log(`
Manual PoC checklist (browser):
  1. Cold start → First Contribution → 3 chat turns → Measure → scores
  2. ?hear=1 → unmute → speak into a beat → say "next"
  3. Mute mic → same UI, type + Continue
  4. Academy First Spark → answer Q1/Q2 → Reflect beat → Zen
  5. Hook Mirror → Bait → Notice → Why → Zen still unlocks
`);
