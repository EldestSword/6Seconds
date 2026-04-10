# AGENTS.md

## Purpose
Maintain and extend **BIG TWED'S 5 SECOND RULE RIP OFF** as a premium-feeling, static browser game-show app for screen-sharing hosts.

## Architecture
- Static front-end only (HTML/CSS/JS).
- Core modules:
  - `scripts/app.js`: orchestration, timers, controls, hotkeys.
  - `scripts/game.js`: state model, phases, defaults, turn helpers.
  - `scripts/prompts.js`: runtime prompt-library loading and prompt drawing.
  - `scripts/generate-prompts.js`: offline prompt generation pipeline.
  - `scripts/audio.js`: local sound playback and mute/volume handling.
  - `scripts/storage.js`: `localStorage` persistence.
  - `scripts/ui.js`: render and visual state updates.
- Styling in `styles/main.css`.
- Prompt content + generation sources in:
  - `data/prompts/templates.json`
  - `data/prompts/wordbanks.json`
  - `data/prompts/generated-prompts.json`

## Design goals
- Game-show energy: dramatic, colorful, readable, polished.
- Teams-friendly readability:
  - large text
  - high contrast
  - clear active turn and score state
- Fast host flow with minimal friction.

## Hard constraints
- No backend.
- Prefer text-only repository contents for portability (avoid committing binary assets when equivalent JS/CSS solutions exist).
- No external services required at runtime.
- No `eval`.
- No unsafe dynamic script injection.
- Prompt text must be rendered safely (no unsafe HTML insertion from content).

## Prompt architecture rules
- Runtime prompt source is `data/prompts/generated-prompts.json` (single large library).
- Expand prompt volume by editing templates and word banks, then regenerating output.
- Avoid returning to long hand-written prompt arrays as the primary prompt source.
- No repeats in-session unless host resets the prompt deck.

## Prompt generation expectations
- Keep all generated prompts work-safe for team settings.
- Avoid sexual/offensive/political/hateful/invasive prompts.
- Favor quick-read, quick-answer spoken prompts.
- Use generation quality controls:
  - deduplication
  - basic grammar/readability checks
  - rule-based exclusion of awkward combinations
- Keep “Name 3...” prefix for all prompts.

## Regeneration workflow
- Run `npm run generate-prompts` from repo root.
- This regenerates `data/prompts/generated-prompts.json` from templates + word banks.

## Change discipline
- Update `CHANGELOG.md` using Keep a Changelog + SemVer.
- Document major feature behavior in `README.md`.
- Preserve compatibility with simple local static hosting (e.g. `python -m http.server`).

## Quality expectations
- Preserve core turn loop.
- Keep animations dramatic but quick.
- Keep host controls obvious and keyboard-friendly.
- Degrade gracefully when audio autoplay is blocked.
