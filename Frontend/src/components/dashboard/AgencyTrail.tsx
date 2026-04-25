import { useMemo, useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import {
  loadAgencyDots,
  computePresenceStreak,
  getTierFromJourney,
  pointOnMeander,
  dotSizePx,
  buildWeeklyMirror,
  getJourneyDayCount,
} from '@/lib/journeyStorage';
import { Mountain } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

const AgencyTrail = () => {
  const { t } = useLanguage();
  const [dots, setDots] = useState(loadAgencyDots);

  useEffect(() => {
    const refresh = () => setDots(loadAgencyDots());
    window.addEventListener('storage', refresh);
    window.addEventListener('agency-dots-changed', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('agency-dots-changed', refresh);
    };
  }, []);

  const total = dots.length;
  const streak = useMemo(() => computePresenceStreak(dots), [dots]);
  const tier = getTierFromJourney();
  const dayCount = getJourneyDayCount();
  const mirror = useMemo(() => buildWeeklyMirror(dots, t), [dots, t]);

  const positions = useMemo(() => {
    const n = dots.length;
    if (n === 0) return [];
    return dots.map((d, i) => {
      const tParam = n === 1 ? 0.5 : i / (n - 1);
      const [x, y] = pointOnMeander(tParam);
      const jitter = ((i * 7) % 5) - 2;
      return {
        dot: d,
        left: Math.max(2, Math.min(98, x + jitter * 0.4)),
        top: Math.max(2, Math.min(98, y + jitter * 0.35)),
        size: dotSizePx(d.choiceId),
      };
    });
  }, [dots]);

  const showArchaeology = dayCount >= 60;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-12 md:pb-16">
      <PageHeader
        eyebrow={t('My journey', 'मेरो यात्रा')}
        title={t('The agency trail', 'आफ्नै छनौटको बाटो')}
        description={t(
          'A record of presence — not progress, not targets. Each small dot is a choice you made.',
          'उपस्थितिको रेकर्ड — प्रगति होइन, लक्ष्य होइन। हरेक बिन्दु तपाईंले गर्नुभएको छनौट हो।',
        )}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: t('Decisions recorded', 'रेकर्ड भएका निर्णयहरू'),
            value: String(total),
          },
          {
            label: t('Days of presence (streak)', 'लगातार उपस्थितिका दिनहरू'),
            value: String(streak),
          },
          {
            label: t('Current tier', 'हालको तह'),
            value: `${t('Tier', 'तह')} ${tier}`,
          },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border-border/50 bg-card/90 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-2 font-display text-2xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden rounded-[1.75rem] border-primary/15 bg-gradient-to-br from-card to-sage-light/30 shadow-[var(--shadow-soft)]">
        <CardContent className="p-6 md:p-8">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Mountain className="h-4 w-4" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t('This week', 'यो हप्ता')}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 md:text-base">{mirror}</p>
        </CardContent>
      </Card>

      <div className="relative min-h-[320px] w-full overflow-hidden rounded-[2rem] border border-border/40 bg-gradient-to-br from-muted/40 via-background to-sage-light/20 shadow-inner md:min-h-[420px]">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          aria-hidden
        >
          <path
            d="M 6 94 Q 20 80 30 72 T 52 38 T 88 8 L 94 5"
            fill="none"
            stroke="hsl(var(--primary) / 0.35)"
            strokeWidth="0.35"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {positions.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              {t(
                'Your trail will grow as you complete the five choices on Today. Nothing to measure — only to witness.',
                'आजको पृष्ठमा पाँच छनौट पूरा गर्दै जाँदा बाटो बन्छ। नाप्नु पर्दैन — देख्न मात्र।',
              )}
            </p>
          </div>
        ) : (
          positions.map(({ dot, left, top, size }, idx) => (
            <span
              key={`${dot.ts}-${idx}`}
              title={dot.choiceId}
              className="absolute rounded-full shadow-sm ring-1 ring-white/60"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'var(--mood-accent, hsl(var(--primary)))',
                opacity: 0.78 + (dot.tier - 1) * 0.09,
              }}
            />
          ))
        )}
      </div>

      {showArchaeology && (
        <Card className="rounded-[1.75rem] border-terracotta/25 bg-terracotta-light/30">
          <CardContent className="space-y-4 p-6 md:p-8">
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t('Strength archaeology', 'बलको खुदाइ')}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(
                'Each week, one gentle voice prompt (before — during — now). Your words stay private in your document; only engagement patterns may inform support.',
                'प्रत्येक हप्ता एउटा न्यानो आवाज प्रश्न (अघि — बीचमा — अहिले)। तपाईंका शब्द तपाईंको कागजमा निजी रहन्छन्।',
              )}
            </p>
            <ul className="space-y-3 text-sm text-foreground/90">
              <li className="rounded-xl bg-background/80 p-4 border border-border/50">
                {t('Week 1 — Before: What did you believe about yourself then?', 'हप्ता १ — अघि: त्यतिबेला आफूबारे के विश्वास गर्नुहुन्थ्यो?')}
              </li>
              <li className="rounded-xl bg-background/80 p-4 border border-border/50">
                {t('Week 2 — During: What did you do to endure?', 'हप्ता २ — बीचमा: टिक्न के गर्नुभयो?')}
              </li>
              <li className="rounded-xl bg-background/80 p-4 border border-border/50">
                {t('Week 3 — Now: What do you want the next-you to remember?', 'हप्ता ३ — अहिले: अर्को तपाईंले के सम्झनु पर्छ?')}
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgencyTrail;
