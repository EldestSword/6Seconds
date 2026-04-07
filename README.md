# BIG TWED'S 5 SECOND RULE RIP OFF

A premium-styled, static browser game-show app for fast-paced **"Name 3..."** rounds over screen share (designed for Microsoft Teams hosting).

## Run locally

This project is static HTML/CSS/JS.

1. Start a local server from the repo root:
   - `python -m http.server 8000`
2. Open `http://localhost:8000`.

> Running with a local server is recommended so JSON prompt packs load reliably.

## Core game flow

1. Host enters player names (one per line).
2. Start game.
3. One player takes one turn each round.
4. Prompt reveal animation.
5. Reading delay.
6. Countdown (default 5s).
7. Buzzer.
8. Host marks correct/incorrect.
9. Score updates and next turn starts.

Prompts do not repeat until the deck is exhausted or reset.

## Features

- Premium game-show UI theme with bold title treatment.
- Dramatic prompt reveal and player spotlight transitions.
- Local sound design bundle (intro/reveal/tick/buzzer/correct/incorrect/round/winner).
- Host hotkeys for live operation:
  - `Space` start/continue
  - `Y` correct
  - `N` incorrect
  - `S` skip prompt
  - `M` mute
  - `R` reset game (with confirmation)
  - `F` fullscreen
- Producer controls panel:
  - timer length
  - reading delay
  - volume
  - mute
  - animation intensity
  - prompt pack toggles
  - reset prompt deck
  - reset game
- Save/resume support via `localStorage`.
- Endgame modal with ranking + session stats.

## File structure

```text
.
├── index.html
├── README.md
├── AGENTS.md
├── CHANGELOG.md
├── assets/
│   └── audio/
├── data/
│   └── prompts/
├── scripts/
│   ├── app.js
│   ├── audio.js
│   ├── game.js
│   ├── prompts.js
│   ├── storage.js
│   └── ui.js
└── styles/
    └── main.css
```

## Prompt packs

Prompt packs live in `data/prompts/*.json` and are loaded locally at startup.
Each pack provides:

- `id`
- `name`
- `description`
- `prompts` array

Add new packs by creating a JSON file and registering it in `scripts/prompts.js`.

## Save / resume behavior

Saved session includes:

- player names and scores
- round and current player
- used prompt IDs
- current settings
- session stats

On load, if a previous session exists, the app shows **Resume Game** or **Start New**.

## Assets

- Audio is synthesized in-browser via the Web Audio API (no binary media assets required, no remote dependencies).
- No backend, no external APIs, no runtime third-party services.
