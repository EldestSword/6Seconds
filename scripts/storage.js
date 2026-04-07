const STORAGE_KEY = 'bigTwedGameState.v2';
const SETTINGS_KEY = 'bigTwedSettings.v2';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function saveGameState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Unable to save game state', error);
  }
}

export function loadGameState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Unable to load saved game state', error);
    return null;
  }
}

export function clearGameState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Unable to save settings', error);
  }
}

export function loadSettings(defaultSettings) {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return clone(defaultSettings);
    }
    return { ...clone(defaultSettings), ...JSON.parse(raw) };
  } catch (error) {
    console.warn('Unable to load settings', error);
    return clone(defaultSettings);
  }
}
