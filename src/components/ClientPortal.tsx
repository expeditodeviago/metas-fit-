import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Download,
  HelpCircle,
  Image as ImageIcon,
  Loader2,
  LogOut,
  MessageSquareQuote,
  RefreshCw,
  Ruler,
  Share2,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { AlunoComResumo } from '../types/database';
import {
  buildCardComparison,
  buildHumanCelebration,
  calculateAge,
  calculateGoalProgress,
  calculateIMC,
  formatDatePtBr,
  formatPtBrNumber,
  getIMCClassification,
  getProgressBadge,
  getTimeGreeting,
  sortAvaliacoesDesc,
} from '../utils/calculations';
import { downloadCardPng, shareCardWhatsApp } from '../utils/exportCard';
import {
  AccessibilityControls,
  SkipToContent,
} from '../hooks/useAccessibility';
import { ThemeToggle } from '../hooks/useTheme';
import { BrandLogo } from './BrandLogo';
import { EvolutionChart } from './EvolutionChart';
import { HelpModal } from './HelpModal';
import { InteractiveBodyEvolution } from './InteractiveBodyEvolution';
import { OnboardingTutorial } from './OnboardingTutorial';
import {
  CARD_LOGICAL_WIDTH,
  EvolutionCard,
  type CardAspectMode,
  type CardThemeMode,
} from './EvolutionCard';

type PortalTab = 'overview' | 'card' | 'history';

interface ClientPortalProps {
  student: AlunoComResumo;
  isTrainerPreview?: boolean;
  onExit: () => void;
  onRefresh?: () => Promise<void>;
}

const PERIMETRY_ROWS: {
  key:
    | 'biceps_d'
    | 'biceps_e'
    | 'ombro'
    | 'peito'
    | 'cintura'
    | 'quadril'
    | 'coxa_d'
    | 'coxa_e'
    | 'panturrilha_d'
    | 'panturrilha_e';
  label: string;
}[] = [
  { key: 'biceps_d', label: 'Bíceps Direito' },
  { key: 'biceps_e', label: 'Bíceps Esquerdo' },
  { key: 'ombro', label: 'Ombro' },
  { key: 'peito', label: 'Peito' },
  { key: 'cintura', label: 'Cintura' },
  { key: 'quadril', label: 'Quadril' },
  { key: 'coxa_d', label: 'Coxa Direita' },
  { key: 'coxa_e', label: 'Coxa Esquerda' },
  { key: 'panturrilha_d', label: 'Panturrilha D' },
  { key: 'panturrilha_e', label: 'Panturrilha E' },
];

export function ClientPortal({
  student,
  isTrainerPreview = false,
  onExit,
  onRefresh,
}: ClientPortalProps) {
  const [activeTab, setActiveTab] = useState<PortalTab>('overview');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<
    string | undefined
  >(undefined);
  const [aspectMode, setAspectMode] = useState<CardAspectMode>('4:5');
  const [cardTheme, setCardTheme] = useState<CardThemeMode>('sport');
  const [showBadges, setShowBadges] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [exporting, setExporting] = useState<'download' | 'share' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [naturalHeight, setNaturalHeight] = useState(748);

  const firstName = student.nome.trim().split(/\s+/)[0] || student.nome;
  const greeting = getTimeGreeting();
  const celebration = useMemo(
    () => buildHumanCelebration(firstName, student.avaliacoes),
    [firstName, student.avaliacoes],
  );
  const age = calculateAge(student.data_nascimento);
  const first = student.primeiraAvaliacao;
  const last = student.ultimaAvaliacao;
  const descAssessments = useMemo(
    () => sortAvaliacoesDesc(student.avaliacoes),
    [student.avaliacoes],
  );

  const comparison = useMemo(
    () => buildCardComparison(student.avaliacoes, selectedAssessmentId),
    [student.avaliacoes, selectedAssessmentId],
  );

  useEffect(() => {
    if (activeTab !== 'card') return;
    const updateMeasurements = () => {
      if (previewWrapRef.current) {
        const availableWidth = previewWrapRef.current.clientWidth;
        setScale(Math.min(1, availableWidth / CARD_LOGICAL_WIDTH));
      }
      if (cardRef.current) {
        setNaturalHeight(cardRef.current.offsetHeight);
      }
    };
    updateMeasurements();
    const observer = new ResizeObserver(updateMeasurements);
    if (previewWrapRef.current) observer.observe(previewWrapRef.current);
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [activeTab, aspectMode, cardTheme, showBadges, comparison]);

  const currentImc = last
    ? (last.imc ?? calculateIMC(last.peso, student.altura_cm))
    : null;
  const imcInfo = getIMCClassification(currentImc);

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
  const weightBadge = hasMultiple
    ? getProgressBadge(first?.peso, last?.peso, 'neutral', ' kg', 1)
    : null;

  const weightGoalProgress = calculateGoalProgress(
    first?.peso,
    last?.peso,
    student.peso_meta,
  );
  const fatGoalProgress = calculateGoalProgress(
    first?.gordura_corporal,
    last?.gordura_corporal,
    student.gordura_meta,
  );

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const exportBg = cardTheme === 'sport' ? '#09090B' : '#FFFFFF';

  const handleDownloadCard = async () => {
    if (!cardRef.current || !comparison.atual) return;
    setExporting('download');
    setFeedback(null);
    try {
      await downloadCardPng(
        cardRef.current,
        student.nome,
        comparison.atual.data_avaliacao,
        exportBg,
      );
      setFeedback({
        type: 'success',
        message: 'Card PNG salvo em alta resolução!',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Erro ao baixar imagem PNG.',
      });
    } finally {
      setExporting(null);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!cardRef.current || !comparison.atual) return;
    setExporting('share');
    setFeedback(null);
    try {
      const result = await shareCardWhatsApp(
        cardRef.current,
        student.nome,
        comparison.atual.data_avaliacao,
        exportBg,
      );
      if (result.method === 'web-share') {
        setFeedback({
          type: 'success',
          message: 'Card enviado para compartilhamento!',
        });
      } else if (result.method === 'download') {
        setFeedback({
          type: 'success',
          message: 'Imagem PNG baixada para você anexar no WhatsApp!',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Erro ao compartilhar o card.',
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 overflow-x-hidden">
      <SkipToContent />
      {/* Banner de preview quando acessado pelo treinador */}
      {isTrainerPreview && (
        <div className="sticky top-0 z-40 bg-[#FC4C02] text-[#ffffff] px-4 py-2.5">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider">
              Preview do Aluno: {student.nome}
            </span>
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#000000]/25 hover:bg-[#000000]/40 text-[#ffffff] px-3 py-1 text-xs font-bold transition shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar ao Painel</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className={`sticky ${isTrainerPreview ? 'top-[42px]' : 'top-0'} z-30 border-b border-line bg-black/95 backdrop-blur`}
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandLogo size="md" />
            <div className="min-w-0">
              <p className="font-display text-lg sm:text-xl font-extrabold uppercase tracking-wider text-white leading-none truncate">
                MEDIDAS <span className="text-[#FC4C02]">&amp;</span> METAS
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 mt-0.5 truncate">
                Portal do Aluno
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <AccessibilityControls compact />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 border border-line-strong text-neutral-300 hover:text-[#FC4C02] transition"
              title="Ajuda e Tutorial"
              aria-label="Abrir ajuda do portal"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            {onRefresh && !isTrainerPreview && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface border border-line-strong text-neutral-300 hover:text-white transition"
                aria-label="Atualizar"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                />
              </button>
            )}

            {!isTrainerPreview && (
              <button
                type="button"
                onClick={onExit}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-surface border border-line-strong hover:border-white px-2.5 sm:px-3 text-xs font-bold uppercase tracking-wider text-neutral-200 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
      <HelpModal open={helpOpen} context="client" onClose={() => setHelpOpen(false)} />
      <OnboardingTutorial
        role="client"
        userName={student.nome}
        autoOpen={!isTrainerPreview}
      />
        {/* Hero Humano & Motivacional */}
        <section className="sport-card rounded-2xl p-5 sm:p-6 border-l-4 border-l-[#FC4C02] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FC4C02]">
                {student.objetivo}
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-white leading-none mt-1">
                {greeting}, {firstName}!
              </h1>
              <p className="text-sm text-neutral-300 mt-2 leading-relaxed max-w-xl">
                {celebration.headline}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1.5">
                {age} anos • {formatPtBrNumber(student.altura_cm, 0)} cm •{' '}
                {last
                  ? `Atualizado em ${formatDatePtBr(last.data_avaliacao)}`
                  : 'Aguardando primeira avaliação'}
              </p>
            </div>

            {last && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAssessmentId(undefined);
                  setActiveTab('card');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#ffffff] transition shrink-0"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Abrir Meu Card PNG</span>
              </button>
            )}
          </div>

          {/* Conquistas reais da jornada */}
          {celebration.milestones.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-line">
              {celebration.milestones.map((m) => (
                <span
                  key={m.id}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                    m.tone === 'positive'
                      ? 'bg-green-500/15 text-green-400'
                      : m.tone === 'energy'
                        ? 'bg-[#FC4C02]/15 text-[#FC4C02]'
                        : 'bg-black border border-line-strong text-neutral-300'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{m.label}</span>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Abas */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface border border-line p-1 max-w-md">
          {(
            [
              { id: 'overview', label: 'Evolução', icon: Activity },
              { id: 'card', label: 'Meu Card', icon: ImageIcon },
              { id: 'history', label: 'Medidas', icon: Ruler },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2.5 px-3 text-xs font-bold uppercase tracking-wider transition ${
                  active
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ==================== ABA 1: EVOLUÇÃO ==================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {!last ? (
              <div className="sport-card rounded-2xl p-12 text-center">
                <p className="font-display text-2xl font-extrabold uppercase text-white">
                  Sua primeira avaliação aparecerá aqui
                </p>
                <p className="text-sm text-neutral-400 mt-1.5 max-w-md mx-auto">
                  Assim que seu personal registrar sua avaliação, seus gráficos,
                  metas e card visual serão liberados automaticamente.
                </p>
              </div>
            ) : (
              <>
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="sport-card rounded-2xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                      Peso Atual
                    </p>
                    <p className="mt-2 font-display text-4xl font-extrabold text-white tabular-nums leading-none">
                      {formatPtBrNumber(last.peso, 1)}
                      <span className="text-lg font-bold text-neutral-500 ml-1">
                        kg
                      </span>
                    </p>
                    <p className="mt-2 text-xs text-neutral-400">
                      {weightBadge
                        ? `${weightBadge.formattedDelta} vs inicial`
                        : 'Peso inicial'}
                    </p>
                  </div>

                  <div className="sport-card rounded-2xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                      IMC Atual
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
                    {fatBadge && (
                      <span
                        className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${
                          fatBadge.sentiment === 'positive'
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        {fatBadge.direction === 'down' ? (
                          <TrendingDown className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingUp className="h-3.5 w-3.5" />
                        )}
                        {fatBadge.formattedDelta}
                      </span>
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
                    {muscleBadge && (
                      <span
                        className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${
                          muscleBadge.sentiment === 'positive'
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        {muscleBadge.direction === 'up' ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {muscleBadge.formattedDelta}
                      </span>
                    )}
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Destaque mobile-first: Modelo Corporal Evolutivo no topo! */}
                  <div className="lg:col-span-5 min-w-0">
                    <InteractiveBodyEvolution
                      aluno={student}
                      avaliacoes={student.avaliacoes}
                    />
                  </div>

                  <div className="lg:col-span-7 min-w-0 space-y-5">
                    <EvolutionChart
                      avaliacoes={student.avaliacoes}
                      pesoMeta={student.peso_meta}
                      gorduraMeta={student.gordura_meta}
                      title="Sua Curva de Evolução"
                    />

                    {(weightGoalProgress !== null ||
                      fatGoalProgress !== null) && (
                      <div className="sport-card rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-[#FC4C02]" />
                          <h2 className="font-display text-lg font-extrabold uppercase text-white">
                            Progresso das Metas
                          </h2>
                        </div>

                        {weightGoalProgress !== null && student.peso_meta && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-neutral-400">
                                Meta Peso ({formatPtBrNumber(student.peso_meta, 1)}{' '}
                                kg)
                              </span>
                              <span className="font-bold text-[#FC4C02] tabular-nums">
                                {weightGoalProgress}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-black overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#FC4C02]"
                                style={{ width: `${weightGoalProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {fatGoalProgress !== null && student.gordura_meta && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-neutral-400">
                                Meta Gordura (
                                {formatPtBrNumber(student.gordura_meta, 1)}%)
                              </span>
                              <span className="font-bold text-green-400 tabular-nums">
                                {fatGoalProgress}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-black overflow-hidden">
                              <div
                                className="h-full rounded-full bg-green-500"
                                style={{ width: `${fatGoalProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="sport-card rounded-2xl p-5 border-l-2 border-l-[#FC4C02]">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquareQuote className="h-4 w-4 text-[#FC4C02]" />
                        <h2 className="font-display text-lg font-extrabold uppercase text-white">
                          Feedback do Personal
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                        {last.observacoes?.trim() ||
                          'Continue firme nos treinos! Seus indicadores estão sendo acompanhados a cada avaliação.'}
                      </p>
                      <p className="mt-3 text-[11px] text-neutral-500">
                        {formatDatePtBr(last.data_avaliacao)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== ABA 2: MEU CARD ==================== */}
        {activeTab === 'card' && (
          <div className="max-w-xl mx-auto space-y-4">
            {!comparison.atual ? (
              <div className="sport-card rounded-2xl p-10 text-center text-sm text-neutral-400">
                Seu card visual será gerado na primeira avaliação.
              </div>
            ) : (
              <>
                <div className="sport-card rounded-xl p-2 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCardTheme('sport')}
                      className={`rounded-lg px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider transition ${
                        cardTheme === 'sport'
                          ? 'bg-[#FC4C02] text-[#ffffff]'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardTheme('classic')}
                      className={`rounded-lg px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider transition ${
                        cardTheme === 'classic'
                          ? 'bg-white text-black'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Claro
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAspectMode('4:5')}
                      className={`rounded-lg px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider transition ${
                        aspectMode === '4:5'
                          ? 'bg-[#FC4C02] text-[#ffffff]'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      4:5
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectMode('9:16')}
                      className={`rounded-lg px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider transition ${
                        aspectMode === '9:16'
                          ? 'bg-[#FC4C02] text-[#ffffff]'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      9:16
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBadges((prev) => !prev)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider transition ${
                        showBadges
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-black text-neutral-500'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{showBadges ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                </div>

                <div className="sport-card rounded-2xl p-2.5 sm:p-4">
                  <div
                    ref={previewWrapRef}
                    className="w-full overflow-hidden rounded-xl flex justify-center"
                    style={{
                      height: `${Math.ceil(naturalHeight * scale)}px`,
                      backgroundColor: exportBg,
                    }}
                  >
                    <div
                      style={{
                        width: `${CARD_LOGICAL_WIDTH}px`,
                        height: `${naturalHeight}px`,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top center',
                        flexShrink: 0,
                      }}
                    >
                      <EvolutionCard
                        ref={cardRef}
                        aluno={student}
                        comparison={comparison}
                        aspectMode={aspectMode}
                        cardTheme={cardTheme}
                        showBadges={showBadges}
                      />
                    </div>
                  </div>
                </div>

                {feedback && (
                  <div
                    className={`rounded-xl px-4 py-3 text-xs font-medium flex items-center gap-2 ${
                      feedback.type === 'success'
                        ? 'bg-green-500/15 border border-green-500/30 text-green-300'
                        : 'bg-red-500/15 border border-red-500/30 text-red-300'
                    }`}
                  >
                    {feedback.type === 'success' && (
                      <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                    )}
                    <span>{feedback.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadCard}
                    disabled={exporting !== null}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] text-[#ffffff] font-bold text-xs uppercase tracking-wider py-3.5 px-5 transition disabled:opacity-60"
                  >
                    {exporting === 'download' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>
                      {exporting === 'download'
                        ? 'Gerando PNG...'
                        : 'Baixar Imagem (PNG)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    disabled={exporting !== null}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] text-[#000000] font-bold text-xs uppercase tracking-wider py-3.5 px-5 transition disabled:opacity-60"
                  >
                    {exporting === 'share' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                    <span>
                      {exporting === 'share'
                        ? 'Preparando...'
                        : 'Compartilhar no WhatsApp'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== ABA 3: MEDIDAS & HISTÓRICO ==================== */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {comparison.atual && comparison.inicial && (
              <section className="sport-card rounded-2xl p-5 sm:p-6">
                <h2 className="font-display text-2xl font-extrabold uppercase text-white mb-4">
                  Perimetria (cm)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PERIMETRY_ROWS.map((row) => {
                    const ini = comparison.inicial?.[row.key];
                    const ant = comparison.anterior?.[row.key];
                    const atu = comparison.atual?.[row.key];
                    const diff =
                      ini != null &&
                      atu != null &&
                      comparison.inicial?.id !== comparison.atual?.id
                        ? Number((atu - ini).toFixed(1))
                        : null;

                    return (
                      <div
                        key={row.key}
                        className="rounded-xl bg-black border border-line px-4 py-3 flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">
                            {row.label}
                          </p>
                          <p className="text-[11px] text-neutral-500 mt-0.5 tabular-nums">
                            Inicial {formatPtBrNumber(ini, 1)} • Anterior{' '}
                            {comparison.anterior
                              ? formatPtBrNumber(ant, 1)
                              : '—'}
                          </p>
                        </div>

                        <div className="text-right tabular-nums">
                          <p className="font-display text-2xl font-extrabold text-white leading-none">
                            {formatPtBrNumber(atu, 1)}
                            {atu != null && (
                              <span className="text-xs text-neutral-500 ml-0.5">
                                cm
                              </span>
                            )}
                          </p>
                          {diff !== null && diff !== 0 && (
                            <p
                              className={`text-[10px] font-bold mt-0.5 ${
                                row.key === 'cintura'
                                  ? diff < 0
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                  : 'text-[#FC4C02]'
                              }`}
                            >
                              {diff > 0 ? '+' : ''}
                              {formatPtBrNumber(diff, 1)} cm
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="font-display text-2xl font-extrabold uppercase text-white">
                Histórico ({descAssessments.length})
              </h2>

              {descAssessments.map((av) => {
                const imc = av.imc ?? calculateIMC(av.peso, student.altura_cm);
                return (
                  <div
                    key={av.id}
                    className="sport-card rounded-2xl p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#FC4C02]" />
                        <span className="font-display text-xl font-extrabold text-white">
                          {formatDatePtBr(av.data_avaliacao)}
                        </span>
                        {last?.id === av.id && (
                          <span className="rounded-md bg-[#FC4C02] px-2 py-0.5 text-[10px] font-bold uppercase text-[#ffffff]">
                            Atual
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssessmentId(av.id);
                          setActiveTab('card');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-black border border-line-strong hover:border-white px-3 py-1.5 text-xs font-bold text-white transition"
                      >
                        <ImageIcon className="h-3.5 w-3.5 text-[#FC4C02]" />
                        <span>Ver Card</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-xl bg-black border border-line py-2 px-1">
                        <p className="text-[10px] font-bold uppercase text-neutral-500">
                          Peso
                        </p>
                        <p className="text-xs font-bold text-white mt-0.5 tabular-nums">
                          {formatPtBrNumber(av.peso, 1)} kg
                        </p>
                      </div>
                      <div className="rounded-xl bg-black border border-line py-2 px-1">
                        <p className="text-[10px] font-bold uppercase text-neutral-500">
                          IMC
                        </p>
                        <p className="text-xs font-bold text-white mt-0.5 tabular-nums">
                          {formatPtBrNumber(imc, 1)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-black border border-line py-2 px-1">
                        <p className="text-[10px] font-bold uppercase text-neutral-500">
                          Gordura
                        </p>
                        <p className="text-xs font-bold text-white mt-0.5 tabular-nums">
                          {av.gordura_corporal != null
                            ? `${formatPtBrNumber(av.gordura_corporal, 1)}%`
                            : '—'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-black border border-line py-2 px-1">
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
                  </div>
                );
              })}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
