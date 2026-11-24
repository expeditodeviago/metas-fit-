import { useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface UseAuthReturn {
  session: Session | null;
  user: User | null;
  isTrainerAuthorized: boolean;
  checkingTrainerAuth: boolean;
  loading: boolean;
  authError: string | null;
  keyError: string | null;
  signInWithGoogle: () => Promise<void>;
  activateTrainerKey: (key: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
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
        'Serviço de autenticação não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.',
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

  const activateTrainerKey = async (rawKey: string): Promise<boolean> => {
    const cleaned = rawKey.trim();
    setKeyError(null);

    if (!cleaned) {
      setKeyError('Digite sua chave de acesso do treinador.');
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
    }
  };

  return {
    session,
    user: session?.user ?? null,
    isTrainerAuthorized,
    checkingTrainerAuth,
    loading,
    authError,
    keyError,
    signInWithGoogle,
    activateTrainerKey,
    signOut,
  };
}
