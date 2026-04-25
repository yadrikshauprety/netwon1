import { getMainApiBase } from '@/lib/apiBase';

export type NgoRegisteredUserRow = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  district?: string | null;
  phoneNumber?: string | null;
  isEmailVerified?: boolean;
  lastLogin?: string | null;
};

function pickApiData<T>(json: unknown): T {
  if (json && typeof json === 'object' && json !== null && 'data' in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: unknown; message?: string };
    if (typeof j.message === 'string' && j.message.trim()) return j.message;
    const d = j.detail;
    if (typeof d === 'string') return d;
    return 'Request failed';
  } catch {
    return 'Request failed';
  }
}

/** NGO-only: list registered survivor accounts with district for coordination. */
export async function fetchRegisteredUsersForNgo(token: string): Promise<NgoRegisteredUserRow[]> {
  const base = getMainApiBase();
  const res = await fetch(`${base}/api/auth/users`, {
    headers: { Authorization: 'Bearer ' + token },
  });
  if (!res.ok) throw new Error(await readError(res));
  const raw = pickApiData<unknown>(await res.json());
  return Array.isArray(raw) ? (raw as NgoRegisteredUserRow[]) : [];
}
