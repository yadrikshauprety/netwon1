import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserCheck, Shield, MessageCircle, Phone, Video, Loader2, CheckCircle2, RotateCcw, Save } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  getTokenFromStorage,
  updateIncidentWorkflow,
  updateIncidentStatus,
  type IncidentDto,
} from '@/lib/incidentsApi';
import { NGO_UNIT_OPTIONS, progressLabel, unitLabel, PROGRESS_KEYS } from '@/lib/incidentMeta';

function stageLabel(type: string, t: (en: string, ne: string) => string): string {
  const map: Record<string, [string, string]> = {
    court_delay: ['Court Hearing', 'अदालत सुनुवाइ'],
    police_dismissal: ['Police Report', 'प्रहरी रिपोर्ट'],
    threat: ['Safety alert', 'सुरक्षा सतर्कता'],
    other: ['Incident update', 'घटना अपडेट'],
  };
  const pair = map[type] ?? map.other;
  return t(pair[0], pair[1]);
}

const urgencyBorder = {
  high: 'border-l-destructive',
  medium: 'border-l-amber-500/80',
  low: 'border-l-primary',
};

const urgencyColors = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-gold-warm/20 text-foreground',
  low: 'bg-sage-light text-primary',
};

interface NgoCaseCardProps {
  patient: IncidentDto;
  t: (en: string, ne: string) => string;
  onUpdated: () => Promise<void>;
  updatingId: string | null;
  setUpdatingId: (id: string | null) => void;
}

export function NgoCaseCard({ patient, t, onUpdated, updatingId, setUpdatingId }: NgoCaseCardProps) {
  const [assignee, setAssignee] = useState('');
  const [unitMode, setUnitMode] = useState<string>('');
  const [unitCustom, setUnitCustom] = useState('');
  const [progress, setProgress] = useState<string>('received');
  const [savingWorkflow, setSavingWorkflow] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  useEffect(() => {
    setAssignee(patient.assigned_to ?? '');
    const known = NGO_UNIT_OPTIONS.some((o) => o.value === patient.assigned_unit && o.value !== 'custom');
    if (known && patient.assigned_unit) {
      setUnitMode(patient.assigned_unit);
      setUnitCustom('');
    } else if (patient.assigned_unit) {
      setUnitMode('custom');
      setUnitCustom(patient.assigned_unit);
    } else {
      setUnitMode('');
      setUnitCustom('');
    }
    setProgress(patient.progress_state ?? 'received');
    setWorkflowError(null);
  }, [patient]);

  const st = patient.status ?? 'pending';
  const shortId = patient.id.replace(/-/g, '').slice(0, 8).toUpperCase();

  const saveWorkflow = async () => {
    const token = getTokenFromStorage();
    if (!token) return;
    let unitOut: string | null = null;
    if (unitMode === 'custom') unitOut = unitCustom.trim() || null;
    else if (unitMode && unitMode !== '') unitOut = unitMode;
    else unitOut = null;

    setWorkflowError(null);
    setSavingWorkflow(true);
    try {
      await updateIncidentWorkflow(token, patient.id, {
        assigned_to: assignee.trim() || null,
        assigned_unit: unitOut,
        progress_state: progress,
      });
      await onUpdated();
    } catch (e) {
      setWorkflowError(e instanceof Error ? e.message : t('Update failed', 'अपडेट असफल'));
    } finally {
      setSavingWorkflow(false);
    }
  };

  const handleNgoStatus = async (next: 'pending' | 'resolved') => {
    const token = getTokenFromStorage();
    if (!token) return;
    setUpdatingId(patient.id);
    try {
      await updateIncidentStatus(token, patient.id, next);
      await onUpdated();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card
      className={cn(
        'overflow-hidden rounded-2xl border border-border/60 bg-card shadow-md transition-shadow hover:shadow-lg',
        'border-l-[5px]',
        urgencyBorder[patient.priority as keyof typeof urgencyBorder] ?? urgencyBorder.medium,
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-col gap-0 lg:flex-row">
          <div className="min-w-0 flex-1 space-y-4 p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/80">
                  {patient.reporter_kind === 'anonymous' ? (
                    <Shield className="h-5 w-5 text-primary" />
                  ) : (
                    <UserCheck className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-semibold text-foreground">{patient.reporter_display_name ?? '—'}</p>
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">#{shortId}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {stageLabel(patient.incident_type, t)} · {formatDistanceToNow(new Date(patient.created_at * 1000), { addSuffix: true })}
                  </p>
                  {patient.reporter_kind !== 'anonymous' && patient.reporter_district ? (
                    <p className="mt-1 text-xs font-medium text-primary/90">
                      {t('District', 'जिल्ला')}: {patient.reporter_district}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(st === 'pending' ? 'bg-gold-warm/25 text-foreground' : 'bg-primary/15 text-primary')}
                >
                  {st === 'pending' ? t('Open', 'खुला') : t('Resolved', 'समाधान')}
                </Badge>
                <Badge className={urgencyColors[patient.priority as keyof typeof urgencyColors] ?? urgencyColors.medium} variant="secondary">
                  {patient.priority}
                </Badge>
                <Badge variant="outline" className="font-normal">
                  {progressLabel(patient.progress_state, t)}
                </Badge>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-muted/25 p-4 text-sm leading-relaxed text-foreground/90">{patient.description}</div>

            {(patient.assigned_to || patient.assigned_unit) && (
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {patient.assigned_unit ? (
                  <span>
                    <span className="font-medium text-foreground/80">{t('Unit', 'इकाई')}: </span>
                    {unitLabel(patient.assigned_unit, t)}
                  </span>
                ) : null}
                {patient.assigned_to ? (
                  <span>
                    <span className="font-medium text-foreground/80">{t('Assignee', 'जिम्मेवार')}: </span>
                    {patient.assigned_to}
                  </span>
                ) : null}
              </div>
            )}

            <div className="grid gap-5 rounded-xl border border-primary/15 bg-gradient-to-br from-card to-muted/20 p-4 md:grid-cols-2 md:p-5">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t('Assignment', 'तोक्नुहोस्')}</p>
                <div className="space-y-2">
                  <Label htmlFor={`unit-${patient.id}`} className="text-xs">
                    {t('Team / body', 'टोली / संस्था')}
                  </Label>
                  <Select value={unitMode || 'none'} onValueChange={(v) => setUnitMode(v === 'none' ? '' : v)}>
                    <SelectTrigger id={`unit-${patient.id}`} className="h-10 rounded-lg bg-background">
                      <SelectValue placeholder={t('Select unit', 'इकाई छान्नुहोस्')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('— None —', '— छैन —')}</SelectItem>
                      {NGO_UNIT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {t(o.labelEn, o.labelNe)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {unitMode === 'custom' ? (
                  <div className="space-y-2">
                    <Label htmlFor={`custom-unit-${patient.id}`} className="text-xs">
                      {t('Custom unit name', 'अनुकूल इकाई नाम')}
                    </Label>
                    <Input
                      id={`custom-unit-${patient.id}`}
                      value={unitCustom}
                      onChange={(e) => setUnitCustom(e.target.value)}
                      className="h-10 rounded-lg"
                      placeholder={t('e.g. Partner NGO name', 'उदा. साझेदार एनजीओ')}
                    />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor={`assignee-${patient.id}`} className="text-xs">
                    {t('Person responsible', 'जिम्मेवार व्यक्ति')}
                  </Label>
                  <Input
                    id={`assignee-${patient.id}`}
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="h-10 rounded-lg"
                    placeholder={t('Name or role', 'नाम वा भूमिका')}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t('Survivor-visible progress', 'बाँचेकालाई देखिने प्रगति')}</p>
                <div className="space-y-2">
                  <Label htmlFor={`prog-${patient.id}`} className="text-xs">
                    {t('Stage', 'चरण')}
                  </Label>
                  <Select value={progress} onValueChange={setProgress}>
                    <SelectTrigger id={`prog-${patient.id}`} className="h-10 rounded-lg bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRESS_KEYS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {progressLabel(k, t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {t(
                    'Survivors see this stage on their Incident Log so they know their case is moving.',
                    'बाँचेकाहरूले आफ्नो घटना लगमा यो चरण देख्छन्।',
                  )}
                </p>
              </div>
            </div>

            {workflowError ? <p className="text-sm text-destructive">{workflowError}</p> : null}

            <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
              <Button
                type="button"
                size="sm"
                className="gap-2 rounded-full"
                disabled={savingWorkflow}
                onClick={() => void saveWorkflow()}
              >
                {savingWorkflow ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                {t('Save assignment & progress', 'तोकाइ र प्रगति सुरक्षित गर्नुहोस्')}
              </Button>
              {st === 'pending' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5 rounded-full"
                  disabled={updatingId === patient.id}
                  onClick={() => void handleNgoStatus('resolved')}
                >
                  {updatingId === patient.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
                  {t('Close case', 'मुद्दा बन्द गर्नुहोस्')}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 rounded-full"
                  disabled={updatingId === patient.id}
                  onClick={() => void handleNgoStatus('pending')}
                >
                  {updatingId === patient.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RotateCcw className="h-4 w-4" aria-hidden />}
                  {t('Reopen case', 'मुद्दा पुन: खोल्नुहोस्')}
                </Button>
              )}
            </div>

            {st === 'resolved' && patient.resolved_at ? (
              <p className="text-xs text-muted-foreground">
                {t('Closed', 'बन्द')}{' '}
                {formatDistanceToNow(new Date(patient.resolved_at * 1000), { addSuffix: true })}
              </p>
            ) : null}
          </div>

          <div className="flex flex-row justify-center gap-1 border-t border-border/60 bg-muted/15 p-3 lg:w-14 lg:flex-col lg:border-l lg:border-t-0 lg:py-6">
            <Button variant="ghost" size="icon" className="text-primary hover:bg-background" aria-label={t('Message', 'सन्देश')}>
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary hover:bg-background" aria-label={t('Call', 'कल')}>
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary hover:bg-background" aria-label={t('Video', 'भिडियो')}>
              <Video className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
