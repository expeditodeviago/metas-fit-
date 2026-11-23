import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  DEMO_USER,
  loadDemoStore,
  resetDemoStore,
  saveDemoStore,
} from '../data/demoData';
import type {
  Aluno,
  AlunoComResumo,
  AlunoInsert,
  AlunoUpdate,
  Avaliacao,
  AvaliacaoInsert,
  AvaliacaoUpdate,
} from '../types/database';
import {
  calculateIMC,
  generateAccessCode,
  getTodayIsoDate,
  sortAvaliacoesAsc,
} from '../utils/calculations';

interface UseStudentsReturn {
  students: AlunoComResumo[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createStudent: (payload: Omit<AlunoInsert, 'user_id'>) => Promise<Aluno>;
  updateStudent: (id: string, payload: AlunoUpdate) => Promise<Aluno>;
  deleteStudent: (id: string) => Promise<void>;
  toggleClientAccess: (id: string, active: boolean) => Promise<void>;
  regenerateClientAccess: (id: string, studentName: string) => Promise<string>;
  createAssessment: (
    payload: Omit<AvaliacaoInsert, 'user_id'>,
    alturaCm: number,
  ) => Promise<Avaliacao>;
  updateAssessment: (
    id: string,
    payload: AvaliacaoUpdate,
    alturaCm: number,
  ) => Promise<Avaliacao>;
  deleteAssessment: (id: string) => Promise<void>;
  resetDemo: () => void;
}

export function combineStudentsWithAssessments(
  alunos: Aluno[],
  avaliacoes: Avaliacao[],
): AlunoComResumo[] {
  const avaliacoesPorAluno = new Map<string, Avaliacao[]>();
  for (const av of avaliacoes) {
    const list = avaliacoesPorAluno.get(av.aluno_id) ?? [];
    list.push(av);
    avaliacoesPorAluno.set(av.aluno_id, list);
  }

  return [...alunos]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((aluno) => {
      const sorted = sortAvaliacoesAsc(avaliacoesPorAluno.get(aluno.id) ?? []);
      return {
        ...aluno,
        avaliacoes: sorted,
        primeiraAvaliacao: sorted[0] ?? null,
        ultimaAvaliacao: sorted[sorted.length - 1] ?? null,
        totalAvaliacoes: sorted.length,
      };
    });
}

export function useStudents(
  userId: string | undefined,
  isDemoMode = false,
): UseStudentsReturn {
  const [students, setStudents] = useState<AlunoComResumo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setStudents([]);
      setLoading(false);
      return;
    }

    if (isDemoMode) {
      const store = loadDemoStore();
      setStudents(combineStudentsWithAssessments(store.alunos, store.avaliacoes));
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [alunosRes, avaliacoesRes] = await Promise.all([
        supabase.from('alunos').select('*').order('nome', { ascending: true }),
        supabase
          .from('avaliacoes')
          .select('*')
          .order('data_avaliacao', { ascending: true })
          .order('created_at', { ascending: true }),
      ]);

      if (alunosRes.error) throw alunosRes.error;
      if (avaliacoesRes.error) throw avaliacoesRes.error;

      setStudents(
        combineStudentsWithAssessments(
          alunosRes.data ?? [],
          avaliacoesRes.data ?? [],
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao carregar alunos e avaliações.',
      );
    } finally {
      setLoading(false);
    }
  }, [userId, isDemoMode]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Mantém abas sincronizadas automaticamente em modo demonstração
  useEffect(() => {
    if (!isDemoMode) return;
    const handleSync = () => {
      const store = loadDemoStore();
      setStudents(combineStudentsWithAssessments(store.alunos, store.avaliacoes));
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('medidas-demo-sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('medidas-demo-sync', handleSync);
    };
  }, [isDemoMode]);

  const createStudent = async (
    payload: Omit<AlunoInsert, 'user_id'>,
  ): Promise<Aluno> => {
    if (!userId) throw new Error('Usuário não autenticado.');

    const codigo =
      payload.acesso_codigo?.trim().toUpperCase() ||
      generateAccessCode(payload.nome);

    if (isDemoMode) {
      const store = loadDemoStore();
      const created: Aluno = {
        id: crypto.randomUUID(),
        user_id: DEMO_USER.id,
        nome: payload.nome,
        data_nascimento: payload.data_nascimento,
        altura_cm: payload.altura_cm,
        sexo: payload.sexo,
        email: payload.email ?? null,
        telefone: payload.telefone ?? null,
        objetivo: payload.objetivo || 'Recomposição Corporal',
        peso_meta: payload.peso_meta ?? null,
        gordura_meta: payload.gordura_meta ?? null,
        avatar_pele: payload.avatar_pele ?? 'tan',
        acesso_codigo: codigo,
        acesso_token: crypto.randomUUID(),
        acesso_ativo: payload.acesso_ativo ?? true,
        ultimo_acesso: null,
        created_at: new Date().toISOString(),
      };
      const next = { ...store, alunos: [...store.alunos, created] };
      saveDemoStore(next);
      setStudents(combineStudentsWithAssessments(next.alunos, next.avaliacoes));
      return created;
    }

    const { data, error: insertError } = await supabase
      .from('alunos')
      .insert({
        ...payload,
        acesso_codigo: codigo,
        user_id: userId,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    await fetchAll();
    return data;
  };

  const updateStudent = async (
    id: string,
    payload: AlunoUpdate,
  ): Promise<Aluno> => {
    if (isDemoMode) {
      const store = loadDemoStore();
      let updatedStudent: Aluno | null = null;
      const nextAlunos = store.alunos.map((aluno) => {
        if (aluno.id !== id) return aluno;
        updatedStudent = { ...aluno, ...payload };
        return updatedStudent;
      });
      const nextAvaliacoes = payload.altura_cm
        ? store.avaliacoes.map((av) =>
          av.aluno_id === id
            ? { ...av, imc: calculateIMC(av.peso, payload.altura_cm) }
            : av,
        )
        : store.avaliacoes;

      if (!updatedStudent) throw new Error('Aluno não encontrado.');
      saveDemoStore({ alunos: nextAlunos, avaliacoes: nextAvaliacoes });
      setStudents(combineStudentsWithAssessments(nextAlunos, nextAvaliacoes));
      return updatedStudent;
    }

    const { data, error: updateError } = await supabase
      .from('alunos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    await fetchAll();
    return data;
  };

  const deleteStudent = async (id: string): Promise<void> => {
    if (isDemoMode) {
      const store = loadDemoStore();
      const next = {
        alunos: store.alunos.filter((a) => a.id !== id),
        avaliacoes: store.avaliacoes.filter((av) => av.aluno_id !== id),
      };
      saveDemoStore(next);
      setStudents(combineStudentsWithAssessments(next.alunos, next.avaliacoes));
      return;
    }

    const { error: deleteError } = await supabase
      .from('alunos')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    await fetchAll();
  };

  const toggleClientAccess = async (
    id: string,
    active: boolean,
  ): Promise<void> => {
    await updateStudent(id, { acesso_ativo: active });
  };

  const regenerateClientAccess = async (
    id: string,
    studentName: string,
  ): Promise<string> => {
    const newCode = generateAccessCode(studentName);
    await updateStudent(id, {
      acesso_codigo: newCode,
      acesso_token: crypto.randomUUID(),
      acesso_ativo: true,
    });
    return newCode;
  };

  const createAssessment = async (
    payload: Omit<AvaliacaoInsert, 'user_id'>,
    alturaCm: number,
  ): Promise<Avaliacao> => {
    if (!userId) throw new Error('Usuário não autenticado.');

    const imc = calculateIMC(payload.peso, alturaCm);

    if (isDemoMode) {
      const store = loadDemoStore();
      const created: Avaliacao = {
        id: crypto.randomUUID(),
        aluno_id: payload.aluno_id,
        user_id: DEMO_USER.id,
        data_avaliacao: payload.data_avaliacao ?? getTodayIsoDate(),
        peso: payload.peso,
        imc,
        gordura_corporal: payload.gordura_corporal ?? null,
        musculatura: payload.musculatura ?? null,
        calorias_necessarias: payload.calorias_necessarias ?? null,
        idade_corporal: payload.idade_corporal ?? null,
        gordura_visceral: payload.gordura_visceral ?? null,
        biceps_d: payload.biceps_d ?? null,
        biceps_e: payload.biceps_e ?? null,
        ombro: payload.ombro ?? null,
        peito: payload.peito ?? null,
        cintura: payload.cintura ?? null,
        quadril: payload.quadril ?? null,
        coxa_d: payload.coxa_d ?? null,
        coxa_e: payload.coxa_e ?? null,
        panturrilha_d: payload.panturrilha_d ?? null,
        panturrilha_e: payload.panturrilha_e ?? null,
        observacoes: payload.observacoes ?? null,
        created_at: new Date().toISOString(),
      };
      const next = { ...store, avaliacoes: [...store.avaliacoes, created] };
      saveDemoStore(next);
      setStudents(combineStudentsWithAssessments(next.alunos, next.avaliacoes));
      return created;
    }

    const { data, error: insertError } = await supabase
      .from('avaliacoes')
      .insert({
        ...payload,
        imc,
        user_id: userId,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    await fetchAll();
    return data;
  };

  const updateAssessment = async (
    id: string,
    payload: AvaliacaoUpdate,
    alturaCm: number,
  ): Promise<Avaliacao> => {
    const imc =
      payload.peso !== undefined
        ? calculateIMC(payload.peso, alturaCm)
        : undefined;

    if (isDemoMode) {
      const store = loadDemoStore();
      let updatedAv: Avaliacao | null = null;
      const nextAvaliacoes = store.avaliacoes.map((av) => {
        if (av.id !== id) return av;
        updatedAv = {
          ...av,
          ...payload,
          ...(imc !== undefined ? { imc } : {}),
        };
        return updatedAv;
      });
      if (!updatedAv) throw new Error('Avaliação não encontrada.');
      saveDemoStore({ alunos: store.alunos, avaliacoes: nextAvaliacoes });
      setStudents(combineStudentsWithAssessments(store.alunos, nextAvaliacoes));
      return updatedAv;
    }

    const { data, error: updateError } = await supabase
      .from('avaliacoes')
      .update({
        ...payload,
        ...(imc !== undefined ? { imc } : {}),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    await fetchAll();
    return data;
  };

  const deleteAssessment = async (id: string): Promise<void> => {
    if (isDemoMode) {
      const store = loadDemoStore();
      const next = {
        ...store,
        avaliacoes: store.avaliacoes.filter((av) => av.id !== id),
      };
      saveDemoStore(next);
      setStudents(combineStudentsWithAssessments(next.alunos, next.avaliacoes));
      return;
    }

    const { error: deleteError } = await supabase
      .from('avaliacoes')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    await fetchAll();
  };

  const resetDemo = () => {
    if (!isDemoMode) return;
    const initial = resetDemoStore();
    setStudents(
      combineStudentsWithAssessments(initial.alunos, initial.avaliacoes),
    );
  };

  return {
    students,
    loading,
    error,
    refresh: fetchAll,
    createStudent,
    updateStudent,
    deleteStudent,
    toggleClientAccess,
    regenerateClientAccess,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    resetDemo,
  };
}
