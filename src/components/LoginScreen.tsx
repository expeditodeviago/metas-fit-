import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Flame,
  HelpCircle,
  KeyRound,
  Loader2,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  AccessibilityControls,
  SkipToContent,
} from '../hooks/useAccessibility';
import { ThemeToggle } from '../hooks/useTheme';
import { openPrivacyModal } from './CookieConsent';
import { HelpModal } from './HelpModal';

interface LoginScreenProps {
  onSignInGoogle: () => Promise<void>;
  onLoginClient: (code: string) => Promise<boolean>;
  trainerError: string | null;
  clientError: string | null;
}

export function LoginScreen({
  onSignInGoogle,
  onLoginClient,
  trainerError,
  clientError,
}: LoginScreenProps) {
  const [roleTab, setRoleTab] = useState<'trainer' | 'client'>('trainer');
  const [submittingGoogle, setSubmittingGoogle] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [submittingClient, setSubmittingClient] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleGoogleLogin = async () => {
    setSubmittingGoogle(true);
    try {
      await onSignInGoogle();
    } finally {
      setSubmittingGoogle(false);
    }
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    setSubmittingClient(true);
    try {
      await onLoginClient(accessCode.trim());
    } finally {
      setSubmittingClient(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row relative">
      <SkipToContent />
      <HelpModal open={helpOpen} context="login" onClose={() => setHelpOpen(false)} />
      <div className="fixed top-4 right-4 z-30 flex items-center gap-1.5">
        <AccessibilityControls compact />
        <ThemeToggle />
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 border border-line-strong text-neutral-300 hover:text-[#FC4C02] transition"
          title="Ajuda"
          aria-label="Abrir ajuda do sistema"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>
      {/* ==================== ESQUERDA: EDITORIAL ESPORTIVO (DESKTOP) ==================== */}
      <aside className="hidden lg:flex lg:w-[54%] xl:w-[58%] flex-col justify-between p-12 xl:p-16 border-r border-line bg-app">
        {/* Marca */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FC4C02] text-[#ffffff]">
            <Flame className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-display text-2xl font-extrabold uppercase tracking-wider text-white leading-none">
              MEDIDAS <span className="text-[#FC4C02]">&amp;</span> METAS
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500 mt-0.5">
              Athletic Performance Tracking
            </p>
          </div>
        </div>

        {/* Copy de alto impacto estilo Nike / Strava */}
        <div className="max-w-xl my-auto py-8">
          <div className="h-1 w-14 bg-[#FC4C02] mb-6" />

          <h1 className="font-display text-6xl xl:text-7xl font-extrabold uppercase tracking-tight text-white leading-[0.95]">
            MEÇA TUDO.
            <br />
            <span className="text-[#FC4C02]">PROVE A EVOLUÇÃO.</span>
          </h1>

          <p className="mt-6 text-base text-neutral-400 leading-relaxed max-w-md">
            Controle avaliações físicas, metas e evolução corporal em um painel
            rápido. Seus alunos acompanham cada avanço em tempo real e recebem o
            card pronto para o WhatsApp.
          </p>

          {/* Barra de métricas reais estilo telemetria esportiva */}
          <div className="mt-10 grid grid-cols-3 border-t border-b border-line divide-x divide-line">
            <div className="py-5 pr-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                Gordura Corporal
              </p>
              <p className="mt-1.5 font-display text-4xl font-extrabold text-white tabular-nums leading-none">
                37,3%
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-green-400">
                <TrendingDown className="h-3.5 w-3.5" /> -3,0%
              </span>
            </div>

            <div className="py-5 px-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                Massa Muscular
              </p>
              <p className="mt-1.5 font-display text-4xl font-extrabold text-white tabular-nums leading-none">
                26,9%
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-green-400">
                <TrendingUp className="h-3.5 w-3.5" /> +1,3%
              </span>
            </div>

            <div className="py-5 pl-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                Cintura
              </p>
              <p className="mt-1.5 font-display text-4xl font-extrabold text-white tabular-nums leading-none">
                78 <span className="text-xl text-neutral-500">cm</span>
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-green-400">
                <TrendingDown className="h-3.5 w-3.5" /> -8 cm
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center gap-6 text-xs text-neutral-500 font-medium">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#FC4C02]" />
            Google OAuth + Isolamento RLS + LGPD
          </span>
          <span>Portal exclusivo por aluno</span>
        </div>
      </aside>

      {/* ==================== DIREITA: AUTENTICAÇÃO LIMPA ==================== */}
      <main id="main-content" className="flex-1 flex flex-col items-center justify-center px-5 py-10 sm:px-8 bg-black">
        <div className="w-full max-w-[420px]">
          {/* Marca mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FC4C02] text-[#ffffff]">
              <Flame className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold uppercase tracking-wider text-white leading-none">
                MEDIDAS <span className="text-[#FC4C02]">&amp;</span> METAS
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 mt-0.5">
                Performance Tracking
              </p>
            </div>
          </div>

          <div className="sport-card rounded-2xl p-6 sm:p-8">
            {/* Tabs Treinador / Aluno */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-black p-1 border border-line mb-7">
              <button
                type="button"
                onClick={() => setRoleTab('trainer')}
                className={`rounded-lg py-2.5 px-3 text-xs font-bold uppercase tracking-wider transition ${
                  roleTab === 'trainer'
                    ? 'bg-[#FC4C02] text-[#ffffff]'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Treinador
              </button>
              <button
                type="button"
                onClick={() => setRoleTab('client')}
                className={`rounded-lg py-2.5 px-3 text-xs font-bold uppercase tracking-wider transition ${
                  roleTab === 'client'
                    ? 'bg-[#FC4C02] text-[#ffffff]'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Aluno
              </button>
            </div>

            {roleTab === 'trainer' ? (
              <div>
                <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-white">
                  Acesso do Treinador
                </h2>
                <p className="mt-1.5 text-sm text-neutral-400 leading-relaxed">
                  Entre diretamente com sua conta Google. Novos treinadores já
                  recebem 2 alunos de exemplo prontos para explorar, editar ou
                  substituir.
                </p>

                {trainerError && (
                  <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 flex gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">{trainerError}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={submittingGoogle}
                  className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl bg-white hover:bg-neutral-200 active:scale-[0.99] text-black font-bold text-sm py-3.5 px-5 transition disabled:opacity-60"
                >
                  {submittingGoogle ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.54-5.17 3.54-8.89z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3.02c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.95H1.28v3.11A12 12 0 0 0 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.27V6.62H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4-3.11z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.78c1.76 0 3.34.61 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4 3.11C6.23 6.89 8.88 4.78 12 4.78z"
                      />
                    </svg>
                  )}
                  <span>
                    {submittingGoogle ? 'Conectando...' : 'Entrar com Google'}
                  </span>
                </button>
              </div>
            ) : (
              <div>
                <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-white">
                  Portal do Aluno
                </h2>
                <p className="mt-1.5 text-sm text-neutral-400 leading-relaxed">
                  Insira o código individual enviado pelo seu personal trainer para
                  ver sua evolução e baixar seu card.
                </p>

                <form onSubmit={handleClientSubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="client-access-code"
                      className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2"
                    >
                      Código de Acesso
                    </label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#FC4C02]" />
                      <input
                        id="client-access-code"
                        type="text"
                        required
                        value={accessCode}
                        onChange={(e) =>
                          setAccessCode(e.target.value.toUpperCase())
                        }
                        placeholder="Ex.: ALUNO-4821"
                        className="w-full rounded-xl border border-line-strong bg-black pl-10 pr-4 py-3.5 text-sm font-mono font-bold tracking-widest text-white placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-neutral-600 focus:border-[#FC4C02] focus:outline-none transition uppercase"
                      />
                    </div>
                  </div>

                  {clientError && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 flex gap-2">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300">{clientError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingClient}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] active:scale-[0.99] text-[#ffffff] font-bold text-sm py-3.5 px-5 transition disabled:opacity-60"
                  >
                    {submittingClient ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Acessar Evolução</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="mt-4 text-center text-[11px] text-neutral-500">
            Ao acessar, você concorda com nossos{' '}
            <button
              type="button"
              onClick={openPrivacyModal}
              className="underline underline-offset-2 text-neutral-300 hover:text-[#FC4C02] transition"
            >
              Termos de Uso, Privacidade e Cookies (LGPD)
            </button>
            .
          </div>
        </div>
      </main>
    </div>
  );
}
