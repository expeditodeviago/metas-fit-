import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { Aluno, Avaliacao, SkinTone } from '../types/database';
import {
  buildEvolutionStages,
  interpolateBodyMorph,
} from '../utils/bodyMorph';
import { formatPtBrNumber } from '../utils/calculations';
import { useTheme } from '../hooks/useTheme';
import {
  BodySilhouette,
  type BodyZoneKey,
  type ZoneSentiment,
} from './BodySilhouette';

interface InteractiveBodyEvolutionProps {
  aluno: Aluno;
  avaliacoes: Avaliacao[];
  onChangeSkinTone?: (tone: SkinTone) => void;
}

const ZONE_LABELS: Record<BodyZoneKey, string> = {
  ombro: 'Ombro',
  peito: 'Peito',
  biceps_d: 'Bíceps Direito',
  biceps_e: 'Bíceps Esquerdo',
  cintura: 'Cintura',
  quadril: 'Quadril',
  coxa_d: 'Coxa Direita',
  coxa_e: 'Coxa Esquerda',
  panturrilha_d: 'Panturrilha D',
  panturrilha_e: 'Panturrilha E',
};

function lerpNullable(
  a: number | null,
  b: number | null,
  t: number,
): number | null {
  if (a == null && b == null) return null;
  if (a == null) return b;
  if (b == null) return a;
  return a + (b - a) * t;
}

export function InteractiveBodyEvolution({
  aluno,
  avaliacoes,
}: InteractiveBodyEvolutionProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const stages = useMemo(
    () => buildEvolutionStages(aluno, avaliacoes),
    [aluno, avaliacoes],
  );

  const latestRealIndex = useMemo(() => {
    const idx = stages.findIndex((s) => s.isGoal);
    if (idx > 0) return idx - 1;
    return Math.max(0, stages.length - 1);
  }, [stages]);

  const [progress, setProgress] = useState<number>(latestRealIndex);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bodySide, setBodySide] = useState<'front' | 'back'>('front');
  const [selectedZone, setSelectedZone] = useState<BodyZoneKey | null>(
    'cintura',
  );

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    setProgress(latestRealIndex);
    setIsPlaying(false);
  }, [aluno.id, latestRealIndex]);

  const maxIndex = Math.max(0, stages.length - 1);

  useEffect(() => {
    if (!isPlaying || maxIndex <= 0) return;

    const speedPerSec = Math.max(0.45, maxIndex / 3.8);

    const tick = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setProgress((prev) => {
        const next = prev + dt * speedPerSec;
        if (next >= maxIndex) {
          setIsPlaying(false);
          return maxIndex;
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    lastTimeRef.current = null;
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [isPlaying, maxIndex]);

  const handleTogglePlay = () => {
    if (maxIndex <= 0) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (progress >= maxIndex - 0.02) {
      setProgress(0);
    }
    setIsPlaying(true);
  };

  const safeProgress = Math.max(0, Math.min(maxIndex, progress));
  const lowerIdx = Math.floor(safeProgress);
  const upperIdx = Math.min(maxIndex, Math.ceil(safeProgress));
  const localT = safeProgress - lowerIdx;

  const stageA = stages[lowerIdx];
  const stageB = stages[upperIdx];
  const initialStage = stages[0];
  const nearestStage = stages[Math.round(safeProgress)];

  const liveMorph = useMemo(() => {
    if (!stageA || !stageB) return undefined;
    return interpolateBodyMorph(stageA.morph, stageB.morph, localT);
  }, [stageA, stageB, localT]);

  const liveMetrics = useMemo(() => {
    if (!stageA || !stageB) return null;
    return {
      peso: lerpNullable(stageA.metrics.peso, stageB.metrics.peso, localT),
      gordura: lerpNullable(
        stageA.metrics.gordura_corporal,
        stageB.metrics.gordura_corporal,
        localT,
      ),
      musculo: lerpNullable(
        stageA.metrics.musculatura,
        stageB.metrics.musculatura,
        localT,
      ),
      cintura: lerpNullable(
        stageA.metrics.cintura,
        stageB.metrics.cintura,
        localT,
      ),
    };
  }, [stageA, stageB, localT]);

  const zoneHighlights = useMemo<Partial<Record<BodyZoneKey, ZoneSentiment>>>(
    () => {
      if (!initialStage || !nearestStage || initialStage.id === nearestStage.id) {
        return {};
      }
      const result: Partial<Record<BodyZoneKey, ZoneSentiment>> = {};
      (Object.keys(ZONE_LABELS) as BodyZoneKey[]).forEach((key) => {
        const start = initialStage.metrics[key];
        const curr = nearestStage.metrics[key];
        if (start == null || curr == null) return;
        const diff = curr - start;
        if (Math.abs(diff) < 0.2) {
          result[key] = 'neutral';
        } else if (key === 'cintura') {
          result[key] = diff < 0 ? 'positive' : 'neutral';
        } else {
          result[key] = diff > 0 ? 'growth' : 'positive';
        }
      });
      return result;
    },
    [initialStage, nearestStage],
  );

  if (stages.length === 0 || !liveMorph || !nearestStage || !liveMetrics) {
    return null;
  }

  const selectedInitialVal = selectedZone
    ? initialStage?.metrics[selectedZone]
    : null;
  const selectedCurrentVal = selectedZone
    ? lerpNullable(
        stageA.metrics[selectedZone],
        stageB.metrics[selectedZone],
        localT,
      )
    : null;
  const selectedDelta =
    selectedInitialVal != null &&
    selectedCurrentVal != null &&
    safeProgress > 0.02
      ? Number((selectedCurrentVal - selectedInitialVal).toFixed(1))
      : null;

  return (
    <section className="sport-card rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FC4C02]">
            Modelo Evolutivo
          </p>
          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white leading-none">
              {nearestStage.label}
            </h2>
            {nearestStage.isGoal && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#FC4C02]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#FC4C02]">
                <Sparkles className="h-3 w-3" />
                Projeção
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {nearestStage.dateLabel} • Definição{' '}
            {Math.round(liveMorph.definition * 100)}%
          </p>
        </div>

        {/* Vista Frente / Costas */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-black p-1 border border-line shrink-0">
          <button
            type="button"
            onClick={() => setBodySide('front')}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
              bodySide === 'front'
                ? 'bg-[#FC4C02] text-[#ffffff]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Frente
          </button>
          <button
            type="button"
            onClick={() => setBodySide('back')}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
              bodySide === 'back'
                ? 'bg-[#FC4C02] text-[#ffffff]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Costas
          </button>
        </div>
      </div>

      {/* Legenda de evolução muscular */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-neutral-400">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
            <span>Redução / definição</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FC4C02]" />
            <span>Ganho / volume</span>
          </span>
        </div>
        <span className="text-[10px] text-neutral-500">
          Toque no músculo para ver medidas
        </span>
      </div>

      {/* Palco do Modelo */}
      <div className="relative rounded-xl bg-app border border-line pt-4 pb-3 px-4 flex flex-col items-center overflow-hidden">
        <div className="w-full max-w-[205px] sm:max-w-[225px]">
          <BodySilhouette
            sexo={aluno.sexo}
            morph={liveMorph}
            theme={isLight ? 'classic-light' : 'sport-dark'}
            bodySide={bodySide}
            activeZone={selectedZone}
            zoneHighlights={zoneHighlights}
            onSelectZone={(zone) => setSelectedZone(zone)}
            className="w-full h-auto"
          />
        </div>

        {selectedZone && (
          <div className="w-full mt-2 rounded-lg bg-surface border border-line px-3 py-2 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  zoneHighlights[selectedZone] === 'positive'
                    ? 'bg-green-500'
                    : zoneHighlights[selectedZone] === 'growth'
                      ? 'bg-[#FC4C02]'
                      : 'bg-neutral-400'
                }`}
              />
              <span className="font-bold uppercase tracking-wider text-white truncate">
                {ZONE_LABELS[selectedZone]}
              </span>
            </div>

            <div className="flex items-center gap-2 tabular-nums shrink-0">
              <span className="text-neutral-500 text-[11px]">
                Ini: {formatPtBrNumber(selectedInitialVal, 1)}
              </span>
              <span className="font-bold text-white">
                {formatPtBrNumber(selectedCurrentVal, 1)} cm
              </span>
              {selectedDelta !== null && selectedDelta !== 0 && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    selectedZone === 'cintura'
                      ? selectedDelta < 0
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-red-500/15 text-red-400'
                      : 'bg-[#FC4C02]/15 text-[#FC4C02]'
                  }`}
                >
                  {selectedDelta > 0 ? '+' : ''}
                  {formatPtBrNumber(selectedDelta, 1)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Métricas em tempo real */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="rounded-xl bg-black border border-line py-2 px-1">
          <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
            Peso
          </p>
          <p className="font-display text-xl font-extrabold text-white tabular-nums leading-tight mt-0.5">
            {formatPtBrNumber(liveMetrics.peso, 1)}
          </p>
          <p className="text-[9px] text-neutral-600">kg</p>
        </div>

        <div className="rounded-xl bg-black border border-line py-2 px-1">
          <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
            Gordura
          </p>
          <p className="font-display text-xl font-extrabold text-white tabular-nums leading-tight mt-0.5">
            {liveMetrics.gordura != null
              ? `${formatPtBrNumber(liveMetrics.gordura, 1)}%`
              : '—'}
          </p>
          <p className="text-[9px] text-neutral-600">GC</p>
        </div>

        <div className="rounded-xl bg-black border border-line py-2 px-1">
          <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
            Músculo
          </p>
          <p className="font-display text-xl font-extrabold text-green-400 tabular-nums leading-tight mt-0.5">
            {liveMetrics.musculo != null
              ? `${formatPtBrNumber(liveMetrics.musculo, 1)}%`
              : '—'}
          </p>
          <p className="text-[9px] text-neutral-600">massa</p>
        </div>

        <div className="rounded-xl bg-black border border-line py-2 px-1">
          <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
            Cintura
          </p>
          <p className="font-display text-xl font-extrabold text-[#FC4C02] tabular-nums leading-tight mt-0.5">
            {formatPtBrNumber(liveMetrics.cintura, 1)}
          </p>
          <p className="text-[9px] text-neutral-600">cm</p>
        </div>
      </div>

      {/* Linha do tempo */}
      {maxIndex > 0 && (
        <div className="space-y-3 pt-1">
          <input
            type="range"
            min={0}
            max={maxIndex}
            step={0.01}
            value={safeProgress}
            onChange={(e) => {
              setIsPlaying(false);
              setProgress(Number(e.target.value));
            }}
            aria-label="Linha do tempo da evolução corporal"
            className="w-full h-2 rounded-lg appearance-none bg-line accent-[#FC4C02] cursor-pointer"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {stages.map((stage, idx) => {
              const isCurrent = Math.round(safeProgress) === idx;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setProgress(idx);
                  }}
                  className={`flex-1 min-w-[66px] rounded-lg py-2 px-2 text-[11px] font-bold uppercase tracking-wider border transition ${
                    isCurrent
                      ? stage.isGoal
                        ? 'bg-[#FC4C02] border-[#FC4C02] text-[#ffffff]'
                        : 'bg-white border-white text-black'
                      : 'bg-black border-line text-neutral-400 hover:text-white'
                  }`}
                >
                  {stage.shortLabel}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] active:scale-[0.99] py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#ffffff] transition"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Pausar Evolução</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Animar Evolução</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setProgress(0);
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black border border-line-strong hover:border-white text-neutral-300 hover:text-white transition"
              title="Voltar ao início"
              aria-label="Voltar ao início"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
