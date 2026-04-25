/** Static demo data for Help / Resources — replace with CMS or API from NGO partners in production. */

export const CRISIS_LINES = [
  {
    id: 'women-helpline',
    nameNe: 'महिला हेल्पलाइन',
    nameEn: "Women's Helpline",
    number: '1145',
    noteNe: '२४ घण्टा, निःशुल्क',
    noteEn: '24 hours, free',
  },
  {
    id: 'police',
    nameNe: 'प्रहरी आपतकालीन',
    nameEn: 'Police Emergency',
    number: '100',
    noteNe: 'आपतकालीन',
    noteEn: 'Emergency',
  },
  {
    id: 'child-helpline',
    nameNe: 'बाल हेल्पलाइन',
    nameEn: 'Child Helpline',
    number: '1098',
    noteNe: 'बाल सुरक्षा',
    noteEn: 'Child protection',
  },
] as const;

export type Shelter = {
  id: string;
  district: string;
  nameNe: string;
  nameEn: string;
  addressNe: string;
  phone?: string;
};

/** Sample shelters keyed by district name (Nepali/English spellings normalized to one key). */
export const SHELTERS: Shelter[] = [
  {
    id: 's1',
    district: 'Kathmandu',
    nameNe: 'वान स्टेप क्राइसिस सेन्टर',
    nameEn: 'One Stop Crisis Management Centre (sample)',
    addressNe: 'काठमाडौं महानगरपालिका (उदाहरण ठेगाना)',
    phone: '01-5550000',
  },
  {
    id: 's2',
    district: 'Kathmandu',
    nameNe: 'महिला तथा बालबालिका सेवा केन्द्र',
    nameEn: 'Women & Children Service Centre (sample)',
    addressNe: 'काठमाडौं — सुरक्षित आवास (उदाहरण)',
    phone: '01-5550001',
  },
  {
    id: 's3',
    district: 'Lalitpur',
    nameNe: 'सुरक्षित आवास केन्द्र',
    nameEn: 'Safe Shelter Centre (sample)',
    addressNe: 'ललितपुर महानगरपालिका (उदाहरण ठेगाना)',
    phone: '01-5550002',
  },
  {
    id: 's4',
    district: 'Bhaktapur',
    nameNe: 'भक्तपुर सहयोग केन्द्र',
    nameEn: 'Bhaktapur Support Centre (sample)',
    addressNe: 'भक्तपुर नगर (उदाहरण)',
  },
  {
    id: 's5',
    district: 'Kaski',
    nameNe: 'पोखरा महिला सहयोग',
    nameEn: 'Pokhara Women Support (sample)',
    addressNe: 'पोखरा लेखनाथ महानगरपालिका (उदाहरण)',
    phone: '061-555000',
  },
  {
    id: 's6',
    district: 'Morang',
    nameNe: 'विराटनगर सुरक्षा केन्द्र',
    nameEn: 'Biratnagar Safety Centre (sample)',
    addressNe: 'विराटनगर महानगरपालिका (उदाहरण)',
  },
];

export type CounselorLanguage = 'ne' | 'ne-en' | 'other';
export type CounselorMode = 'voice' | 'in-person';

export type Counselor = {
  id: string;
  nameNe: string;
  nameEn: string;
  bioNe: string;
  languages: CounselorLanguage[];
  /** Counselor identifies as woman — used when user prefers a woman counselor */
  isWoman: boolean;
  modes: CounselorMode[];
  /** Mon–Sun, true = has a slot that day (demo) */
  availabilityWeek: boolean[];
};

export const COUNSELORS: Counselor[] = [
  {
    id: 'c1',
    nameNe: 'सुनिता शर्मा',
    nameEn: 'Sunita Sharma',
    bioNe: '१२ वर्षदेखि महिला हिंसा र ट्रमा परामर्शमा काम गर्दै।',
    languages: ['ne'],
    isWoman: true,
    modes: ['voice', 'in-person'],
    availabilityWeek: [true, true, false, true, true, false, false],
  },
  {
    id: 'c2',
    nameNe: 'प्रिया गुरुङ',
    nameEn: 'Priya Gurung',
    bioNe: 'नेपाली र अङ्ग्रेजीमा परामर्श; सहरी र ग्रामीण दुवै अनुभव।',
    languages: ['ne-en'],
    isWoman: true,
    modes: ['voice'],
    availabilityWeek: [true, false, true, true, false, true, false],
  },
  {
    id: 'c3',
    nameNe: 'अमित तामाङ',
    nameEn: 'Amit Tamang',
    bioNe: 'पारिवारिक हिंसा र कानुनी प्रक्रियामा साथ दिने परामर्श।',
    languages: ['ne-en'],
    isWoman: false,
    modes: ['in-person'],
    availabilityWeek: [false, true, true, true, true, true, false],
  },
  {
    id: 'c4',
    nameNe: 'रिना के.सी.',
    nameEn: 'Rina K.C.',
    bioNe: 'फोन र अनुहार-अनुहार दुवै — तपाईंको गतिमा।',
    languages: ['ne'],
    isWoman: true,
    modes: ['voice', 'in-person'],
    availabilityWeek: [true, true, true, true, true, false, false],
  },
];

export type LegalAudioTrack = {
  id: string;
  titleNe: string;
  titleEn: string;
  stageNe: string;
  stageEn: string;
  durationMin: number;
  descriptionNe: string;
  /** Partner-hosted audio URL when available */
  audioUrl?: string;
};

export const LEGAL_AUDIO_TRACKS: LegalAudioTrack[] = [
  {
    id: 'l1',
    titleNe: 'उजुरी दर्ता के भएको हो?',
    titleEn: 'What does filing a complaint mean?',
    stageNe: 'सुरु — प्रहरी / वारदात कायम',
    stageEn: 'Start — police & FIR',
    durationMin: 4,
    descriptionNe:
      'कानुनी सहायता एनजीओ साझेदारसँग तयार पारिएको — साधारण नेपालीमा।',
  },
  {
    id: 'l2',
    titleNe: 'अनुसन्धान र सुरक्षा आदेश',
    titleEn: 'Investigation & protection orders',
    stageNe: 'अनुसन्धान चल्दै',
    stageEn: 'During investigation',
    durationMin: 5,
    descriptionNe: 'तपाईंका अधिकार र प्रहरी/अदालतको भूमिका सरल भाषामा।',
  },
  {
    id: 'l3',
    titleNe: 'अदालतमा बयान र सहयोग',
    titleEn: 'Court statement & support',
    stageNe: 'मुद्दा अदालतमा',
    stageEn: 'Case in court',
    durationMin: 4,
    descriptionNe: 'के अपेक्षा गर्ने, के सोध्ने — तयारी।',
  },
  {
    id: 'l4',
    titleNe: 'कानुनी सहायता र वकिल',
    titleEn: 'Legal aid & lawyers',
    stageNe: 'कुनै पनि चरण',
    stageEn: 'Any stage',
    durationMin: 3,
    descriptionNe: 'निःशुल्क कानुनी सहायता कहाँबाट पाउने।',
  },
];

/** Pre-drafted emergency SMS (Nepali) — user opens native composer; picks trusted contact; no internet. */
export const EMERGENCY_SMS_BODY =
  'कृपया मलाई सम्पर्क गर्नुहोस्। मलाई कसैसँग कुरा गर्नु छ।';

export {
  NEPAL_DISTRICTS_77 as NEPAL_DISTRICTS,
  NEPAL_DISTRICT_SELECT_OTHER,
  NEPAL_DISTRICTS_77_SET,
  isOfficialNepalDistrict,
} from '@/data/nepalDistricts';
