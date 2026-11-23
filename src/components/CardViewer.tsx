import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  Share2,
  Sparkles,
} from 'lucide-react';
import type { AlunoComResumo } from '../types/database';
import { buildCardComparison, formatDatePtBr } from '../utils/calculations';
import { downloadCardPng, shareCardWhatsApp } from '../utils/exportCard';
import {
  CARD_LOGICAL_WIDTH,
  EvolutionCard,
  type CardAspectMode,
  type CardThemeMode,
} from './EvolutionCard';

interface CardViewerProps {
  student: AlunoComResumo;
  targetAssessmentId?: string;
  onBack: () => void;
}

export function CardViewer({
  student,
  targetAssessmentId,
  onBack,
}: CardViewerProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);

  const [aspectMode, setAspectMode] = useState<CardAspectMode>('4:5');
  const [cardTheme, setCardTheme] = useState<CardThemeMode>('sport');
  const [showBadges, setShowBadges] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(1);
  const [naturalHeight, setNaturalHeight] = useState<number>(748);
  const [exporting, setExporting] = useState<'download' | 'share' | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const comparison = useMemo(
    () => buildCardComparison(student.avaliacoes, targetAssessmentId),
    [student.avaliacoes, targetAssessmentId],
  );

  useEffect(() => {
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
  }, [aspectMode, cardTheme, showBadges, comparison]);

  const exportBg = cardTheme === 'sport' ? '#09090B' : '#FFFFFF';

  const handleDownload = async () => {
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
        message: 'Imagem PNG baixada em alta resolução (3x)!',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Erro ao exportar imagem. Tente novamente.',
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
          message:
            'Seu navegador não suporta envio direto — o PNG foi baixado para você anexar no WhatsApp.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Não foi possível compartilhar o card.',
      });
    } finally {
      setExporting(null);
    }
  };

  if (!comparison.atual || !comparison.inicial) {
    return (
      <div className="sport-card rounded-2xl p-12 text-center max-w-md mx-auto">
        <p className="text-sm font-semibold text-neutral-200">
          Este aluno ainda não possui avaliações para gerar o card.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-xl bg-white text-black px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
        >
          Voltar ao perfil
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-line">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-line-strong hover:border-white text-white transition"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FC4C02]">
            {student.nome} • Av. {comparison.avaliacaoNumero}/
            {comparison.totalAvaliacoes} (
            {formatDatePtBr(comparison.atual.data_avaliacao)})
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-none mt-0.5">
            Exportar Card PNG
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Palco do Card */}
        <div className="lg:col-span-8">
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
        </div>

        {/* Controles e Exportação */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="sport-card rounded-2xl p-4 sm:p-5 space-y-4">
            <h2 className="font-display text-xl font-extrabold uppercase text-white">
              Personalizar Card
            </h2>

            {/* Estilo do Card */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                Estilo Visual
              </p>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-black p-1 border border-line">
                <button
                  type="button"
                  onClick={() => setCardTheme('sport')}
                  className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition ${
                    cardTheme === 'sport'
                      ? 'bg-[#FC4C02] text-[#ffffff]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Dark Pro
                </button>
                <button
                  type="button"
                  onClick={() => setCardTheme('classic')}
                  className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition ${
                    cardTheme === 'classic'
                      ? 'bg-white text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Clássico
                </button>
              </div>
            </div>

            {/* Proporção */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                Proporção
              </p>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-black p-1 border border-line">
                <button
                  type="button"
                  onClick={() => setAspectMode('4:5')}
                  className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition ${
                    aspectMode === '4:5'
                      ? 'bg-[#FC4C02] text-[#ffffff]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  4:5 Chat
                </button>
                <button
                  type="button"
                  onClick={() => setAspectMode('9:16')}
                  className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition ${
                    aspectMode === '9:16'
                      ? 'bg-[#FC4C02] text-[#ffffff]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  9:16 Status
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowBadges((prev) => !prev)}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider border transition ${
                  showBadges
                    ? 'bg-green-500/15 text-green-400 border-green-500/30'
                    : 'bg-black text-neutral-400 border-line-strong'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Badges Evolução</span>
                </span>
                <span>{showBadges ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {feedback && (
            <div
              className={`rounded-xl px-4 py-3 text-xs font-medium flex items-start gap-2 ${
                feedback.type === 'success'
                  ? 'bg-green-500/15 border border-green-500/30 text-green-300'
                  : 'bg-red-500/15 border border-red-500/30 text-red-300'
              }`}
            >
              {feedback.type === 'success' && (
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleDownload}
              disabled={exporting !== null}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] active:scale-[0.99] text-[#ffffff] font-bold text-xs uppercase tracking-wider py-3.5 px-5 transition disabled:opacity-60"
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
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] active:scale-[0.99] text-[#000000] font-bold text-xs uppercase tracking-wider py-3.5 px-5 transition disabled:opacity-60"
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
        </aside>
      </div>
    </div>
  );
}
