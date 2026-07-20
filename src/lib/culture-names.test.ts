import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCultureName,
  normalizeCultureLabel,
  suggestCultureLabels,
  validateCultureLabel,
} from './culture-names';

describe('culture-names', () => {
  it('normalizes and formats laszlo.culture', () => {
    assert.equal(normalizeCultureLabel('Laszlo.culture'), 'laszlo');
    assert.equal(normalizeCultureLabel('@Laszlo'), 'laszlo');
    assert.equal(formatCultureName('Laszlo'), 'laszlo.culture');
  });

  it('validates labels', () => {
    assert.equal(validateCultureLabel('laszlo').ok, true);
    assert.equal(validateCultureLabel('ab').ok, false);
    assert.equal(validateCultureLabel('admin').ok, false);
    assert.equal(validateCultureLabel('1bad').ok, false);
    assert.equal(validateCultureLabel('good-name').ok, true);
  });

  it('suggests valid labels from seed', () => {
    const s = suggestCultureLabels('Laszlo', 'AbCdEfGhIjKlMnOpQrStUvWxYz123456789');
    assert.ok(s.length >= 1);
    assert.ok(s.every((x) => validateCultureLabel(x).ok));
  });
});
