import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOTAL_CARDS,
  getLossChance,
  formatRiskPercent,
  getTensionLevel,
  sanitizePlayers,
  createInitialGameState,
  executeCardDraw,
  advancePlayerTurn,
  getRoundNumber,
  getCardImageUrl,
} from './rules';

test('getLossChance returns 1% for first 10 cards and scales linearly to 5% at card 60', () => {
  assert.equal(getLossChance(1), 0.01);
  assert.equal(getLossChance(10), 0.01);
  assert.ok(Math.abs(getLossChance(35) - 0.03) < 1e-9);
  assert.ok(Math.abs(getLossChance(60) - 0.05) < 1e-9);
});

test('formatRiskPercent formats probabilities cleanly', () => {
  assert.equal(formatRiskPercent(0.01), '1%');
  assert.equal(formatRiskPercent(0.014), '1.4%');
  assert.equal(formatRiskPercent(0.03), '3%');
  assert.equal(formatRiskPercent(0.05), '5%');
});

test('getTensionLevel categorizes draw numbers into 4 progressive phases', () => {
  assert.equal(getTensionLevel(1).level, 'calm');
  assert.equal(getTensionLevel(10).level, 'calm');
  assert.equal(getTensionLevel(15).level, 'warming');
  assert.equal(getTensionLevel(30).level, 'tense');
  assert.equal(getTensionLevel(50).level, 'critical');
  assert.equal(getTensionLevel(60).intensity, 1);
});

test('sanitizePlayers enforces 2 to 8 players and fills empty names', () => {
  const result = sanitizePlayers(['  Vik  ', '']);
  assert.deepEqual(result, ['Vik', 'Jogador 2']);

  const single = sanitizePlayers(['Solo']);
  assert.deepEqual(single, ['Solo', 'Jogador 2']);

  const many = sanitizePlayers(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  assert.equal(many.length, 8);
});

test('executeCardDraw draws card when roll >= chance and records history', () => {
  const initial = createInitialGameState(['Alice', 'Bob'], () => 0.5);
  assert.equal(initial.deck.length, TOTAL_CARDS);

  // Roll 0.5 is safe (>= 0.01)
  const { nextState, result } = executeCardDraw(initial, 0.5, 1000);
  assert.equal(result, 'drawn');
  assert.equal(nextState.drawnCount, 1);
  assert.equal(nextState.deck.length, TOTAL_CARDS - 1);
  assert.ok(nextState.currentCard !== null);
  assert.equal(nextState.history.length, 1);
  assert.equal(nextState.history[0].player, 'Alice');
  assert.equal(nextState.history[0].drawNumber, 1);
});

test('executeCardDraw triggers Vire o Copo loss when roll < chance', () => {
  const initial = createInitialGameState(['Alice', 'Bob'], () => 0.5);
  // Roll 0.005 is < 0.01 (1% chance on card 1)
  const { nextState, result } = executeCardDraw(initial, 0.005, 1000);
  assert.equal(result, 'loss');
  assert.equal(nextState.status, 'gameover');
  assert.equal(nextState.outcome, 'loss');
  assert.equal(nextState.loserName, 'Alice');
  assert.equal(nextState.loserDrawNumber, 1);
});

test('advancePlayerTurn rotates players and clears currentCard', () => {
  const initial = createInitialGameState(['Alice', 'Bob', 'Carol'], () => 0.5);
  const { nextState } = executeCardDraw(initial, 0.5, 1000);
  const afterTurn1 = advancePlayerTurn(nextState);
  assert.equal(afterTurn1.currentPlayerIndex, 1);
  assert.equal(afterTurn1.currentCard, null);

  const afterTurn2 = advancePlayerTurn(afterTurn1);
  assert.equal(afterTurn2.currentPlayerIndex, 2);

  const afterTurn3 = advancePlayerTurn(afterTurn2);
  assert.equal(afterTurn3.currentPlayerIndex, 0);
});

test('getRoundNumber and getCardImageUrl compute accurate values', () => {
  assert.equal(getRoundNumber(0, 3), 1);
  assert.equal(getRoundNumber(1, 3), 1);
  assert.equal(getRoundNumber(3, 3), 1);
  assert.equal(getRoundNumber(4, 3), 2);
  assert.equal(getCardImageUrl(null), '/assets/cards/61.png');
  assert.equal(getCardImageUrl(15), '/assets/cards/15.png');
});
