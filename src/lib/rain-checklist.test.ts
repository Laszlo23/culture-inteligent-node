import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DISCORD_PIN_COPY,
  DM_INVITE_COPY,
  RAIN_CHAPTERS,
  RAIN_CHECKLIST_KEY,
  RAIN_TASKS,
  TELEGRAM_PIN_COPY,
  firstIncompleteChapter,
  markRainTask,
  rainDoneCount,
  readRainProgress,
  toggleRainTask,
} from './rain-checklist.ts';
import { RAIN_CAST_SEQUENCE, getCastTemplate } from './farcaster.ts';

describe('rain checklist', () => {
  beforeEach(() => {
    try {
      localStorage.removeItem(RAIN_CHECKLIST_KEY);
    } catch {
      // node without localStorage — ok
    }
  });

  it('tracks seven founder rain tasks', () => {
    assert.equal(RAIN_TASKS.length, 7);
    const p = readRainProgress();
    assert.equal(rainDoneCount(p), 0);
    const next = markRainTask('cast_rain', true);
    assert.equal(next.cast_rain, true);
    assert.equal(rainDoneCount(next), 1);
    // Toggle flips whatever is currently stored (memory or localStorage)
    const before = readRainProgress().cast_rain;
    const toggled = toggleRainTask('cast_rain');
    assert.equal(toggled.cast_rain, !before);
  });

  it('ships Discord + Telegram pin copy with Hearing + Passport', () => {
    assert.match(DISCORD_PIN_COPY, /Hearing Mode/i);
    assert.match(DISCORD_PIN_COPY, /passport/i);
    assert.match(DISCORD_PIN_COPY, /\/spark/);
    assert.match(TELEGRAM_PIN_COPY, /hear=1/);
    assert.match(TELEGRAM_PIN_COPY, /Passport/i);
  });

  it('groups tasks into four ritual chapters', () => {
    assert.equal(RAIN_CHAPTERS.length, 4);
    assert.deepEqual(
      RAIN_CHAPTERS.map((c) => c.id),
      ['cast', 'pin', 'invite', 'host']
    );
    assert.match(DM_INVITE_COPY, /First Spark/i);
    assert.equal(firstIncompleteChapter(readRainProgress()), 'cast');
  });
});

describe('rain cast sequence', () => {
  it('opens with make-it-rain and includes hearing + partner', () => {
    assert.equal(RAIN_CAST_SEQUENCE[0], 'rain');
    assert.ok(RAIN_CAST_SEQUENCE.includes('weekly_hearing'));
    assert.ok(RAIN_CAST_SEQUENCE.includes('partner_pilot'));
    const rain = getCastTemplate('rain');
    assert.match(rain.text, /Make it rain/i);
    assert.match(rain.text, /Hear → Spark → Zen → Spread → Return/);
  });
});
