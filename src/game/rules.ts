export const TOTAL_CARDS = 60;
export const BACK_CARD_ID = 61;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;

export interface HistoryItem {
  card: number;
  player: string;
  drawNumber: number;
  risk: string;
  timestamp: number;
}

export interface GameStateData {
  players: string[];
  currentPlayerIndex: number;
  deck: number[];
  drawnCount: number;
  currentCard: number | null;
  history: HistoryItem[];
  status: 'title' | 'playing' | 'paused' | 'gameover';
  outcome: 'none' | 'loss' | 'deck_cleared';
  loserName: string | null;
  loserDrawNumber: number | null;
}

/**
 * Generates a cryptographically strong or math fallback float in [0, 1)
 */
export function defaultRandomFloat(): number {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return array[0] / 2 ** 32;
  }
  return Math.random();
}

/**
 * Fisher-Yates shuffle returning a new array
 */
export function shuffleDeck(cards: number[], rng: () => number = defaultRandomFloat): number[] {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Creates a fresh 1..60 shuffled deck
 */
export function createShuffledDeck(rng: () => number = defaultRandomFloat): number[] {
  const base = Array.from({ length: TOTAL_CARDS }, (_, i) => i + 1);
  return shuffleDeck(base, rng);
}

/**
 * Progressive elimination chance:
 * First 10 cards: 1% (0.01)
 * Cards 11 to 60: linearly increases from 1% up to 5% (0.05) on card 60.
 */
export function getLossChance(drawNumber: number): number {
  const clamped = Math.max(1, Math.min(drawNumber, TOTAL_CARDS));
  if (clamped <= 10) return 0.01;
  const progress = (clamped - 10) / (TOTAL_CARDS - 10);
  return 0.01 + progress * 0.04;
}

/**
 * Formats a probability [0..1] into a human-readable percentage string (e.g. "1%", "1.4%", "5%")
 */
export function formatRiskPercent(chance: number): string {
  const pct = chance * 100;
  const formatted = pct.toFixed(chance < 0.02 ? 1 : 1).replace(/\.0$/, '');
  return `${formatted}%`;
}

/**
 * Returns a semantic tension level based on the current draw number / risk
 */
export function getTensionLevel(drawNumber: number): {
  level: 'calm' | 'warming' | 'tense' | 'critical';
  label: string;
  intensity: number; // 0 to 1
} {
  const chance = getLossChance(drawNumber);
  const intensity = Math.max(0, Math.min(1, (chance - 0.01) / 0.04));
  if (drawNumber <= 10) {
    return { level: 'calm', label: 'Brisa Leve', intensity: 0 };
  }
  if (drawNumber <= 25) {
    return { level: 'warming', label: 'Clima Esquenta', intensity };
  }
  if (drawNumber <= 45) {
    return { level: 'tense', label: 'Mão Tremendo', intensity };
  }
  return { level: 'critical', label: 'Risco Máximo', intensity };
}

/**
 * Sanitizes player names list to ensure 2..8 valid non-empty names
 */
export function sanitizePlayers(players: string[]): string[] {
  const cleaned = players
    .slice(0, MAX_PLAYERS)
    .map((name, idx) => String(name || '').trim() || `Jogador ${idx + 1}`);
  while (cleaned.length < MIN_PLAYERS) {
    cleaned.push(`Jogador ${cleaned.length + 1}`);
  }
  return cleaned;
}

/**
 * Initializes a new game state for the given players
 */
export function createInitialGameState(
  players: string[],
  rng: () => number = defaultRandomFloat
): GameStateData {
  const validPlayers = sanitizePlayers(players);
  return {
    players: validPlayers,
    currentPlayerIndex: 0,
    deck: createShuffledDeck(rng),
    drawnCount: 0,
    currentCard: null,
    history: [],
    status: 'playing',
    outcome: 'none',
    loserName: null,
    loserDrawNumber: null,
  };
}

/**
 * Executes a card draw step deterministically given a random roll in [0, 1).
 * Returns the updated state and whether the draw triggered a loss ("Vire o Copo!").
 */
export function executeCardDraw(
  state: GameStateData,
  roll: number = defaultRandomFloat(),
  now: number = Date.now()
): { nextState: GameStateData; result: 'drawn' | 'loss' | 'empty' } {
  if (state.deck.length === 0) {
    return {
      nextState: {
        ...state,
        status: 'gameover',
        outcome: 'deck_cleared',
      },
      result: 'empty',
    };
  }

  const drawNumber = state.drawnCount + 1;
  const chance = getLossChance(drawNumber);
  const playerName = state.players[state.currentPlayerIndex] || `Jogador ${state.currentPlayerIndex + 1}`;

  if (roll < chance) {
    return {
      nextState: {
        ...state,
        drawnCount: drawNumber,
        status: 'gameover',
        outcome: 'loss',
        loserName: playerName,
        loserDrawNumber: drawNumber,
      },
      result: 'loss',
    };
  }

  const [cardNumber, ...remainingDeck] = state.deck;
  const newHistoryItem: HistoryItem = {
    card: cardNumber,
    player: playerName,
    drawNumber,
    risk: formatRiskPercent(chance),
    timestamp: now,
  };

  return {
    nextState: {
      ...state,
      deck: remainingDeck,
      drawnCount: drawNumber,
      currentCard: cardNumber,
      history: [newHistoryItem, ...state.history],
    },
    result: 'drawn',
  };
}

/**
 * Advances to the next player's turn, hiding the current card.
 * If all 60 cards were drawn and survived, transitions to deck_cleared gameover.
 */
export function advancePlayerTurn(state: GameStateData): GameStateData {
  if (state.deck.length === 0) {
    return {
      ...state,
      currentCard: null,
      status: 'gameover',
      outcome: 'deck_cleared',
    };
  }

  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  return {
    ...state,
    currentPlayerIndex: nextIndex,
    currentCard: null,
  };
}

/**
 * Computes current round number (1-indexed)
 */
export function getRoundNumber(drawnCount: number, playerCount: number): number {
  const safeCount = Math.max(1, playerCount);
  const completedTurns = Math.max(0, drawnCount - 1);
  return Math.floor(completedTurns / safeCount) + 1;
}

/**
 * Returns the asset path for a given card ID (1..60 for cards, 61 for back)
 */
export function getCardImageUrl(cardId: number | null): string {
  const id = cardId && cardId >= 1 && cardId <= 61 ? cardId : BACK_CARD_ID;
  const rawBase = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) ? import.meta.env.BASE_URL : '/';
  const prefix = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  return `${prefix}assets/cards/${id}.png`;
}


