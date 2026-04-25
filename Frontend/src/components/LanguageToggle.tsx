import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium sm:gap-2 sm:text-sm" title="English / नेपाली">
      <span className={language === 'en' ? 'text-foreground' : 'text-muted-foreground'}>EN</span>
      <Switch
        checked={language === 'ne'}
        onCheckedChange={(checked) => setLanguage(checked ? 'ne' : 'en')}
        className="scale-90 data-[state=checked]:bg-primary sm:scale-100"
      />
      <span className={language === 'ne' ? 'text-foreground' : 'text-muted-foreground'}>
        <span className="xs:hidden">ने</span>
        <span className="hidden xs:inline">नेपाली</span>
      </span>
    </div>
  );
};

export default LanguageToggle;
