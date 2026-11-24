import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { AlunoComResumo, ClientPortalPayload } from '../types/database';
import { sortAvaliacoesAsc } from '../utils/calculations';

const CLIENT_SESSION_KEY = 'medidas_metas_client_code';

interface UseClientPortalReturn {
  clientStudent: AlunoComResumo | null;
  clientCode: string | null;
  loading: boolean;
  error: string | null;
  loginAsClient: (codeOrToken: string) => Promise<boolean>;
  refreshClient: () => Promise<void>;
  logoutClient: () => void;
}

function toResumo(payload: ClientPortalPayload): AlunoComResumo {
  const sorted = sortAvaliacoesAsc(payload.avaliacoes ?? []);
  return {
    ...payload.aluno,
    avaliacoes: sorted,
    primeiraAvaliacao: sorted[0] ?? null,
    ultimaAvaliacao: sorted[sorted.length - 1] ?? null,
    totalAvaliacoes: sorted.length,
  };
}

export function useClientPortal(): UseClientPortalReturn {
  const [clientCode, setClientCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const urlCode = new URLSearchParams(window.location.search).get('aluno');
    if (urlCode?.trim()) return urlCode.trim();
    return sessionStorage.getItem(CLIENT_SESSION_KEY);
  });

  const [clientStudent, setClientStudent] = useState<AlunoComResumo | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(Boolean(clientCode));
  const [error, setError] = useState<string | null>(null);

  const fetchByIdentifier = useCallback(
    async (identifier: string): Promise<boolean> => {
      const cleaned = identifier.trim();
      if (!cleaned) {
        setError('Informe o código de acesso fornecido pelo seu personal.');
        return false;
      }

      if (!isSupabaseConfigured) {
        setClientStudent(null);
        setLoading(false);
        setError(
          'Conexão com o banco de dados não configurada. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.',
        );
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc(
          'get_client_portal',
          {
            p_identifier: cleaned,
          },
        );

        if (rpcError) throw rpcError;

        if (!data || !data.aluno) {
          setClientStudent(null);
          setError(
            'Código inválido ou acesso pausado pelo seu personal trainer.',
          );
          return false;
        }

        setClientStudent(toResumo(data));
        return true;
      } catch (err) {
        setClientStudent(null);
        setError(
          err instanceof Error
            ? err.message
            : 'Erro ao carregar dados do portal do aluno.',
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Auto-carrega quando vem por URL (?aluno=CODIGO) ou sessão ativa
  useEffect(() => {
    if (!clientCode) {
      setLoading(false);
      return;
    }
    void fetchByIdentifier(clientCode);
  }, [clientCode, fetchByIdentifier]);

  const loginAsClient = async (codeOrToken: string): Promise<boolean> => {
    const cleaned = codeOrToken.trim();
    const ok = await fetchByIdentifier(cleaned);
    if (ok) {
      setClientCode(cleaned);
      sessionStorage.setItem(CLIENT_SESSION_KEY, cleaned);
    }
    return ok;
  };

  const refreshClient = async () => {
    if (!clientCode) return;
    await fetchByIdentifier(clientCode);
  };

  const logoutClient = () => {
    setClientCode(null);
    setClientStudent(null);
    setError(null);
    sessionStorage.removeItem(CLIENT_SESSION_KEY);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('aluno')) {
        url.searchParams.delete('aluno');
        window.history.replaceState({}, '', url.toString());
      }
    }
  };

  return {
    clientStudent,
    clientCode,
    loading,
    error,
    loginAsClient,
    refreshClient,
    logoutClient,
  };
}
