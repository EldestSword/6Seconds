const PROMPT_LIBRARY_FILE = 'data/prompts/generated-prompts.json';

export async function loadPromptLibrary() {
  const response = await fetch(PROMPT_LIBRARY_FILE, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load prompt library: ${PROMPT_LIBRARY_FILE}`);
  }

  const payload = await response.json();
  const prompts = Array.isArray(payload.prompts)
    ? payload.prompts.filter((prompt) => typeof prompt === 'string' && prompt.trim().length > 0)
    : [];

  return {
    id: payload.id || 'generatedMegaDeck',
    name: payload.name || 'Generated Mega Deck',
    description: payload.description || 'Large generated work-safe Name 3 prompt library.',
    prompts
  };
}

export function getPromptPool(library) {
  return library.prompts.map((prompt, index) => ({
    id: `${library.id}:${index}`,
    libraryId: library.id,
    libraryName: library.name,
    text: prompt.trim()
  }));
}

export function drawPrompt(pool, usedPromptIds) {
  const unused = pool.filter((item) => !usedPromptIds.has(item.id));
  if (!unused.length) {
    return null;
  }
  return unused[Math.floor(Math.random() * unused.length)];
}
