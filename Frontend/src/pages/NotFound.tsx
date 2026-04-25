import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Heart } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="gradient-hero flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md rounded-[1.75rem] border-border/60 bg-card/90 shadow-[var(--shadow-card)] backdrop-blur-sm">
        <CardHeader className="space-y-3 pb-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Heart className="h-7 w-7 text-primary fill-primary/15" aria-hidden />
          </div>
          <CardTitle className="font-display text-4xl font-bold text-foreground">404</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {t('This page could not be found.', 'यो पृष्ठ फेला परेन।')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-2">
          <p className="text-center text-sm text-muted-foreground">
            {t('The link may be broken or the page was moved.', 'लिङ्क बिग्रिएको हुन सक्छ वा पृष्ठ सारिएको हुन सक्छ।')}
          </p>
          <Button asChild className="btn-hero w-full gap-2 rounded-full">
            <Link to="/">
              <Home className="h-4 w-4" />
              {t('Return to Home', 'गृहपृष्ठमा फर्कनुहोस्')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
