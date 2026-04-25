import { cn } from '@/lib/utils';
import { progressVisualStep } from '@/lib/incidentMeta';

interface CaseProgressStripProps {
  progressState: string;
  className?: string;
  label: (en: string, ne: string) => string;
}

export function CaseProgressStrip({ progressState, className, label }: CaseProgressStripProps) {
  const current = progressVisualStep(progressState);
  const steps: [string, string][] = [
    [label('Received', 'प्राप्त'), label('Report received by the team', 'टोलीले रिपोर्ट प्राप्त गर्यो')],
    [label('Review', 'समीक्षा'), label('Initial review', 'प्रारम्भिक समीक्षा')],
    [label('Assigned', 'तोकिएको'), label('Assigned to a person or unit', 'व्यक्ति व इकाईमा तोकियो')],
    [label('Active', 'सक्रिय'), label('Follow-up in progress', 'फलोअप जारी')],
    [label('Closed', 'बन्द'), label('Case closed', 'मुद्दा बन्द')],
  ];

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label('Progress', 'प्रगति')}</p>
      <div className="flex flex-wrap items-center gap-1 sm:gap-0 sm:justify-between">
        {steps.map((s, i) => {
          const done = i <= current;
          const isLast = i === steps.length - 1;
          return (
            <div key={i} className="flex min-w-0 flex-1 items-center sm:min-w-[4.5rem]">
              <div className="flex w-full flex-col items-center gap-1 text-center">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    done ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground',
                  )}
                  title={s[1]}
                >
                  {i + 1}
                </div>
                <span className={cn('hidden text-[10px] font-medium leading-tight sm:block', done ? 'text-foreground' : 'text-muted-foreground')}>
                  {s[0]}
                </span>
              </div>
              {!isLast ? (
                <div
                  className={cn('mx-0.5 hidden h-0.5 min-w-[8px] flex-1 sm:mx-1 sm:block', i < current ? 'bg-primary/70' : 'bg-border')}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
