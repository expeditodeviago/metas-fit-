import { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  MessageCircle,
  Plus,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type {
  AlunoComResumo,
  AlunoInsert,
  AlunoUpdate,
  Avaliacao,
} from '../types/database';
import {
  buildClientPortalUrl,
  buildWhatsAppInviteUrl,
  calculateAge,
  calculateGoalProgress,
  calculateIMC,
  formatDatePtBr,
  formatDateTimePtBr,
  formatPtBrNumber,
  getIMCClassification,
  getInitials,
  getProgressBadge,
  sortAvaliacoesDesc,
} from '../utils/calculations';
import { EvolutionChart } from './EvolutionChart';
import { InteractiveBodyEvolution } from './InteractiveBodyEvolution';
import { StudentModal } from './StudentModal';

interface StudentProfileProps {
  student: AlunoComResumo;
  onBack: () => void;
  onNewAssessment: () => void;
  onEditAssessment: (avaliacao: Avaliacao) => void;
  onViewCard: (avaliacaoId?: string) => void;
  onPreviewAsClient: () => void;
  onUpdateStudent: (id: string, payload: AlunoUpdate) => Promise<void>;
  onToggleClientAccess: (id: string, active: boolean) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onDeleteAssessment: (id: string) => Promise<void>;
}

export function StudentProfile({
  student,
  onBack,
  onNewAssessment,
  onEditAssessment,
  onViewCard,
  onPreviewAsClient,
  onUpdateStudent,
  onToggleClientAccess,
  onDeleteStudent,
  onDeleteAssessment,
}: StudentProfileProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(false);
  const [deletingAssessmentId, setDeletingAssessmentId] = useState<string | null>(
    null,
  );
  const [confirmAssessmentId, setConfirmAssessmentId] = useState<string | null>(
    null,
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [togglingAccess, setTogglingAccess] = useState(false);

  const age = calculateAge(student.data_nascimento);
  const first = student.primeiraAvaliacao;
  const last = student.ultimaAvaliacao;
  const descAssessments = sortAvaliacoesDesc(student.avaliacoes);
  const hasMultiple = Boolean(first && last && first.id !== last.id);

  const currentImc = last
    ? (last.imc ?? calculateIMC(last.peso, student.altura_cm))
    : null;
  const imcInfo = getIMCClassification(currentImc);

  const fatProgress = hasMultiple
    ? getProgressBadge(
      first?.gordura_corporal,
      last?.gordura_corporal,
      'lower',
      '%',
      1,
    )
    : null;

  const muscleProgress = hasMultiple
    ? getProgressBadge(first?.musculatura, last?.musculatura, 'higher', '%', 1)
    : null;

  const weightDelta =
    first && last && first.id !== last.id
      ? Number((last.peso - first.peso).toFixed(1))
      : null;

  const weightGoalPct = calculateGoalProgress(
    first?.peso,
    last?.peso,
    student.peso_meta,
  );
  const fatGoalPct = calculateGoalProgress(
    first?.gordura_corporal,
    last?.gordura_corporal,
    student.gordura_meta,
  );

  const portalUrl = buildClientPortalUrl(student.acesso_codigo);
  const whatsappUrl = buildWhatsAppInviteUrl(
    student.nome,
    student.acesso_codigo,
    student.telefone,
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignora erro
    }
  };

  const handleToggleAccess = async () => {
    setTogglingAccess(true);
    try {
      await onToggleClientAccess(student.id, !student.acesso_ativo);
    } finally {
      setTogglingAccess(false);
    }
  };

  const handleUpdateStudent = async (data: Omit<AlunoInsert, 'user_id'>) => {
    await onUpdateStudent(student.id, {
      nome: data.nome,
      data_nascimento: data.data_nascimento,
      altura_cm: data.altura_cm,
      sexo: data.sexo,
      avatar_pele: data.avatar_pele,
      objetivo: data.objetivo,
      peso_meta: data.peso_meta,
      gordura_meta: data.gordura_meta,
      telefone: data.telefone,
      email: data.email,
      acesso_codigo: data.acesso_codigo,
    });
  };

  const handleConfirmDeleteStudent = async () => {
    setDeletingStudent(true);
    try {
      await onDeleteStudent(student.id);
    } finally {
      setDeletingStudent(false);
      setConfirmDeleteStudent(false);
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    setDeletingAssessmentId(id);
    try {
      await onDeleteAssessment(id);
    } finally {
      setDeletingAssessmentId(null);
      setConfirmAssessmentId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================== TOPBAR DO ALUNO ==================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-line">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-line-strong hover:border-white text-white transition"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-black font-display text-xl font-extrabold">
            {getInitials(student.nome)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="truncate font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-none">
                {student.nome}
              </h1>
              <span className="rounded-md bg-[#FC4C02]/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#FC4C02]">
                {student.objetivo}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {age} anos • {formatPtBrNumber(student.altura_cm, 0)} cm •{' '}
              {student.sexo === 'F' ? 'Feminino' : 'Masculino'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onNewAssessment}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#ffffff] transition"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span>Nova Avaliação</span>
          </button>

          <button
            type="button"
            onClick={() => onViewCard()}
            disabled={!last}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition disabled:opacity-40"
          >
            <ImageIcon className="h-4 w-4" />
            <span>Card PNG</span>
          </button>

          <button
            type="button"
            onClick={onPreviewAsClient}
            className="inline-flex items-center gap-1.5 rounded-xl bg-surface border border-line-strong hover:border-[#FC4C02] px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-200 transition"
          >
            <Eye className="h-4 w-4 text-[#FC4C02]" />
            <span>Ver Portal</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-line-strong hover:border-white text-neutral-300 transition"
            title="Editar aluno"
            aria-label="Editar aluno"
          >
            <Edit3 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setConfirmDeleteStudent(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-line-strong hover:border-red-500 text-neutral-400 hover:text-red-400 transition"
            title="Excluir aluno"
            aria-label="Excluir aluno"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Confirmação exclusão */}
      {confirmDeleteStudent && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-red-200">
            Excluir <strong>{student.nome}</strong> também removerá permanentemente
            as {student.totalAvaliacoes} avaliações e revogará o portal do cliente.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmDeleteStudent(false)}
              className="rounded-lg bg-black border border-line-strong px-4 py-2 text-xs font-bold text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteStudent}
              disabled={deletingStudent}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-[#ffffff] disabled:opacity-60"
            >
              {deletingStudent && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Confirmar Exclusão</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== KPIs ==================== */}
      {last && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="sport-card rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
              Peso Atual
            </p>
            <p className="mt-2 font-display text-4xl font-extrabold text-white tabular-nums leading-none">
              {formatPtBrNumber(last.peso, 1)}
              <span className="text-lg font-bold text-neutral-500 ml-1">kg</span>
            </p>
            <p className="mt-2 text-xs text-neutral-400">
              {weightDelta !== null && weightDelta !== 0
                ? `${weightDelta > 0 ? '+' : ''}${formatPtBrNumber(weightDelta, 1)} kg vs inicial`
                : 'Primeira marcação'}
            </p>
          </div>

          <div className="sport-card rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
              IMC
            </p>
            <p className="mt-2 font-display text-4xl font-extrabold text-white tabular-nums leading-none">
              {formatPtBrNumber(currentImc, 1, false)}
            </p>
            <span
              className={`mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${imcInfo.badgeClass}`}
            >
              {imcInfo.label}
            </span>
          </div>

          <div className="sport-card rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
              Gordura
            </p>
            <p className="mt-2 font-display text-4xl font-extrabold text-white tabular-nums leading-none">
              {last.gordura_corporal != null
                ? `${formatPtBrNumber(last.gordura_corporal, 1)}%`
                : '—'}
            </p>
            {fatProgress ? (
              <span
                className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${fatProgress.sentiment === 'positive'
                  ? 'text-green-400'
                  : 'text-red-400'
                  }`}
              >
                {fatProgress.direction === 'down' ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5" />
                )}
                {fatProgress.formattedDelta}
              </span>
            ) : (
              <p className="mt-2 text-xs text-neutral-500">—</p>
            )}
          </div>

          <div className="sport-card rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
              Musculatura
            </p>
            <p className="mt-2 font-display text-4xl font-extrabold text-white tabular-nums leading-none">
              {last.musculatura != null
                ? `${formatPtBrNumber(last.musculatura, 1)}%`
                : '—'}
            </p>
            {muscleProgress ? (
              <span
                className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${muscleProgress.sentiment === 'positive'
                  ? 'text-green-400'
                  : 'text-red-400'
                  }`}
              >
                {muscleProgress.direction === 'up' ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {muscleProgress.formattedDelta}
              </span>
            ) : (
              <p className="mt-2 text-xs text-neutral-500">—</p>
            )}
          </div>
        </section>
      )}

      {/* ==================== GRID PRINCIPAL ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 min-w-0 space-y-6 order-2 lg:order-2">
          <EvolutionChart
            avaliacoes={student.avaliacoes}
            pesoMeta={student.peso_meta}
            gorduraMeta={student.gordura_meta}
          />

          {/* Histórico */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white">
                Histórico ({student.totalAvaliacoes})
              </h2>
              <button
                type="button"
                onClick={onNewAssessment}
                className="text-xs font-bold uppercase tracking-wider text-[#FC4C02] hover:underline"
              >
                + Nova Avaliação
              </button>
            </div>

            {descAssessments.length === 0 ? (
              <div className="sport-card rounded-2xl px-6 py-12 text-center">
                <Calendar className="h-7 w-7 text-[#FC4C02] mx-auto mb-3" />
                <p className="font-bold text-white">
                  Nenhuma avaliação registrada
                </p>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                  Registre a primeira avaliação para gerar o card e liberar os
                  gráficos no portal do cliente.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {descAssessments.map((av) => {
                  const isLatest = last?.id === av.id;
                  const isFirst = first?.id === av.id;
                  const imc = av.imc ?? calculateIMC(av.peso, student.altura_cm);
                  const confirming = confirmAssessmentId === av.id;
                  const deleting = deletingAssessmentId === av.id;

                  return (
                    <div
                      key={av.id}
                      className="sport-card rounded-2xl p-4 sm:p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-xl font-extrabold text-white">
                            {formatDatePtBr(av.data_avaliacao)}
                          </span>
                          {isLatest && (
                            <span className="rounded-md bg-[#FC4C02] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ffffff]">
                              Atual
                            </span>
                          )}
                          {isFirst && (
                            <span className="rounded-md bg-line px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                              Inicial
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onViewCard(av.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-black border border-line-strong hover:border-white px-3 py-1.5 text-xs font-bold text-white transition"
                        >
                          <ImageIcon className="h-3.5 w-3.5 text-[#FC4C02]" />
                          <span>Card</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="rounded-xl bg-black border border-line py-2.5 px-1">
                          <p className="text-[10px] font-bold uppercase text-neutral-500">
                            Peso
                          </p>
                          <p className="text-xs font-bold text-white mt-0.5 tabular-nums">
                            {formatPtBrNumber(av.peso, 1)} kg
                          </p>
                        </div>
                        <div className="rounded-xl bg-black border border-line py-2.5 px-1">
                          <p className="text-[10px] font-bold uppercase text-neutral-500">
                            IMC
                          </p>
                          <p className="text-xs font-bold text-white mt-0.5 tabular-nums">
                            {formatPtBrNumber(imc, 1)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-black border border-line py-2.5 px-1">
                          <p className="text-[10px] font-bold uppercase text-neutral-500">
                            Gordura
                          </p>
                          <p className="text-xs font-bold text-white mt-0.5 tabular-nums">
                            {av.gordura_corporal != null
                              ? `${formatPtBrNumber(av.gordura_corporal, 1)}%`
                              : '—'}
                          </p>
                        </div>
                        <div className="rounded-xl bg-black border border-line py-2.5 px-1">
                          <p className="text-[10px] font-bold uppercase text-neutral-500">
                            Músculo
                          </p>
                          <p className="text-xs font-bold text-white mt-0.5 tabular-nums">
                            {av.musculatura != null
                              ? `${formatPtBrNumber(av.musculatura, 1)}%`
                              : '—'}
                          </p>
                        </div>
                      </div>

                      {av.observacoes && (
                        <p className="rounded-xl bg-black border-l-2 border-l-[#FC4C02] px-3.5 py-2.5 text-xs text-neutral-300 leading-relaxed">
                          {av.observacoes}
                        </p>
                      )}

                      <div className="pt-2.5 border-t border-line flex items-center justify-end gap-2">
                        {confirming ? (
                          <>
                            <span className="text-xs text-red-400 mr-auto">
                              Excluir esta avaliação?
                            </span>
                            <button
                              type="button"
                              onClick={() => setConfirmAssessmentId(null)}
                              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-400 hover:text-white"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAssessment(av.id)}
                              disabled={deleting}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-[#ffffff] disabled:opacity-60"
                            >
                              {deleting && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                              <span>Excluir</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onEditAssessment(av)}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-400 hover:bg-surface-2 hover:text-white transition"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmAssessmentId(av.id)}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-500 hover:bg-red-500/15 hover:text-red-400 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Excluir</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Coluna Esquerda no Desktop / Topo no Celular: Modelo Evolutivo + Acesso */}
        <aside className="lg:col-span-5 min-w-0 space-y-5 order-1 lg:order-1">
          {last && (
            <InteractiveBodyEvolution
              aluno={student}
              avaliacoes={student.avaliacoes}
              onChangeSkinTone={(tone) => {
                void onUpdateStudent(student.id, { avatar_pele: tone });
              }}
            />
          )}

          {/* Acesso do Cliente */}
          <div className="sport-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#FC4C02]" />
                <h2 className="font-display text-lg font-extrabold uppercase text-white">
                  Acesso do Aluno
                </h2>
              </div>
              <button
                type="button"
                onClick={handleToggleAccess}
                disabled={togglingAccess}
                className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${student.acesso_ativo
                  ? 'bg-green-500/15 text-green-400 hover:bg-red-500/15 hover:text-red-400'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-green-500/15 hover:text-green-400'
                  }`}
              >
                {student.acesso_ativo ? 'Ativo' : 'Pausado'}
              </button>
            </div>

            <div className="rounded-xl bg-black border border-line p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Código Exclusivo
              </p>
              <p className="mt-1 font-mono text-xl font-bold tracking-widest text-[#FC4C02]">
                {student.acesso_codigo}
              </p>
              <p className="mt-1.5 text-[11px] text-neutral-500">
                Último acesso: {formatDateTimePtBr(student.ultimo_acesso)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-black border border-line-strong hover:border-white py-2.5 px-3 text-xs font-bold text-white transition"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-green-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-[#FC4C02]" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] py-2.5 px-3 text-xs font-bold text-[#000000] transition"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
                <ExternalLink className="h-3 w-3 opacity-75" />
              </a>
            </div>

            <button
              type="button"
              onClick={onPreviewAsClient}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-[#ffffff] transition"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Ver como Aluno</span>
            </button>
          </div>

          {/* Metas */}
          <div className="sport-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[#FC4C02]" />
                <h2 className="font-display text-lg font-extrabold uppercase text-white">
                  Metas
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs font-bold text-[#FC4C02] hover:underline"
              >
                Ajustar
              </button>
            </div>

            {weightGoalPct === null && fatGoalPct === null ? (
              <p className="text-xs text-neutral-500">
                Defina Peso Meta ou Gordura Meta ao editar o aluno para exibir a
                barra de progresso no portal dele.
              </p>
            ) : (
              <div className="space-y-4">
                {weightGoalPct !== null && student.peso_meta && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-neutral-400">
                        Peso Meta ({formatPtBrNumber(student.peso_meta, 1)} kg)
                      </span>
                      <span className="font-bold text-[#FC4C02] tabular-nums">
                        {weightGoalPct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-black overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FC4C02]"
                        style={{ width: `${weightGoalPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {fatGoalPct !== null && student.gordura_meta && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-neutral-400">
                        Gordura Meta ({formatPtBrNumber(student.gordura_meta, 1)}%)
                      </span>
                      <span className="font-bold text-green-400 tabular-nums">
                        {fatGoalPct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-black overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${fatGoalPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      <StudentModal
        isOpen={isEditModalOpen}
        initialStudent={student}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateStudent}
      />
    </div>
  );
}
