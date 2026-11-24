import { useId } from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
};

export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  const uid = useId().replace(/:/g, '');
  const bgId = `mm-bg-${uid}`;
  const sheenId = `mm-sheen-${uid}`;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${SIZE_CLASSES[size]} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-sm"
      >
        <defs>
          <linearGradient
            id={bgId}
            x1="6"
            y1="4"
            x2="58"
            y2="60"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FF6B1A" />
            <stop offset="55%" stopColor="#FC4C02" />
            <stop offset="100%" stopColor="#D93800" />
          </linearGradient>
          <linearGradient
            id={sheenId}
            x1="32"
            y1="0"
            x2="32"
            y2="34"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${bgId})`} />
        <rect x="2" y="2" width="60" height="30" rx="16" fill={`url(#${sheenId})`} />
        <rect
          x="2.75"
          y="2.75"
          width="58.5"
          height="58.5"
          rx="15.25"
          stroke="#FFFFFF"
          strokeOpacity="0.18"
          strokeWidth="1.5"
        />

        {/* Monograma M + Seta de Evolução/Meta */}
        <path
          d="M15 44V24.5L26.5 36L38 23.5L46.5 18"
          stroke="#FFFFFF"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M39.5 16.5H48.5V25.5"
          stroke="#FFFFFF"
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M48.5 31.5V44"
          stroke="#FFFFFF"
          strokeWidth="5.2"
          strokeLinecap="round"
        />

        {/* Marcações de régua antropométrica (Medidas) */}
        <line
          x1="22"
          y1="51.5"
          x2="42"
          y2="51.5"
          stroke="#FFFFFF"
          strokeOpacity="0.55"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="25"
          y1="49.5"
          x2="25"
          y2="53.5"
          stroke="#FFFFFF"
          strokeOpacity="0.75"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="32"
          y1="48.8"
          x2="32"
          y2="54.2"
          stroke="#FFFFFF"
          strokeOpacity="0.95"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="39"
          y1="49.5"
          x2="39"
          y2="53.5"
          stroke="#FFFFFF"
          strokeOpacity="0.75"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
