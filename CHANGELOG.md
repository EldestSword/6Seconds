# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-04-12

### Added
- Added a curated classic-style prompt bank at `data/prompts/classic-core-prompts.json` with several hundred concrete, low-argument prompts.
- Added generator family weighting targets (classic/category, letter, place, feature, lifestyle) for consistent 5-second-rule style coverage.
- Added explicit letter/category compatibility rules to avoid weak or awkward starting-letter combinations.
- Added stronger quality gates in generation: objectivity, nicheness, judgeability, and readability filters.

### Changed
- Refactored prompt templates and word banks around concrete recall categories instead of scenario-heavy improv-style premises.
- Rebuilt the prompt generation script to combine curated classic prompts with safer generated prompts into a single runtime mega-deck.
- Tuned target prompt count toward quality-first scale (about 3k-5k, default target 3600).
- Updated prompt docs in `README.md` and `AGENTS.md` to reflect the new classic-first philosophy.

### Removed
- Removed legacy scenario/hypothetical generation patterns from template + filter flow (e.g., `if`, `might happen`, and multi-clause behavior prompts).

## [1.2.0] - 2026-04-10

### Added
- Added a template + word-bank prompt generation pipeline with `scripts/generate-prompts.js`.
- Added editable generation sources at `data/prompts/templates.json` and `data/prompts/wordbanks.json`.
- Added a large generated runtime prompt dataset at `data/prompts/generated-prompts.json` (5,000+ prompts).
- Added `package.json` script `npm run generate-prompts` for repeatable prompt regeneration.

### Changed
- Replaced multi-pack prompt loading with a single generated mega-deck prompt library.
- Updated runtime prompt selection and UI labeling to use the generated library model while preserving no-repeat-in-session behavior.
- Simplified producer controls by removing prompt pack toggles and keeping deck reset flow.
- Updated docs (`README.md`, `AGENTS.md`) to describe the new scalable prompt architecture and workflow.

### Removed
- Removed legacy small static prompt pack JSON files.

## [1.1.1] - 2026-04-06

### Fixed
- Removed binary `.wav` assets that prevented PR creation in environments that reject binary file diffs.
- Replaced file-based audio playback with Web Audio API synthesis so all sound cues remain local, static, and repository-text-only.

## [1.1.0] - 2026-04-06

### Added
- Modular static app structure split into focused scripts for app flow, game state, prompts, audio, storage, and UI rendering.
- Premium game-show visual redesign with bold title lockup, spotlight, high-contrast stage layout, and improved Teams readability.
- Dramatic turn reveal sequence with animated prompt selection and reading-delay-to-countdown flow.
- Local bundled sound suite: intro, reveal, tick, buzzer, correct, incorrect, round transition, and winner fanfare.
- Producer controls panel for timer length, reading delay, volume, animation intensity, prompt pack toggles, deck reset, and game reset.
- Hotkeys for live hosting (`Space`, `Y`, `N`, `S`, `M`, `R`, `F`) with input-safe handling.
- Prompt pack architecture using local JSON files with multiple categories and non-repeating prompt draw logic.
- Local save/resume session support with resume-or-new choice on load.
- Endgame winner/results modal with ranked scoreboard and session stats.

### Changed
- Upgraded branding and typography treatment to emphasize “BIG TWED'S 5 SECOND RULE RIP OFF” as a playful premium game title.
- Improved scoreboard presentation with current player highlighting and leader indicators.

### Security
- Kept implementation static and browser-only with no backend and no remote runtime dependencies.
- Prompt content rendering remains text-safe to avoid unsafe HTML injection from prompt data.
