/**
 * Client-side journey / agency trail + case events (no backend required for demo).
 * Coordinator flows can later sync the same shape from an API.
 */

const AGENCY_KEY = 'aafnai_agency_dots_v1';
const CASE_KEY = 'aafnai_case_events_v1';
const JOURNEY_START = 'aafnai_journey_start_ms';

/** When set (logged-in user), day/tier use this anchor from the server instead of localStorage. */
let serverJourneyStartMs: number | null = null;

export function setJourneyStartFromServer(ms: number): void {
  serverJourneyStartMs = ms;
}

export function clearServerJourneyStart(): void {
  serverJourneyStartMs = null;
}

export interface AgencyDot {
  ts: number;
  tier: 1 | 2 | 3;
  choiceId: string;
}

export interface CaseEventPersisted {
  id: string;
  date: string;
  type: 'court' | 'police' | 'document' | 'milestone';
  title: string;
  status: 'completed' | 'upcoming' | 'delayed';
  emotionalNote?: string;
  /** User notes for this timeline step; stored with the case event. */
  notes?: string;
}

export function ensureJourneyStart(): number {
  try {
    const t = localStorage.getItem(JOURNEY_START);
    if (!t) {
      const n = Date.now();
      localStorage.setItem(JOURNEY_START, String(n));
      return n;
    }
    return parseInt(t, 10);
  } catch {
    return Date.now();
  }
}

export function getJourneyDayCount(): number {
  const start = serverJourneyStartMs !== null ? serverJourneyStartMs : ensureJourneyStart();
  return Math.floor((Date.now() - start) / 86400000) + 1;
}

export function getTierFromJourney(): 1 | 2 | 3 {
  const days = getJourneyDayCount();
  if (days < 30) return 1;
  if (days < 60) return 2;
  return 3;
}

export function recordAgencyDecision(choiceId: string): void {
  try {
    ensureJourneyStart();
    const tier = getTierFromJourney();
    const dots = loadAgencyDots();
    dots.push({ ts: Date.now(), tier, choiceId });
    localStorage.setItem(AGENCY_KEY, JSON.stringify(dots));
    window.dispatchEvent(new Event('agency-dots-changed'));
  } catch {
    /* ignore quota */
  }
}

export function loadAgencyDots(): AgencyDot[] {
  try {
    const raw = localStorage.getItem(AGENCY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AgencyDot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Consecutive days (local) with at least one decision, ending today or yesterday chain */
export function computePresenceStreak(dots: AgencyDot[]): number {
  if (dots.length === 0) return 0;
  const days = new Set(dots.map((d) => dayKey(d.ts)));
  let streak = 0;
  const check = new Date();
  check.setHours(12, 0, 0, 0);
  for (let i = 0; i < 400; i++) {
    const k = dayKey(check.getTime());
    if (days.has(k)) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else if (i === 0) {
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function loadCaseEvents(): CaseEventPersisted[] | null {
  try {
    const raw = localStorage.getItem(CASE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CaseEventPersisted[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCaseEvents(events: CaseEventPersisted[]): void {
  try {
    localStorage.setItem(CASE_KEY, JSON.stringify(events));
  } catch {
    /* ignore */
  }
}

const DEFAULT_CASE_EVENTS: CaseEventPersisted[] = [
  { id: '1', date: '2024-01-15', type: 'police', title: 'FIR Filed', status: 'completed' },
  { id: '2', date: '2024-03-20', type: 'court', title: 'First Hearing', status: 'completed' },
  {
    id: '3',
    date: '2024-06-10',
    type: 'court',
    title: 'Second Hearing — Postponed',
    status: 'delayed',
    emotionalNote: 'ibt-2',
  },
  { id: '4', date: '2024-09-15', type: 'court', title: 'Rescheduled Hearing', status: 'upcoming' },
];

export function getCaseEventsOrSeed(): CaseEventPersisted[] {
  const existing = loadCaseEvents();
  if (existing && existing.length > 0) return existing;
  saveCaseEvents(DEFAULT_CASE_EVENTS);
  return DEFAULT_CASE_EVENTS;
}

/** Dot diameter 8–12px from stable hash */
export function dotSizePx(choiceId: string): number {
  let h = 0;
  for (let i = 0; i < choiceId.length; i++) h = (h * 31 + choiceId.charCodeAt(i)) >>> 0;
  return 8 + (h % 5);
}

const TIER_COLORS: Record<1 | 2 | 3, string> = {
  1: 'hsl(150 22% 72%)',
  2: 'hsl(150 28% 42%)',
  3: 'hsl(150 32% 28%)',
};

export function tierDotColor(tier: 1 | 2 | 3): string {
  return TIER_COLORS[tier];
}

/** Meandering path from bottom-left toward top-right (percent of container) */
export const MEANDER_PTS: [number, number][] = [
  [6, 94],
  [14, 88],
  [9, 78],
  [22, 82],
  [30, 72],
  [20, 62],
  [34, 54],
  [26, 44],
  [42, 48],
  [52, 38],
  [46, 28],
  [58, 22],
  [70, 30],
  [64, 16],
  [78, 12],
  [88, 8],
  [94, 5],
];

export function pointOnMeander(t: number): [number, number] {
  const pts = MEANDER_PTS;
  if (pts.length === 0) return [50, 50];
  const u = Math.max(0, Math.min(1, t));
  const f = u * (pts.length - 1);
  const i = Math.floor(f);
  const frac = f - i;
  const a = pts[i];
  const b = pts[Math.min(i + 1, pts.length - 1)];
  return [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
}

export function buildWeeklyMirror(
  dots: AgencyDot[],
  t: (en: string, ne: string) => string,
): string {
  const weekMs = 7 * 86400000;
  const now = Date.now();
  const recent = dots.filter((d) => d.ts >= now - weekMs);
  if (recent.length === 0) {
    return t(
      'When you are ready, your choices here become a quiet record of presence — not performance.',
      'जब तपाईं तयार हुनुहुन्छ, यहाँका छनौटहरू उपस्थितिको शान्त रेकर्ड बन्छन् — प्रदर्शन होइन।',
    );
  }
  const evening = recent.filter((d) => {
    const h = new Date(d.ts).getHours();
    return h >= 17 || h < 5;
  }).length;
  const quiet = recent.filter((d) => d.choiceId === 'pace' || d.choiceId === 'sound').length;

  if (evening >= recent.length * 0.55) {
    return t(
      `This week many of your choices were made in the evening or at night — ${recent.length} moments you still showed up for yourself.`,
      `यो हप्ता तपाईंका धेरै छनौट साँझ वा रातमा भए — आफ्नो लागि ${recent.length} पल तपाईं उपस्थित हुनुभयो।`,
    );
  }
  if (quiet >= 4) {
    return t(
      `You made ${recent.length} choices this week. Several were about sound, colour, or pace — small ways of caring for your senses.`,
      `यो हप्ता तपाईंले ${recent.length} छनौट गर्नुभयो। धेरैजसो ध्वनि, रङ वा गतिसँग जोडिएका थिए — इन्द्रियहरूको हेरचाहका साना तरिका।`,
    );
  }
  return t(
    `You made ${recent.length} choices this week. Each one is evidence of you choosing — not a target, not a score.`,
    `यो हप्ता तपाईंले ${recent.length} छनौट गर्नुभयो। प्रत्येक तपाईंले छान्नुभएको प्रमाण हो — लक्ष्य होइन, अङ्क होइन।`,
  );
}
