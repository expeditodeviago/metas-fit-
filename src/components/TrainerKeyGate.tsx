import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { DEMO_TRAINER_KEY } from '../hooks/useAuth';
import { ThemeToggle } from '../hooks/useTheme';

interface TrainerKeyGateProps {
  user: User;
  isDemoMode: boolean;
  error: string | null;
  onActivate: (key: string) => Promise<boolean>;
  onSignOut: () => Promise<void>;
}

export function TrainerKeyGate({
  user,
  isDemoMode,
  error,
  onActivate,
  onSignOut,
}: TrainerKeyGateProps) {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const trainerEmail = user.email || 'Conta Google conectada';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setSubmitting(true);
    try {
      await onActivate(keyInput);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoQuickFill = async () => {
    setKeyInput(DEMO_TRAINER_KEY);
    setSubmitting(true);
    try {
      await onActivate(DEMO_TRAINER_KEY);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="sport-card rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FC4C02] text-[#ffffff]">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-black hover:border-white px-3 py-2 text-xs font-semibold text-neutral-300 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Trocar conta</span>
              </button>
            </div>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FC4C02]">
            Verificação em 2 Camadas
          </p>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-white mt-1">
            Chave do Treinador
          </h1>
          <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
            Valide sua chave exclusiva (bcrypt + RLS). Ela fica vinculada apenas à
            sua conta Google após o primeiro acesso.
          </p>

          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-black border border-line px-3.5 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                <span className="text-xs font-medium text-neutral-200 truncate">
                  1. Google ({trainerEmail})
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase text-green-400 shrink-0">
                OK
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-black border border-[#FC4C02]/40 px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#FC4C02] shrink-0" />
                <span className="text-xs font-medium text-white">
                  2. Chave de Acesso (bcrypt)
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase text-[#FC4C02]">
                Pendente
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="trainer-secret-key"
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2"
              >
                Sua Chave Secreta
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#FC4C02]" />
                <input
                  id="trainer-secret-key"
                  type={showKey ? 'text' : 'password'}
                  required
                  autoFocus
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Digite sua chave de treinador"
                  className="w-full rounded-xl border border-line-strong bg-black pl-10 pr-10 py-3.5 text-sm font-mono text-white placeholder:font-sans placeholder:text-neutral-600 focus:border-[#FC4C02] focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition"
                  aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] active:scale-[0.99] text-[#ffffff] font-bold text-sm py-3.5 px-5 transition disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              <span>
                {submitting ? 'Validando...' : 'Desbloquear Painel'}
              </span>
            </button>
          </form>

          {isDemoMode && (
            <div className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-2">
              <div className="text-xs text-neutral-400">
                Chave Demo:{' '}
                <code className="font-mono font-bold text-[#FC4C02]">
                  {DEMO_TRAINER_KEY}
                </code>
              </div>
              <button
                type="button"
                onClick={handleDemoQuickFill}
                disabled={submitting}
                className="rounded-lg bg-white text-black hover:bg-neutral-200 px-3 py-1.5 text-xs font-bold transition"
              >
                Usar chave
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
