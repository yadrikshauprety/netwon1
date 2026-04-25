/** Must match Backend ALLOWED_PROGRESS order for stepper semantics */
export const PROGRESS_KEYS = [
  'received',
  'triaging',
  'assigned',
  'in_progress',
  'awaiting_survivor',
  'closed',
] as const;

export type ProgressKey = (typeof PROGRESS_KEYS)[number];

/** Visual step 0..4 for progress bar (collapses NGO states for survivors) */
export function progressVisualStep(progressState: string): number {
  switch (progressState) {
    case 'received':
      return 0;
    case 'triaging':
      return 1;
    case 'assigned':
      return 2;
    case 'in_progress':
    case 'awaiting_survivor':
      return 3;
    case 'closed':
      return 4;
    default:
      return 0;
  }
}

export const NGO_UNIT_OPTIONS = [
  { value: 'legal_advocacy', labelEn: 'Legal advocacy', labelNe: 'कानुनी वकालत' },
  { value: 'field_outreach', labelEn: 'Field / outreach', labelNe: 'क्षेत्र / आउटरीच' },
  { value: 'counselling', labelEn: 'Counselling', labelNe: 'परामर्श' },
  { value: 'shelter', labelEn: 'Shelter coordination', labelNe: 'आश्रय समन्वय' },
  { value: 'admin', labelEn: 'Admin / intake', labelNe: 'प्रशासन / ग्रहण' },
  { value: 'custom', labelEn: 'Custom (type below)', labelNe: 'अनुकूलन (तल लेख्नुहोस्)' },
] as const;

export function progressLabel(
  key: string,
  t: (en: string, ne: string) => string,
): string {
  const map: Record<string, [string, string]> = {
    received: ['Received', 'प्राप्त'],
    triaging: ['Under review', 'समीक्षा अन्तर्गत'],
    assigned: ['Assigned to team', 'टोलीमा तोकिएको'],
    in_progress: ['Active follow-up', 'सक्रिय फलोअप'],
    awaiting_survivor: ['Awaiting your reply', 'तपाईंको जवाफ पर्खँदै'],
    closed: ['Closed', 'बन्द'],
  };
  const pair = map[key] ?? map.received;
  return t(pair[0], pair[1]);
}

export function unitLabel(value: string | null | undefined, t: (en: string, ne: string) => string): string {
  if (!value) return '';
  const opt = NGO_UNIT_OPTIONS.find((o) => o.value === value);
  if (opt) return t(opt.labelEn, opt.labelNe);
  return value;
}
