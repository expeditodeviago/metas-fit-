import { useMemo, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { Avaliacao } from '../types/database';
import { useTheme } from '../hooks/useTheme';
import {
  formatDatePtBr,
  formatPtBrNumber,
  formatShortDatePtBr,
  getProgressBadge,
  sortAvaliacoesAsc,
  type MetricGoal,
} from '../utils/calculations';

type ChartMetricKey = 'peso' | 'gordura_corporal' | 'musculatura' | 'cintura';

interface EvolutionChartProps {
  avaliacoes: Avaliacao[];
  pesoMeta?: number | null;
  gorduraMeta?: number | null;
  title?: string;
}

interface MetricConfig {
  key: ChartMetricKey;
  label: string;
  unit: string;
  stroke: string;
  fillStart: string;
  goal: MetricGoal;
}

const METRICS: MetricConfig[] = [
  {
    key: 'peso',
    label: 'Peso',
    unit: 'kg',
    stroke: '#FC4C02',
    fillStart: 'rgba(252, 76, 2, 0.22)',
    goal: 'neutral',
  },
  {
    key: 'gordura_corporal',
    label: 'Gordura',
    unit: '%',
    stroke: '#FF3B30',
    fillStart: 'rgba(255, 59, 48, 0.20)',
    goal: 'lower',
  },
  {
    key: 'musculatura',
    label: 'Músculo',
    unit: '%',
    stroke: '#22C55E',
    fillStart: 'rgba(34, 197, 94, 0.20)',
    goal: 'higher',
  },
  {
    key: 'cintura',
    label: 'Cintura',
    unit: 'cm',
    stroke: '#FFFFFF',
    fillStart: 'rgba(255, 255, 255, 0.14)',
    goal: 'lower',
  },
];

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX = ((p0.x + p1.x) / 2).toFixed(1);
    d += ` C ${cpX} ${p0.y.toFixed(1)}, ${cpX} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}

export function EvolutionChart({
  avaliacoes,
  pesoMeta,
  gorduraMeta,
  title = 'Evolução',
}: EvolutionChartProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [selectedMetric, setSelectedMetric] =
    useState<ChartMetricKey>('gordura_corporal');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sorted = useMemo(() => sortAvaliacoesAsc(avaliacoes), [avaliacoes]);

  const baseCfg =
    METRICS.find((m) => m.key === selectedMetric) ?? METRICS[0];
  const metricCfg =
    baseCfg.key === 'cintura' && isLight
      ? {
          ...baseCfg,
          stroke: '#18181B',
          fillStart: 'rgba(24, 24, 27, 0.14)',
        }
      : baseCfg;

  const dataPoints = useMemo(() => {
    return sorted
      .map((av) => ({
        id: av.id,
        date: av.data_avaliacao,
        value: av[metricCfg.key],
      }))
      .filter(
        (pt): pt is { id: string; date: string; value: number } =>
          pt.value !== null && pt.value !== undefined,
      );
  }, [sorted, metricCfg.key]);

  const targetValue =
    metricCfg.key === 'peso'
      ? pesoMeta ?? null
      : metricCfg.key === 'gordura_corporal'
        ? gorduraMeta ?? null
        : null;

  const first = dataPoints[0];
  const last = dataPoints[dataPoints.length - 1];
  const focused =
    activeIndex !== null && dataPoints[activeIndex]
      ? dataPoints[activeIndex]
      : last;

  const badge =
    first && last && dataPoints.length > 1
      ? getProgressBadge(
          first.value,
          last.value,
          metricCfg.goal,
          metricCfg.unit === '%' ? '%' : ` ${metricCfg.unit}`,
          1,
        )
      : null;

  const width = 560;
  const height = 196;
  const padLeft = 40;
  const padRight = 22;
  const padTop = 24;
  const padBottom = 30;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const values = dataPoints.map((d) => d.value);
  if (targetValue !== null) values.push(targetValue);

  const rawMin = values.length ? Math.min(...values) : 0;
  const rawMax = values.length ? Math.max(...values) : 100;
  const span = Math.max(2, rawMax - rawMin);
  const minY = rawMin - span * 0.22;
  const maxY = rawMax + span * 0.22;

  const toY = (val: number) =>
    padTop + ((maxY - val) / Math.max(0.01, maxY - minY)) * plotH;

  const coords = dataPoints.map((pt, idx) => {
    const x =
      dataPoints.length === 1
        ? padLeft + plotW / 2
        : padLeft + (idx / (dataPoints.length - 1)) * plotW;
    return {
      ...pt,
      x,
      y: toY(pt.value),
    };
  });

  const linePath = buildSmoothPath(coords);
  const areaPath =
    coords.length >= 2
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  const goalY = targetValue !== null ? toY(targetValue) : null;
  const gridTicks = [maxY, (maxY + minY) / 2, minY];

  return (
    <div className="sport-card rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
            {title}
          </p>
          <div className="mt-1 flex items-baseline gap-2.5 flex-wrap">
            <span className="font-display text-4xl font-extrabold text-white tabular-nums leading-none">
              {focused
                ? `${formatPtBrNumber(focused.value, 1)}${metricCfg.unit === '%' ? '%' : ` ${metricCfg.unit}`}`
                : '—'}
            </span>
            {focused && (
              <span className="text-xs text-neutral-500">
                {formatDatePtBr(focused.date)}
              </span>
            )}
            {badge && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                  badge.sentiment === 'positive'
                    ? 'bg-green-500/15 text-green-400'
                    : badge.sentiment === 'negative'
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-neutral-800 text-neutral-200'
                }`}
              >
                {badge.direction === 'down' ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3" />
                )}
                {badge.formattedDelta}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1 rounded-xl bg-black p-1 border border-line shrink-0">
          {METRICS.map((m) => {
            const active = m.key === selectedMetric;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setSelectedMetric(m.key);
                  setActiveIndex(null);
                }}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-center transition whitespace-nowrap ${
                  active
                    ? 'bg-[#FC4C02] text-[#ffffff]'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        {dataPoints.length === 0 ? (
          <div className="h-44 flex items-center justify-center rounded-xl bg-black border border-dashed border-line-strong text-xs text-neutral-500">
            Sem registros de {metricCfg.label.toLowerCase()} ainda.
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible"
            role="img"
            aria-label={`Gráfico de evolução de ${metricCfg.label}`}
          >
            <defs>
              <linearGradient
                id={`sport-chart-${metricCfg.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={metricCfg.fillStart} />
                <stop
                  offset="100%"
                  stopColor={isLight ? 'rgba(255, 255, 255, 0)' : 'rgba(0, 0, 0, 0)'}
                />
              </linearGradient>
            </defs>

            {gridTicks.map((tick, idx) => {
              const y = toY(tick);
              return (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke={isLight ? '#E5E5EA' : '#202020'}
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fill={isLight ? '#71717A' : '#666666'}
                    fontSize="10"
                    className="tabular-nums"
                  >
                    {formatPtBrNumber(tick, 0)}
                  </text>
                </g>
              );
            })}

            {goalY !== null && targetValue !== null && (
              <g>
                <line
                  x1={padLeft}
                  y1={goalY}
                  x2={width - padRight}
                  y2={goalY}
                  stroke="#16A34A"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.75"
                />
                <rect
                  x={width - padRight - 72}
                  y={goalY - 18}
                  width="72"
                  height="16"
                  rx="4"
                  fill={isLight ? '#DCFCE7' : '#052E16'}
                  stroke="#22C55E"
                  strokeOpacity="0.45"
                />
                <text
                  x={width - padRight - 36}
                  y={goalY - 7}
                  textAnchor="middle"
                  fill={isLight ? '#15803D' : '#4ADE80'}
                  fontSize="9.5"
                  fontWeight="700"
                >
                  META {formatPtBrNumber(targetValue, 1)}
                  {metricCfg.unit === '%' ? '%' : ''}
                </text>
              </g>
            )}

            {areaPath && (
              <path d={areaPath} fill={`url(#sport-chart-${metricCfg.key})`} />
            )}

            {coords.length >= 2 && (
              <path
                d={linePath}
                fill="none"
                stroke={metricCfg.stroke}
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            )}

            {coords.map((pt, idx) => {
              const isSelected =
                activeIndex === idx ||
                (activeIndex === null && idx === coords.length - 1);

              return (
                <g
                  key={pt.id}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => setActiveIndex(idx)}
                  className="cursor-pointer"
                >
                  <circle cx={pt.x} cy={pt.y} r="16" fill="transparent" />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 5 : 3.5}
                    fill={
                      isSelected
                        ? metricCfg.stroke
                        : isLight
                          ? '#FFFFFF'
                          : '#000000'
                    }
                    stroke={metricCfg.stroke}
                    strokeWidth="2.5"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 11}
                    textAnchor="middle"
                    fill={
                      isSelected
                        ? isLight
                          ? '#111114'
                          : '#FFFFFF'
                        : isLight
                          ? '#71717A'
                          : '#888888'
                    }
                    fontSize="10.5"
                    fontWeight="700"
                    className="tabular-nums"
                  >
                    {formatPtBrNumber(pt.value, 1)}
                  </text>
                  <text
                    x={pt.x}
                    y={height - 6}
                    textAnchor="middle"
                    fill={
                      isSelected
                        ? isLight
                          ? '#111114'
                          : '#FFFFFF'
                        : isLight
                          ? '#71717A'
                          : '#666666'
                    }
                    fontSize="10"
                    fontWeight={isSelected ? '700' : '500'}
                  >
                    {formatShortDatePtBr(pt.date)}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
