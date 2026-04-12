#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TEMPLATES_PATH = path.join(ROOT, 'data/prompts/templates.json');
const WORDBANKS_PATH = path.join(ROOT, 'data/prompts/wordbanks.json');
const CLASSIC_CORE_PATH = path.join(ROOT, 'data/prompts/classic-core-prompts.json');
const OUTPUT_PATH = path.join(ROOT, 'data/prompts/generated-prompts.json');

const TARGET_PROMPTS = 3600;

const FAMILY_WEIGHTS = {
  classic: 0.45,
  letter: 0.25,
  place: 0.15,
  feature: 0.1,
  lifestyle: 0.05
};

const LETTER_COMPATIBILITY = {
  countries: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'],
  cities: ['A', 'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'],
  animals: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'P', 'R', 'S', 'T'],
  "boys' names": ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'],
  "girls' names": ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'],
  foods: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'M', 'P', 'R', 'S', 'T'],
  drinks: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'L', 'M', 'P', 'R', 'S', 'T'],
  jobs: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'L', 'M', 'N', 'P', 'R', 'S', 'T'],
  'movie villains': ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'L', 'M', 'P', 'R', 'S', 'T'],
  superheroes: ['A', 'B', 'C', 'D', 'F', 'G', 'H', 'I', 'L', 'M', 'P', 'R', 'S', 'T'],
  'video game characters': ['B', 'C', 'D', 'F', 'G', 'K', 'L', 'M', 'P', 'R', 'S', 'T'],
  'musical instruments': ['B', 'C', 'D', 'F', 'G', 'H', 'K', 'L', 'M', 'P', 'S', 'T']
};

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function normalizePrompt(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function shuffle(values) {
  const array = [...values];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function cartesian(slotNames, banks) {
  if (!slotNames.length) return [{}];
  const [head, ...rest] = slotNames;
  const tail = cartesian(rest, banks);
  const out = [];
  for (const value of banks[head] ?? []) {
    for (const suffix of tail) {
      out.push({ [head]: value, ...suffix });
    }
  }
  return out;
}

function applySlots(text, picked) {
  let prompt = text;
  for (const [slot, value] of Object.entries(picked)) {
    prompt = prompt.replace(`{${slot}}`, value);
  }
  return prompt;
}

function isLetterCompatible(picked) {
  if (!picked.categoryLetterPlural || !picked.letter) return true;
  const allowed = LETTER_COMPATIBILITY[picked.categoryLetterPlural];
  return Array.isArray(allowed) ? allowed.includes(picked.letter) : true;
}

function readabilityFilter(prompt) {
  if (!prompt?.startsWith('Name 3 ')) return false;
  if (prompt.length < 18 || prompt.length > 90) return false;
  const words = normalizePrompt(prompt).split(' ');
  return words.length >= 4 && words.length <= 12;
}

function objectivityFilter(prompt) {
  const lower = prompt.toLowerCase();
  return !/\b(if|might|could|would do|someone|during|secretly|imagine|pretend)\b/.test(lower);
}

function nichenessFilter(prompt) {
  const lower = prompt.toLowerCase();
  const clauseHits = (lower.match(/\b(with|when|while|because|after|before|unless|although|which)\b/g) || []).length;
  return clauseHits <= 1;
}

function judgeabilityFilter(prompt) {
  const lower = prompt.toLowerCase();
  return /beginning with|things you'd find|things you'd see|things with|kinds of|things in|associated with|you wear in|you'd take on/.test(lower) || /^name 3 [a-z0-9'\- ]+\.$/i.test(prompt);
}

function awkwardCombinationFilter(prompt) {
  const lower = prompt.toLowerCase();
  const banned = [
    /name 3 (countries|cities|us states) for /,
    /name 3 (movie villains|superheroes|tv characters|cartoon characters) for /,
    /name 3 (countries|cities|us states) people (eat|drink|wear|use|play|watch)/,
    /name 3 .* in a beach\./
  ];
  return !banned.some((pattern) => pattern.test(lower));
}

function qualityFilter(prompt) {
  return readabilityFilter(prompt) && objectivityFilter(prompt) && nichenessFilter(prompt) && judgeabilityFilter(prompt) && awkwardCombinationFilter(prompt);
}

function targetForFamily(family) {
  return Math.floor(TARGET_PROMPTS * (FAMILY_WEIGHTS[family] ?? 0));
}

function generateFamilyPrompts(templates, banks, family, normalizedSet) {
  const familyTemplates = templates.filter((template) => template.family === family);
  const candidates = [];

  for (const template of familyTemplates) {
    const slots = [...template.text.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1]);
    const combos = cartesian(slots, banks);

    for (const picked of combos) {
      if (!isLetterCompatible(picked)) continue;
      const prompt = applySlots(template.text, picked);
      if (!qualityFilter(prompt)) continue;
      candidates.push(prompt);
    }
  }

  const familyTarget = targetForFamily(family);
  const out = [];
  for (const prompt of shuffle(candidates)) {
    const key = normalizePrompt(prompt);
    if (normalizedSet.has(key)) continue;
    normalizedSet.add(key);
    out.push(prompt);
    if (out.length >= familyTarget) break;
  }

  return out;
}

function buildDeck() {
  const templates = loadJson(TEMPLATES_PATH).templates;
  const banks = loadJson(WORDBANKS_PATH).banks;
  const classicPayload = loadJson(CLASSIC_CORE_PATH);

  const normalized = new Set();
  const classicCore = [];
  const classicCoreLetter = [];
  const classicCoreNonLetter = [];
  for (const prompt of classicPayload.prompts ?? []) {
    if (!qualityFilter(prompt)) continue;
    const key = normalizePrompt(prompt);
    if (normalized.has(key)) continue;
    normalized.add(key);
    classicCore.push(prompt);
    if (/beginning with/i.test(prompt)) {
      classicCoreLetter.push(prompt);
    } else {
      classicCoreNonLetter.push(prompt);
    }
  }

  const generatedByFamily = {};
  for (const family of Object.keys(FAMILY_WEIGHTS)) {
    generatedByFamily[family] = generateFamilyPrompts(templates, banks, family, normalized);
  }

  const pools = {
    classic: shuffle([...classicCoreNonLetter, ...generatedByFamily.classic]),
    letter: shuffle([...classicCoreLetter, ...generatedByFamily.letter]),
    place: shuffle(generatedByFamily.place),
    feature: shuffle(generatedByFamily.feature),
    lifestyle: shuffle(generatedByFamily.lifestyle)
  };

  const combined = [];
  const used = new Set();

  for (const family of Object.keys(FAMILY_WEIGHTS)) {
    const quota = targetForFamily(family);
    let pickedForFamily = 0;
    for (const prompt of pools[family]) {
      const key = normalizePrompt(prompt);
      if (used.has(key)) continue;
      used.add(key);
      combined.push(prompt);
      pickedForFamily += 1;
      if (combined.length >= TARGET_PROMPTS || pickedForFamily >= quota) break;
    }
  }

  const leftovers = shuffle(Object.values(pools).flat());
  for (const prompt of leftovers) {
    if (combined.length >= TARGET_PROMPTS) break;
    const key = normalizePrompt(prompt);
    if (used.has(key)) continue;
    used.add(key);
    combined.push(prompt);
  }

  if (combined.length < 3000) {
    throw new Error(`Only generated ${combined.length} prompts; expected at least 3000.`);
  }

  const generated = Object.values(generatedByFamily).flat();

  const output = {
    id: 'generatedMegaDeck',
    name: 'Generated Mega Deck',
    description: 'Classic-style Name 3 prompt library tuned for fast, objective, low-argument rounds.',
    source: {
      templatesFile: 'data/prompts/templates.json',
      wordbanksFile: 'data/prompts/wordbanks.json',
      classicCoreFile: 'data/prompts/classic-core-prompts.json',
      generatedAt: new Date().toISOString(),
      target: TARGET_PROMPTS,
      familyWeights: FAMILY_WEIGHTS,
      familyCounts: Object.fromEntries(Object.entries(generatedByFamily).map(([family, prompts]) => [family, prompts.length])),
      classicCoreCount: classicCore.length,
      generatedCount: generated.length,
      totalCount: combined.length
    },
    prompts: combined
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Generated ${combined.length} prompts to ${path.relative(ROOT, OUTPUT_PATH)}`);
}

buildDeck();
