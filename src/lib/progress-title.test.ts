import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveProgressTitle } from './progress-title.ts';

const zero = {
  knowledge: 0,
  builder: 0,
  creativity: 0,
  contribution: 0,
  humanValue: 0,
};

describe('resolveProgressTitle', () => {
  it('starts as Quiet Spark before any contribution', () => {
    const t = resolveProgressTitle(zero, { firstContribution: false });
    assert.equal(t.id, 'quiet_spark');
    assert.equal(t.title, 'Quiet Spark');
  });

  it('passport claim without spark nudges to First Spark', () => {
    const t = resolveProgressTitle(zero, {
      firstContribution: false,
      passportClaimed: true,
    });
    assert.equal(t.id, 'first_spark');
  });

  it('first contribution at low value is First Spark', () => {
    const t = resolveProgressTitle(
      { ...zero, knowledge: 10, creativity: 8, contribution: 5, humanValue: 8 },
      { firstContribution: true }
    );
    assert.equal(t.id, 'first_spark');
  });

  it('climbs Attention Apprentice at humanValue >= 12', () => {
    const t = resolveProgressTitle(
      { ...zero, humanValue: 12 },
      { firstContribution: true }
    );
    assert.equal(t.id, 'attention_apprentice');
  });

  it('climbs Passport Builder at humanValue >= 25', () => {
    const t = resolveProgressTitle(
      { ...zero, humanValue: 25 },
      { firstContribution: true }
    );
    assert.equal(t.id, 'passport_builder');
  });

  it('climbs Culture Node at humanValue >= 45', () => {
    const t = resolveProgressTitle(
      { ...zero, humanValue: 45 },
      { firstContribution: true }
    );
    assert.equal(t.id, 'culture_node');
  });

  it('climbs Reputation Keeper at humanValue >= 70', () => {
    const t = resolveProgressTitle(
      { ...zero, humanValue: 70 },
      { firstContribution: true }
    );
    assert.equal(t.id, 'reputation_keeper');
  });

  it('treats hv > 0 as sparked even without the flag', () => {
    const t = resolveProgressTitle(
      { ...zero, humanValue: 30 },
      { firstContribution: false }
    );
    assert.equal(t.id, 'passport_builder');
  });
});
