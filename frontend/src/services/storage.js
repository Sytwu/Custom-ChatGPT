const KEYS = {
  settings: "ccgpt_settings",
  apiKeys: "ccgpt_api_keys",
  conversations: "ccgpt_conversations",
  activeId: "ccgpt_active_id",
  groups: "ccgpt_groups",
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors (e.g. private mode quota)
  }
}

export function loadSettings() {
  return load(KEYS.settings, null);
}

export function saveSettings(settings) {
  save(KEYS.settings, settings);
}

export function loadApiKeys() {
  return load(KEYS.apiKeys, { groqApiKey: "", nvidiaApiKey: "" });
}

export function saveApiKeys(keys) {
  save(KEYS.apiKeys, keys);
}

export function loadConversations() {
  return load(KEYS.conversations, []);
}

export function saveConversations(conversations) {
  save(KEYS.conversations, conversations);
}

export function loadActiveId() {
  return load(KEYS.activeId, null);
}

export function saveActiveId(id) {
  save(KEYS.activeId, id);
}

export function loadGroups() {
  return load(KEYS.groups, []);
}

export function saveGroups(groups) {
  save(KEYS.groups, groups);
}
