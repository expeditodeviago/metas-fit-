import type { Avaliacao } from '../types/database';

export type MetricGoal = 'lower' | 'higher' | 'imc' | 'neutral';

export interface ProgressBadgeData {
  delta: number;
  direction: 'up' | 'down';
  sentiment: 'positive' | 'negative' | 'neutral';
  formattedDelta: string;
}

export interface CardComparison {
  inicial: Avaliacao | null;
  anterior: Avaliacao | null;
  atual: Avaliacao | null;
  totalAvaliacoes: number;
  avaliacaoNumero: number;
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDatePtBr(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

export function formatShortDatePtBr(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const [, month, day] = isoDate.slice(0, 10).split('-');
  if (!month || !day) return isoDate;
  return `${day}/${month}`;
}

export function formatDateTimePtBr(isoDateTime: string | null | undefined): string {
  if (!isoDateTime) return 'Nunca acessou';
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateAge(
  birthDateIso: string,
  referenceDateIso?: string,
): number {
  const [bYear, bMonth, bDay] = birthDateIso.slice(0, 10).split('-').map(Number);
  if (!bYear || !bMonth || !bDay) return 0;

  let refYear: number;
  let refMonth: number;
  let refDay: number;

  if (referenceDateIso) {
    const parts = referenceDateIso.slice(0, 10).split('-').map(Number);
    refYear = parts[0];
    refMonth = parts[1];
    refDay = parts[2];
  } else {
    const today = new Date();
    refYear = today.getFullYear();
    refMonth = today.getMonth() + 1;
    refDay = today.getDate();
  }

  let age = refYear - bYear;
  if (refMonth < bMonth || (refMonth === bMonth && refDay < bDay)) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function calculateIMC(
  pesoKg: number | null | undefined,
  alturaCm: number | null | undefined,
): number | null {
  if (!pesoKg || !alturaCm || pesoKg <= 0 || alturaCm <= 0) return null;
  const alturaM = alturaCm / 100;
  const raw = pesoKg / (alturaM * alturaM);
  return Math.round(raw * 10) / 10;
}

export function getIMCClassification(imc: number | null): {
  label: string;
  badgeClass: string;
} {
  if (imc == null) {
    return {
      label: '—',
      badgeClass: 'bg-neutral-900 text-neutral-400 border border-neutral-800',
    };
  }
  if (imc < 18.5) {
    return {
      label: 'Abaixo do peso',
      badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    };
  }
  if (imc < 25) {
    return {
      label: 'Peso normal',
      badgeClass: 'bg-green-500/15 text-green-400 border border-green-500/30',
    };
  }
  if (imc < 30) {
    return {
      label: 'Sobrepeso',
      badgeClass: 'bg-[#FC4C02]/15 text-[#FF783E] border border-[#FC4C02]/35',
    };
  }
  if (imc < 35) {
    return {
      label: 'Obesidade I',
      badgeClass: 'bg-red-500/15 text-red-400 border border-red-500/30',
    };
  }
  if (imc < 40) {
    return {
      label: 'Obesidade II',
      badgeClass: 'bg-red-500/15 text-red-400 border border-red-500/30',
    };
  }
  return {
    label: 'Obesidade III',
    badgeClass: 'bg-red-500/15 text-red-400 border border-red-500/30',
  };
}

export function parseDecimalInput(value: string): number | null {
  const cleaned = value.trim().replace(',', '.');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseIntegerInput(value: string): number | null {
  const cleaned = value.trim().replace(/[^\d-]/g, '');
  if (!cleaned) return null;
  const parsed = parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatPtBrNumber(
  value: number | null | undefined,
  decimals = 1,
  trimTrailingZero = true,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  const fixed = Number(value).toFixed(decimals);
  const normalized =
    trimTrailingZero && decimals > 0 ? fixed.replace(/\.?0+$/, '') : fixed;
  return normalized.replace('.', ',');
}

export function sortAvaliacoesAsc(avaliacoes: Avaliacao[]): Avaliacao[] {
  return [...avaliacoes].sort((a, b) => {
    const byDate = a.data_avaliacao.localeCompare(b.data_avaliacao);
    if (byDate !== 0) return byDate;
    return a.created_at.localeCompare(b.created_at);
  });
}

export function sortAvaliacoesDesc(avaliacoes: Avaliacao[]): Avaliacao[] {
  return sortAvaliacoesAsc(avaliacoes).reverse();
}

export function buildCardComparison(
  avaliacoes: Avaliacao[],
  targetAvaliacaoId?: string,
): CardComparison {
  const sorted = sortAvaliacoesAsc(avaliacoes);
  if (sorted.length === 0) {
    return {
      inicial: null,
      anterior: null,
      atual: null,
      totalAvaliacoes: 0,
      avaliacaoNumero: 0,
    };
  }

  let targetIdx = sorted.length - 1;
  if (targetAvaliacaoId) {
    const found = sorted.findIndex((item) => item.id === targetAvaliacaoId);
    if (found !== -1) {
      targetIdx = found;
    }
  }

  return {
    inicial: sorted[0],
    anterior: targetIdx > 0 ? sorted[targetIdx - 1] : null,
    atual: sorted[targetIdx],
    totalAvaliacoes: sorted.length,
    avaliacaoNumero: targetIdx + 1,
  };
}

export function getProgressBadge(
  baseline: number | null | undefined,
  current: number | null | undefined,
  goal: MetricGoal,
  unit = '',
  decimals = 1,
): ProgressBadgeData | null {
  if (baseline == null || current == null) return null;

  const rawDelta = current - baseline;
  const roundedDelta = Number(rawDelta.toFixed(decimals));
  if (Math.abs(roundedDelta) < 0.001) return null;

  const direction: 'up' | 'down' = roundedDelta > 0 ? 'up' : 'down';

  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (goal === 'lower') {
    sentiment = roundedDelta < 0 ? 'positive' : 'negative';
  } else if (goal === 'higher') {
    sentiment = roundedDelta > 0 ? 'positive' : 'negative';
  } else if (goal === 'imc') {
    if (baseline > 24.9) {
      sentiment = roundedDelta < 0 ? 'positive' : 'negative';
    } else if (baseline < 18.5) {
      sentiment = roundedDelta > 0 ? 'positive' : 'negative';
    } else {
      sentiment = current >= 18.5 && current <= 24.9 ? 'neutral' : 'negative';
    }
  }

  const absFormatted = formatPtBrNumber(Math.abs(roundedDelta), decimals, true);
  const sign = roundedDelta > 0 ? '+' : '-';

  return {
    delta: roundedDelta,
    direction,
    sentiment,
    formattedDelta: `${sign}${absFormatted}${unit}`,
  };
}

/**
 * Calcula % de progresso entre um valor inicial, atual e meta.
 */
export function calculateGoalProgress(
  initial: number | null | undefined,
  current: number | null | undefined,
  target: number | null | undefined,
): number | null {
  if (initial == null || current == null || target == null) return null;
  const totalDistance = target - initial;
  if (Math.abs(totalDistance) < 0.01) return 100;
  const covered = current - initial;
  const ratio = (covered / totalDistance) * 100;
  return Math.max(0, Math.min(100, Math.round(ratio)));
}

/**
 * Gera código amigável para acesso do aluno (ex.: DIVINA-4821 ou MM-9K4P).
 */
export function generateAccessCode(studentName: string): string {
  const firstWord = studentName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 6);

  const prefix = firstWord.length >= 3 ? firstWord : 'MM';
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefix}-${suffix}`;
}

export function buildClientPortalUrl(codeOrToken: string): string {
  if (typeof window === 'undefined') return `/?aluno=${codeOrToken}`;
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('aluno', codeOrToken);
  return url.toString();
}

export function buildWhatsAppInviteUrl(
  studentName: string,
  accessCode: string,
  phone?: string | null,
): string {
  const firstName = studentName.trim().split(/\s+/)[0] || studentName;
  const portalUrl = buildClientPortalUrl(accessCode);
  const text = [
    `Olá, ${firstName}! Seu painel de evolução no *Medidas & Metas* foi atualizado.`,
    '',
    `Acesse suas medidas, gráficos e card visual pelo link:`,
    portalUrl,
    '',
    `Código de acesso: *${accessCode}*`,
  ].join('\n');

  const digits = (phone ?? '').replace(/\D/g, '');
  const base = digits ? `https://wa.me/${digits}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Saudação natural conforme o horário do dia.
 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export interface MilestoneHighlight {
  id: string;
  label: string;
  tone: 'positive' | 'energy' | 'neutral';
}

/**
 * Gera uma mensagem humana motivacional e conquistas reais a partir da evolução do aluno.
 */
export function buildHumanCelebration(
  firstName: string,
  avaliacoes: Avaliacao[],
): { headline: string; milestones: MilestoneHighlight[] } {
  const sorted = sortAvaliacoesAsc(avaliacoes);
  if (sorted.length === 0) {
    return {
      headline: `Tudo pronto para começar sua jornada, ${firstName}!`,
      milestones: [],
    };
  }

  if (sorted.length === 1) {
    return {
      headline: `Primeiro passo registrado, ${firstName}! A partir daqui cada avanço fica marcado.`,
      milestones: [
        { id: 'start', label: '1ª avaliação concluída', tone: 'energy' },
      ],
    };
  }

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const milestones: MilestoneHighlight[] = [];

  const fatDiff =
    first.gordura_corporal != null && last.gordura_corporal != null
      ? Number((last.gordura_corporal - first.gordura_corporal).toFixed(1))
      : null;
  const muscleDiff =
    first.musculatura != null && last.musculatura != null
      ? Number((last.musculatura - first.musculatura).toFixed(1))
      : null;
  const waistDiff =
    first.cintura != null && last.cintura != null
      ? Number((last.cintura - first.cintura).toFixed(1))
      : null;
  const bodyAgeDiff =
    first.idade_corporal != null && last.idade_corporal != null
      ? last.idade_corporal - first.idade_corporal
      : null;

  if (waistDiff !== null && waistDiff <= -1) {
    milestones.push({
      id: 'waist',
      label: `${formatPtBrNumber(Math.abs(waistDiff), 1)} cm menos de cintura`,
      tone: 'positive',
    });
  }
  if (fatDiff !== null && fatDiff <= -0.5) {
    milestones.push({
      id: 'fat',
      label: `-${formatPtBrNumber(Math.abs(fatDiff), 1)}% de gordura`,
      tone: 'positive',
    });
  }
  if (muscleDiff !== null && muscleDiff >= 0.4) {
    milestones.push({
      id: 'muscle',
      label: `+${formatPtBrNumber(muscleDiff, 1)}% de musculatura`,
      tone: 'energy',
    });
  }
  if (bodyAgeDiff !== null && bodyAgeDiff <= -1) {
    milestones.push({
      id: 'body-age',
      label: `${Math.abs(bodyAgeDiff)} anos mais jovem (idade corporal)`,
      tone: 'positive',
    });
  }

  milestones.push({
    id: 'consistency',
    label: `${sorted.length} avaliações firmes`,
    tone: 'neutral',
  });

  if (fatDiff !== null && fatDiff < 0 && muscleDiff !== null && muscleDiff > 0) {
    return {
      headline: `Evolução de respeito, ${firstName}! Você secou gordura e ganhou massa muscular ao mesmo tempo.`,
      milestones: milestones.slice(0, 4),
    };
  }
  if (waistDiff !== null && waistDiff <= -2) {
    return {
      headline: `Olha essa resposta, ${firstName}! Já são ${formatPtBrNumber(Math.abs(waistDiff), 1)} cm a menos de cintura.`,
      milestones: milestones.slice(0, 4),
    };
  }
  if (muscleDiff !== null && muscleDiff > 0.5) {
    return {
      headline: `Construção sólida, ${firstName}! Mais força, volume e definição aparecendo nos números.`,
      milestones: milestones.slice(0, 4),
    };
  }

  return {
    headline: `Constância vence tudo, ${firstName}! Continue acompanhando cada passo da sua evolução.`,
    milestones: milestones.slice(0, 4),
  };
}
