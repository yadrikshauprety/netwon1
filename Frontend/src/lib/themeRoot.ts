/** Inline vars set by MoodGate / mood flow; must match keys we set on documentElement. */
const ROOT_MOOD_STYLE_KEYS = [
  '--primary',
  '--primary-transparent',
  '--card',
  '--background',
  '--mood-accent',
  '--ring',
  '--sidebar-primary',
  '--sidebar-ring',
] as const;

/** Restore theme tokens from CSS (:root) after mood overrides or logout. */
export function clearRootMoodThemeOverrides(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const key of ROOT_MOOD_STYLE_KEYS) {
    root.style.removeProperty(key);
  }
}
