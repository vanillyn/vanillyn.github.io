export const settings = {
  fov: 45,
  mouseSensitivity: 1.0,
};

const listeners = new Set();
export function onSettingsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function setSetting(key, value) {
  settings[key] = value;
  listeners.forEach((fn) => fn(key, value));
}
