const KEY = "iyrs_session";
const KEY_PREFS = "iyrs_prefs";

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function saveSession(user) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ user, ts: Date.now() }));
  } catch {}
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function getPrefs() {
  try {
    return JSON.parse(localStorage.getItem(KEY_PREFS)) ?? {};
  } catch {
    return {};
  }
}

export function setPref(key, value) {
  const p = getPrefs();
  p[key] = value;
  try {
    localStorage.setItem(KEY_PREFS, JSON.stringify(p));
  } catch {}
}

export function hasClearedForest() {
  return !!getPrefs().forestCleared;
}

export function markForestCleared() {
  setPref("forestCleared", true);
}

export function isAutoDesktop() {
  return !!getPrefs().autoDesktop;
}

export function setAutoDesktop(v) {
  setPref("autoDesktop", v);
}
