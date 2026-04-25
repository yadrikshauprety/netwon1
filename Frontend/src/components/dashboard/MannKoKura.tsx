import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Moon, Heart, Cloud, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOPICS: {
  key: string;
  icon: typeof Moon;
  titleEn: string;
  titleNe: string;
  bodyEn: string;
  bodyNe: string;
  closingEn: string;
  closingNe: string;
}[] = [
  {
    key: 'sleep',
    icon: Moon,
    titleEn: "Why can't I sleep even when I'm exhausted?",
    titleNe: 'थकित भए पनि किन निदाउन गाह्रो हुन्छ?',
    bodyEn:
      'When the body is tired but the mind will not rest, it is often because something inside still needs to be heard. That is not weakness — it is how stress lives in the body.',
    bodyNe:
      'जब शरीर थकित छ तर मन आराम गर्दैन, प्रायः भित्र केही सुनिन बाँकी हुन्छ। यो कमजोरी होइन — तनाव शरीरमा यसरी बस्छ।',
    closingEn: 'This is not your weakness. This is the human mind.',
    closingNe: 'यो तपाईंको कमजोरी होइन। यो मानव मन हो।',
  },
  {
    key: 'anger',
    icon: Wind,
    titleEn: 'Why do I feel angry all the time and I do not know why?',
    titleNe: 'किन सधैं रिस उठ्छ र किन हो भन्ने थाहा हुँदैन?',
    bodyEn:
      'Anger often sits on top of fear or grief. In families where feelings are not named, anger becomes the only feeling that is allowed out.',
    bodyNe:
      'रिस प्रायः डर वा शोकमाथि बसेको हुन्छ। जहाँ भावनाको नाम हुँदैन, रिस मात्र बाहिर निस्कन पाउने भावना बन्छ।',
    closingEn: 'This is not your weakness. This is the human mind.',
    closingNe: 'यो तपाईंको कमजोरी होइन। यो मानव मन हो।',
  },
  {
    key: 'chest',
    icon: Heart,
    titleEn: 'Why does my chest feel tight for no reason?',
    titleNe: 'बिना कारण छाती किन अप्ठेरो हुन्छ?',
    bodyEn:
      'Tight chest, headache, and heaviness are common ways anxiety shows up when there are no words for it yet. Many women feel this first in the body.',
    bodyNe:
      'छाती अप्ठेरो, टाउको दुखाइ, गह्रौंपन — चिन्ता शब्द नभएसम्म शरीरले यसरी बोल्छ। धेरै महिलाहरू पहिले शरीरमै महसुस गर्छन्।',
    closingEn: 'This is not your weakness. This is the human mind.',
    closingNe: 'यो तपाईंको कमजोरी होइन। यो मानव मन हो।',
  },
  {
    key: 'empty',
    icon: Cloud,
    titleEn: 'Why do I feel empty when everything looks fine on the outside?',
    titleNe: 'बाहिर सबै ठीक देखिँदा पनि किन खाली महसुस हुन्छ?',
    bodyEn:
      'You can be safe on paper and still feel alone inside. The gap between how things look and how they feel is real, and naming it is the first kindness.',
    bodyNe:
      'कागजमा सुरक्षित देखिँदा पनि भित्र एक्लो महसुस हुन सक्छ। देखिने र महसुस हुने बीचको फरक वास्तविक छ — यसलाई नाम दिनु नै पहिलो दया हो।',
    closingEn: 'This is not your weakness. This is the human mind.',
    closingNe: 'यो तपाईंको कमजोरी होइन। यो मानव मन हो।',
  },
  {
    key: 'cry',
    icon: BookOpen,
    titleEn: 'Is it normal to cry without knowing why?',
    titleNe: 'कारण नबुझी रुनु सामान्य हो?',
    bodyEn:
      'Tears without a clear reason often carry old tiredness, not drama. Your body is releasing what words cannot hold yet.',
    bodyNe:
      'कारण नदेखिने आँसु प्रायः पुरानो थकान बोक्छ, नाटक होइन। शरीरले जे शब्दले समात्न सक्दैन त्यो खाली गर्दैछ।',
    closingEn: 'This is not your weakness. This is the human mind.',
    closingNe: 'यो तपाईंको कमजोरी होइन। यो मानव मन हो।',
  },
];

interface MannKoKuraProps {
  /** Tighter spacing when nested under Legal Rights */
  variant?: 'standalone' | 'embedded';
  className?: string;
}

const MannKoKura = ({ variant = 'standalone', className }: MannKoKuraProps) => {
  const { t } = useLanguage();
  const embedded = variant === 'embedded';

  return (
    <div
      className={cn(
        'mx-auto max-w-3xl space-y-8',
        embedded ? 'pb-2' : 'pb-16',
        className,
      )}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {t('Mind Talk', 'मनको कुरा')}
        </p>
        <h1
          className={cn(
            'mt-1 font-display font-bold text-foreground text-balance',
            embedded ? 'text-2xl md:text-3xl' : 'text-3xl',
          )}
        >
          {t('What the heart says', 'मनले के भन्छ')}
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          {t(
            'Short, warm explainers — not clinical labels. Read what resonates.',
            'छोटा, न्याना व्याख्याहरू — औपचारिक नाम होइन। जुन मिल्छ पढ्नुहोस्।',
          )}
        </p>
      </div>

      <div className="space-y-5">
        {TOPICS.map((topic) => (
          <Card
            key={topic.key}
            className="overflow-hidden rounded-2xl border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="p-6 md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-light text-primary">
                  <topic.icon className="h-5 w-5" aria-hidden />
                </div>
                <h2 className="font-display text-lg font-semibold text-foreground md:text-xl text-balance">
                  {t(topic.titleEn, topic.titleNe)}
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 md:text-base">{t(topic.bodyEn, topic.bodyNe)}</p>
              <p className="mt-4 border-l-2 border-primary/40 pl-4 text-sm font-medium italic text-sage-dark md:text-base">
                {t(topic.closingEn, topic.closingNe)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MannKoKura;
