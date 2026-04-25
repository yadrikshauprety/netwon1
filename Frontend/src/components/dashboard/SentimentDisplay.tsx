import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { SentimentResponse } from './SentimentCheckIn';
import { Heart, Shield, Users, Moon } from 'lucide-react';

interface SentimentDisplayProps {
  sentiment: SentimentResponse;
}

const SentimentDisplay = ({ sentiment }: SentimentDisplayProps) => {
  const { t } = useLanguage();

  const getOverallLabel = (score: number) => {
    if (score >= 80) return { en: "You're doing great today 💚", ne: 'आज तपाईं राम्रो गर्दै हुनुहुन्छ 💚', color: 'text-primary' };
    if (score >= 60) return { en: "You're holding up well 🙂", ne: 'तपाईं राम्रोसँग टिकिरहनुभएको छ 🙂', color: 'text-primary' };
    if (score >= 40) return { en: "It's okay to have tough days 🤝", ne: 'कठिन दिनहरू हुनु ठीक छ 🤝', color: 'text-muted-foreground' };
    return { en: "We see you. You're not alone 💛", ne: 'हामीले तपाईंलाई देख्छौं। तपाईं एक्लो हुनुहुन्न 💛', color: 'text-destructive' };
  };

  const metrics = [
    { key: 'mood', icon: Heart, en: 'Mood', ne: 'मनोदशा', value: sentiment.mood },
    { key: 'safety', icon: Shield, en: 'Safety', ne: 'सुरक्षा', value: sentiment.safety },
    { key: 'support', icon: Users, en: 'Support', ne: 'सहयोग', value: sentiment.support },
    { key: 'sleep', icon: Moon, en: 'Sleep', ne: 'निद्रा', value: sentiment.sleep },
  ];

  const overall = getOverallLabel(sentiment.overallScore);

  return (
    <Card className="border-border/50 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          {t("Today's Well-being", 'आजको भलाइ')}
        </CardTitle>
        <p className={`text-sm font-medium ${overall.color}`}>{t(overall.en, overall.ne)}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.key} className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <m.icon className="h-3.5 w-3.5" />
                {t(m.en, m.ne)}
              </div>
              <Progress value={(m.value / 5) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">{m.value}/5</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('Overall Score', 'समग्र स्कोर')}</span>
          <span className="text-2xl font-display font-bold text-foreground">{sentiment.overallScore}%</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SentimentDisplay;
