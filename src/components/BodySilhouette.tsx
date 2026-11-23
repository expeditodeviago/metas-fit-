import { useMemo } from 'react';
import Body, { type ExtendedBodyPart, type Slug } from '@mjcdev/react-body-highlighter';
import type { Sexo, SkinTone } from '../types/database';
import type { BodyMorphParams } from '../utils/bodyMorph';

export type BodyZoneKey =
  | 'ombro'
  | 'peito'
  | 'biceps_d'
  | 'biceps_e'
  | 'cintura'
  | 'quadril'
  | 'coxa_d'
  | 'coxa_e'
  | 'panturrilha_d'
  | 'panturrilha_e';

export type ZoneSentiment = 'positive' | 'growth' | 'neutral';
export type BodyStyleMode = 'human' | 'scanner';
export type AvatarMood = 'focused' | 'proud' | 'radiant';

export const SKIN_TONE_PALETTES: Record<
  SkinTone,
  {
    label: string;
    swatch: string;
    light: string;
    mid: string;
    shadow: string;
    hair: string;
    hairHighlight: string;
    contour: string;
  }
> = {
  light: {
    label: 'Clara',
    swatch: '#EFCAB2',
    light: '#F7D9C4',
    mid: '#E7B99D',
    shadow: '#CE977A',
    hair: '#4A3429',
    hairHighlight: '#6E5142',
    contour: '#B98367',
  },
  tan: {
    label: 'Morena Clara',
    swatch: '#D8A280',
    light: '#E3B291',
    mid: '#CE9674',
    shadow: '#B27958',
    hair: '#2A1D18',
    hairHighlight: '#4A362E',
    contour: '#965F40',
  },
  brown: {
    label: 'Morena',
    swatch: '#AF7555',
    light: '#C18765',
    mid: '#A66C4D',
    shadow: '#875136',
    hair: '#1E1513',
    hairHighlight: '#382924',
    contour: '#6C3D27',
  },
  deep: {
    label: 'Negra',
    swatch: '#7B4C35',
    light: '#8E5B42',
    mid: '#724430',
    shadow: '#562F1F',
    hair: '#141010',
    hairHighlight: '#2B2220',
    contour: '#3D2014',
  },
};

export interface BodySilhouetteProps {
  sexo: Sexo;
  morph?: BodyMorphParams;
  ghostMorph?: BodyMorphParams | null;
  theme?: 'sport-dark' | 'classic-light';
  bodySide?: 'front' | 'back';
  styleMode?: BodyStyleMode;
  skinTone?: SkinTone;
  mood?: AvatarMood;
  activeZone?: BodyZoneKey | null;
  zoneHighlights?: Partial<Record<BodyZoneKey, ZoneSentiment>>;
  showHotspots?: boolean;
  onSelectZone?: (zone: BodyZoneKey) => void;
  className?: string;
}

const ALL_SLUGS: Slug[] = [
  'chest',
  'obliques',
  'abs',
  'biceps',
  'triceps',
  'neck',
  'trapezius',
  'deltoids',
  'adductors',
  'quadriceps',
  'knees',
  'tibialis',
  'calves',
  'forearm',
  'hands',
  'ankles',
  'feet',
  'head',
  'hair',
  'upper-back',
  'lower-back',
  'gluteal',
  'hamstring',
];

function sentimentToIntensity(
  sentiment: ZoneSentiment | undefined,
  isSelected: boolean,
): number {
  if (sentiment === 'positive') return isSelected ? 4 : 2;
  if (sentiment === 'growth') return isSelected ? 5 : 3;
  return isSelected ? 6 : 1;
}

function slugToZone(
  slug: Slug | undefined,
  bodySide: 'front' | 'back',
  partSide?: 'left' | 'right',
): BodyZoneKey | null {
  if (!slug) return null;
  const pickSide = (rightKey: BodyZoneKey, leftKey: BodyZoneKey): BodyZoneKey => {
    if (partSide === 'left') {
      return bodySide === 'front' ? rightKey : leftKey;
    }
    return bodySide === 'front' ? leftKey : rightKey;
  };

  switch (slug) {
    case 'deltoids':
    case 'trapezius':
      return 'ombro';
    case 'chest':
    case 'upper-back':
      return 'peito';
    case 'biceps':
    case 'triceps':
    case 'forearm':
      return pickSide('biceps_d', 'biceps_e');
    case 'abs':
    case 'obliques':
    case 'lower-back':
      return 'cintura';
    case 'adductors':
    case 'gluteal':
      return 'quadril';
    case 'quadriceps':
    case 'hamstring':
      return pickSide('coxa_d', 'coxa_e');
    case 'calves':
    case 'tibialis':
      return pickSide('panturrilha_d', 'panturrilha_e');
    default:
      return null;
  }
}

/**
 * Mapa anatômico profissional masculino/feminino baseado em @mjcdev/react-body-highlighter.
 * Converte a evolução real das medidas em intensidade de cor nos grupos musculares,
 * preserva o equilíbrio claro/escuro e permite toque direto nas regiões para inspeção.
 */
export function BodySilhouette({
  sexo,
  morph,
  theme = 'sport-dark',
  bodySide = 'front',
  activeZone = null,
  zoneHighlights = {},
  onSelectZone,
  className = '',
}: BodySilhouetteProps) {
  const isLight = theme === 'classic-light';
  const gender = sexo === 'F' ? 'female' : 'male';

  // Paleta de intensidades (1-indexed -> colors[intensity - 1]):
  // 1: músculo neutro, 2: definição/redução, 3: hipertrofia/ganho,
  // 4..6: destaque ativo selecionado, 7: cabelo, 8: cabeça/rosto
  const palette = useMemo<string[]>(() => {
    if (isLight) {
      return [
        '#DED7CE', // 1: neutro base claro
        '#16A34A', // 2: redução/definição
        '#E85012', // 3: hipertrofia/ganho
        '#15803D', // 4: ativo redução
        '#C2410C', // 5: ativo ganho
        '#8C8278', // 6: ativo neutro
        '#44403C', // 7: cabelo
        '#C9BFB3', // 8: cabeça
      ];
    }
    return [
      '#272731', // 1: neutro base dark
      '#22C55E', // 2: redução/definição
      '#FC4C02', // 3: hipertrofia/ganho
      '#4ADE80', // 4: ativo redução
      '#FF8347', // 5: ativo ganho
      '#6E6E7D', // 6: ativo neutro
      '#3F3F48', // 7: cabelo
      '#363642', // 8: cabeça
    ];
  }, [isLight]);

  const borderStroke = isLight ? '#B6ABA0' : '#4C4C5B';

  const bodyData = useMemo<ExtendedBodyPart[]>(() => {
    const getSingle = (zone: BodyZoneKey) =>
      sentimentToIntensity(zoneHighlights[zone], activeZone === zone);

    const getBilateral = (rightZone: BodyZoneKey, leftZone: BodyZoneKey) => {
      const leftMapped = bodySide === 'front' ? rightZone : leftZone;
      const rightMapped = bodySide === 'front' ? leftZone : rightZone;
      const leftIntensity = getSingle(leftMapped);
      const rightIntensity = getSingle(rightMapped);
      return {
        intensity: Math.max(leftIntensity, rightIntensity),
        leftSideIntensity: leftIntensity,
        rightSideIntensity: rightIntensity,
      };
    };

    const arm = getBilateral('biceps_d', 'biceps_e');
    const thigh = getBilateral('coxa_d', 'coxa_e');
    const calf = getBilateral('panturrilha_d', 'panturrilha_e');
    const shoulder = getSingle('ombro');
    const chest = getSingle('peito');
    const waist = getSingle('cintura');
    const hip = getSingle('quadril');

    const mapBySlug: Partial<
      Record<
        Slug,
        {
          intensity: number;
          leftSideIntensity: number;
          rightSideIntensity: number;
        }
      >
    > = {
      deltoids: {
        intensity: shoulder,
        leftSideIntensity: shoulder,
        rightSideIntensity: shoulder,
      },
      chest: {
        intensity: chest,
        leftSideIntensity: chest,
        rightSideIntensity: chest,
      },
      abs: {
        intensity: waist,
        leftSideIntensity: waist,
        rightSideIntensity: waist,
      },
      obliques: {
        intensity: waist,
        leftSideIntensity: waist,
        rightSideIntensity: waist,
      },
      'lower-back': {
        intensity: waist,
        leftSideIntensity: waist,
        rightSideIntensity: waist,
      },
      adductors: {
        intensity: hip,
        leftSideIntensity: hip,
        rightSideIntensity: hip,
      },
      gluteal: {
        intensity: hip,
        leftSideIntensity: hip,
        rightSideIntensity: hip,
      },
      biceps: arm,
      triceps: arm,
      quadriceps: thigh,
      hamstring: thigh,
      calves: calf,
      tibialis: calf,
      hair: { intensity: 7, leftSideIntensity: 7, rightSideIntensity: 7 },
      head: { intensity: 8, leftSideIntensity: 8, rightSideIntensity: 8 },
    };

    return ALL_SLUGS.map((slug) => {
      const entry = mapBySlug[slug] ?? {
        intensity: 1,
        leftSideIntensity: 1,
        rightSideIntensity: 1,
      };
      return { slug, ...entry };
    });
  }, [zoneHighlights, activeZone, bodySide]);

  // Morph sutil de plenitude corporal na linha do tempo sem distorcer a ilustração
  const scaleX = morph
    ? Math.max(0.94, Math.min(1.07, 1 + morph.fullness * 0.055))
    : 1;

  const handleClick = (part: ExtendedBodyPart, partSide?: 'left' | 'right') => {
    if (!onSelectZone) return;
    const mapped = slugToZone(part.slug, bodySide, partSide);
    if (mapped) {
      onSelectZone(mapped);
    }
  };

  return (
    <div
      className={`select-none flex items-center justify-center ${className}`}
      style={{
        transform: `scaleX(${scaleX.toFixed(4)})`,
        transformOrigin: 'center center',
        transition: 'transform 160ms ease-out',
      }}
    >
      <div className="w-full [&>svg]:w-full [&>svg]:h-auto [&>svg]:block [&>svg]:max-w-full [&>svg_path]:transition-colors [&>svg_path]:duration-200 [&>svg_path#head]:pointer-events-none [&>svg_path#hair]:pointer-events-none [&>svg_path#hands]:pointer-events-none [&>svg_path#feet]:pointer-events-none [&>svg_path#ankles]:pointer-events-none [&>svg_path#knees]:pointer-events-none">
        <Body
          gender={gender}
          side={bodySide}
          data={bodyData}
          colors={palette}
          border={borderStroke}
          scale={1}
          onBodyPartClick={onSelectZone ? handleClick : undefined}
        />
      </div>
    </div>
  );
}
