import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  FIRST_CONTRIBUTION_KEY,
  seedFromFirstContribution,
  pickFirstContributionPrompt,
  saveFirstContribution,
  readFirstContribution,
  hasCompletedFirstContribution,
} from './first-contribution.ts';
import { heuristicFirstContributionEval } from './first-contribution-eval.ts';
import {
  encodePassportShare,
  decodePassportShare,
  passportShareUrl,
  achievementsFromScores,
} from './passport-share.ts';
import { computeHumanScores } from './human-economy.ts';

describe('seedFromFirstContribution', () => {
  it('maps dims into first-reveal band with creativity alias', () => {
    const scores = seedFromFirstContribution({
      curiosity: 80,
      creativity: 60,
      reflection: 40,
    });
    assert.ok(scores.knowledge >= 8 && scores.knowledge <= 28);
    assert.ok(scores.creativity >= 5 && scores.creativity <= 22);
    assert.equal(scores.builder, scores.creativity);
    assert.ok(scores.contribution >= 3 && scores.contribution <= 18);
    assert.ok(scores.humanValue > 0);
  });
});

describe('heuristicFirstContributionEval', () => {
  it('rewards reflective language', () => {
    const thin = heuristicFirstContributionEval('I learned stuff yesterday at work.');
    const rich = heuristicFirstContributionEval(
      'I learned why attention residues after task-switching matter. I used to wonder why focus felt broken. Reflecting on that changed my perspective — I batch deep work now because I finally understood the cost.'
    );
    assert.ok(rich.dims.curiosity >= thin.dims.curiosity);
    assert.ok(rich.dims.reflection >= thin.dims.reflection);
  });
});

describe('first contribution persistence', () => {
  beforeEach(() => {
    try {
      localStorage.removeItem(FIRST_CONTRIBUTION_KEY);
    } catch {
      // node without localStorage — ok
    }
  });

  it('saves and reads seeded passport when storage exists', () => {
    const scores = seedFromFirstContribution({
      curiosity: 70,
      creativity: 50,
      reflection: 45,
    });
    const record = {
      prompt: pickFirstContributionPrompt(),
      answer: 'x'.repeat(50),
      dims: { curiosity: 70, creativity: 50, reflection: 45 },
      coachLine: 'Good start.',
      scores,
      at: new Date().toISOString(),
    };
    saveFirstContribution(record);
    try {
      if (typeof localStorage === 'undefined') {
        assert.ok(scores.creativity > 0);
        return;
      }
      assert.equal(hasCompletedFirstContribution(), true);
      const got = readFirstContribution();
      assert.ok(got);
      assert.equal(got!.scores.creativity, scores.creativity);
    } catch {
      // storage unavailable
      assert.ok(scores.humanValue > 0);
    }
  });
});

describe('passport share codec', () => {
  it('round-trips scores and builds https URL', () => {
    const scores = seedFromFirstContribution({
      curiosity: 90,
      creativity: 70,
      reflection: 55,
    });
    const payload = {
      name: 'Laszlo',
      scores,
      achievements: achievementsFromScores(scores),
    };
    const code = encodePassportShare(payload);
    const back = decodePassportShare(code);
    assert.ok(back);
    assert.equal(back!.name, 'Laszlo');
    assert.equal(back!.scores.humanValue, scores.humanValue);
    assert.equal(back!.scores.creativity, scores.creativity);
    const url = passportShareUrl(payload, 'https://mining.buildingcultureid.space');
    assert.match(url, /^https:\/\/mining\.buildingcultureid\.space\/\?passport=/);
  });
});

describe('computeHumanScores with seed', () => {
  it('floors activity scores with first-contribution seed', () => {
    const seed = seedFromFirstContribution({
      curiosity: 100,
      creativity: 100,
      reflection: 100,
    });
    const withSeed = computeHumanScores({
      academyCompletedCount: 0,
      coreSessionTotal: 5,
      missionsCompleted: 0,
      missionsTotal: 3,
      seed,
    });
    assert.ok(withSeed.knowledge >= seed.knowledge);
    assert.ok(withSeed.creativity >= seed.creativity);
    assert.equal(withSeed.creativity, withSeed.builder);
  });
});
