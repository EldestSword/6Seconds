const PACK_FILES = [
  'data/prompts/general.json',
  'data/prompts/food.json',
  'data/prompts/films-tv.json',
  'data/prompts/music.json',
  'data/prompts/geography.json',
  'data/prompts/worksafe-chaos.json'
];

export async function loadPromptPacks() {
  const responses = await Promise.all(
    PACK_FILES.map(async (file) => {
      const response = await fetch(file, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to load prompt pack: ${file}`);
      }
      return response.json();
    })
  );

  return responses.map((pack) => ({
    ...pack,
    prompts: pack.prompts.filter((prompt) => typeof prompt === 'string' && prompt.trim().length > 0)
  }));
}

export function getPromptPool(packs, enabledPackIds) {
  return packs
    .filter((pack) => enabledPackIds.includes(pack.id))
    .flatMap((pack) =>
      pack.prompts.map((prompt, index) => ({
        id: `${pack.id}:${index}`,
        packId: pack.id,
        packName: pack.name,
        text: prompt.trim()
      }))
    );
}

export function drawPrompt(pool, usedPromptIds) {
  const unused = pool.filter((item) => !usedPromptIds.has(item.id));
  if (unused.length === 0) {
    return null;
  }
  const choice = unused[Math.floor(Math.random() * unused.length)];
  return choice;
}
