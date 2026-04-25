import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import CaseTrackerPage from '@/components/dashboard/CaseTrackerPage';
import PeerConnect from '@/components/dashboard/PeerConnect';
import SafetyPlanning from '@/components/dashboard/SafetyPlanning';
import LegalRights from '@/components/dashboard/LegalRights';
import TherapistConnect from '@/components/dashboard/TherapistConnect';
import Chatbot from '@/components/dashboard/Chatbot';
import MoodGate from '@/components/dashboard/MoodGate';
import TodayScreen from '@/components/dashboard/TodayScreen';
import WellnessSpectrum, { type WellnessPath } from '@/components/dashboard/WellnessSpectrum';
import {
  Scale,
  Calendar,
  Users,
  Shield,
  BookOpen,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { applyMoodThemeFromKey } from '@/lib/moodTheme';

const WELLNESS_SESSION_KEY = 'aafnai_wellness_gate_v1';

const defaultTabForPath = (p: WellnessPath) => {
  switch (p) {
    case 'heavy':
      return 'today';
    case 'unsettled':
      return 'rights';
    case 'alone':
      return 'peer';
    case 'support':
      return 'safety';
    default:
      return 'today';
  }
};

const navItems = [
  { key: 'today', icon: Calendar, labelEn: 'Today', labelNe: 'आज' },
  { key: 'case', icon: Scale, labelEn: 'Case Tracker', labelNe: 'मुद्दा ट्र्याकर' },
  { key: 'peer', icon: Users, labelEn: 'Peer Connect', labelNe: 'साथी जडान' },
  { key: 'safety', icon: Shield, labelEn: 'Safety Plan', labelNe: 'सुरक्षा योजना' },
  { key: 'rights', icon: BookOpen, labelEn: 'Legal Rights', labelNe: 'कानुनी अधिकार' },
  { key: 'therapist', icon: Heart, labelEn: 'Therapist / NGO', labelNe: 'थेरापिस्ट / एनजीओ' },
  { key: 'chatbot', icon: MessageCircle, labelEn: 'Sahara Chat', labelNe: 'सहारा च्याट' },
];

const UserDashboard = () => {
  const { t } = useLanguage();
  const { isAuthenticated, user, authReady } = useAuth();
  const [activeTab, setActiveTab] = useState('today');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moodDone, setMoodDone] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [wellnessChosen, setWellnessChosen] = useState(() => {
    try {
      return sessionStorage.getItem(WELLNESS_SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (selectedMood) applyMoodThemeFromKey(selectedMood);
  }, [selectedMood]);

  if (!authReady) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }
  if (!isAuthenticated || user?.role !== 'user') return <Navigate to="/auth" />;

  const handleMoodDone = (moodKey: string) => {
    setSelectedMood(moodKey);
    setMoodDone(true);
    setTimeout(() => {
      setSidebarOpen(typeof window !== 'undefined' && window.innerWidth >= 1024);
    }, 200);
  };

  const handleWellnessChoose = (path: WellnessPath) => {
    try {
      sessionStorage.setItem(WELLNESS_SESSION_KEY, '1');
    } catch {
      /* ignore */
    }
    setWellnessChosen(true);
    setActiveTab(defaultTabForPath(path));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'today':
        return <TodayScreen moodColor={selectedMood ?? 'green'} />;
      case 'case':
        return <CaseTrackerPage />;
      case 'peer':
        return <PeerConnect />;
      case 'safety':
        return <SafetyPlanning />;
      case 'rights':
        return <LegalRights />;
      case 'therapist':
        return <TherapistConnect />;
      case 'chatbot':
        return <Chatbot />;
      default:
        return <TodayScreen moodColor={selectedMood ?? 'green'} />;
    }
  };

  const showWellnessGate = moodDone && !wellnessChosen;
  const dashboardVisible = moodDone && wellnessChosen;

  return (
    <div className="min-h-screen bg-background" style={{ transition: 'background-color 800ms ease' }}>
      {!moodDone && <MoodGate onComplete={handleMoodDone} />}
      {showWellnessGate && <WellnessSpectrum onChoose={handleWellnessChoose} />}

      <div
        className={cn(
          'transition-opacity duration-500 ease-out',
          moodDone ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <Navbar />
      </div>

      <div
        className={cn(
          'relative flex h-[100dvh] min-h-0 w-full max-w-[100vw] flex-1 overflow-x-hidden pt-[var(--nav-offset)] transition-[opacity] duration-500 ease-out',
          dashboardVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        {dashboardVisible && sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-background/50 backdrop-blur-[2px] lg:hidden"
            style={{ top: 'var(--nav-offset)' }}
            aria-label={t('Close menu', 'मेनु बन्द')}
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <aside
          id="user-dashboard-sidebar"
          className={cn(
            'flex flex-col overflow-hidden border-r border-border bg-card transition-[transform,width,min-width] duration-300 ease-out',
            'max-lg:fixed max-lg:left-0 max-lg:z-40 max-lg:w-[15rem] max-lg:shadow-lg max-lg:h-[calc(100dvh-var(--nav-offset))] max-lg:top-[var(--nav-offset)]',
            sidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
            'lg:relative lg:h-full lg:translate-x-0 lg:shadow-none',
            sidebarOpen ? 'lg:w-60 lg:min-w-[15rem]' : 'lg:w-0 lg:min-w-0 lg:border-0 lg:overflow-hidden',
          )}
        >
          <div className="flex w-[15rem] flex-1 flex-col py-5 pl-3 pr-2">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              YOUR JOURNEY
            </p>
            <nav className="flex flex-col gap-0.5" aria-label={t('Main navigation', 'मुख्य नेभिगेसन')}>
              {navItems.map((item) => {
                const active = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.key);
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                      active
                        ? 'bg-primary/10 font-medium text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                    )}
                  >
                    <item.icon
                      className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-primary' : 'opacity-80')}
                      strokeWidth={active ? 2.25 : 2}
                    />
                    <span className="leading-snug">{t(item.labelEn, item.labelNe)}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {dashboardVisible ? (
          <>
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="fixed z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-card/95 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-muted/80 lg:hidden"
              style={{
                top: 'calc(var(--nav-offset) + 10px)',
                left: 'max(12px, env(safe-area-inset-left, 0px))',
              }}
              aria-expanded={sidebarOpen}
              aria-controls="user-dashboard-sidebar"
              aria-label={
                sidebarOpen ? t('Close menu', 'मेनु बन्द') : t('Open journey menu', 'यात्रा मेनु खोल्नुहोस्')
              }
            >
              {sidebarOpen ? <X className="h-5 w-5" strokeWidth={2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
            </button>

            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                'absolute z-50 hidden h-12 w-5 items-center justify-center rounded-r-lg border border-l-0 border-border bg-card text-muted-foreground shadow-sm transition-[left] duration-300 hover:bg-muted/50 lg:flex',
              )}
              style={{ left: sidebarOpen ? '15rem' : 0, top: '50%', transform: 'translateY(-50%)' }}
              aria-label={sidebarOpen ? t('Collapse menu', 'मेनु बन्द') : t('Expand menu', 'मेनु खोल्नुहोस्')}
            >
              {sidebarOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </>
        ) : null}

        <main
          className={cn(
            'min-h-0 min-w-0 flex-1 overflow-x-hidden',
            activeTab === 'chatbot'
              ? 'flex flex-col overflow-hidden p-0 max-lg:pt-12'
              : 'overflow-y-auto pr-4 pb-4 pt-14 max-lg:pl-12 sm:pr-6 sm:pb-6 sm:pt-14 md:pr-8 md:pb-8 md:pt-14 lg:px-6 lg:pb-6 lg:pt-6 xl:px-8 xl:pb-8',
          )}
        >
          {dashboardVisible ? (
            activeTab === 'chatbot' ? (
              renderContent()
            ) : (
              <div className="mx-auto w-full max-w-6xl">{renderContent()}</div>
            )
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
