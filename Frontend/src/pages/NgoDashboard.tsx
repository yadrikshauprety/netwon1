import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Calendar, Loader2, CheckCircle2, ClipboardList } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetchIncidents, fetchIncidentStats, getTokenFromStorage, type IncidentDto } from '@/lib/incidentsApi';
import { fetchRegisteredUsersForNgo, type NgoRegisteredUserRow } from '@/lib/ngoUsersApi';
import { NgoCaseCard } from '@/components/dashboard/NgoCaseCard';

const NgoDashboard = () => {
  const { t } = useLanguage();
  const { isAuthenticated, user, authReady } = useAuth();
  const [cases, setCases] = useState<IncidentDto[]>([]);
  const [stats, setStats] = useState({
    pending_cases: 0,
    resolved_cases: 0,
    pending_anonymous: 0,
    pending_registered: 0,
    incidents_this_week: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<'all' | 'anonymous' | 'registered'>('all');
  const [caseStatus, setCaseStatus] = useState<'all' | 'pending' | 'resolved'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<NgoRegisteredUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const loadRegisteredUsers = useCallback(async () => {
    const token = getTokenFromStorage();
    if (!token) {
      setRegisteredUsers([]);
      return;
    }
    setUsersLoading(true);
    try {
      const rows = await fetchRegisteredUsersForNgo(token);
      setRegisteredUsers(rows);
    } catch {
      setRegisteredUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    const token = getTokenFromStorage();
    if (!token) {
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const list = await fetchIncidents(token, audience, caseStatus);
      setCases(list);
      try {
        const s = await fetchIncidentStats(token);
        setStats(s);
      } catch {
        setStats({
          pending_cases: 0,
          resolved_cases: 0,
          pending_anonymous: 0,
          pending_registered: 0,
          incidents_this_week: 0,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Could not load dashboard', 'ड्यासबोर्ड लोड गर्न सकिएन'));
    } finally {
      setLoading(false);
    }
  }, [t, audience, caseStatus]);

  useEffect(() => {
    if (!authReady || !isAuthenticated || user?.role !== 'ngo') return;
    void loadDashboard();
    void loadRegisteredUsers();
  }, [authReady, isAuthenticated, user?.role, loadDashboard, loadRegisteredUsers]);

  if (!authReady) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }
  if (!isAuthenticated || user?.role !== 'ngo') return <Navigate to="/auth" />;

  const statCards = [
    {
      label: t('Open cases', 'खुला मुद्दा'),
      value: String(stats.pending_cases),
      icon: ClipboardList,
      color: 'bg-sage-light text-primary',
    },
    {
      label: t('Resolved', 'समाधान'),
      value: String(stats.resolved_cases),
      icon: CheckCircle2,
      color: 'bg-primary/15 text-primary',
    },
    {
      label: t('Anonymous (open)', 'अज्ञात (खुला)'),
      value: String(stats.pending_anonymous),
      icon: Shield,
      color: 'bg-terracotta-light text-terracotta',
    },
    {
      label: t('New this week', 'यो हप्ता नयाँ'),
      value: String(stats.incidents_this_week),
      icon: Calendar,
      color: 'bg-rose-soft text-foreground',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="min-h-[calc(100dvh-var(--nav-offset))] bg-gradient-to-b from-primary/[0.06] via-muted/20 to-background pt-[var(--nav-offset)]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-10">
          <PageHeader
            eyebrow={t('Coordinator', 'समन्वयक')}
            title={t('Case coordination', 'मुद्दा समन्वय')}
            description={t(
              'Assign teams, track progress, and keep survivors informed — all in one place.',
              'टोली तोक्नुहोस्, प्रगति हेर्नुहोस्, र बाँचेकाहरूलाई जानकारी दिनुहोस् — एकै ठाउँमा।',
            )}
          />

          {error ? (
            <p className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {statCards.map((s, i) => (
              <Card key={i} className="rounded-2xl border-border/50 bg-card/95 shadow-sm backdrop-blur-sm">
                <CardContent className="flex items-center gap-3 p-4 md:p-5">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-2xl font-bold text-foreground">{loading ? '—' : s.value}</p>
                    <p className="text-xs leading-tight text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mb-6 rounded-2xl border-border/60 bg-card/90 shadow-sm">
            <CardContent className="space-y-3 p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('Registered survivors', 'दर्ता प्रयोगकर्ता')}
                </p>
                {usersLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden /> : null}
              </div>
              {registeredUsers.length === 0 && !usersLoading ? (
                <p className="text-sm text-muted-foreground">
                  {t('No registered user accounts yet.', 'अझै कुनै दर्ता खाता छैन।')}
                </p>
              ) : (
                <div className="max-h-56 overflow-auto rounded-xl border border-border/50">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-muted/80 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                      <tr>
                        <th className="px-3 py-2">{t('Name', 'नाम')}</th>
                        <th className="px-3 py-2">{t('Email', 'इमेल')}</th>
                        <th className="px-3 py-2">{t('District', 'जिल्ला')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredUsers.map((u) => (
                        <tr key={u._id} className="border-t border-border/40">
                          <td className="px-3 py-2 font-medium text-foreground">{u.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                          <td className="px-3 py-2 text-foreground/90">{u.district?.trim() || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6 rounded-2xl border-border/60 bg-card/90 shadow-sm">
            <CardContent className="space-y-4 p-4 md:p-5">
              <Tabs value={audience} onValueChange={(v) => setAudience(v as typeof audience)} className="w-full">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Reporter type', 'प्रतिवेदक प्रकार')}</p>
                <TabsList className="mt-2 flex h-auto min-h-10 w-full flex-wrap gap-1 rounded-xl bg-muted/70 p-1">
                  <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    {t('All', 'सबै')}
                  </TabsTrigger>
                  <TabsTrigger value="anonymous" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    {t('Anonymous', 'अज्ञात')}
                  </TabsTrigger>
                  <TabsTrigger value="registered" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    {t('Registered', 'दर्ता')}
                  </TabsTrigger>
                </TabsList>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Case status', 'मुद्दा स्थिति')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      { key: 'all' as const, en: 'All', ne: 'सबै' },
                      { key: 'pending' as const, en: 'Open', ne: 'खुला' },
                      { key: 'resolved' as const, en: 'Resolved', ne: 'समाधान' },
                    ] as const
                  ).map((opt) => (
                    <Button
                      key={opt.key}
                      type="button"
                      size="sm"
                      variant={caseStatus === opt.key ? 'default' : 'secondary'}
                      className="rounded-full"
                      onClick={() => setCaseStatus(opt.key)}
                    >
                      {t(opt.en, opt.ne)}
                    </Button>
                  ))}
                </div>

                <TabsContent value={audience} className="mt-6 space-y-4 focus-visible:outline-none">
                  {loading ? (
                    <div className="flex justify-center py-16 text-muted-foreground">
                      <Loader2 className="h-9 w-9 animate-spin" aria-hidden />
                    </div>
                  ) : cases.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 py-14 text-center">
                      <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" aria-hidden />
                      <p className="text-sm text-muted-foreground">{t('No cases in this view.', 'यो दृश्यमा कुनै मुद्दा छैन।')}</p>
                    </div>
                  ) : (
                    cases.map((c) => (
                      <NgoCaseCard
                        key={c.id}
                        patient={c}
                        t={t}
                        onUpdated={loadDashboard}
                        updatingId={updatingId}
                        setUpdatingId={setUpdatingId}
                      />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NgoDashboard;
