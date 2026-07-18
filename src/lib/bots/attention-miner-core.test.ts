import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  handleBotCommand,
  parseAnswerPayload,
  parseBotCommand,
} from './attention-miner-core.ts';
import { pickKnowledgeCard, KNOWLEDGE_DECK } from './knowledge-deck.ts';
import {
  claimDailyMiner,
  getMinerPlayer,
  gradeSparkAnswer,
  setPendingSpark,
} from './miner-ledger.ts';

describe('parseBotCommand', () => {
  it('maps mine/spark/knowledge to spark', () => {
    assert.equal(parseBotCommand('/mine').cmd, 'spark');
    assert.equal(parseBotCommand('/spark').cmd, 'spark');
    assert.equal(parseBotCommand('knowledge').cmd, 'spark');
  });

  it('parses A/B/C answers', () => {
    assert.deepEqual(parseBotCommand('B'), { cmd: 'answer', arg: 'B' });
    assert.deepEqual(parseBotCommand('2'), { cmd: 'answer', arg: 'B' });
  });

  it('strips bot mentions', () => {
    assert.equal(parseBotCommand('/claim@CultureMinerBot').cmd, 'claim');
  });

  it('maps partner / pilot', () => {
    assert.equal(parseBotCommand('/partner').cmd, 'partner');
    assert.equal(parseBotCommand('pilot').cmd, 'partner');
  });
});

describe('parseAnswerPayload', () => {
  it('reads Discord button ids', () => {
    assert.deepEqual(parseAnswerPayload('answer:C:k_zen'), {
      letter: 'C',
      cardId: 'k_zen',
    });
  });
});

describe('knowledge deck', () => {
  it('has stable cards with three options', () => {
    assert.ok(KNOWLEDGE_DECK.length >= 6);
    for (const c of KNOWLEDGE_DECK) {
      assert.equal(c.options.length, 3);
      assert.ok(c.correctIdx >= 0 && c.correctIdx <= 2);
    }
  });

  it('pickKnowledgeCard is deterministic with seed', () => {
    assert.equal(pickKnowledgeCard('seed-a').id, pickKnowledgeCard('seed-a').id);
  });
});

describe('Attention Miner ledger + commands', () => {
  const uid = `test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  it('help mentions spark and partner rails', async () => {
    const reply = await handleBotCommand({
      platform: 'telegram',
      userId: uid,
      cmd: 'help',
    });
    assert.match(reply.text, /Attention Miner/i);
    assert.match(reply.text, /spark/i);
    assert.match(reply.text, /partner/i);
    assert.ok((reply.linkButtons?.length || 0) >= 1);
  });

  it('spark → grade awards knowledge', async () => {
    const card = pickKnowledgeCard('fixed-seed');
    const id = `${uid}_spark`;
    await setPendingSpark('telegram', id, card.id, card.options, 'Tester');
    const graded = await gradeSparkAnswer('telegram', id, card.id, true);
    assert.ok(graded);
    assert.ok(graded!.knowledgePoints >= 15);
    assert.equal(graded!.correct, 1);

    const ans = await handleBotCommand({
      platform: 'telegram',
      userId: `${uid}_spark_ui`,
      cmd: 'spark',
    });
    assert.equal(ans.choices?.length, 3);
  });

  it('claim respects cooldown after first drip', async () => {
    const id = `${uid}_claim`;
    const first = await claimDailyMiner('discord', id, 'Claimer');
    assert.equal(first.ok, true);
    const second = await claimDailyMiner('discord', id);
    assert.equal(second.ok, false);
    if (!second.ok) assert.ok(second.hoursLeft > 0);
    const p = await getMinerPlayer('discord', id);
    assert.ok(p.knowledgePoints >= 25);
  });

  it('partner command deep-links to partners room', async () => {
    const reply = await handleBotCommand({
      platform: 'discord',
      userId: `${uid}_p`,
      cmd: 'partner',
    });
    assert.match(reply.text, /Partner Attention Session/i);
    assert.ok(reply.linkButtons?.some((b) => b.url.includes('partners')));
  });
});
