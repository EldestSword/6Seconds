import { PHASES, getLeaderboard } from './game.js';

function escapeText(value) {
  const span = document.createElement('span');
  span.textContent = value;
  return span.textContent;
}

function phaseLabel(phase) {
  switch (phase) {
    case PHASES.READY:
      return 'Ready for next turn';
    case PHASES.REVEALING:
      return 'Selecting prompt...';
    case PHASES.READING:
      return 'Reading time';
    case PHASES.COUNTDOWN:
      return 'Countdown live';
    case PHASES.SCORING:
      return 'Waiting for host score';
    case PHASES.ENDED:
      return 'Game over';
    default:
      return 'Setup';
  }
}

export function renderPlayers(container, state) {
  container.innerHTML = '';
  const leaders = getLeaderboard(state.players);
  const topScore = leaders[0]?.score ?? 0;

  state.players.forEach((player, index) => {
    const card = document.createElement('article');
    card.className = 'player-card';
    if (index === state.currentPlayerIndex && state.phase !== PHASES.SETUP && state.phase !== PHASES.ENDED) {
      card.classList.add('is-current');
    }
    if (player.score === topScore && topScore > 0) {
      card.classList.add('is-leading');
    }

    card.innerHTML = `
      <h3>${escapeText(player.name)}</h3>
      <p class="score" data-score="${player.score}">${player.score}</p>
      <p class="meta">✅ ${player.correct} · ❌ ${player.incorrect} · 🔥 ${player.streak}</p>
    `;
    container.appendChild(card);
  });
}

export function render(state, settings, elements) {
  const current = state.players[state.currentPlayerIndex];

  elements.roundValue.textContent = String(state.round);
  elements.statusPill.textContent = phaseLabel(state.phase);
  elements.playerSpotlight.textContent = current ? `${current.name.toUpperCase()} IS UP!` : 'SETUP MODE';
  elements.promptText.textContent = state.currentPrompt?.text ?? 'Press Start Game to begin the chaos.';
  elements.packTag.textContent = state.currentPrompt ? `Library: ${state.currentPrompt.libraryName}` : 'Library: --';
  elements.countdown.textContent = state.phase === PHASES.COUNTDOWN ? String(state.countdownValue) : '5';
  elements.countdown.classList.toggle('is-live', state.phase === PHASES.COUNTDOWN);

  elements.startTurnBtn.disabled = ![PHASES.READY, PHASES.SETUP].includes(state.phase);
  elements.correctBtn.disabled = state.phase !== PHASES.SCORING;
  elements.incorrectBtn.disabled = state.phase !== PHASES.SCORING;
  elements.skipBtn.disabled = ![PHASES.REVEALING, PHASES.READING, PHASES.READY].includes(state.phase);

  elements.muteBtn.textContent = settings.muted ? '🔇 Unmute' : '🔊 Mute';
  elements.volumeValue.textContent = `${Math.round(settings.volume * 100)}%`;

  elements.stateDebug.textContent = `Round ${state.round} · Turn ${state.currentPlayerIndex + 1}/${state.players.length || 0} · ${phaseLabel(state.phase)}`;

  renderPlayers(elements.scoreboard, state);
}

export function renderEndgame(elements, state) {
  const leaderboard = getLeaderboard(state.players);
  elements.finalBoard.innerHTML = leaderboard
    .map((player, idx) => `<li><span>#${idx + 1} ${escapeText(player.name)}</span><strong>${player.score} pts</strong></li>`)
    .join('');

  const winner = leaderboard[0];
  const tied = leaderboard.filter((p) => p.score === winner.score);
  elements.winnerText.textContent = tied.length > 1
    ? `It's a tie between ${tied.map((p) => p.name).join(' & ')}!`
    : `${winner.name} wins BIG TWED glory!`;

  elements.statPrompts.textContent = String(state.stats.promptsUsed);
  elements.statTurns.textContent = String(state.stats.turns);
  elements.statStreak.textContent = String(state.stats.longestStreak);
}
