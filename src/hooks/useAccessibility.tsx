import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Contrast, Type } from 'lucide-react';

const A11Y_STORAGE_KEY = 'medidas_metas_a11y';

interface AccessibilityState {
  largeText: boolean;
  highContrast: boolean;
}

interface AccessibilityContextValue extends AccessibilityState {
  toggleLargeText: () => void;
  toggleHighContrast: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(
  null,
);

function readInitialState(): AccessibilityState {
  if (typeof window === 'undefined') {
    return { largeText: false, highContrast: false };
  }
  try {
    const raw = localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return { largeText: false, highContrast: false };
    const parsed = JSON.parse(raw) as Partial<AccessibilityState>;
    return {
      largeText: Boolean(parsed.largeText),
      highContrast: Boolean(parsed.highContrast),
    };
  } catch {
    return { largeText: false, highContrast: false };
  }
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccessibilityState>(readInitialState);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('a11y-large-text', state.largeText);
    root.classList.toggle('a11y-high-contrast', state.highContrast);
    try {
      localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage failures
    }
  }, [state]);

  const toggleLargeText = useCallback(() => {
    setState((prev) => ({ ...prev, largeText: !prev.largeText }));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setState((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{ ...state, toggleLargeText, toggleHighContrast }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error(
      'useAccessibility precisa estar dentro de AccessibilityProvider',
    );
  }
  return ctx;
}

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-[#FC4C02] focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:uppercase focus:tracking-wider focus:text-[#ffffff] focus:shadow-lg"
    >
      Ir para o conteúdo principal
    </a>
  );
}

export function AccessibilityControls({
  compact = false,
  fullWidth = false,
}: {
  compact?: boolean;
  fullWidth?: boolean;
}) {
  const { largeText, highContrast, toggleLargeText, toggleHighContrast } =
    useAccessibility();

  const btnBase =
    'flex h-9 items-center justify-center rounded-lg border text-xs font-bold transition min-w-0';

  return (
    <div
      className={
        fullWidth
          ? 'grid grid-cols-2 gap-1.5 w-full'
          : 'flex items-center gap-1.5 shrink-0'
      }
      role="group"
      aria-label="Controles de acessibilidade"
    >
      <button
        type="button"
        onClick={toggleLargeText}
        aria-pressed={largeText}
        aria-label="Alternar texto ampliado"
        title="Texto ampliado (A+)"
        className={`${btnBase} ${
          fullWidth
            ? 'w-full px-2 gap-1.5'
            : compact
              ? 'w-9 shrink-0'
              : 'px-2.5 gap-1 shrink-0'
        } ${
          largeText
            ? 'bg-[#FC4C02] border-[#FC4C02] text-[#ffffff]'
            : 'bg-surface-2 border-line-strong text-neutral-300 hover:text-[#FC4C02]'
        }`}
      >
        <Type className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {!compact && <span className="truncate">A+</span>}
      </button>

      <button
        type="button"
        onClick={toggleHighContrast}
        aria-pressed={highContrast}
        aria-label="Alternar alto contraste"
        title="Alto contraste"
        className={`${btnBase} ${
          fullWidth
            ? 'w-full px-2 gap-1.5'
            : compact
              ? 'w-9 shrink-0'
              : 'px-2.5 gap-1 shrink-0'
        } ${
          highContrast
            ? 'bg-[#FC4C02] border-[#FC4C02] text-[#ffffff]'
            : 'bg-surface-2 border-line-strong text-neutral-300 hover:text-[#FC4C02]'
        }`}
      >
        <Contrast className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {!compact && (
          <span className={fullWidth ? 'truncate' : 'sr-only sm:not-sr-only'}>
            Contraste
          </span>
        )}
      </button>
    </div>
  );
}
