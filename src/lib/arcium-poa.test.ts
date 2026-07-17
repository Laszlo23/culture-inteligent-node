/**
 * Unit checks mirroring culture-poa Arcis verify_attention_threshold.
 * Run: npx tsx --test src/lib/arcium-poa.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  artifactLenBucket,
  evaluateAttentionThreshold,
  ARCIUM_MIN_SCORE,
} from './arcium-poa.ts';

describe('artifactLenBucket', () => {
  it('returns 0 for empty', () => {
    assert.equal(artifactLenBucket(0), 0);
    assert.equal(artifactLenBucket(-1), 0);
  });
  it('floors len/40 and caps at 10', () => {
    assert.equal(artifactLenBucket(39), 0);
    assert.equal(artifactLenBucket(40), 1);
    assert.equal(artifactLenBucket(80), 2);
    assert.equal(artifactLenBucket(9999), 10);
  });
});

describe('evaluateAttentionThreshold (circuit mirror)', () => {
  it('passes when score >= 60 and bucket >= 1', () => {
    const r = evaluateAttentionThreshold(72, 80);
    assert.equal(r.passed, true);
    assert.equal(r.scoreBand, 1);
    assert.equal(r.artifactLenBucket, 2);
  });
  it('fails when score < min', () => {
    const r = evaluateAttentionThreshold(40, 200);
    assert.equal(r.passed, false);
    assert.equal(r.scoreBand, 0);
  });
  it('fails when artifact bucket empty even if score high', () => {
    const r = evaluateAttentionThreshold(95, 10);
    assert.equal(r.passed, false);
    assert.equal(r.scoreBand, 3);
    assert.equal(r.artifactLenBucket, 0);
  });
  it('bands match Arcis thresholds', () => {
    assert.equal(evaluateAttentionThreshold(59, 100).scoreBand, 0);
    assert.equal(evaluateAttentionThreshold(60, 100).scoreBand, 1);
    assert.equal(evaluateAttentionThreshold(75, 100).scoreBand, 2);
    assert.equal(evaluateAttentionThreshold(90, 100).scoreBand, 3);
  });
  it('min score constant is 60', () => {
    assert.equal(ARCIUM_MIN_SCORE, 60);
  });
});
