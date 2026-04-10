import { drawPrompt, getPromptPool } from './prompts.js';

export const PHASES = {
  SETUP: 'setup',
  READY: 'ready',
  REVEALING: 'revealing',
  READING: 'reading',
  COUNTDOWN: 'countdown',
  SCORING: 'scoring',
  ENDED: 'ended'
};

export const DEFAULT_SETTINGS = {
  timerLength: 5,
  readingDelayMs: 1700,
  animationIntensity: 'normal',
  muted: false,
  volume: 0.7,
};

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    players: [],
    round: 1,
    currentPlayerIndex: 0,
    currentPrompt: null,
    usedPromptIds: [],
    countdownValue: DEFAULT_SETTINGS.timerLength,
    waitingForResumeChoice: false,
    stats: {
      turns: 0,
      promptsUsed: 0,
      longestStreak: 0
    }
  };
}

export function createPlayers(names) {
  return names
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({
      id: crypto.randomUUID(),
      name,
      score: 0,
      correct: 0,
      incorrect: 0,
      streak: 0,
      longestStreak: 0,
      skipsUsed: 0
    }));
}

export function getLeaderboard(players) {
  return [...players].sort((a, b) => b.score - a.score || b.correct - a.correct || a.name.localeCompare(b.name));
}

export function getCurrentPlayer(state) {
  return state.players[state.currentPlayerIndex] || null;
}

export function nextTurn(state) {
  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  const round = nextIndex === 0 ? state.round + 1 : state.round;
  return { nextIndex, round };
}

export function drawNextPrompt(state, promptLibrary) {
  const pool = getPromptPool(promptLibrary);
  const used = new Set(state.usedPromptIds);
  return drawPrompt(pool, used);
}
