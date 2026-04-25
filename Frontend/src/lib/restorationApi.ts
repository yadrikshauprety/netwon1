import { getMainApiBase } from '@/lib/apiBase';

export interface DailyRestorationState {
  journey_start_ms: number;
  daily_restoration_date: string | null;
  daily_restoration_step: number;
}

/** Browser-local calendar date YYYY-MM-DD (for daily reset of the 5 choices). */
export function clientLocalDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: unknown };
    const d = j.detail;
    if (typeof d === 'string') return d;
    return 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export async function fetchDailyRestoration(token: string): Promise<DailyRestorationState> {
  const base = getMainApiBase();
  const res = await fetch(base + '/api/auth/daily-restoration', {
    headers: { Authorization: 'Bearer ' + token },
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as DailyRestorationState;
}

export async function saveDailyRestoration(
  token: string,
  body: {
    journey_start_ms?: number;
    daily_restoration_date: string;
    daily_restoration_step: number;
  },
): Promise<DailyRestorationState> {
  const base = getMainApiBase();
  const res = await fetch(base + '/api/auth/daily-restoration', {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as DailyRestorationState;
}

export function getTokenFromStorage(): string | null {
  try {
    return localStorage.getItem('sahara_auth_token');
  } catch {
    return null;
  }
}
