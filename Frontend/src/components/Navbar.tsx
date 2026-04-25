import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import LanguageToggle from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutDashboard, LogOut, Mail, MapPin, Shield, User } from 'lucide-react';
import sangaiLogo from '@/assets/sangai-logo.png';

const Navbar = () => {
  const { t } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/85 pt-[env(safe-area-inset-top,0px)] shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={sangaiLogo} alt="" className="h-[28px] w-auto max-w-[120px] object-contain" />
          <span className="text-xl font-display font-semibold text-foreground">
            {t('Sangai', 'सङ्गै')}
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <LanguageToggle />
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-full border-border bg-card px-4 text-foreground shadow-sm hover:bg-muted"
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span className="hidden max-w-[10rem] truncate font-medium xs:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0" collisionPadding={16}>
                  <div className="border-b border-border/60 bg-muted/30 px-3 py-3">
                    <DropdownMenuLabel className="p-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('Your profile', 'तपाईंको प्रोफाइल')}
                    </DropdownMenuLabel>
                    <p className="mt-1 font-display text-base font-semibold text-foreground">{user.name}</p>
                  </div>
                  <div className="space-y-3 px-3 py-3 text-sm">
                    <div className="flex gap-2.5">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">{t('Email', 'इमेल')}</p>
                        <p className="break-all text-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{t('Role', 'भूमिका')}</p>
                        <p className="text-foreground">
                          {user.role === 'ngo'
                            ? t('NGO partner', 'एनजीओ साझेदार')
                            : t('User', 'प्रयोगकर्ता')}
                        </p>
                      </div>
                    </div>
                    {user.role === 'user' ? (
                      <div className="flex gap-2.5">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            {t('District', 'जिल्ला')}
                          </p>
                          <p className="text-foreground">{user.district ?? '—'}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <DropdownMenuSeparator className="my-0" />
                  <div className="p-1">
                    <DropdownMenuItem asChild className="cursor-pointer rounded-md">
                      <Link to={user.role === 'ngo' ? '/ngo-dashboard' : '/dashboard'} className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        {user.role === 'ngo'
                          ? t('NGO dashboard', 'एनजीओ ड्यासबोर्ड')
                          : t('My dashboard', 'मेरो ड्यासबोर्ड')}
                      </Link>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" onClick={logout} aria-label={t('Log out', 'लगआउट')}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button className="btn-hero text-sm px-6 py-2">
                {t('Login', 'लगइन')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
