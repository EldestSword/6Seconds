import { AudioManager } from './audio.js';
import { createInitialState, createPlayers, DEFAULT_SETTINGS, drawNextPrompt, nextTurn, PHASES } from './game.js';
import { loadPromptLibrary } from './prompts.js';
import { clearGameState, loadGameState, loadSettings, saveGameState, saveSettings } from './storage.js';
import { render, renderEndgame } from './ui.js';

const elements = {
  playerInput: document.querySelector('#playerNames'),
  startGameBtn: document.querySelector('#startGameBtn'),
  startTurnBtn: document.querySelector('#startTurnBtn'),
  correctBtn: document.querySelector('#correctBtn'),
  incorrectBtn: document.querySelector('#incorrectBtn'),
  skipBtn: document.querySelector('#skipBtn'),
  endGameBtn: document.querySelector('#endGameBtn'),
  promptText: document.querySelector('#promptText'),
  packTag: document.querySelector('#packTag'),
  countdown: document.querySelector('#countdownValue'),
  playerSpotlight: document.querySelector('#playerSpotlight'),
  roundValue: document.querySelector('#roundValue'),
  scoreboard: document.querySelector('#scoreboard'),
  statusPill: document.querySelector('#statusPill'),
  stateDebug: document.querySelector('#stateDebug'),
  muteBtn: document.querySelector('#muteBtn'),
  testSoundBtn: document.querySelector('#testSoundBtn'),
  settingsToggle: document.querySelector('#settingsToggle'),
  settingsPanel: document.querySelector('#settingsPanel'),
  timerInput: document.querySelector('#timerLength'),
  delayInput: document.querySelector('#readingDelay'),
  volumeInput: document.querySelector('#volumeControl'),
  volumeValue: document.querySelector('#volumeValue'),
  animationSelect: document.querySelector('#animationIntensity'),
  resetDeckBtn: document.querySelector('#resetDeckBtn'),
  resetGameBtn: document.querySelector('#resetGameBtn'),
  sessionModal: document.querySelector('#sessionModal'),
  resumeBtn: document.querySelector('#resumeBtn'),
  newSessionBtn: document.querySelector('#newSessionBtn'),
  hotkeyHint: document.querySelector('#hotkeyHint'),
  endgamePanel: document.querySelector('#endgamePanel'),
  winnerText: document.querySelector('#winnerText'),
  finalBoard: document.querySelector('#finalBoard'),
  statPrompts: document.querySelector('#statPrompts'),
  statTurns: document.querySelector('#statTurns'),
  statStreak: document.querySelector('#statStreak'),
  playAgainBtn: document.querySelector('#playAgainBtn')
};

let promptLibrary = null;
let settings = loadSettings(DEFAULT_SETTINGS);
let state = createInitialState();
const audio = new AudioManager(settings.volume, settings.muted);

let countdownInterval = null;
let readingTimeout = null;
let revealInterval = null;

function persist() {
  saveGameState(state);
  saveSettings(settings);
}

function updateUi() {
  render(state, settings, elements);
  const total = promptLibrary?.prompts?.length ?? 0;
  const used = state.usedPromptIds.length;
  const remaining = Math.max(0, total - used);
  elements.stateDebug.textContent += ` · Prompts ${remaining}/${total} left`;
}

function stopTimers() {
  clearInterval(countdownInterval);
  clearTimeout(readingTimeout);
  clearInterval(revealInterval);
}

function applyAnimationIntensity() {
  document.body.dataset.animation = settings.animationIntensity;
}

function spotlightPulse() {
  elements.playerSpotlight.classList.remove('pulse');
  void elements.playerSpotlight.offsetWidth;
  elements.playerSpotlight.classList.add('pulse');
}

function startCountdown() {
  state.phase = PHASES.COUNTDOWN;
  state.countdownValue = settings.timerLength;
  updateUi();

  countdownInterval = setInterval(() => {
    state.countdownValue -= 1;
    if (state.countdownValue > 0) {
      audio.play('tick', { multiplier: 0.6 });
      updateUi();
      return;
    }

    clearInterval(countdownInterval);
    state.countdownValue = 0;
    state.phase = PHASES.SCORING;
    audio.play('buzzer');
    updateUi();
    persist();
  }, 1000);
}

function startRevealFlow() {
  if (!state.players.length) {
    return;
  }

  stopTimers();
  state.phase = PHASES.REVEALING;
  state.currentPrompt = null;
  updateUi();
  spotlightPulse();
  audio.play('reveal');

  const poolPreview = [promptLibrary?.name || 'Generated Mega Deck'];

  let cycles = 0;
  revealInterval = setInterval(() => {
    cycles += 1;
    const name = poolPreview[Math.floor(Math.random() * poolPreview.length)] || 'General';
    elements.promptText.textContent = `Selecting from ${name}...`;
  }, 120);

  setTimeout(() => {
    clearInterval(revealInterval);
    const prompt = drawNextPrompt(state, promptLibrary);
    if (!prompt) {
      elements.promptText.textContent = 'No prompts left in the mega deck. Reset prompt deck in Settings.';
      state.phase = PHASES.READY;
      updateUi();
      return;
    }

    state.currentPrompt = prompt;
    state.usedPromptIds.push(prompt.id);
    state.stats.promptsUsed += 1;
    state.phase = PHASES.READING;
    audio.play('round', { multiplier: 0.5 });
    updateUi();

    readingTimeout = setTimeout(() => {
      startCountdown();
    }, settings.readingDelayMs);

    persist();
  }, Math.min(1500, 600 + cycles * 60));
}

function applyScore(isCorrect) {
  if (state.phase !== PHASES.SCORING) {
    return;
  }

  const player = state.players[state.currentPlayerIndex];
  state.stats.turns += 1;

  if (isCorrect) {
    player.score += 1;
    player.correct += 1;
    player.streak += 1;
    player.longestStreak = Math.max(player.longestStreak, player.streak);
    state.stats.longestStreak = Math.max(state.stats.longestStreak, player.streak);
    audio.play('correct');
  } else {
    player.incorrect += 1;
    player.streak = 0;
    audio.play('incorrect');
  }

  const { nextIndex, round } = nextTurn(state);
  state.currentPlayerIndex = nextIndex;
  state.round = round;
  state.phase = PHASES.READY;

  updateUi();
  persist();
}

function startGameFromInput() {
  const names = elements.playerInput.value
    .split('\n')
    .map((name) => name.trim())
    .filter(Boolean);

  if (names.length < 2) {
    window.alert('Add at least 2 players to start.');
    return;
  }

  state = createInitialState();
  state.players = createPlayers(names);
  state.phase = PHASES.READY;
  state.round = 1;
  state.currentPlayerIndex = 0;

  audio.unlock();
  audio.play('intro');
  updateUi();
  persist();
}

function endGame() {
  stopTimers();
  state.phase = PHASES.ENDED;
  audio.play('winner');
  renderEndgame(elements, state);
  elements.endgamePanel.showModal();
  updateUi();
  persist();
}

function attachEvents() {
  elements.startGameBtn.addEventListener('click', startGameFromInput);
  elements.startTurnBtn.addEventListener('click', () => {
    audio.unlock();
    if (state.phase === PHASES.SETUP) {
      startGameFromInput();
      return;
    }
    if (state.phase === PHASES.READY) {
      startRevealFlow();
    }
  });

  elements.correctBtn.addEventListener('click', () => applyScore(true));
  elements.incorrectBtn.addEventListener('click', () => applyScore(false));

  elements.skipBtn.addEventListener('click', () => {
    if (![PHASES.REVEALING, PHASES.READING, PHASES.READY].includes(state.phase)) {
      return;
    }
    stopTimers();
    startRevealFlow();
  });

  elements.endGameBtn.addEventListener('click', () => {
    if (state.players.length === 0) {
      return;
    }
    if (window.confirm('End game and reveal winner?')) {
      endGame();
    }
  });

  elements.muteBtn.addEventListener('click', () => {
    settings.muted = !settings.muted;
    audio.setMuted(settings.muted);
    updateUi();
    persist();
  });

  elements.testSoundBtn.addEventListener('click', () => {
    audio.unlock();
    audio.test();
  });

  elements.settingsToggle.addEventListener('click', () => {
    elements.settingsPanel.classList.toggle('is-open');
  });

  elements.timerInput.addEventListener('change', (event) => {
    const value = Number(event.target.value);
    settings.timerLength = Number.isFinite(value) ? Math.max(3, Math.min(10, value)) : 5;
    event.target.value = settings.timerLength;
    persist();
    updateUi();
  });

  elements.delayInput.addEventListener('change', (event) => {
    const value = Number(event.target.value);
    settings.readingDelayMs = Number.isFinite(value) ? Math.max(500, Math.min(5000, value)) : 1700;
    event.target.value = settings.readingDelayMs;
    persist();
  });

  elements.volumeInput.addEventListener('input', (event) => {
    settings.volume = Number(event.target.value);
    audio.setVolume(settings.volume);
    updateUi();
    persist();
  });

  elements.animationSelect.addEventListener('change', (event) => {
    settings.animationIntensity = event.target.value;
    applyAnimationIntensity();
    persist();
  });

  elements.resetDeckBtn.addEventListener('click', () => {
    if (!window.confirm('Reset used prompts and reuse every prompt?')) {
      return;
    }
    state.usedPromptIds = [];
    updateUi();
    persist();
  });

  elements.resetGameBtn.addEventListener('click', () => {
    if (!window.confirm('Reset current game and clear saved state?')) {
      return;
    }
    stopTimers();
    clearGameState();
    state = createInitialState();
    updateUi();
  });

  elements.resumeBtn.addEventListener('click', () => {
    elements.sessionModal.close();
    state.waitingForResumeChoice = false;
    updateUi();
  });

  elements.newSessionBtn.addEventListener('click', () => {
    clearGameState();
    state = createInitialState();
    elements.sessionModal.close();
    updateUi();
  });

  elements.playAgainBtn.addEventListener('click', () => {
    elements.endgamePanel.close();
    state.phase = PHASES.READY;
    state.currentPlayerIndex = 0;
    state.round = 1;
    state.usedPromptIds = [];
    state.currentPrompt = null;
    state.players = state.players.map((player) => ({
      ...player,
      score: 0,
      correct: 0,
      incorrect: 0,
      streak: 0,
      longestStreak: 0
    }));
    state.stats = { turns: 0, promptsUsed: 0, longestStreak: 0 };
    updateUi();
    persist();
  });

  document.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === ' ') {
      event.preventDefault();
      if (state.phase === PHASES.READY) {
        startRevealFlow();
      } else if (state.phase === PHASES.SETUP) {
        startGameFromInput();
      }
      return;
    }

    if (key === 'y') {
      applyScore(true);
    } else if (key === 'n') {
      applyScore(false);
    } else if (key === 's') {
      elements.skipBtn.click();
    } else if (key === 'm') {
      elements.muteBtn.click();
    } else if (key === 'r') {
      elements.resetGameBtn.click();
    } else if (key === 'f') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }
  });
}

async function init() {
  promptLibrary = await loadPromptLibrary();

  const saved = loadGameState();
  if (saved?.players?.length) {
    state = { ...createInitialState(), ...saved, waitingForResumeChoice: true };
    elements.sessionModal.showModal();
  }

  elements.timerInput.value = settings.timerLength;
  elements.delayInput.value = settings.readingDelayMs;
  elements.volumeInput.value = settings.volume;
  elements.animationSelect.value = settings.animationIntensity;

  applyAnimationIntensity();
  audio.setMuted(settings.muted);
  audio.setVolume(settings.volume);
  attachEvents();
  updateUi();
}

init().catch((error) => {
  console.error(error);
  elements.promptText.textContent = 'Failed to load prompt library. Check local file paths.';
});
