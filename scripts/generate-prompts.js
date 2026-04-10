#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TEMPLATES_PATH = path.join(ROOT, 'data/prompts/templates.json');
const WORDBANKS_PATH = path.join(ROOT, 'data/prompts/wordbanks.json');
const OUTPUT_PATH = path.join(ROOT, 'data/prompts/generated-prompts.json');

const TARGET_PROMPTS = 6500;

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function normalizePrompt(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleTokenSet(value) {
  return new Set(normalizePrompt(value).split(' ').filter((token) => token.length > 2));
}

function jaccard(a, b) {
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function applySlots(template, banks) {
  let prompt = template.text;
  const slots = [...template.text.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]);

  for (const slot of slots) {
    const bank = banks[slot];
    if (!bank?.length) {
      return null;
    }
    const choice = bank[Math.floor(Math.random() * bank.length)];
    prompt = prompt.replace(`{${slot}}`, choice);
  }

  return prompt;
}

function qualityFilter(prompt) {
  if (!prompt || !prompt.startsWith('Name 3')) return false;
  if (prompt.length < 20 || prompt.length > 96) return false;
  if (/\b(?:politics|religion|sex|drugs|violence|weapon)\b/i.test(prompt)) return false;
  if (/\s{2,}/.test(prompt)) return false;

  const lower = prompt.toLowerCase();
  const bannedAwkward = [
    'name 3 things that are are',
    'name 3 things you you',
    'name 3 reasons someone might might',
    'name 3 things that would ruin an office celebration'
  ];

  if (bannedAwkward.some((phrase) => lower.includes(phrase))) return false;

  const words = normalizePrompt(prompt).split(' ');
  for (let i = 1; i < words.length; i += 1) {
    if (words[i] === words[i - 1] && words[i].length > 2) {
      return false;
    }
  }

  return true;
}

function generate() {
  const templatesPayload = loadJson(TEMPLATES_PATH);
  const banksPayload = loadJson(WORDBANKS_PATH);
  const templates = templatesPayload.templates;
  const banks = banksPayload.banks;

  const prompts = [];
  const normalized = new Set();
  const tokenSets = [];

  const attemptsLimit = TARGET_PROMPTS * 25;
  let attempts = 0;

  while (prompts.length < TARGET_PROMPTS && attempts < attemptsLimit) {
    attempts += 1;
    const template = templates[Math.floor(Math.random() * templates.length)];
    const prompt = applySlots(template, banks);

    if (!qualityFilter(prompt)) continue;

    const normalizedPrompt = normalizePrompt(prompt);
    if (normalized.has(normalizedPrompt)) continue;

    const tokens = titleTokenSet(prompt);
    if (tokens.size < 4) continue;

    const nearDuplicate = tokenSets.some((existing) => jaccard(existing, tokens) > 0.985);
    if (nearDuplicate) continue;

    normalized.add(normalizedPrompt);
    tokenSets.push(tokens);
    prompts.push(prompt);
  }

  if (prompts.length < 3000) {
    throw new Error(`Only generated ${prompts.length} prompts; expected at least 3000.`);
  }

  const output = {
    id: 'generatedMegaDeck',
    name: 'Generated Mega Deck',
    description: 'Large generated work-safe Name 3 prompt library.',
    source: {
      templatesFile: 'data/prompts/templates.json',
      wordbanksFile: 'data/prompts/wordbanks.json',
      generatedAt: new Date().toISOString(),
      target: TARGET_PROMPTS,
      attempts
    },
    prompts
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Generated ${prompts.length} prompts to ${path.relative(ROOT, OUTPUT_PATH)}`);
}

generate();
