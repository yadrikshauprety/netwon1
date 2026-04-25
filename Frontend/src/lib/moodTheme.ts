/** Mood keys from MoodGate; values are hex for --mood-accent and hero tints. */
export const MOOD_HEX: Record<string, string> = {
  purple: '#7F77DD',
  amber: '#EF9F27',
  rose: '#ED93B1',
  green: '#1D9E75',
  blue: '#378ADD',
  coral: '#D85A30',
  yellow: '#FAC775',
  nearwhite: '#b0a89a',
};

const DEFAULT_MOOD_KEY = 'green';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '').slice(0, 6);
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}

/** Space-separated HSL values for `hsl(var(--primary))` (Tailwind / shadcn). */
export function hexToHslTriplet(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  const hue = Math.round(h * 360);
  const sat = Math.round(s * 100);
  let light = Math.round(l * 100);

  /** Keep sidebar / text-primary readable on cream backgrounds. */
  if (light > 52) light = Math.max(38, light - 14);
  if (light < 28) light = 32;

  return `${hue} ${sat}% ${light}%`;
}

export function moodHeroGradient(accentHex: string): string {
  const h = accentHex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a1 = 0.32;
  const a2 = 0.16;
  return `linear-gradient(135deg, rgba(${r},${g},${b},${a1}) 0%, #faf0e6 42%, rgba(${r},${g},${b},${a2}) 100%)`;
}

/**
 * Sets root tokens used by Tailwind `primary` and inline `var(--mood-accent)`.
 * Safe while logged in; cleared on logout via `clearRootMoodThemeOverrides`.
 */
export function applyMoodThemeFromKey(moodKey: string | null | undefined): void {
  if (typeof document === 'undefined') return;
  const hex = MOOD_HEX[moodKey ?? DEFAULT_MOOD_KEY] ?? MOOD_HEX[DEFAULT_MOOD_KEY];
  const hsl = hexToHslTriplet(hex);
  const root = document.documentElement;
  root.style.setProperty('--mood-accent', hex);
  root.style.setProperty('--primary', hsl);
  root.style.setProperty('--ring', hsl);
  root.style.setProperty('--sidebar-primary', hsl);
  root.style.setProperty('--sidebar-ring', hsl);
}
