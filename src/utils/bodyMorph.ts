import type { Aluno, Avaliacao, Sexo } from '../types/database';
import { calculateIMC, formatDatePtBr, sortAvaliacoesAsc } from './calculations';

/**
 * Parâmetros anatômicos normalizados para deformação suave do modelo corporal.
 * 0 = proporção atlética média; valores negativos = mais fino/enxuto; positivos = mais largo/volumoso.
 */
export interface BodyMorphParams {
  shoulder: number;     // -1 .. +1.2 (ombro)
  chest: number;        // -1 .. +1.2 (peito / caixa torácica)
  waist: number;        // -1 .. +1.5 (cintura / abdômen)
  hip: number;          // -1 .. +1.3 (quadril / glúteo)
  bicepR: number;       // -1 .. +1.3 (bíceps direito)
  bicepL: number;       // -1 .. +1.3 (bíceps esquerdo)
  thighR: number;       // -1 .. +1.3 (coxa direita)
  thighL: number;       // -1 .. +1.3 (coxa esquerda)
  calfR: number;        // -1 .. +1.2 (panturrilha direita)
  calfL: number;        // -1 .. +1.2 (panturrilha esquerda)
  fullness: number;     // -0.6 .. +1.2 (volume geral / IMC & gordura)
  definition: number;   // 0 .. 1 (definição muscular visível)
}

export interface BodyLandmarkPoint {
  x: number;
  y: number;
}

export interface BodyLandmarks {
  ombro: BodyLandmarkPoint;
  peito: BodyLandmarkPoint;
  biceps_d: BodyLandmarkPoint;
  biceps_e: BodyLandmarkPoint;
  cintura: BodyLandmarkPoint;
  quadril: BodyLandmarkPoint;
  coxa_d: BodyLandmarkPoint;
  coxa_e: BodyLandmarkPoint;
  panturrilha_d: BodyLandmarkPoint;
  panturrilha_e: BodyLandmarkPoint;
}

export interface EvolutionStage {
  id: string;
  label: string;
  shortLabel: string;
  dateLabel: string;
  isGoal?: boolean;
  morph: BodyMorphParams;
  metrics: {
    peso: number | null;
    imc: number | null;
    gordura_corporal: number | null;
    musculatura: number | null;
    cintura: number | null;
    quadril: number | null;
    ombro: number | null;
    peito: number | null;
    biceps_d: number | null;
    biceps_e: number | null;
    coxa_d: number | null;
    coxa_e: number | null;
    panturrilha_d: number | null;
    panturrilha_e: number | null;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Converte uma avaliação física + dados do aluno em parâmetros anatômicos proporcionais.
 * Usa razões relativas à altura para manter proporções realistas em qualquer estatura.
 */
export function computeBodyMorph(
  aluno: Pick<Aluno, 'altura_cm' | 'sexo'>,
  av: Partial<Avaliacao> | null | undefined,
): BodyMorphParams {
  const isMale = aluno.sexo === 'M';
  const h = clamp(aluno.altura_cm || (isMale ? 176 : 165), 140, 215);

  const imc =
    av?.imc ??
    (av?.peso ? calculateIMC(av.peso, h) : null) ??
    (isMale ? 24 : 22.5);

  const fat = av?.gordura_corporal ?? (isMale ? 18 : 27);
  const muscle = av?.musculatura ?? (isMale ? 39 : 30);

  // Volume corporal geral baseado em IMC e % de gordura
  const imcNorm = clamp((imc - (isMale ? 23.5 : 22)) / 8.5, -0.6, 1.2);
  const fatNorm = clamp((fat - (isMale ? 16 : 25)) / 14, -0.5, 1.2);
  const fullness = clamp(imcNorm * 0.55 + fatNorm * 0.45, -0.55, 1.15);

  // Nível de definição muscular visível (0 = suave, 1 = alta definição atlética)
  const fatDef = isMale
    ? clamp((26 - fat) / 14, 0, 1)
    : clamp((39 - fat) / 17, 0, 1);
  const muscleDef = isMale
    ? clamp((muscle - 33) / 12, 0, 1)
    : clamp((muscle - 23) / 12, 0, 1);
  const definition = clamp(fatDef * 0.65 + muscleDef * 0.35, 0.08, 1);

  // Referências proporcionais à altura (razões antropométricas)
  const ref = isMale
    ? {
        shoulder: 0.65,
        chest: 0.56,
        waist: 0.465,
        hip: 0.55,
        bicep: 0.195,
        thigh: 0.32,
        calf: 0.212,
      }
    : {
        shoulder: 0.59,
        chest: 0.54,
        waist: 0.425,
        hip: 0.595,
        bicep: 0.162,
        thigh: 0.315,
        calf: 0.212,
      };

  const ratioDelta = (
    value: number | null | undefined,
    baseRatio: number,
    sensitivity: number,
    fallback: number,
    min = -0.9,
    max = 1.25,
  ) => {
    if (value == null || value <= 0) return clamp(fallback, min, max);
    const ratio = value / h;
    return clamp((ratio - baseRatio) * sensitivity, min, max);
  };

  const muscleBoost = (muscleDef - 0.5) * 0.55;

  return {
    shoulder: ratioDelta(
      av?.ombro,
      ref.shoulder,
      11.5,
      muscleBoost + fullness * 0.25,
      -0.8,
      1.15,
    ),
    chest: ratioDelta(
      av?.peito,
      ref.chest,
      11.5,
      fullness * 0.45 + muscleBoost * 0.4,
      -0.8,
      1.15,
    ),
    waist: ratioDelta(
      av?.cintura,
      ref.waist,
      13.5,
      fullness * 0.9,
      -0.85,
      1.45,
    ),
    hip: ratioDelta(
      av?.quadril,
      ref.hip,
      12.5,
      fullness * 0.6,
      -0.8,
      1.3,
    ),
    bicepR: ratioDelta(
      av?.biceps_d,
      ref.bicep,
      26,
      muscleBoost + fullness * 0.35,
      -0.8,
      1.25,
    ),
    bicepL: ratioDelta(
      av?.biceps_e ?? av?.biceps_d,
      ref.bicep,
      26,
      muscleBoost + fullness * 0.35,
      -0.8,
      1.25,
    ),
    thighR: ratioDelta(
      av?.coxa_d,
      ref.thigh,
      19,
      fullness * 0.45 + muscleBoost * 0.5,
      -0.8,
      1.25,
    ),
    thighL: ratioDelta(
      av?.coxa_e ?? av?.coxa_d,
      ref.thigh,
      19,
      fullness * 0.45 + muscleBoost * 0.5,
      -0.8,
      1.25,
    ),
    calfR: ratioDelta(
      av?.panturrilha_d,
      ref.calf,
      24,
      fullness * 0.3 + muscleBoost * 0.45,
      -0.75,
      1.15,
    ),
    calfL: ratioDelta(
      av?.panturrilha_e ?? av?.panturrilha_d,
      ref.calf,
      24,
      fullness * 0.3 + muscleBoost * 0.45,
      -0.75,
      1.15,
    ),
    fullness,
    definition,
  };
}

/**
 * Interpola linearmente dois estados anatômicos (t entre 0 e 1) para animação 60fps.
 */
export function interpolateBodyMorph(
  a: BodyMorphParams,
  b: BodyMorphParams,
  t: number,
): BodyMorphParams {
  const k = clamp(t, 0, 1);
  return {
    shoulder: lerp(a.shoulder, b.shoulder, k),
    chest: lerp(a.chest, b.chest, k),
    waist: lerp(a.waist, b.waist, k),
    hip: lerp(a.hip, b.hip, k),
    bicepR: lerp(a.bicepR, b.bicepR, k),
    bicepL: lerp(a.bicepL, b.bicepL, k),
    thighR: lerp(a.thighR, b.thighR, k),
    thighL: lerp(a.thighL, b.thighL, k),
    calfR: lerp(a.calfR, b.calfR, k),
    calfL: lerp(a.calfL, b.calfL, k),
    fullness: lerp(a.fullness, b.fullness, k),
    definition: lerp(a.definition, b.definition, k),
  };
}

/**
 * Gera a linha do tempo de estágios do aluno (Inicial -> ... -> Atual -> Meta projetada).
 */
export function buildEvolutionStages(
  aluno: Aluno,
  avaliacoes: Avaliacao[],
): EvolutionStage[] {
  const sorted = sortAvaliacoesAsc(avaliacoes);
  if (sorted.length === 0) return [];

  const stages: EvolutionStage[] = sorted.map((av, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === sorted.length - 1;
    const shortLabel =
      sorted.length === 1
        ? 'Atual'
        : isFirst
          ? 'Inicial'
          : isLast
            ? 'Atual'
            : `Av. ${idx + 1}`;

    return {
      id: av.id,
      label: isFirst
        ? 'Avaliação Inicial'
        : isLast
          ? 'Avaliação Atual'
          : `Avaliação ${idx + 1}`,
      shortLabel,
      dateLabel: formatDatePtBr(av.data_avaliacao),
      morph: computeBodyMorph(aluno, av),
      metrics: {
        peso: av.peso,
        imc: av.imc ?? calculateIMC(av.peso, aluno.altura_cm),
        gordura_corporal: av.gordura_corporal,
        musculatura: av.musculatura,
        cintura: av.cintura,
        quadril: av.quadril,
        ombro: av.ombro,
        peito: av.peito,
        biceps_d: av.biceps_d,
        biceps_e: av.biceps_e,
        coxa_d: av.coxa_d,
        coxa_e: av.coxa_e,
        panturrilha_d: av.panturrilha_d,
        panturrilha_e: av.panturrilha_e,
      },
    };
  });

  // Se o treinador definiu peso_meta ou gordura_meta, adiciona estágio "Meta" projetado!
  const latest = sorted[sorted.length - 1];
  if (aluno.peso_meta != null || aluno.gordura_meta != null) {
    const targetPeso = aluno.peso_meta ?? latest.peso;
    const targetFat = aluno.gordura_meta ?? latest.gordura_corporal;
    const fatDrop =
      latest.gordura_corporal != null && targetFat != null
        ? Math.max(0, latest.gordura_corporal - targetFat)
        : 0;
    const projectedMuscle =
      latest.musculatura != null
        ? Number((latest.musculatura + Math.min(3.5, fatDrop * 0.35 + 0.8)).toFixed(1))
        : null;
    const projectedWaist =
      latest.cintura != null
        ? Number(Math.max(58, latest.cintura - fatDrop * 1.15).toFixed(1))
        : null;

    const goalSnapshot: Partial<Avaliacao> = {
      ...latest,
      peso: targetPeso,
      imc: calculateIMC(targetPeso, aluno.altura_cm),
      gordura_corporal: targetFat,
      musculatura: projectedMuscle,
      cintura: projectedWaist,
    };

    stages.push({
      id: 'goal-projection',
      label: 'Projeção da Meta',
      shortLabel: 'Meta',
      dateLabel: aluno.objetivo,
      isGoal: true,
      morph: computeBodyMorph(aluno, goalSnapshot),
      metrics: {
        peso: targetPeso,
        imc: calculateIMC(targetPeso, aluno.altura_cm),
        gordura_corporal: targetFat,
        musculatura: projectedMuscle,
        cintura: projectedWaist,
        quadril: latest.quadril,
        ombro: latest.ombro,
        peito: latest.peito,
        biceps_d: latest.biceps_d,
        biceps_e: latest.biceps_e,
        coxa_d: latest.coxa_d,
        coxa_e: latest.coxa_e,
        panturrilha_d: latest.panturrilha_d,
        panturrilha_e: latest.panturrilha_e,
      },
    });
  }

  return stages;
}

/**
 * Calcula coordenadas exatas dos contornos anatômicos no viewBox 0 0 220 420.
 * Compartilhado entre o SVG e as setas/hotspots para alinhamento sub-pixel.
 */
export function computeAnatomicalMeasures(sexo: Sexo, m: BodyMorphParams) {
  const isMale = sexo === 'M';

  // Larguras a partir do eixo central (cx = 110)
  const headRx = (isMale ? 15.2 : 13.8) + m.fullness * 1.1;
  const neckW = (isMale ? 10.6 : 8.6) + m.fullness * 1.3;
  const shoulderW = (isMale ? 42 : 34.5) + m.shoulder * 6.5 + m.fullness * 1.8;
  const chestW = (isMale ? 35.5 : 31.5) + m.chest * 5.2 + m.fullness * 2.2;
  const waistW = (isMale ? 26.5 : 21.8) + m.waist * 7.8 + m.fullness * 2.8;
  const hipW = (isMale ? 30.2 : 34.2) + m.hip * 6.4 + m.fullness * 2.2;

  // Braços (pose atlética natural aberta ~15°)
  const armRThick = (isMale ? 12.6 : 10.2) + m.bicepR * 3.0 + m.fullness * 1.2;
  const armLThick = (isMale ? 12.6 : 10.2) + m.bicepL * 3.0 + m.fullness * 1.2;

  // Pernas (coxa e panturrilha)
  const thighRWidth = (isMale ? 19.6 : 20.6) + m.thighR * 3.8 + m.fullness * 1.4;
  const thighLWidth = (isMale ? 19.6 : 20.6) + m.thighL * 3.8 + m.fullness * 1.4;
  const kneeW = (isMale ? 11.4 : 10.8) + m.fullness * 0.8;
  const calfRWidth = (isMale ? 13.4 : 12.6) + m.calfR * 2.6 + m.fullness * 0.9;
  const calfLWidth = (isMale ? 13.4 : 12.6) + m.calfL * 2.6 + m.fullness * 0.9;
  const ankleW = (isMale ? 7.2 : 6.4) + m.fullness * 0.4;

  // Pontos-chave dos braços (viewer's left = direito do aluno; viewer's right = esquerdo do aluno)
  const cx = 110;
  const rShoulderX = cx - shoulderW;
  const lShoulderX = cx + shoulderW;

  const rArmCenterX = rShoulderX - 7;
  const lArmCenterX = lShoulderX + 7;

  const rBicepOuterX = rArmCenterX - armRThick * 0.58;
  const lBicepOuterX = lArmCenterX + armLThick * 0.58;

  // Centros das pernas (abertura sutil atlética)
  const rLegTopX = cx - hipW * 0.48;
  const lLegTopX = cx + hipW * 0.48;
  const rKneeCenterX = cx - 19;
  const lKneeCenterX = cx + 19;
  const rAnkleCenterX = cx - 20.5;
  const lAnkleCenterX = cx + 20.5;

  const landmarks: BodyLandmarks = {
    ombro: { x: rShoulderX + 2, y: 98 },
    peito: { x: cx + chestW * 0.42, y: 120 },
    biceps_d: { x: rBicepOuterX + 3, y: 136 },
    biceps_e: { x: lBicepOuterX - 3, y: 136 },
    cintura: { x: cx - waistW + 2, y: 170 },
    quadril: { x: cx + hipW - 2, y: 207 },
    coxa_d: { x: rLegTopX - thighRWidth * 0.35, y: 256 },
    coxa_e: { x: lLegTopX + thighLWidth * 0.35, y: 256 },
    panturrilha_d: { x: rAnkleCenterX - calfRWidth * 0.45, y: 338 },
    panturrilha_e: { x: lAnkleCenterX + calfLWidth * 0.45, y: 338 },
  };

  return {
    cx,
    headRx,
    neckW,
    shoulderW,
    chestW,
    waistW,
    hipW,
    armRThick,
    armLThick,
    thighRWidth,
    thighLWidth,
    kneeW,
    calfRWidth,
    calfLWidth,
    ankleW,
    rShoulderX,
    lShoulderX,
    rArmCenterX,
    lArmCenterX,
    rLegTopX,
    lLegTopX,
    rKneeCenterX,
    lKneeCenterX,
    rAnkleCenterX,
    lAnkleCenterX,
    landmarks,
  };
}
