import { useLanguage } from '@/contexts/LanguageContext';
import { Cloud, Wind, UserRound, LifeBuoy } from 'lucide-react';

export type WellnessPath = 'heavy' | 'unsettled' | 'alone' | 'support';

interface WellnessSpectrumProps {
  onChoose: (path: WellnessPath) => void;
}

const cards: {
  path: WellnessPath;
  icon: typeof Cloud;
  titleEn: string;
  titleNe: string;
  descEn: string;
  descNe: string;
  accent: string;
}[] = [
  {
    path: 'heavy',
    icon: Cloud,
    titleEn: "I'm carrying something heavy",
    titleNe: 'बोझिलो छु',
    descEn: 'Overwhelmed, stressed, exhausted — any reason. No cause you must name.',
    descNe: 'थकान, तनाव, अभिभूत — कुनै पनि कारण। नाम नलेख्नु पर्ने बाध्यता छैन।',
    accent: 'from-rose-soft/40 to-card',
  },
  {
    path: 'unsettled',
    icon: Wind,
    titleEn: 'My mind is unsettled',
    titleNe: 'मन अलमलिएको छ',
    descEn: 'Anxious, worried, sleep is hard — something feels off.',
    descNe: 'चिन्ता, अलमल, निद्रा गाह्रो — केही मिलेन जस्तो।',
    accent: 'from-sage-light to-card',
  },
  {
    path: 'alone',
    icon: UserRound,
    titleEn: "I'm feeling alone",
    titleNe: 'एक्लो महसुस गर्दैछु',
    descEn: 'Isolated or disconnected — you are not the only one who feels this.',
    descNe: 'एक्लो वा टाढा — यस्तो महसुस गर्ने तपाईं मात्र होइनन्।',
    accent: 'from-gold-warm/30 to-card',
  },
  {
    path: 'support',
    icon: LifeBuoy,
    titleEn: 'I need support',
    titleNe: 'मलाई सहायता चाहिन्छ',
    descEn: 'Something specific is happening — legal help, safety, and resources live in Help.',
    descNe: 'केही विशेष भइरहेको छ — कानुनी सहयोग, सुरक्षा र स्रोतहरू सहायतामा छन्।',
    accent: 'from-terracotta-light to-card',
  },
];

const WellnessSpectrum = ({ onChoose }: WellnessSpectrumProps) => {
  const { t } = useLanguage();

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-start overflow-y-auto overscroll-contain bg-background/95 px-3 py-6 backdrop-blur-md sm:justify-center sm:px-4 sm:py-8"
      role="dialog"
      aria-labelledby="wellness-heading"
      aria-modal="true"
    >
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {t('AAFNAI', 'आफ्नै')}
      </p>
      <h1
        id="wellness-heading"
        className="mb-2 text-center font-display text-2xl font-bold text-foreground md:text-3xl text-balance"
      >
        {t('Where are you today?', 'आज तपाईं कहाँ हुनुहुन्छ?')}
      </h1>
      <p className="mb-6 max-w-lg text-center text-sm text-muted-foreground leading-relaxed sm:mb-8 md:text-base">
        {t(
          'Four doors. No diagnosis. Pick what feels closest — you can change your mind anytime.',
          'चार ढोका। कुनै निदान होइन। जुन नजिक लाग्छ त्यो छान्नुहोस् — कुनै पनि बेला बदल्न सकिन्छ।',
        )}
      </p>

      <div className="grid w-full max-w-3xl gap-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:grid-cols-2 sm:gap-4">
        {cards.map((c) => (
          <button
            key={c.path}
            type="button"
            onClick={() => onChoose(c.path)}
            className={`group relative overflow-hidden rounded-[1.5rem] border border-border/60 bg-gradient-to-br ${c.accent} p-4 text-left shadow-[var(--shadow-soft)] transition-all duration-300 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-6`}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-background/80 text-primary shadow-sm transition-transform group-hover:scale-105">
              <c.icon className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground md:text-xl">
              {t(c.titleEn, c.titleNe)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(c.descEn, c.descNe)}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WellnessSpectrum;
