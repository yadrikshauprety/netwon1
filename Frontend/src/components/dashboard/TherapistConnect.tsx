import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  CRISIS_LINES,
  SHELTERS,
  COUNSELORS,
  LEGAL_AUDIO_TRACKS,
  EMERGENCY_SMS_BODY,
  NEPAL_DISTRICTS,
  NEPAL_DISTRICT_SELECT_OTHER,
  NEPAL_DISTRICTS_77_SET,
  type Counselor,
  type CounselorLanguage,
  type CounselorMode,
} from '@/data/helpResources';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Building2,
  Headphones,
  MapPin,
  MessageSquare,
  Phone,
  Shield,
  UserRound,
  Volume2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

const WEEK_LABELS_NE = ['सोम', 'मङ्गल', 'बुध', 'बिहि', 'शुक्र', 'शनि', 'आइत'];

function AvailabilityStrip({ week }: { week: boolean[] }) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        यस हप्ता उपलब्धता
      </p>
      <div className="flex gap-1">
        {week.map((on, i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="truncate text-[9px] text-muted-foreground">{WEEK_LABELS_NE[i]}</span>
            <div
              className={`h-2.5 w-full max-w-[36px] rounded-sm ${on ? 'bg-primary' : 'bg-muted'}`}
              title={on ? 'उपलब्ध' : '—'}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function filterCounselors(
  list: Counselor[],
  lang: CounselorLanguage,
  womanPref: 'woman' | 'any',
  mode: CounselorMode,
): Counselor[] {
  return list.filter((c) => {
    if (!c.modes.includes(mode)) return false;
    if (womanPref === 'woman' && !c.isWoman) return false;
    if (lang === 'ne') {
      if (!c.languages.some((l) => l === 'ne' || l === 'ne-en')) return false;
    } else if (lang === 'ne-en') {
      if (!c.languages.includes('ne-en')) return false;
    } else {
      if (!c.languages.includes('ne-en')) return false;
    }
    return true;
  });
}

function openNativeSms(body: string) {
  const href = `sms:?body=${encodeURIComponent(body)}`;
  window.location.href = href;
}

const TherapistConnect = () => {
  const { t, language } = useLanguage();
  const { user, updateDistrict } = useAuth();
  const district = user?.district ?? 'Kathmandu';
  const districtIsOfficial = NEPAL_DISTRICTS_77_SET.has(district);
  /** True after user picks “Other” from the dropdown while still on an official district */
  const [otherPicker, setOtherPicker] = useState(false);
  const showOtherField = !districtIsOfficial || otherPicker;
  const selectDistrictValue = showOtherField ? NEPAL_DISTRICT_SELECT_OTHER : district;
  const [districtOtherDraft, setDistrictOtherDraft] = useState(
    districtIsOfficial ? '' : district,
  );

  useEffect(() => {
    if (user?.district && !NEPAL_DISTRICTS_77_SET.has(user.district)) {
      setDistrictOtherDraft(user.district);
      setOtherPicker(false);
    }
    if (user?.district && NEPAL_DISTRICTS_77_SET.has(user.district)) {
      setDistrictOtherDraft('');
      setOtherPicker(false);
    }
  }, [user?.district]);

  const [langPref, setLangPref] = useState<CounselorLanguage>('ne');
  const [womanPref, setWomanPref] = useState<'woman' | 'any'>('any');
  const [modePref, setModePref] = useState<CounselorMode>('voice');

  const sheltersForDistrict = useMemo(() => {
    if (!district || !NEPAL_DISTRICTS_77_SET.has(district)) {
      return SHELTERS.filter((s) => ['Kathmandu', 'Lalitpur'].includes(s.district));
    }
    const exact = SHELTERS.filter((s) => s.district === district);
    if (exact.length > 0) return exact;
    return SHELTERS.filter((s) => s.district === 'Kathmandu');
  }, [district]);

  const matchedCounselors = useMemo(
    () => filterCounselors(COUNSELORS, langPref, womanPref, modePref),
    [langPref, womanPref, modePref],
  );

  const handleRequestCounselor = (c: Counselor) => {
    toast.success(
      language === 'ne'
        ? 'अनुरोध समन्वयकलाई पठाइयो। तपाईंको फोन नम्बर सिधा साझा गरिएको छैन।'
        : 'Request sent to the NGO coordinator. Your phone number was not shared directly.',
    );
    console.log('[demo] counselor request', c.id, { district });
  };

  const ne = language === 'ne';

  return (
    <div className="space-y-8 font-sans">
      <PageHeader
        eyebrow={t('Support', 'सहयोग')}
        title={t('Resources & help', 'स्रोत र सहयोग')}
        description={t(
          'Three levels of support — immediate, matched counseling, and legal audio.',
          'तीन तहको सहयोग — तत्काल, मिल्दो परामर्श, र कानुनी अडियो।',
        )}
      />

      {/* Tier 1 — Immediate */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/15 text-sm font-bold text-destructive">
            १
          </span>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {t('Next 10 minutes', 'अर्को १० मिनेट भित्र')}
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t(
            'Crisis numbers, shelters in your district, and an emergency SMS you can send on 2G — no internet required.',
            'संकटका नम्बरहरू, तपाईंको जिल्लाका आश्रय, र आपतकालीन SMS — २G मा पनि, इन्टरनेट बिना।',
          )}
        </p>

        <Card className="rounded-2xl border-border/80 bg-card/90 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-primary" />
                  {t('Your district', 'तपाईंको जिल्ला')}
                </CardTitle>
                <CardDescription>
                  {t('Set once at signup — change here anytime. We never store your exact location.', 'साइनअपमा एक पटक — यहाँबाट पनि बदल्न सकिन्छ। ठ्याक्कै ठेगाना राख्दैनौं।')}
                </CardDescription>
              </div>
              <div className="w-full sm:w-56">
                <Label className="sr-only">District</Label>
                <Select
                  value={selectDistrictValue}
                  onValueChange={(v) => {
                    if (v === NEPAL_DISTRICT_SELECT_OTHER) {
                      setOtherPicker(true);
                      return;
                    }
                    setOtherPicker(false);
                    updateDistrict(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(70vh,320px)]">
                    {NEPAL_DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                    <SelectItem value={NEPAL_DISTRICT_SELECT_OTHER}>
                      {t('Other (type district name)', 'अन्य (जिल्लाको नाम लेख्नुहोस्)')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {showOtherField ? (
                  <Input
                    className="mt-2 h-10"
                    value={districtOtherDraft}
                    onChange={(e) => setDistrictOtherDraft(e.target.value)}
                    onBlur={() => {
                      const next = districtOtherDraft.trim();
                      if (next) {
                        updateDistrict(next);
                        setOtherPicker(false);
                      }
                    }}
                    placeholder={t('Your district name', 'तपाईंको जिल्ला')}
                  />
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Phone className="h-4 w-4 text-primary" />
                {t('Crisis & helpline numbers', 'संकट र हेल्पलाइन नम्बर')}
              </h4>
              <div className="grid gap-2 sm:grid-cols-3">
                {CRISIS_LINES.map((line) => (
                  <a
                    key={line.id}
                    href={`tel:${line.number.replace(/-/g, '')}`}
                    className="rounded-xl border border-border/80 bg-background/80 px-3 py-3 transition-colors hover:bg-muted/50"
                  >
                    <p className="text-xs font-medium text-muted-foreground">{ne ? line.nameNe : line.nameEn}</p>
                    <p className="font-mono text-lg font-semibold text-primary">{line.number}</p>
                    <p className="text-[11px] text-muted-foreground">{ne ? line.noteNe : line.noteEn}</p>
                  </a>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                {t('Shelters & safe spaces (your district)', 'आश्रय र सुरक्षित ठाउँ (तपाईंको जिल्ला)')}
              </h4>
              {!NEPAL_DISTRICTS_77_SET.has(district) && (
                <p className="mb-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  {t(
                    'Showing example locations in Kathmandu valley. Set a specific district when you can.',
                    'काठमाडौं उपत्यकाका उदाहरण देखाइँदै। जिल्ला छान्नुहोस् जब सक्नुहुन्छ।',
                  )}
                </p>
              )}
              <ul className="space-y-2">
                {sheltersForDistrict.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm leading-snug"
                  >
                    <span className="font-medium text-foreground">{ne ? s.nameNe : s.nameEn}</span>
                    <span className="block text-muted-foreground">{s.addressNe}</span>
                    {s.phone && (
                      <a href={`tel:${s.phone}`} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <Phone className="h-3 w-3" />
                        {s.phone}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    {t('Emergency SMS to someone you trust', 'विश्वासको मानिसलाई आपतकालीन SMS')}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'Opens your phone’s SMS app with a short Nepali message. You choose the contact — works offline.',
                      'फोनको SMS खोल्छ — छोटो नेपाली सन्देश। सम्पर्क तपाईंले छान्नुहोस् — अफलाइनमा पनि चल्छ।',
                    )}
                  </p>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic text-foreground">
                    {EMERGENCY_SMS_BODY}
                  </blockquote>
                </div>
                <Button
                  type="button"
                  className="shrink-0 gap-2 bg-primary text-primary-foreground"
                  onClick={() => openNativeSms(EMERGENCY_SMS_BODY)}
                >
                  <MessageSquare className="h-4 w-4" />
                  {t('Review & send SMS', 'हेरी पठाउनुहोस्')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tier 2 — Match */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
            २
          </span>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {t('Counselor match', 'परामर्शदाता मिलान')}
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t(
            'Answer three questions. We show NGO partners who fit — you request; the coordinator connects you without sharing your number directly.',
            'तीन प्रश्न। मिल्ने साझेदार देखाउँछौं — अनुरोध गर्नुहोस्; समन्वयकले जोड्छ, नम्बर सिधा साझा हुँदैन।',
          )}
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Your preferences', 'तपाईंको रोजाइ')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('Language', 'भाषा')}</Label>
              <RadioGroup
                value={langPref}
                onValueChange={(v) => setLangPref(v as CounselorLanguage)}
                className="grid gap-2 sm:grid-cols-3"
              >
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="ne" id="l-ne" />
                  <span className="text-sm">{t('Nepali', 'नेपाली')}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="ne-en" id="l-bi" />
                  <span className="text-sm">{t('Nepali + English', 'नेपाली + अङ्ग्रेजी')}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="other" id="l-ot" />
                  <span className="text-sm">{t('Other language need', 'अरू भाषा चाहिन्छ')}</span>
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <UserRound className="h-4 w-4" />
                {t('Counselor', 'परामर्शदाता')}
              </Label>
              <RadioGroup
                value={womanPref}
                onValueChange={(v) => setWomanPref(v as 'woman' | 'any')}
                className="flex flex-wrap gap-2"
              >
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="woman" id="w-y" />
                  <span className="text-sm">{t('I prefer a woman counselor', 'महिला परामर्शदाता रोज्छु')}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="any" id="w-n" />
                  <span className="text-sm">{t('No preference', 'कुनै रोजाइ छैन')}</span>
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('How to connect', 'कसरी जोडिने')}</Label>
              <RadioGroup
                value={modePref}
                onValueChange={(v) => setModePref(v as CounselorMode)}
                className="grid gap-2 sm:grid-cols-2"
              >
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="voice" id="m-v" />
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm">{t('Voice call', 'भ्वाइस कल')}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="in-person" id="m-p" />
                  <span className="text-sm">{t('In person', 'अनुहार-अनुहार')}</span>
                </label>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {matchedCounselors.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {t('No counselors match right now. Try another option or contact the NGO desk.', 'अहिले मिल्दो परामर्शदाता छैन। अर्को विकल्प छान्नुहोस् वा डेस्कमा सम्पर्क गर्नुहोस्।')}
              </CardContent>
            </Card>
          ) : (
            matchedCounselors.map((c) => (
              <Card key={c.id} className="overflow-hidden border-border/70 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display text-lg font-semibold text-foreground">
                        {ne ? c.nameNe : c.nameEn}
                      </h4>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.bioNe}</p>
                      <AvailabilityStrip week={c.availabilityWeek} />
                    </div>
                    <Button className="shrink-0 gap-2 self-start sm:self-end" onClick={() => handleRequestCounselor(c)}>
                      <Shield className="h-4 w-4" />
                      {t('Request connection', 'जोडन अनुरोध')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Tier 3 — Legal audio */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-sm font-bold text-amber-800 dark:text-amber-200">
            ३
          </span>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {t('Legal rights — audio', 'कानुनी अधिकार — अडियो')}
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t(
            'Short colloquial Nepali explainers (3–5 min) from our legal-aid NGO partner — accurate, warm, not jargon.',
            'छोटा नेपाली व्याख्या (३–५ मिन) — कानुनी सहायता एनजीओ साझेदारसँग; सही, न्यानो, कठिन शब्द बिना।',
          )}
        </p>

        <div className="grid gap-3">
          {LEGAL_AUDIO_TRACKS.map((track) => (
            <Card key={track.id} className="border-border/70">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Headphones className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{ne ? track.titleNe : track.titleEn}</p>
                    <p className="text-xs text-muted-foreground">
                      {ne ? track.stageNe : track.stageEn} · {track.durationMin} {t('min', 'मिन')}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{track.descriptionNe}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {track.audioUrl ? (
                    <audio controls className="h-9 max-w-[220px] sm:max-w-[280px]" preload="metadata">
                      <source src={track.audioUrl} />
                    </audio>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                      <Volume2 className="h-4 w-4 shrink-0" />
                      <span>
                        {t('Partner audio — coming to the app soon', 'साझेदार अडियो — छिट्टै एपमा')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t(
            'This is general information, not personal legal advice. For your case, speak with a qualified lawyer or legal aid.',
            'यो सामान्य जानकारी हो, व्यक्तिगत कानुनी सल्लाह होइन। आफ्नो मुद्दाको लागि वकिल वा कानुनी सहायतासँग कुरा गर्नुहोस्।',
          )}
        </p>
      </section>
    </div>
  );
};

export default TherapistConnect;
