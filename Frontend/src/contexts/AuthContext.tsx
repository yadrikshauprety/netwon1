import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getMainApiBase } from '@/lib/apiBase';
import {
  fetchDailyRestoration,
  saveDailyRestoration,
  type DailyRestorationState,
} from '@/lib/restorationApi';
import { setJourneyStartFromServer, clearServerJourneyStart } from '@/lib/journeyStorage';
import { clearRootMoodThemeOverrides } from '@/lib/themeRoot';

const DISTRICT_KEY = 'sahara_user_district';
const TOKEN_KEY = 'sahara_auth_token';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'ngo';
  district?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (
    name: string,
    email: string,
    password: string,
    role: 'user' | 'ngo',
    district?: string,
  ) => Promise<AuthUser>;
  logout: () => void;
  updateDistrict: (district: string) => void;
  isAuthenticated: boolean;
  /** False until we finish checking localStorage token against /api/auth/me */
  authReady: boolean;
  /** Daily Restoration progress from API; null if not loaded or logged out */
  restoration: DailyRestorationState | null;
  /** False while fetching /api/auth/daily-restoration after login/session restore */
  restorationReady: boolean;
  saveRestoration: (patch: {
    daily_restoration_date: string;
    daily_restoration_step: number;
    journey_start_ms?: number;
  }) => Promise<void>;
}

const SIGNUP_MAX_NAME_LENGTH = 100;
const SIGNUP_MAX_EMAIL_LENGTH = 254;
const SIGNUP_MIN_PASSWORD_LENGTH = 8;
/** bcrypt only hashes the first 72 bytes; Firebase also enforces practical limits */
const SIGNUP_MAX_PASSWORD_LENGTH = 72;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignupPassword(password: string): void {
  if (!password) {
    throw new Error('Password is required');
  }
  if (password.length < SIGNUP_MIN_PASSWORD_LENGTH) {
    throw new Error('Password is too short');
  }
  if (password.length > SIGNUP_MAX_PASSWORD_LENGTH) {
    throw new Error('Password too long');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one capital letter');
  }
  if (!/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new Error('Password must contain at least one special character');
  }
}

function validateSignupInput(
  name: string,
  email: string,
  password: string,
  role: 'user' | 'ngo',
  district?: string,
): void {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Name is required');
  }
  if (trimmedName.length > SIGNUP_MAX_NAME_LENGTH) {
    throw new Error('Name is too long');
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    throw new Error('Email is required');
  }
  if (trimmedEmail.length > SIGNUP_MAX_EMAIL_LENGTH) {
    throw new Error('Email is too long');
  }
  if (!trimmedEmail.includes('@')) {
    throw new Error('Email must contain @ symbol');
  }
  if (!EMAIL_RE.test(trimmedEmail)) {
    throw new Error('Please enter a valid email');
  }

  validateSignupPassword(password);

  if (role === 'user') {
    const d = district?.trim();
    if (!d) {
      throw new Error('Please select your district');
    }
    if (d.length < 2) {
      throw new Error('District name is too short');
    }
    if (d.length > 120) {
      throw new Error('District name is too long');
    }
  }
}

function pickApiData<T>(json: unknown): T {
  if (json && typeof json === 'object' && json !== null && 'data' in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

function normalizeAuthUser(raw: Record<string, unknown>): AuthUser {
  const id = String(raw.id ?? raw._id ?? '');
  return {
    id,
    name: String(raw.name ?? ''),
    email: String(raw.email ?? ''),
    role: raw.role === 'ngo' ? 'ngo' : 'user',
    district: typeof raw.district === 'string' && raw.district.trim() ? raw.district.trim() : undefined,
  };
}

function isLikelyFetchNetworkError(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  if (e instanceof Error && /failed to fetch/i.test(e.message)) return true;
  return false;
}

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: unknown; message?: string };
    if (typeof j.message === 'string' && j.message.trim()) {
      return j.message;
    }
    const d = j.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d))
      return d
        .map((x: { msg?: string }) => x.msg ?? '')
        .filter(Boolean)
        .join(', ');
    return 'Request failed';
  } catch {
    return 'Request failed';
  }
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {
    throw new Error('no provider');
  },
  signup: async () => {
    throw new Error('no provider');
  },
  logout: () => {},
  updateDistrict: () => {},
  isAuthenticated: false,
  authReady: false,
  restoration: null,
  restorationReady: true,
  saveRestoration: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [restoration, setRestoration] = useState<DailyRestorationState | null>(null);
  const [restorationReady, setRestorationReady] = useState(true);

  const hydrateRestoration = useCallback(async (token: string) => {
    setRestorationReady(false);
    try {
      const r = await fetchDailyRestoration(token);
      setRestoration(r);
      setJourneyStartFromServer(r.journey_start_ms);
    } catch {
      setRestoration(null);
    } finally {
      setRestorationReady(true);
    }
  }, []);

  const persistSession = useCallback((token: string, u: AuthUser) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      if (u.role === 'user' && u.district) {
        localStorage.setItem(DISTRICT_KEY, u.district);
      }
    } catch {
      /* ignore */
    }
    setUser(u);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let token: string | null = null;
      try {
        token = localStorage.getItem(TOKEN_KEY);
      } catch {
        token = null;
      }
      if (!token) {
        if (!cancelled) {
          clearServerJourneyStart();
          clearRootMoodThemeOverrides();
          setRestoration(null);
          setRestorationReady(true);
          setAuthReady(true);
        }
        return;
      }
      const base = getMainApiBase();
      try {
        const res = await fetch(base + '/api/auth/me', {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (!res.ok) throw new Error('stale');
        const data = (await res.json()) as AuthUser;
        if (!cancelled) setUser(data);
        // Unblock UI after /me — daily-restoration loads in background (was doubling wait on login/refresh)
        if (!cancelled) setAuthReady(true);
        if (!cancelled) void hydrateRestoration(token);
      } catch {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {
          /* ignore */
        }
        if (!cancelled) {
          clearServerJourneyStart();
          clearRootMoodThemeOverrides();
          setRestoration(null);
          setRestorationReady(true);
        }
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateRestoration]);

  const saveRestoration = useCallback(
    async (patch: {
      daily_restoration_date: string;
      daily_restoration_step: number;
      journey_start_ms?: number;
    }) => {
      let token: string | null = null;
      try {
        token = localStorage.getItem(TOKEN_KEY);
      } catch {
        token = null;
      }
      if (!token) return;
      try {
        const next = await saveDailyRestoration(token, patch);
        setRestoration(next);
        setJourneyStartFromServer(next.journey_start_ms);
      } catch {
        /* offline or server error — keep local UI; next refresh may sync */
      }
    },
    [],
  );

  const updateDistrict = useCallback((district: string) => {
    try {
      localStorage.setItem(DISTRICT_KEY, district);
    } catch {
      /* ignore */
    }
    setUser((u) => (u ? { ...u, district } : null));
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const base = getMainApiBase();
      const res = await fetch(base + "/api/auth/login", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await readError(res));
      const body = await res.json();
      const payload = pickApiData<{
        user?: Record<string, unknown>;
        accessToken?: string;
        access_token?: string;
      }>(body);
      const token = payload.accessToken ?? payload.access_token;
      const userRaw = payload.user;
      if (!token || !userRaw || typeof userRaw !== 'object') {
        throw new Error('Invalid server response');
      }
      const user = normalizeAuthUser(userRaw as Record<string, unknown>);
      persistSession(token, user);
      void hydrateRestoration(token);
      return user;
    },
    [persistSession, hydrateRestoration],
  );

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: 'user' | 'ngo',
      district?: string,
    ): Promise<AuthUser> => {
      validateSignupInput(name, email, password, role, district);

      const base = getMainApiBase();
      let res: Response;
      try {
        res = await fetch(base + "/api/auth/register", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            role,
            district: role === 'user' ? district?.trim() : undefined,
          }),
        });
      } catch (e) {
        if (isLikelyFetchNetworkError(e)) {
          throw new Error('Unable to connect to the server. Please try again.');
        }
        throw e;
      }
      if (!res.ok) throw new Error(await readError(res));
      const body = await res.json();
      const payload = pickApiData<{
        user?: Record<string, unknown>;
        accessToken?: string;
        access_token?: string;
      }>(body);
      const token = payload.accessToken ?? payload.access_token;
      const userRaw = payload.user;
      if (!token || !userRaw || typeof userRaw !== 'object') {
        throw new Error('Invalid server response');
      }
      const user = normalizeAuthUser(userRaw as Record<string, unknown>);
      persistSession(token, user);
      void hydrateRestoration(token);
      return user;
    },
    [persistSession, hydrateRestoration],
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    clearServerJourneyStart();
    clearRootMoodThemeOverrides();
    setRestoration(null);
    setRestorationReady(true);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        updateDistrict,
        isAuthenticated: !!user,
        authReady,
        restoration,
        restorationReady,
        saveRestoration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
