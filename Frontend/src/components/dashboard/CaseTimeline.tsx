import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, FileText, Plus, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import type { CaseEventPersisted } from '@/lib/journeyStorage';
import { getCaseEventsOrSeed, saveCaseEvents } from '@/lib/journeyStorage';

const IBT_NOTE_KEY = 'ibt-2';

function emotionalNoteText(note: string | undefined, t: (en: string, ne: string) => string): string | undefined {
  if (!note) return undefined;
  if (note === IBT_NOTE_KEY) {
    return t(
      "This is the 2nd postponement. It's okay to feel frustrated. Many women at this stage feel the same exhaustion.",
      'यो दोस्रो स्थगन हो। निराश महसुस गर्नु ठीक छ। यस चरणमा धेरै महिलाहरूले उस्तै थकान महसुस गर्छन्।',
    );
  }
  return note;
}

interface CaseTimelineProps {
  /** When true, omits the main PageHeader (e.g. nested under Case Tracker page). */
  hideHeader?: boolean;
}

const CaseTimeline = ({ hideHeader = false }: CaseTimelineProps) => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<CaseEventPersisted[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<CaseEventPersisted['type']>('court');
  const [newStatus, setNewStatus] = useState<CaseEventPersisted['status']>('upcoming');

  useEffect(() => {
    setEvents(getCaseEventsOrSeed());
    setLoaded(true);
  }, []);

  const persist = useCallback((next: CaseEventPersisted[]) => {
    setEvents(next);
    saveCaseEvents(next);
  }, []);

  const statusColors = {
    completed: 'bg-primary/10 text-primary',
    upcoming: 'bg-gold-warm/20 text-foreground',
    delayed: 'bg-destructive/10 text-destructive',
  };

  const addEvent = () => {
    if (!newTitle.trim()) return;
    const ev: CaseEventPersisted = {
      id: `evt-${Date.now()}`,
      date: newDate,
      type: newType,
      title: newTitle.trim(),
      status: newStatus,
      notes: '',
    };
    persist([...events, ev]);
    setNewTitle('');
    setOpen(false);
  };

  const setEventNotes = (id: string, notes: string) => {
    persist(events.map((ev) => (ev.id === id ? { ...ev, notes } : ev)));
  };

  if (!loaded) {
    return (
      <div className="h-32 animate-pulse rounded-2xl bg-muted/50" aria-hidden />
    );
  }

  return (
    <div className="space-y-8">
      {hideHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-muted-foreground">
            {t(
              'Saved on this device — sync from backend when available.',
              'यो यन्त्रमा बचत — ब्याकएन्ड जोड्दा मिलाउन सकिन्छ।',
            )}
          </p>
          <Button className="btn-hero shrink-0 gap-2 rounded-full text-sm" type="button" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('Add event', 'घटना थप्नुहोस्')}
          </Button>
        </div>
      ) : (
        <PageHeader
          eyebrow={t('Legal process', 'कानुनी प्रक्रिया')}
          title={t('Case timeline', 'मुद्दाको समयरेखा')}
          description={t('Saved on this device — sync from backend when available.', 'यो यन्त्रमा बचत — ब्याकएन्ड जोड्दा मिलाउन सकिन्छ।')}
          action={
            <Button className="btn-hero shrink-0 gap-2 rounded-full text-sm" type="button" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('Add event', 'घटना थप्नुहोस्')}
            </Button>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{t('Add case event', 'मुद्दाको घटना थप्नुहोस्')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ev-title">{t('Title', 'शीर्षक')}</Label>
              <Input
                id="ev-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t('e.g. Next hearing', 'उदा. अर्को सुनुवाइ')}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-date">{t('Date', 'मिति')}</Label>
              <Input
                id="ev-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('Type', 'प्रकार')}</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as CaseEventPersisted['type'])}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="court">{t('Court', 'अदालत')}</SelectItem>
                    <SelectItem value="police">{t('Police', 'प्रहरी')}</SelectItem>
                    <SelectItem value="document">{t('Document', 'कागजात')}</SelectItem>
                    <SelectItem value="milestone">{t('Milestone', 'कोशेढुङ्गा')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('Status', 'स्थिति')}</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as CaseEventPersisted['status'])}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">{t('Completed', 'सम्पन्न')}</SelectItem>
                    <SelectItem value="upcoming">{t('Upcoming', 'आगामी')}</SelectItem>
                    <SelectItem value="delayed">{t('Delayed', 'ढिलो')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
              {t('Cancel', 'रद्द')}
            </Button>
            <Button type="button" className="btn-hero rounded-full" onClick={addEvent}>
              {t('Save', 'बचत')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative space-y-4">
        {events.map((event, i) => (
          <div key={event.id} className="relative pl-8">
            {i < events.length - 1 && <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />}
            <div
              className={`absolute left-0 top-2 flex h-8 w-8 items-center justify-center rounded-full ${
                event.status === 'completed'
                  ? 'bg-primary text-primary-foreground'
                  : event.status === 'delayed'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {event.type === 'court' ? (
                <Calendar className="h-4 w-4" />
              ) : event.type === 'police' ? (
                <FileText className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </div>
            <Card className="ml-4 rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                  </div>
                  <Badge className={statusColors[event.status]}>
                    {event.status === 'completed'
                      ? t('Completed', 'सम्पन्न')
                      : event.status === 'delayed'
                        ? t('Delayed', 'ढिलो')
                        : t('Upcoming', 'आगामी')}
                  </Badge>
                </div>
                {emotionalNoteText(event.emotionalNote, t) && (
                  <div className="mt-3 rounded-lg border border-terracotta/20 bg-terracotta-light p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                      <p className="text-sm italic text-foreground/80">{emotionalNoteText(event.emotionalNote, t)}</p>
                    </div>
                  </div>
                )}
                <div className="mt-4 space-y-2 border-t border-border/50 pt-4">
                  <Label htmlFor={`case-notes-${event.id}`} className="text-xs font-medium text-muted-foreground">
                    {t('Notes', 'नोटहरू')}
                  </Label>
                  <Textarea
                    id={`case-notes-${event.id}`}
                    value={event.notes ?? ''}
                    onChange={(e) => setEventNotes(event.id, e.target.value)}
                    placeholder={t('Private notes for this step…', 'यस चरणका लागि निजी नोट…')}
                    rows={3}
                    className="min-h-[72px] resize-y rounded-xl border-border/80 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {t('Saved on this device with this case step.', 'यो यन्त्रमा यो चरणसँगै बचत हुन्छ।')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaseTimeline;
