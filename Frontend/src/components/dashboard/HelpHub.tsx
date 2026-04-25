import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, MessageSquare, BookOpen, Scale, Heart } from 'lucide-react';
import CaseTrackerPage from '@/components/dashboard/CaseTrackerPage';
import LegalRights from '@/components/dashboard/LegalRights';
import SafetyPlanning from '@/components/dashboard/SafetyPlanning';
import TherapistConnect from '@/components/dashboard/TherapistConnect';

const SMS_BODY_NE =
  'नमस्ते, मलाई कुरा गर्नुपर्छ। कृपया जब सक्नुहुन्छ सम्पर्क गर्नुहोस्।';
const SMS_BODY_EN = 'Hello, I need someone to contact me when you can.';

const HelpHub = () => {
  const { t, language } = useLanguage();
  const smsBody = language === 'ne' ? SMS_BODY_NE : SMS_BODY_EN;
  const smsHref = `sms:?body=${encodeURIComponent(smsBody)}`;

  return (
    <div className="mx-auto max-w-4xl space-y-12 pb-20">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {t('Help', 'सहायता')}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-foreground">
          {t('Support & resources', 'सहयोग र स्रोतहरू')}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground leading-relaxed">
          {t(
            'Crisis options, people who can help, and legal information — in one place. Open only what you need.',
            'संकटका विकल्प, मद्दत गर्न सक्ने मानिसहरू, र कानुनी जानकारी — एकै ठाउँमा। जे चाहिन्छ मात्र खोल्नुहोस्।',
          )}
        </p>
      </div>

      {/* Tier 1 — immediate */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
          <Phone className="h-5 w-5 text-primary" />
          {t('In the next few minutes', 'अर्को केही मिनेटमा')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-2xl border-destructive/20 bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("Women's helpline", 'महिला हेल्पलाइन')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold tracking-wide text-primary">1145</p>
              <p className="text-sm text-muted-foreground">
                {t('Free, confidential support in Nepal.', 'नेपालमा निःशुल्क, गोप्य सहयोग।')}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('Quick message to someone you trust', 'विश्वासको मानिसलाई छिटो सन्देश')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(
                  'Opens your SMS app with a short Nepali line. You approve before sending. Works on 2G.',
                  'एसएमएस एप खोल्छ — छोटो नेपाली पंक्ति। पठाउनु अघि तपाईं स्वीकृति दिनुहोस्। २G मा पनि चल्छ।',
                )}
              </p>
              <Button asChild className="btn-hero w-full rounded-full">
                <a href={smsHref}>{t('Prepare SMS', 'एसएमएस तयार पार्नुहोस्')}</a>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Card className="rounded-2xl border-border/50 bg-muted/30">
          <CardContent className="flex flex-wrap items-start gap-3 p-5">
            <MapPin className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                {t('Shelter & local help', 'आश्रय र स्थानीय सहयोग')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {t(
                  'Your district (from signup) can be used to show nearby NGO partners — directory data is supplied by your organization.',
                  'साइनअपको जिल्लाअनुसार नजिकको एनजीओ साझेदार देखाउन सकिन्छ — सूची संस्थाले दिन्छ।',
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tier 2 — counselors */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
          <Heart className="h-5 w-5 text-primary" />
          {t('Counselors & NGO match', 'परामर्शदाता र एनजीओ मिलान')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            'Filter by language, woman counselor preference, and how you want to connect. Requests go to a coordinator.',
            'भाषा, महिला परामर्शदाता र जडानको तरिकाअनुसार छान्नुहोस्। अनुरोध समन्वयकसम्म जान्छ।',
          )}
        </p>
        <TherapistConnect />
      </section>

      {/* Tier 3 — legal audio / rights */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
          <BookOpen className="h-5 w-5 text-primary" />
          {t('Know your rights (plain language)', 'अधिकार बुझ्नुहोस् (सरल भाषा)')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            'Short explainers and stages of the process — written to be useful, not intimidating.',
            'छोटा व्याख्या र चरणहरू — उपयोगी, डरलाग्दो होइन।',
          )}
        </p>
        <LegalRights />
      </section>

      {/* DV / legal module — “if something specific” */}
      <section className="space-y-4 rounded-[2rem] border border-primary/15 bg-gradient-to-b from-card to-muted/20 p-6 md:p-8">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
          <Scale className="h-5 w-5 text-primary" />
          {t('If something specific is happening', 'केही विशेष भइरहेछ भने')}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t(
            'Case tracker (timeline with notes on each step) and safety planning — for when you are ready.',
            'मुद्दा ट्र्याकर (प्रत्येक चरणमा नोटसहित समयरेखा) र सुरक्षा योजना — जब तपाईं तयार हुनुहुन्छ।',
          )}
        </p>
        <div className="space-y-10 pt-4">
          <CaseTrackerPage variant="embedded" />
          <div className="border-t border-border/60 pt-10">
            <SafetyPlanning />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpHub;
