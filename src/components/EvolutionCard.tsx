import { forwardRef, useId } from 'react';
import type { Aluno } from '../types/database';
import { computeBodyMorph } from '../utils/bodyMorph';
import {
  calculateAge,
  calculateIMC,
  formatDatePtBr,
  formatPtBrNumber,
  getProgressBadge,
  type CardComparison,
  type MetricGoal,
  type ProgressBadgeData,
} from '../utils/calculations';
import {
  BodySilhouette,
  type BodyStyleMode,
  type BodyZoneKey,
  type ZoneSentiment,
} from './BodySilhouette';

export type CardAspectMode = '4:5' | '9:16';
export type CardThemeMode = 'sport' | 'classic';

export interface EvolutionCardProps {
  aluno: Aluno;
  comparison: CardComparison;
  aspectMode?: CardAspectMode;
  cardTheme?: CardThemeMode;
  bodyStyle?: BodyStyleMode;
  showBadges?: boolean;
  showGhost?: boolean;
}

export const CARD_LOGICAL_WIDTH = 540;

interface CompositionBarConfig {
  label: string;
  initialText: string;
  currentText: string;
  badge: ProgressBadgeData | null;
  variant: 'primary' | 'secondary';
}

interface PerimeterBoxConfig {
  id: BodyZoneKey;
  label: string;
  side: 'left' | 'right';
  top: number;
  initialVal: number | null | undefined;
  previousVal: number | null | undefined;
  currentVal: number | null | undefined;
  goal: MetricGoal;
}

function DeltaPill({
  badge,
  onDark = false,
  compact = false,
}: {
  badge: ProgressBadgeData | null;
  onDark?: boolean;
  compact?: boolean;
}) {
  if (!badge) return null;

  const arrow = badge.direction === 'down' ? '↓' : '↑';

  let toneClass = '';
  if (onDark) {
    if (badge.sentiment === 'positive') {
      toneClass = 'bg-green-500/20 text-green-300 border border-green-400/35';
    } else if (badge.sentiment === 'negative') {
      toneClass = 'bg-red-500/20 text-red-300 border border-red-400/35';
    } else {
      toneClass = 'bg-white/15 text-white/90 border border-white/25';
    }
  } else if (badge.sentiment === 'positive') {
    toneClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  } else if (badge.sentiment === 'negative') {
    toneClass = 'bg-rose-50 text-rose-700 border border-rose-200';
  } else {
    toneClass = 'bg-stone-100 text-stone-600 border border-stone-200';
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full font-bold leading-none whitespace-nowrap ${toneClass} ${compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
        }`}
    >
      <span>{arrow}</span>
      <span>{badge.formattedDelta}</span>
    </span>
  );
}

export const EvolutionCard = forwardRef<HTMLDivElement, EvolutionCardProps>(
  function EvolutionCard(
    {
      aluno,
      comparison,
      aspectMode = '4:5',
      cardTheme = 'sport',
      showBadges = true,
    },
    ref,
  ) {
    const uid = useId().replace(/:/g, '');
    const { inicial, anterior, atual } = comparison;

    if (!atual || !inicial) return null;

    const isSport = cardTheme === 'sport';
    const isStories = aspectMode === '9:16';
    const age = calculateAge(aluno.data_nascimento, atual.data_avaliacao);
    const hasMultiple = inicial.id !== atual.id;

    // Morph corporal real baseado na avaliação atual e destaques musculares da evolução
    const currentMorph = computeBodyMorph(aluno, atual);

    const cardZoneHighlights: Partial<Record<BodyZoneKey, ZoneSentiment>> = {};
    if (hasMultiple) {
      const zones: BodyZoneKey[] = [
        'ombro',
        'peito',
        'biceps_d',
        'biceps_e',
        'cintura',
        'quadril',
        'coxa_d',
        'coxa_e',
        'panturrilha_d',
        'panturrilha_e',
      ];
      zones.forEach((zone) => {
        const start = inicial[zone];
        const curr = atual[zone];
        if (start == null || curr == null) return;
        const diff = curr - start;
        if (Math.abs(diff) < 0.2) {
          cardZoneHighlights[zone] = 'neutral';
        } else if (zone === 'cintura') {
          cardZoneHighlights[zone] = diff < 0 ? 'positive' : 'neutral';
        } else {
          cardZoneHighlights[zone] = diff > 0 ? 'growth' : 'positive';
        }
      });
    }

    const initialImc =
      inicial.imc ?? calculateIMC(inicial.peso, aluno.altura_cm);
    const currentImc = atual.imc ?? calculateIMC(atual.peso, aluno.altura_cm);

    const weightBadge = hasMultiple
      ? getProgressBadge(inicial.peso, atual.peso, 'neutral', ' kg', 1)
      : null;

    const compositionBars: CompositionBarConfig[] = [
      {
        label: 'IMC',
        initialText: formatPtBrNumber(initialImc, 1, false),
        currentText: formatPtBrNumber(currentImc, 1, false),
        badge: hasMultiple
          ? getProgressBadge(initialImc, currentImc, 'imc', '', 1)
          : null,
        variant: 'primary',
      },
      {
        label: 'Gordura corporal',
        initialText:
          inicial.gordura_corporal != null
            ? `${formatPtBrNumber(inicial.gordura_corporal, 1)}%`
            : '—',
        currentText:
          atual.gordura_corporal != null
            ? `${formatPtBrNumber(atual.gordura_corporal, 1)}%`
            : '—',
        badge: hasMultiple
          ? getProgressBadge(
            inicial.gordura_corporal,
            atual.gordura_corporal,
            'lower',
            '%',
            1,
          )
          : null,
        variant: 'secondary',
      },
      {
        label: 'Musculatura',
        initialText:
          inicial.musculatura != null
            ? `${formatPtBrNumber(inicial.musculatura, 1)}%`
            : '—',
        currentText:
          atual.musculatura != null
            ? `${formatPtBrNumber(atual.musculatura, 1)}%`
            : '—',
        badge: hasMultiple
          ? getProgressBadge(
            inicial.musculatura,
            atual.musculatura,
            'higher',
            '%',
            1,
          )
          : null,
        variant: 'primary',
      },
      {
        label: 'Calorias necessárias',
        initialText:
          inicial.calorias_necessarias != null
            ? `${formatPtBrNumber(inicial.calorias_necessarias, 0)} kcal`
            : '—',
        currentText:
          atual.calorias_necessarias != null
            ? `${formatPtBrNumber(atual.calorias_necessarias, 0)} kcal`
            : '—',
        badge: hasMultiple
          ? getProgressBadge(
            inicial.calorias_necessarias,
            atual.calorias_necessarias,
            'higher',
            '',
            0,
          )
          : null,
        variant: 'secondary',
      },
      {
        label: 'Idade corporal',
        initialText: formatPtBrNumber(inicial.idade_corporal, 0),
        currentText: formatPtBrNumber(atual.idade_corporal, 0),
        badge: hasMultiple
          ? getProgressBadge(
            inicial.idade_corporal,
            atual.idade_corporal,
            'lower',
            '',
            0,
          )
          : null,
        variant: 'primary',
      },
      {
        label: 'Gordura Visceral',
        initialText: formatPtBrNumber(inicial.gordura_visceral, 0),
        currentText: formatPtBrNumber(atual.gordura_visceral, 0),
        badge: hasMultiple
          ? getProgressBadge(
            inicial.gordura_visceral,
            atual.gordura_visceral,
            'lower',
            '',
            0,
          )
          : null,
        variant: 'secondary',
      },
    ];

    // Ordem anatômica de cima para baixo -> ZERO cruzamento entre setas!
    const perimeterBoxes: PerimeterBoxConfig[] = [
      // Coluna esquerda (5 membros)
      {
        id: 'ombro',
        label: 'Ombro',
        side: 'left',
        top: 0,
        initialVal: inicial.ombro,
        previousVal: anterior?.ombro,
        currentVal: atual.ombro,
        goal: 'neutral',
      },
      {
        id: 'biceps_d',
        label: 'Bíceps direito',
        side: 'left',
        top: 86,
        initialVal: inicial.biceps_d,
        previousVal: anterior?.biceps_d,
        currentVal: atual.biceps_d,
        goal: 'neutral',
      },
      {
        id: 'cintura',
        label: 'Cintura',
        side: 'left',
        top: 172,
        initialVal: inicial.cintura,
        previousVal: anterior?.cintura,
        currentVal: atual.cintura,
        goal: 'lower',
      },
      {
        id: 'coxa_d',
        label: 'Coxa direita',
        side: 'left',
        top: 258,
        initialVal: inicial.coxa_d,
        previousVal: anterior?.coxa_d,
        currentVal: atual.coxa_d,
        goal: 'neutral',
      },
      {
        id: 'panturrilha_d',
        label: 'Panturrilha D',
        side: 'left',
        top: 344,
        initialVal: inicial.panturrilha_d,
        previousVal: anterior?.panturrilha_d,
        currentVal: atual.panturrilha_d,
        goal: 'neutral',
      },

      // Coluna direita (5 membros)
      {
        id: 'peito',
        label: 'Peito',
        side: 'right',
        top: 0,
        initialVal: inicial.peito,
        previousVal: anterior?.peito,
        currentVal: atual.peito,
        goal: 'neutral',
      },
      {
        id: 'biceps_e',
        label: 'Bíceps esquerdo',
        side: 'right',
        top: 86,
        initialVal: inicial.biceps_e,
        previousVal: anterior?.biceps_e,
        currentVal: atual.biceps_e,
        goal: 'neutral',
      },
      {
        id: 'quadril',
        label: 'Quadril',
        side: 'right',
        top: 172,
        initialVal: inicial.quadril,
        previousVal: anterior?.quadril,
        currentVal: atual.quadril,
        goal: 'neutral',
      },
      {
        id: 'coxa_e',
        label: 'Coxa esquerda',
        side: 'right',
        top: 258,
        initialVal: inicial.coxa_e,
        previousVal: anterior?.coxa_e,
        currentVal: atual.coxa_e,
        goal: 'neutral',
      },
      {
        id: 'panturrilha_e',
        label: 'Panturrilha E',
        side: 'right',
        top: 344,
        initialVal: inicial.panturrilha_e,
        previousVal: anterior?.panturrilha_e,
        currentVal: atual.panturrilha_e,
        goal: 'neutral',
      },
    ];

    // Mapeia alvos anatômicos do mapa @mjcdev/react-body-highlighter (200x400) no bloco 508x420
    const silLeft = 154;
    const silTop = 10;
    const silW = 200;
    const silH = 400;

    const anatomicalTargets: Record<BodyZoneKey, [number, number]> =
      aluno.sexo === 'F'
        ? {
            ombro: [71, 100],
            peito: [115, 108],
            biceps_d: [63, 122],
            biceps_e: [138, 122],
            cintura: [86, 146],
            quadril: [120, 179],
            coxa_d: [80, 218],
            coxa_e: [124, 218],
            panturrilha_d: [86, 307],
            panturrilha_e: [116, 307],
          }
        : {
            ombro: [64, 95],
            peito: [116, 104],
            biceps_d: [55, 124],
            biceps_e: [145, 124],
            cintura: [82, 146],
            quadril: [123, 178],
            coxa_d: [75, 221],
            coxa_e: [125, 221],
            panturrilha_d: [73, 300],
            panturrilha_e: [127, 300],
          };

    const mapPoint = (zone: BodyZoneKey): [number, number] => {
      const [px, py] = anatomicalTargets[zone];
      return [silLeft + (px / 200) * silW, silTop + (py / 400) * silH];
    };

    const arrowColor = isSport ? '#FC4C02' : '#B8734B';

    return (
      <div
        ref={ref}
        style={{
          width: `${CARD_LOGICAL_WIDTH}px`,
          minHeight: isStories ? '960px' : '748px',
          backgroundColor: isSport ? '#09090B' : '#FFFFFF',
          color: isSport ? '#FFFFFF' : '#1C1917',
        }}
        className={`${isSport ? 'force-dark' : ''} select-none flex flex-col justify-between px-4 ${isStories ? 'py-8' : 'py-5'
          }`}
      >
        {/* ================= CABEÇALHO ================= */}
        <header className="text-center">
          {isSport ? (
            <div className="flex flex-col items-center">
              <div
                className="h-1 w-10 mb-2"
                style={{ backgroundColor: '#FC4C02' }}
              />
              <h1 className="font-display text-[36px] font-extrabold uppercase tracking-[0.06em] leading-none text-white">
                MEDIDAS <span style={{ color: '#FC4C02' }}>&amp;</span> METAS
              </h1>
            </div>
          ) : (
            <h1
              className="font-script text-[40px] leading-[1.15] tracking-normal"
              style={{ color: '#4E0E22' }}
            >
              Medidas &amp; Metas
            </h1>
          )}

          <div className="mt-2 space-y-0.5">
            <p
              className={`text-[13px] font-bold tracking-tight ${isSport ? 'text-white' : 'text-stone-800'
                }`}
            >
              {aluno.nome}
            </p>
            <div
              className={`flex items-center justify-center flex-wrap gap-x-2.5 gap-y-1 text-[11.5px] font-medium ${isSport ? 'text-neutral-400' : 'text-stone-600'
                }`}
            >
              <span>
                Idade:{' '}
                <strong className={isSport ? 'text-white' : 'text-stone-800'}>
                  {age}
                </strong>
              </span>
              <span className={isSport ? 'text-neutral-700' : 'text-stone-300'}>
                •
              </span>
              <span>
                Peso Inicial:{' '}
                <strong className={isSport ? 'text-white' : 'text-stone-800'}>
                  {formatPtBrNumber(inicial.peso, 1)} kg
                </strong>
              </span>
              <span className={isSport ? 'text-neutral-700' : 'text-stone-300'}>
                •
              </span>
              <span className="inline-flex items-center gap-1">
                <span>
                  Peso Atual:{' '}
                  <strong style={{ color: isSport ? '#FC4C02' : '#4E0E22' }}>
                    {formatPtBrNumber(atual.peso, 1)} kg
                  </strong>
                </span>
                {showBadges && weightBadge && (
                  <DeltaPill badge={weightBadge} onDark={isSport} compact />
                )}
              </span>
            </div>
          </div>
        </header>

        {/* ================= BLOCO SUPERIOR: BARRAS DE COMPOSIÇÃO ================= */}
        <section
          className={isStories ? 'my-5 space-y-1.5' : 'mt-3.5 space-y-[5px]'}
        >
          {compositionBars.map((bar) => {
            const bgColor = isSport
              ? bar.variant === 'primary'
                ? '#18181C'
                : '#111114'
              : bar.variant === 'primary'
                ? '#B8734B'
                : '#4E0E22';

            return (
              <div
                key={bar.label}
                style={{
                  backgroundColor: bgColor,
                  border: isSport
                    ? bar.variant === 'primary'
                      ? '1px solid #2A2A32'
                      : '1px solid #1E1E24'
                    : 'none',
                }}
                className={`${isSport ? 'rounded-xl' : 'rounded-full'
                  } px-4 py-[6.5px] flex items-center justify-between text-white`}
              >
                <span className="text-[12.5px] font-bold tracking-tight flex items-center gap-2">
                  {isSport && (
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          bar.variant === 'primary' ? '#FC4C02' : '#52525B',
                      }}
                    />
                  )}
                  <span>{bar.label}</span>
                </span>

                <div className="flex items-center gap-2">
                  <div className="text-[12.5px] tabular-nums tracking-tight">
                    <span className="text-white/75 font-medium">
                      {bar.initialText}
                    </span>
                    <span className="mx-1.5 text-white/40">/</span>
                    <span className="text-[9.5px] uppercase tracking-wider text-white/65 mr-1 font-semibold">
                      Atual:
                    </span>
                    <span className="font-extrabold text-white">
                      {bar.currentText}
                    </span>
                  </div>

                  {showBadges && bar.badge && (
                    <DeltaPill badge={bar.badge} onDark compact />
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* ================= BLOCO INFERIOR: MODELO EVOLUTIVO + CARDS ================= */}
        <section
          className={`relative mx-auto ${isStories ? 'my-4' : 'mt-4'}`}
          style={{ width: '508px', height: '420px' }}
        >
          {/* Modelo anatômico profissional com destaques da evolução */}
          <div
            className="absolute"
            style={{
              left: `${silLeft}px`,
              top: `${silTop}px`,
              width: `${silW}px`,
              height: `${silH}px`,
            }}
          >
            <BodySilhouette
              sexo={aluno.sexo}
              morph={currentMorph}
              theme={isSport ? 'sport-dark' : 'classic-light'}
              zoneHighlights={cardZoneHighlights}
              className="w-full h-full"
            />
          </div>

          {/* 10 Cards laterais de Perimetria */}
          {perimeterBoxes.map((box) => {
            const isLeft = box.side === 'left';
            const perimeterDelta = hasMultiple
              ? getProgressBadge(
                box.initialVal,
                box.currentVal,
                box.goal,
                '',
                1,
              )
              : null;

            return (
              <div
                key={box.id}
                style={{
                  top: `${box.top}px`,
                  left: isLeft ? '0px' : '360px',
                  width: '148px',
                  height: '76px',
                  backgroundColor: isSport ? '#121216' : '#FFFFFF',
                  borderColor: isSport ? '#282830' : '#C58B68',
                }}
                className="absolute rounded-[11px] border overflow-visible"
              >
                {/* Pill de título */}
                <div
                  style={{
                    backgroundColor: isSport ? '#FC4C02' : '#B8734B',
                  }}
                  className={`mx-auto -mt-[1px] w-full ${isSport ? 'rounded-t-[10px]' : 'rounded-full'
                    } px-2 py-[3px] text-center text-[10.5px] font-bold text-white tracking-tight leading-tight`}
                >
                  {box.label}
                </div>

                {/* Inicial / Anterior / Atual */}
                <div
                  className={`px-2.5 pt-1 pb-1 text-[10.5px] leading-[1.38] tabular-nums ${isSport ? 'text-neutral-300' : 'text-stone-700'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={isSport ? 'text-neutral-500' : 'text-stone-500'}
                    >
                      Inicial:
                    </span>
                    <span
                      className={`font-semibold ${isSport ? 'text-neutral-200' : 'text-stone-800'
                        }`}
                    >
                      {formatPtBrNumber(box.initialVal, 1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={isSport ? 'text-neutral-500' : 'text-stone-500'}
                    >
                      Anterior:
                    </span>
                    <span
                      className={`font-semibold ${isSport ? 'text-neutral-300' : 'text-stone-700'
                        }`}
                    >
                      {anterior ? formatPtBrNumber(box.previousVal, 1) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className="font-bold"
                      style={{ color: isSport ? '#FC4C02' : '#4E0E22' }}
                    >
                      Atual:
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <strong
                        className="font-extrabold"
                        style={{ color: isSport ? '#FFFFFF' : '#4E0E22' }}
                      >
                        {formatPtBrNumber(box.currentVal, 1)}
                      </strong>
                      {showBadges && perimeterDelta && (
                        <span
                          className={`text-[9px] font-extrabold ${perimeterDelta.sentiment === 'positive'
                            ? isSport
                              ? 'text-green-400'
                              : 'text-emerald-600'
                            : perimeterDelta.sentiment === 'negative'
                              ? isSport
                                ? 'text-red-400'
                                : 'text-rose-600'
                              : isSport
                                ? 'text-[#FC4C02]'
                                : 'text-brand-terracotta-dark'
                            }`}
                        >
                          {perimeterDelta.direction === 'down' ? '↓' : '↑'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Overlay SVG com setas alinhadas dinamicamente ao modelo morphed */}
          <svg
            viewBox="0 0 508 420"
            width="508"
            height="420"
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            <defs>
              <marker
                id={`card-arrow-${uid}`}
                markerWidth="6"
                markerHeight="6"
                refX="4.8"
                refY="3"
                orient="auto"
              >
                <path d="M0.5 0.7 L5.2 3 L0.5 5.3 Z" fill={arrowColor} />
              </marker>
            </defs>

            {perimeterBoxes.map((box) => {
              const startX = box.side === 'left' ? 148 : 360;
              const startY = box.top + 12;
              const [endX, endY] = mapPoint(box.id);

              return (
                <g key={`arrow-${box.id}`}>
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke={arrowColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    markerEnd={`url(#card-arrow-${uid})`}
                    opacity="0.92"
                  />
                  <circle cx={startX} cy={startY} r="2.2" fill={arrowColor} />
                </g>
              );
            })}
          </svg>
        </section>

        {/* ================= RODAPÉ ================= */}
        <footer
          className="mt-3 pt-2 flex items-center justify-between text-[10.5px]"
          style={{
            borderTop: isSport ? '1px solid #1E1E24' : '1px solid #E8DDD5',
            color: isSport ? '#71717A' : '#A8A29E',
          }}
        >
          <span>
            {hasMultiple
              ? `Evolução • ${formatDatePtBr(inicial.data_avaliacao)} → ${formatDatePtBr(atual.data_avaliacao)}`
              : `Avaliação inicial • ${formatDatePtBr(atual.data_avaliacao)}`}
          </span>
          <span
            className="font-bold uppercase tracking-wider text-[10px]"
            style={{ color: isSport ? '#FC4C02' : '#4E0E22' }}
          >
            Medidas &amp; Metas
          </span>
        </footer>
      </div>
    );
  },
);
