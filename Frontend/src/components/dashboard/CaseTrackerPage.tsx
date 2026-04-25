import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/layout/PageHeader';
import CaseTimeline from '@/components/dashboard/CaseTimeline';
import { cn } from '@/lib/utils';

export interface CaseTrackerPageProps {
  /** When embedded (e.g. Help hub), skip the main page header and use tighter section titles. */
  variant?: 'default' | 'embedded';
}

const CaseTrackerPage = ({ variant = 'default' }: CaseTrackerPageProps) => {
  const { t } = useLanguage();
  const embedded = variant === 'embedded';

  return (
    <div className={cn('space-y-10 pb-8', embedded && 'space-y-8 pb-0')}>
      {!embedded && (
        <PageHeader
          eyebrow={t('Your case', 'तपाईंको मुद्दा')}
          title={t('Case Tracker', 'मुद्दा ट्र्याकर')}
          description={t(
            'Your timeline — add steps and keep private notes under each one. Saved on this device.',
            'तपाईंको समयरेखा — चरण थप्नुहोस् र प्रत्येकमुनि निजी नोट राख्नुहोस्। यो यन्त्रमा बचत हुन्छ।',
          )}
        />
      )}

      <section className={cn('space-y-4', !embedded && 'scroll-mt-4')}>
        {embedded ? (
          <h3 className="font-display text-base font-semibold text-foreground">
            {t('Case timeline', 'मुद्दाको समयरेखा')}
          </h3>
        ) : (
          <h2 className="font-display text-xl font-semibold text-foreground">
            {t('Case timeline', 'मुद्दाको समयरेखा')}
          </h2>
        )}
        <CaseTimeline hideHeader />
      </section>
    </div>
  );
};

export default CaseTrackerPage;
