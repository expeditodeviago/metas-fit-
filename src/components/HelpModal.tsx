import { useEffect } from 'react';
import {
  Accessibility,
  BookOpen,
  Compass,
  Cookie,
  HelpCircle,
  ShieldAlert,
  X,
} from 'lucide-react';
import { openPrivacyModal } from './CookieConsent';
import { openOnboardingTutorial } from './OnboardingTutorial';

export type HelpContext = 'login' | 'trainer' | 'client';

interface HelpModalProps {
  open: boolean;
  context: HelpContext;
  onClose: () => void;
}

const CONTEXT_STEPS: Record<
  HelpContext,
  { title: string; subtitle: string; steps: string[] }
> = {
  login: {
    title: 'Como acessar o sistema',
    subtitle: 'Escolha entre o painel do personal trainer ou o portal do aluno.',
    steps: [
      'Treinador: entre diretamente com sua conta Google. Novos usuários já recebem 2 alunos de exemplo prontos para testar, editar ou excluir.',
      'Aluno: insira o código individual enviado pelo personal trainer na aba "Aluno" ou abra o link exclusivo.',
      'Acessibilidade e Tema: use os botões A+, Contraste e Tema Claro/Escuro no topo a qualquer momento.',
    ],
  },
  trainer: {
    title: 'Guia rápido do Personal Trainer',
    subtitle: 'Fluxo recomendado para avaliações rápidas sem erros de digitação.',
    steps: [
      'Cadastre ou selecione o aluno e toque em "Nova Avaliação" para registrar composição corporal e perimetria.',
      'Valores fora do padrão clínico exibem confirmação de segurança antes de gravar (Prevenção de Erros).',
      'Gere o Card PNG em 4:5 ou 9:16 e acompanhe o modelo anatômico frente/costas por etapa.',
    ],
  },
  client: {
    title: 'Como ler seu Portal de Evolução',
    subtitle: 'Interaja diretamente com o modelo anatômico e com a linha do tempo.',
    steps: [
      'Toque em qualquer grupo muscular no mapa anatômico para comparar Inicial → Atual em centímetros.',
      'Use "Frente / Costas" e o slider da linha do tempo para visualizar sua recomposição muscular.',
      'Na aba "Meu Card", personalize tema Claro/Escuro e baixe sua imagem em alta resolução.',
    ],
  },
};

export function HelpModal({ open, context, onClose }: HelpModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const info = CONTEXT_STEPS[context];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-surface border border-line-strong shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FC4C02]/15 text-[#FC4C02]">
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="help-modal-title"
                className="font-display text-xl font-extrabold uppercase tracking-tight text-white"
              >
                {info.title}
              </h2>
              <p className="text-xs text-neutral-400">{info.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar ajuda"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-black text-neutral-300 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto text-xs text-neutral-300 leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#FC4C02] flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Passo a passo na interface</span>
            </h3>
            <ul className="space-y-1.5">
              {info.steps.map((step) => (
                <li
                  key={step}
                  className="rounded-xl bg-black border border-line px-3.5 py-2.5"
                >
                  {step}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl bg-black border border-line p-3.5 space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Accessibility className="h-3.5 w-3.5 text-[#FC4C02]" aria-hidden="true" />
              <span>Acessibilidade (Permanente, Temporária e Situacional)</span>
            </h3>
            <p className="text-neutral-400">
              • <strong>Botões A+ e Contraste</strong> no topo ampliam tipografia e reforçam bordas para baixa visão.
            </p>
            <p className="text-neutral-400">
              • <strong>Navegação por teclado e toque único</strong> (Tab/Enter/Esc + zonas grandes) atende limitação temporária em membro superior.
            </p>
            <p className="text-neutral-400">
              • <strong>Legenda textual e alternância de tema</strong> acompanham as cores verde/laranja em ambientes de academia com luz intensa ou baixo contraste.
            </p>
          </section>

          <section className="rounded-xl bg-[#FC4C02]/10 border border-[#FC4C02]/30 p-3.5 flex gap-2.5">
            <ShieldAlert className="h-4 w-4 text-[#FC4C02] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-neutral-200">
              <strong>Segurança &amp; Prevenção de Erros:</strong> ações críticas ou valores fora da faixa clínica pedem confirmação explícita antes de concluir.
            </p>
          </section>
        </div>

        <div className="px-5 py-3 border-t border-line flex flex-wrap items-center justify-between gap-2 bg-black">
          <div className="flex flex-wrap items-center gap-2">
            {(context === 'trainer' || context === 'client') && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openOnboardingTutorial(context);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface-2 px-3 py-2 text-xs font-semibold text-white hover:border-[#FC4C02] transition"
              >
                <Compass className="h-3.5 w-3.5 text-[#FC4C02]" aria-hidden="true" />
                <span>Ver Tutorial</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                openPrivacyModal();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition"
            >
              <Cookie className="h-3.5 w-3.5 text-[#FC4C02]" aria-hidden="true" />
              <span>Privacidade &amp; Cookies</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#ffffff] transition"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
