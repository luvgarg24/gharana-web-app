import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthAPI, getToken, saveToken } from '@/src/api/client';

export type User = {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  referral_code: string;
  credits: number;
  preferences: { dietary?: string[]; notifications?: boolean };
};

type Ctx = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, full_name: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  updatePreferences: (p: { dietary: string[]; notifications: boolean }) => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await AuthAPI.me();
      setUser(me as User);
    } catch {
      await saveToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res: any = await AuthAPI.login({ email, password });
    await saveToken(res.token);
    setUser(res.user);
  }, []);

  const signUp = useCallback(async (email: string, password: string, full_name: string, phone?: string) => {
    const res: any = await AuthAPI.register({ email, password, full_name, phone });
    await saveToken(res.token);
    setUser(res.user);
  }, []);

  const signOut = useCallback(async () => {
    await saveToken(null);
    setUser(null);
  }, []);

  const updatePreferences = useCallback(async (p: { dietary: string[]; notifications: boolean }) => {
    const u: any = await AuthAPI.updatePrefs(p);
    setUser(u as User);
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signUp, signOut, refresh, updatePreferences }), [user, loading, signIn, signUp, signOut, refresh, updatePreferences]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
