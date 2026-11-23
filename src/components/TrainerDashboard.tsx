import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Calendar,
  Check,
  Copy,
  Eye,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import type { AlunoComResumo } from '../types/database';
import {
  buildClientPortalUrl,
  calculateAge,
  formatDatePtBr,
  formatPtBrNumber,
  getInitials,
  getProgressBadge,
} from '../utils/calculations';

interface TrainerDashboardProps {
  mode: 'overview' | 'students';
  students: AlunoComResumo[];
  loading: boolean;
  error: string | null;
  onSelectStudent: (studentId: string) => void;
  onOpenCard: (studentId: string) => void;
  onPreviewAsClient: (studentId: string) => void;
  onOpenNewStudent: () => void;
  onGoToAccess: () => void;
}

type GenderFilter = 'ALL' | 'F' | 'M';

export function TrainerDashboard({
  mode,
  students,
  loading,
  error,
  onSelectStudent,
  onOpenCard,
  onPreviewAsClient,
  onOpenNewStudent,
  onGoToAccess,
}: TrainerDashboardProps) {
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const totalAssessments = students.reduce(
      (sum, s) => sum + s.totalAvaliacoes,
      0,
    );
    const activePortals = students.filter((s) => s.acesso_ativo).length;

    const fatDeltas = students
      .map((s) => {
        const first = s.primeiraAvaliacao?.gordura_corporal;
        const last = s.ultimaAvaliacao?.gordura_corporal;
        if (
          first == null ||
          last == null ||
          s.primeiraAvaliacao?.id === s.ultimaAvaliacao?.id
        ) {
          return null;
        }
        return last - first;
      })
      .filter((v): v is number => v !== null);

    const avgFatDelta =
      fatDeltas.length > 0
        ? fatDeltas.reduce((a, b) => a + b, 0) / fatDeltas.length
        : null;

    return {
      totalStudents,
      totalAssessments,
      activePortals,
      avgFatDelta,
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (genderFilter !== 'ALL' && s.sexo !== genderFilter) return false;
      if (!q) return true;
      return (
        s.nome.toLowerCase().includes(q) ||
        s.objetivo.toLowerCase().includes(q) ||
        s.acesso_codigo.toLowerCase().includes(q)
      );
    });
  }, [students, search, genderFilter]);

  const handleCopyPortalLink = async (student: AlunoComResumo) => {
    const url = buildClientPortalUrl(student.acesso_codigo);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(student.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback silencioso
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================== CABEÇALHO ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-line">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FC4C02]">
            {mode === 'overview' ? 'Painel do Treinador' : 'Carteira de Alunos'}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-white leading-none mt-1">
            {mode === 'overview' ? 'Visão Geral' : 'Meus Alunos'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGoToAccess}
            className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-surface hover:border-line-strong px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-200 transition"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#FC4C02]" />
            <span>Acessos ({stats.activePortals})</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewStudent}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#ffffff] transition"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span>Novo Aluno</span>
          </button>
        </div>
      </div>

      {/* ==================== KPIs ==================== */}
      {mode === 'overview' && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="sport-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                Alunos
              </span>
              <Users className="h-4 w-4 text-[#FC4C02]" />
            </div>
            <p className="mt-3 font-display text-4xl font-extrabold text-white tabular-nums leading-none">
              {stats.totalStudents}
            </p>
            <p className="mt-2 text-[11px] text-neutral-500">Ativos no painel</p>
          </div>

          <div className="sport-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                Avaliações
              </span>
              <Activity className="h-4 w-4 text-white" />
            </div>
            <p className="mt-3 font-display text-4xl font-extrabold text-white tabular-nums leading-none">
              {stats.totalAssessments}
            </p>
            <p className="mt-2 text-[11px] text-neutral-500">Registradas</p>
          </div>

          <div className="sport-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                Média Gordura
              </span>
              <TrendingDown className="h-4 w-4 text-green-400" />
            </div>
            <p className="mt-3 font-display text-4xl font-extrabold text-green-400 tabular-nums leading-none">
              {stats.avgFatDelta !== null
                ? `${stats.avgFatDelta > 0 ? '+' : ''}${formatPtBrNumber(stats.avgFatDelta, 1)}%`
                : '—'}
            </p>
            <p className="mt-2 text-[11px] text-neutral-500">Evolução média</p>
          </div>

          <div className="sport-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                Portais ON
              </span>
              <KeyRound className="h-4 w-4 text-[#FC4C02]" />
            </div>
            <p className="mt-3 font-display text-4xl font-extrabold text-white tabular-nums leading-none">
              {stats.activePortals}
              <span className="text-xl font-bold text-neutral-600">
                /{stats.totalStudents}
              </span>
            </p>
            <p className="mt-2 text-[11px] text-neutral-500">Acessos liberados</p>
          </div>
        </section>
      )}

      {/* ==================== BUSCA & FILTRO ==================== */}
      <section className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar aluno por nome, objetivo ou código..."
            className="w-full rounded-xl border border-line bg-surface pl-11 pr-10 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-[#FC4C02] focus:outline-none transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-surface border border-line p-1 self-start sm:self-auto">
          {(
            [
              { id: 'ALL', label: 'Todos' },
              { id: 'F', label: 'Feminino' },
              { id: 'M', label: 'Masculino' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setGenderFilter(f.id)}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition ${
                genderFilter === f.id
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* ==================== GRID DE ALUNOS ==================== */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <Loader2 className="h-7 w-7 animate-spin text-[#FC4C02] mb-3" />
          <p className="text-sm">Carregando alunos...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="sport-card rounded-2xl px-6 py-16 text-center">
          <Users className="h-8 w-8 text-[#FC4C02] mx-auto mb-3" />
          <h2 className="font-display text-2xl font-extrabold uppercase text-white">
            {search ? 'Nenhum aluno encontrado' : 'Sem alunos cadastrados'}
          </h2>
          <p className="mt-1 text-sm text-neutral-400 max-w-sm mx-auto">
            {search
              ? 'Ajuste a busca ou limpe o filtro.'
              : 'Cadastre seu primeiro aluno para registrar avaliações e gerar cards.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={onOpenNewStudent}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#ffffff]"
            >
              <Plus className="h-4 w-4" />
              <span>Cadastrar Aluno</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const age = calculateAge(student.data_nascimento);
            const first = student.primeiraAvaliacao;
            const last = student.ultimaAvaliacao;
            const hasMultiple = Boolean(first && last && first.id !== last.id);

            const fatBadge = hasMultiple
              ? getProgressBadge(
                  first?.gordura_corporal,
                  last?.gordura_corporal,
                  'lower',
                  '%',
                  1,
                )
              : null;
            const muscleBadge = hasMultiple
              ? getProgressBadge(
                  first?.musculatura,
                  last?.musculatura,
                  'higher',
                  '%',
                  1,
                )
              : null;

            return (
              <article
                key={student.id}
                className="group sport-card-hover rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Topo */}
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectStudent(student.id)}
                      className="flex items-center gap-3 text-left min-w-0"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-black font-display text-lg font-extrabold">
                        {getInitials(student.nome)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-base text-white group-hover:text-[#FC4C02] transition">
                          {student.nome}
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {age} anos • {formatPtBrNumber(student.altura_cm, 0)} cm
                        </p>
                      </div>
                    </button>

                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        student.acesso_ativo
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {student.acesso_ativo ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>

                  {/* Objetivo + Código */}
                  <div className="mt-3.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] font-semibold text-neutral-400">
                      {student.objetivo}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyPortalLink(student)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-black border border-line-strong hover:border-[#FC4C02] px-2.5 py-1 text-[11px] font-mono text-neutral-200 transition shrink-0"
                      title="Copiar link de acesso do aluno"
                    >
                      {copiedId === student.id ? (
                        <>
                          <Check className="h-3 w-3 text-green-400" />
                          <span className="text-green-400 font-sans font-bold">
                            Copiado
                          </span>
                        </>
                      ) : (
                        <>
                          <span>{student.acesso_codigo}</span>
                          <Copy className="h-3 w-3 text-[#FC4C02]" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Métricas */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-black border border-line p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                        Peso
                      </p>
                      <p className="mt-1 font-display text-2xl font-extrabold text-white tabular-nums leading-none">
                        {last ? formatPtBrNumber(last.peso, 1) : '—'}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-1">
                        {student.peso_meta
                          ? `Meta ${formatPtBrNumber(student.peso_meta, 0)}kg`
                          : 'kg'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black border border-line p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                        Gordura
                      </p>
                      <p className="mt-1 font-display text-2xl font-extrabold text-white tabular-nums leading-none">
                        {last?.gordura_corporal != null
                          ? `${formatPtBrNumber(last.gordura_corporal, 1)}%`
                          : '—'}
                      </p>
                      {fatBadge ? (
                        <span
                          className={`inline-flex items-center gap-0.5 text-[10px] font-bold mt-1 ${
                            fatBadge.sentiment === 'positive'
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          {fatBadge.direction === 'down' ? (
                            <TrendingDown className="h-2.5 w-2.5" />
                          ) : (
                            <TrendingUp className="h-2.5 w-2.5" />
                          )}
                          {fatBadge.formattedDelta}
                        </span>
                      ) : (
                        <p className="text-[10px] text-neutral-600 mt-1">—</p>
                      )}
                    </div>

                    <div className="rounded-xl bg-black border border-line p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                        Músculo
                      </p>
                      <p className="mt-1 font-display text-2xl font-extrabold text-white tabular-nums leading-none">
                        {last?.musculatura != null
                          ? `${formatPtBrNumber(last.musculatura, 1)}%`
                          : '—'}
                      </p>
                      {muscleBadge ? (
                        <span
                          className={`inline-flex items-center gap-0.5 text-[10px] font-bold mt-1 ${
                            muscleBadge.sentiment === 'positive'
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          {muscleBadge.direction === 'up' ? (
                            <TrendingUp className="h-2.5 w-2.5" />
                          ) : (
                            <TrendingDown className="h-2.5 w-2.5" />
                          )}
                          {muscleBadge.formattedDelta}
                        </span>
                      ) : (
                        <p className="text-[10px] text-neutral-600 mt-1">—</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé */}
                <div className="mt-4 pt-3.5 border-t border-line flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {last ? formatDatePtBr(last.data_avaliacao) : 'Sem avaliação'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onPreviewAsClient(student.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-black border border-line-strong hover:border-[#FC4C02] text-neutral-300 hover:text-[#FC4C02] transition"
                      title="Ver Portal como Aluno"
                      aria-label={`Ver portal como ${student.nome}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {last && (
                      <button
                        type="button"
                        onClick={() => onOpenCard(student.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-black border border-line-strong hover:border-white text-neutral-300 hover:text-white transition"
                        title="Gerar Card PNG"
                        aria-label={`Gerar card de ${student.nome}`}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectStudent(student.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#FC4C02] hover:bg-[#FF5E1A] text-[#ffffff] px-3 py-1.5 text-xs font-bold transition"
                    >
                      <span>Abrir</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
