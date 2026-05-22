const KEYS = {
  settings: 'pomo.settings',
  tasks: 'pomo.tasks',
  history: 'pomo.history',
  activeTaskId: 'pomo.activeTaskId',
};

export const defaultSettings = {
  workMin: 25,
  breakMin: 5,
  longBreakMin: 15,
  longBreakEvery: 4,
  autoStartBreak: false,
  autoStartWork: false,
};

export function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(KEYS.settings));
    return { ...defaultSettings, ...(s || {}) };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(s) {
  localStorage.setItem(KEYS.settings, JSON.stringify(s));
}

export function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.tasks)) || [];
  } catch {
    return [];
  }
}

export function saveTasks(t) {
  localStorage.setItem(KEYS.tasks, JSON.stringify(t));
}

export function loadActiveTaskId() {
  return localStorage.getItem(KEYS.activeTaskId) || null;
}

export function saveActiveTaskId(id) {
  if (id) localStorage.setItem(KEYS.activeTaskId, id);
  else localStorage.removeItem(KEYS.activeTaskId);
}

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.history)) || {};
  } catch {
    return {};
  }
}

export function saveHistory(h) {
  localStorage.setItem(KEYS.history, JSON.stringify(h));
}

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
