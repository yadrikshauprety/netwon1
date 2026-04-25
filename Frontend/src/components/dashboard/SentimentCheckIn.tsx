import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SentimentCheckInProps {
  open: boolean;
  onComplete: (responses: SentimentResponse) => void;
}

export interface SentimentResponse {
  mood: number;
  safety: number;
  support: number;
  sleep: number;
  overallScore: number;
  timestamp: string;
}

const questions = [
  {
    key: 'mood',
    en: 'How are you feeling today?',
    ne: 'आज तपाईंलाई कस्तो लागिरहेको छ?',
    options: [
      { value: 1, en: '😢 Very Low', ne: '😢 धेरै कम' },
      { value: 2, en: '😟 Low', ne: '😟 कम' },
      { value: 3, en: '😐 Okay', ne: '😐 ठीकै' },
      { value: 4, en: '🙂 Good', ne: '🙂 राम्रो' },
      { value: 5, en: '😊 Great', ne: '😊 उत्तम' },
    ],
  },
  {
    key: 'safety',
    en: 'How safe do you feel right now?',
    ne: 'अहिले तपाईं कत्तिको सुरक्षित महसुस गर्नुहुन्छ?',
    options: [
      { value: 1, en: '🔴 Not safe', ne: '🔴 सुरक्षित छैन' },
      { value: 2, en: '🟠 Uneasy', ne: '🟠 अस्वस्थ' },
      { value: 3, en: '🟡 Somewhat', ne: '🟡 केही हदसम्म' },
      { value: 4, en: '🟢 Mostly safe', ne: '🟢 प्रायः सुरक्षित' },
      { value: 5, en: '💚 Completely safe', ne: '💚 पूर्ण सुरक्षित' },
    ],
  },
  {
    key: 'support',
    en: 'Do you feel supported by people around you?',
    ne: 'तपाईंको वरिपरिका मानिसहरूबाट सहयोग महसुस गर्नुहुन्छ?',
    options: [
      { value: 1, en: '😞 Not at all', ne: '😞 बिल्कुलै छैन' },
      { value: 2, en: '😕 Rarely', ne: '😕 विरलै' },
      { value: 3, en: '😐 Sometimes', ne: '😐 कहिलेकाहीं' },
      { value: 4, en: '🙂 Often', ne: '🙂 प्रायः' },
      { value: 5, en: '🤗 Always', ne: '🤗 सधैं' },
    ],
  },
  {
    key: 'sleep',
    en: 'How well did you sleep last night?',
    ne: 'हिजो राति तपाईंले कत्तिको राम्रो निद्रा पाउनुभयो?',
    options: [
      { value: 1, en: '😴 Very poorly', ne: '😴 धेरै खराब' },
      { value: 2, en: '😪 Poorly', ne: '😪 खराब' },
      { value: 3, en: '😐 Average', ne: '😐 ठीकै' },
      { value: 4, en: '😌 Well', ne: '😌 राम्रो' },
      { value: 5, en: '😇 Very well', ne: '😇 धेरै राम्रो' },
    ],
  },
];

const SentimentCheckIn = ({ open, onComplete }: SentimentCheckInProps) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const currentQ = questions[step];

  const handleSelect = (value: number) => {
    const newAnswers = { ...answers, [currentQ.key]: value };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      const overallScore = Math.round(
        ((newAnswers.mood + newAnswers.safety + newAnswers.support + newAnswers.sleep) / 20) * 100
      );
      onComplete({
        mood: newAnswers.mood,
        safety: newAnswers.safety,
        support: newAnswers.support,
        sleep: newAnswers.sleep,
        overallScore,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {t('Daily Check-In', 'दैनिक जाँच')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'Take a moment to reflect. Your answers are private.',
              'एक क्षण सोच्नुहोस्। तपाईंका जवाफहरू निजी छन्।'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1.5 mb-2">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <p className="text-base font-medium text-foreground">{t(currentQ.en, currentQ.ne)}</p>

        <div className="grid gap-2 mt-2">
          {currentQ.options.map((opt) => (
            <Button
              key={opt.value}
              variant="outline"
              className={`justify-start text-left h-auto py-3 px-4 text-sm transition-all hover:border-primary hover:bg-primary/5 ${
                answers[currentQ.key] === opt.value ? 'border-primary bg-primary/10' : ''
              }`}
              onClick={() => handleSelect(opt.value)}
            >
              {t(opt.en, opt.ne)}
            </Button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          {t(`Question ${step + 1} of ${questions.length}`, `प्रश्न ${step + 1} मध्ये ${questions.length}`)}
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default SentimentCheckIn;
