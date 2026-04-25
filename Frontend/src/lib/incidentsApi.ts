import { getMainApiBase } from '@/lib/apiBase';
import { getTokenFromStorage } from '@/lib/restorationApi';

export interface IncidentDto {
  id: string;
  incident_type: string;
  description: string;
  priority: string;
  anonymous_to_ngo: boolean;
  created_at: number;
  status: 'pending' | 'resolved';
  resolved_at: number | null;
  assigned_to: string | null;
  assigned_unit: string | null;
  progress_state: string;
  progress_updated_at: number | null;
  reporter_display_name?: string | null;
  reporter_kind?: 'anonymous' | 'registered' | null;
  /** District from user profile when reporter is registered and not anonymous */
  reporter_district?: string | null;
}

export interface IncidentStatsDto {
  pending_cases: number;
  resolved_cases: number;
  pending_anonymous: number;
  pending_registered: number;
  incidents_this_week: number;
}

function pickApiData<T>(json: unknown): T {
  if (json && typeof json === 'object' && json !== null && 'data' in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

function toUnixSeconds(value: unknown): number {
  if (typeof value === 'number') return value > 1_000_000_000_000 ? Math.floor(value / 1000) : value;
  if (typeof value === 'string') {
    const t = Date.parse(value);
    return Number.isFinite(t) ? Math.floor(t / 1000) : Math.floor(Date.now() / 1000);
  }
  return Math.floor(Date.now() / 1000);
}

/** Map Express incident list rows to the shape the UI expects */
function mapIncidentRow(raw: Record<string, unknown>): IncidentDto {
  const statusRaw = String(raw.status ?? 'pending');
  const status: 'pending' | 'resolved' = statusRaw === 'resolved' ? 'resolved' : 'pending';
  const anon = Boolean(raw.anonymous_to_ngo ?? raw.isAnonymous);
  const created = raw.created_at ?? raw.createdAt;
  return {
    id: String(raw.id ?? ''),
    incident_type: String(raw.incident_type ?? raw.type ?? 'other'),
    description: String(raw.description ?? ''),
    priority: String(raw.priority ?? 'medium'),
    anonymous_to_ngo: anon,
    created_at: toUnixSeconds(created),
    status,
    resolved_at: raw.resolved_at != null ? Number(raw.resolved_at) : null,
    assigned_to: raw.assigned_to != null ? String(raw.assigned_to) : null,
    assigned_unit: raw.assigned_unit != null ? String(raw.assigned_unit) : null,
    progress_state: String(raw.progress_state ?? 'received'),
    progress_updated_at: raw.progress_updated_at != null ? Number(raw.progress_updated_at) : null,
    reporter_display_name:
      raw.reporter_display_name != null
        ? String(raw.reporter_display_name)
        : raw.userName != null
          ? String(raw.userName)
          : null,
    reporter_kind:
      raw.reporter_kind === 'anonymous' || raw.reporter_kind === 'registered'
        ? raw.reporter_kind
        : anon
          ? 'anonymous'
          : 'registered',
    reporter_district:
      raw.reporter_district != null && raw.reporter_district !== ''
        ? String(raw.reporter_district)
        : null,
  };
}

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: unknown; message?: string };
    if (typeof j.message === 'string' && j.message.trim()) return j.message;
    const d = j.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d))
      return d
        .map((x: { msg?: string }) => x.msg ?? '')
        .filter(Boolean)
        .join(', ');
    return 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export async function fetchIncidents(
  token: string,
  filterKind: 'all' | 'anonymous' | 'registered' = 'all',
  caseStatus: 'all' | 'pending' | 'resolved' = 'all',
): Promise<IncidentDto[]> {
  const base = getMainApiBase();
  const params = new URLSearchParams();
  if (filterKind !== 'all') params.set('filter_kind', filterKind);
  if (caseStatus !== 'all') params.set('case_status', caseStatus);
  const q = params.toString();
  const res = await fetch(`${base}/api/incidents${q ? `?${q}` : ''}`, {
    headers: { Authorization: 'Bearer ' + token },
  });
  if (!res.ok) throw new Error(await readError(res));
  const body = await res.json();
  const rawList = pickApiData<unknown>(body);
  const arr = Array.isArray(rawList) ? rawList : [];
  return arr.map((row) => mapIncidentRow(row as Record<string, unknown>));
}

export async function fetchIncidentStats(token: string): Promise<IncidentStatsDto> {
  const base = getMainApiBase();
  const res = await fetch(`${base}/api/incidents/stats`, {
    headers: { Authorization: 'Bearer ' + token },
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as IncidentStatsDto;
}

export async function createIncident(
  token: string,
  body: {
    incident_type: string;
    description: string;
    priority?: 'low' | 'medium' | 'high';
    anonymous_to_ngo?: boolean;
  },
): Promise<IncidentDto> {
  const base = getMainApiBase();
  const res = await fetch(`${base}/api/incidents`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as IncidentDto;
}

export async function updateIncidentStatus(
  token: string,
  incidentId: string,
  status: 'pending' | 'resolved',
): Promise<IncidentDto> {
  const base = getMainApiBase();
  const res = await fetch(`${base}/api/incidents/${encodeURIComponent(incidentId)}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as IncidentDto;
}

export async function updateIncidentWorkflow(
  token: string,
  incidentId: string,
  body: {
    assigned_to?: string | null;
    assigned_unit?: string | null;
    progress_state?: string;
  },
): Promise<IncidentDto> {
  const base = getMainApiBase();
  const res = await fetch(`${base}/api/incidents/${encodeURIComponent(incidentId)}/workflow`, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as IncidentDto;
}

export { getTokenFromStorage };
