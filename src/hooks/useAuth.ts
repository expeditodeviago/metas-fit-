import { useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { DEMO_USER } from '../data/demoData';

export const DEMO_TRAINER_KEY = 'STUDIO-2026';
const DEMO_KEY_SESSION_STORAGE = 'medidas_metas_demo_trainer_unlocked';

interface UseAuthReturn {
  session: Session | null;
  user: User | null;
  isDemoMode: boolean;
  isTrainerAuthorized: boolean;
  checkingTrainerAuth: boolean;
  loading: boolean;
  authError: string | null;
  keyError: string | null;
  signInWithGoogle: () => Promise<void>;
  enterDemoMode: () => void;
  activateTrainerKey: (key: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isTrainerAuthorized, setIsTrainerAuthorized] = useState<boolean>(false);
  const [checkingTrainerAuth, setCheckingTrainerAuth] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);

  const verifyTrainerAuthorization = useCallback(async () => {
    setCheckingTrainerAuth(true);
    setKeyError(null);
    try {
      const { data, error } = await supabase.rpc('check_trainer_status');
      if (error) throw error;
      setIsTrainerAuthorized(Boolean(data));
    } catch (err) {
      setIsTrainerAuthorized(false);
      setKeyError(
        err instanceof Error
          ? err.message
          : 'Não foi possível validar sua autorização de treinador.',
      );
    } finally {
      setCheckingTrainerAuth(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setAuthError(error.message);
        }
        setSession(data.session);
        setLoading(false);
        if (data.session) {
          void verifyTrainerAuthorization();
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setAuthError(
          err instanceof Error ? err.message : 'Erro ao verificar sessão.',
        );
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLoading(false);
      if (nextSession) {
        void verifyTrainerAuthorization();
      } else {
        setIsTrainerAuthorized(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [verifyTrainerAuthorization]);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      setAuthError(
        'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env para entrar com Google, ou teste no Modo Estúdio Local abaixo.',
      );
      return;
    }

    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setAuthError(error.message);
    }
  };

  const enterDemoMode = () => {
    if (isSupabaseConfigured) return;
    setAuthError(null);
    setKeyError(null);
    const alreadyUnlocked =
      sessionStorage.getItem(DEMO_KEY_SESSION_STORAGE) === '1';
    setIsDemoMode(true);
    setIsTrainerAuthorized(alreadyUnlocked);
  };

  const activateTrainerKey = async (rawKey: string): Promise<boolean> => {
    const cleaned = rawKey.trim();
    setKeyError(null);

    if (!cleaned) {
      setKeyError('Digite sua chave de acesso do treinador.');
      return false;
    }

    if (isDemoMode) {
      if (cleaned.toUpperCase() === DEMO_TRAINER_KEY) {
        sessionStorage.setItem(DEMO_KEY_SESSION_STORAGE, '1');
        setIsTrainerAuthorized(true);
        return true;
      }
      setKeyError(
        `Chave incorreta. No modo demonstração, utilize ${DEMO_TRAINER_KEY}.`,
      );
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('activate_trainer_key', {
        p_access_key: cleaned,
      });

      if (error) throw error;

      if (data?.ok) {
        setIsTrainerAuthorized(true);
        return true;
      }

      setKeyError(
        data?.error || 'Chave de acesso inválida ou já vinculada a outra conta.',
      );
      return false;
    } catch (err) {
      setKeyError(
        err instanceof Error
          ? err.message
          : 'Erro ao validar a chave de acesso.',
      );
      return false;
    }
  };

  const signOut = async () => {
    setAuthError(null);
    setKeyError(null);
    setIsTrainerAuthorized(false);
    if (isDemoMode) {
      sessionStorage.removeItem(DEMO_KEY_SESSION_STORAGE);
      setIsDemoMode(false);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
    }
  };

  return {
    session,
    user: isDemoMode ? DEMO_USER : (session?.user ?? null),
    isDemoMode,
    isTrainerAuthorized,
    checkingTrainerAuth,
    loading,
    authError,
    keyError,
    signInWithGoogle,
    enterDemoMode,
    activateTrainerKey,
    signOut,
  };
}
