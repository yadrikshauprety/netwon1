/**
 * Deployed backend (Render). Override with VITE_API_BASE_URL for local dev, e.g. http://127.0.0.1:5000
 */
export const DEFAULT_API_BASE = 'https://path-to-strength.onrender.com';

/** Base URL for main FastAPI (main.py), without trailing slash or `/api` suffix. */
export function getMainApiBase(): string {
  const fromEnv =
    import.meta.env.VITE_API_BASE_URL ??
    (import.meta.env.VITE_BACKEND_URL as string | undefined);
  const raw = (fromEnv || DEFAULT_API_BASE).replace(/\/$/, '');
  return raw.replace(/\/api\/?$/i, '');
}
