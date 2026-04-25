import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Phone, MapPin, Backpack, FileText, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

const SafetyPlanning = () => {
  const { t } = useLanguage();

  const emergencyItems = [
    { icon: FileText, text: t('Important documents (citizenship, marriage cert, FIR copy)', 'महत्त्वपूर्ण कागजातहरू (नागरिकता, विवाह प्रमाणपत्र, एफआईआर प्रति)') },
    { icon: Phone, text: t('Phone with emergency contacts saved', 'आपतकालीन सम्पर्क सुरक्षित गरिएको फोन') },
    { icon: Backpack, text: t('Small bag with essentials (clothes, medicine)', 'आवश्यक सामानको सानो झोला (कपडा, औषधि)') },
    { icon: MapPin, text: t('Know the nearest safe house / shelter location', 'नजिकको सुरक्षित घर / आश्रय स्थानको जानकारी') },
  ];

  const contacts = [
    { name: t('Nepal Police Women Cell', 'नेपाल प्रहरी महिला सेल'), number: '1145' },
    { name: t('National Women Commission', 'राष्ट्रिय महिला आयोग'), number: '01-4354109' },
    { name: t('WOREC Nepal', 'वर्क नेपाल'), number: '01-5006373' },
    { name: t('Maiti Nepal', 'माइती नेपाल'), number: '01-4492904' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t('Protection', 'सुरक्षा')}
        title={t('Safety Planning', 'सुरक्षा योजना')}
        description={t('Practical, not clinical. Your safety comes first.', 'व्यावहारिक, क्लिनिकल होइन। तपाईंको सुरक्षा पहिलो हो।')}
      />

      <Card className="rounded-2xl border-destructive/25 bg-destructive/5 shadow-sm">
        <CardContent className="flex items-center gap-3 p-4 md:p-5">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm font-medium text-foreground">
            {t('If you are in immediate danger, call 100 (Nepal Police) or 1145 (Women Cell)', 'यदि तपाईं तत्काल खतरामा हुनुहुन्छ भने, 100 (नेपाल प्रहरी) वा 1145 (महिला सेल) मा कल गर्नुहोस्')}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-display text-lg font-semibold">
            <Shield className="h-5 w-5 text-primary" />
            {t('If You Need to Leave Quickly', 'यदि तपाईंलाई छिटो जानु पर्छ')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {emergencyItems.map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-sage-light/80 p-3.5">
              <item.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{item.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-display text-lg font-semibold">
            <Phone className="h-5 w-5 text-primary" />
            {t('Emergency Contacts', 'आपतकालीन सम्पर्कहरू')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {contacts.map((c, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-muted/50 p-3.5">
              <span className="text-sm font-medium text-foreground">{c.name}</span>
              <a href={`tel:${c.number}`} className="text-sm text-primary font-semibold hover:underline">{c.number}</a>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SafetyPlanning;
