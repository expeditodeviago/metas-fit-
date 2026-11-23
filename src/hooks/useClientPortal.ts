import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { loadDemoStore, saveDemoStore } from '../data/demoData';
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
    async (identifier: string, recordAccess = false): Promise<boolean> => {
      const cleaned = identifier.trim();
      if (!cleaned) {
        setError('Informe o código de acesso fornecido pelo seu personal.');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        if (!isSupabaseConfigured) {
          const store = loadDemoStore();
          const found = store.alunos.find(
            (a) =>
              a.acesso_codigo.toUpperCase() === cleaned.toUpperCase() ||
              a.acesso_token === cleaned,
          );

          if (!found) {
            setClientStudent(null);
            setError(
              'Código de acesso não encontrado. Verifique com seu treinador.',
            );
            return false;
          }

          if (!found.acesso_ativo) {
            setClientStudent(null);
            setError(
              'Seu acesso está temporariamente pausado pelo treinador.',
            );
            return false;
          }

          let alunoAtualizado = found;
          if (recordAccess) {
            const nowIso = new Date().toISOString();
            alunoAtualizado = { ...found, ultimo_acesso: nowIso };
            const nextAlunos = store.alunos.map((a) =>
              a.id === found.id ? alunoAtualizado : a,
            );
            saveDemoStore({ ...store, alunos: nextAlunos });
          }

          const avaliacoes = store.avaliacoes.filter(
            (av) => av.aluno_id === found.id,
          );
          setClientStudent(toResumo({ aluno: alunoAtualizado, avaliacoes }));
          return true;
        }

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
    void fetchByIdentifier(clientCode, true);
  }, [clientCode, fetchByIdentifier]);

  // Sincronização em tempo real quando o treinador altera dados em outra aba (Demo Mode)
  useEffect(() => {
    if (!clientCode || isSupabaseConfigured) return;
    const handleSync = () => {
      void fetchByIdentifier(clientCode, false);
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('medidas-demo-sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('medidas-demo-sync', handleSync);
    };
  }, [clientCode, fetchByIdentifier]);

  const loginAsClient = async (codeOrToken: string): Promise<boolean> => {
    const cleaned = codeOrToken.trim();
    const ok = await fetchByIdentifier(cleaned, true);
    if (ok) {
      setClientCode(cleaned);
      sessionStorage.setItem(CLIENT_SESSION_KEY, cleaned);
    }
    return ok;
  };

  const refreshClient = async () => {
    if (!clientCode) return;
    await fetchByIdentifier(clientCode, false);
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
