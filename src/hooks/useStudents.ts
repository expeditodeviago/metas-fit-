import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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

export function useStudents(userId: string | undefined): UseStudentsReturn {
  const [students, setStudents] = useState<AlunoComResumo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setStudents([]);
      setLoading(false);
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
  }, [userId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const createStudent = async (
    payload: Omit<AlunoInsert, 'user_id'>,
  ): Promise<Aluno> => {
    if (!userId) throw new Error('Usuário não autenticado.');

    const codigo =
      payload.acesso_codigo?.trim().toUpperCase() ||
      generateAccessCode(payload.nome);

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
    const { error: deleteError } = await supabase
      .from('avaliacoes')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    await fetchAll();
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
  };
}
