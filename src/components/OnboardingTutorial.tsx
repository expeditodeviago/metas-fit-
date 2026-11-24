import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Image as ImageIcon,
  KeyRound,
  Ruler,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export type TutorialRole = 'trainer' | 'client';

interface TutorialStep {
  badge: string;
  title: string;
  description: string;
  highlights: string[];
  tip: string;
  icon: typeof Sparkles;
}

const STORAGE_KEYS: Record<TutorialRole, string> = {
  trainer: 'mm_onboarding_trainer_seen_v1',
  client: 'mm_onboarding_client_seen_v1',
};

const OPEN_TUTORIAL_EVENT = 'mm:open-tutorial';

export function hasSeenTutorial(role: TutorialRole): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEYS[role]) === '1';
  } catch {
    return false;
  }
}

export function markTutorialSeen(role: TutorialRole): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS[role], '1');
  } catch {
    // Ignora em modo privado restrito
  }
}

export function openOnboardingTutorial(role: TutorialRole): void {
  window.dispatchEvent(
    new CustomEvent<TutorialRole>(OPEN_TUTORIAL_EVENT, { detail: role }),
  );
}

const TRAINER_STEPS: TutorialStep[] = [
  {
    badge: 'Boas-vindas • Primeiro Acesso',
    title: 'Seu painel profissional já veio pronto para explorar',
    description:
      'Para facilitar seu primeiro contato, criamos automaticamente 2 alunos de exemplo (Camila Ferreira e Rafael Nogueira) com avaliações reais já preenchidas.',
    highlights: [
      'Clique em qualquer aluno de exemplo para testar gráficos, mapa corporal e Card PNG.',
      'Você pode editar ou excluir os perfis de exemplo a qualquer momento — eles não voltam após excluídos.',
      'Seus dados ficam isolados exclusivamente na sua conta Google via segurança RLS.',
    ],
    tip: 'Dica: quando estiver pronto, clique em "+ Novo Aluno" no menu lateral para cadastrar seus clientes reais.',
    icon: Sparkles,
  },
  {
    badge: 'Passo 2 • Alunos e Metas',
    title: 'Cadastre alunos com objetivo e metas claras',
    description:
      'Na aba "Alunos" ou no botão "+ Novo Aluno", você registra os dados básicos e define peso meta e % de gordura meta de cada cliente.',
    highlights: [
      'Informe data de nascimento, altura (cm) e sexo para calibrar o IMC e o modelo anatômico.',
      'Escolha o objetivo (Recomposição, Emagrecimento ou Hipertrofia) para ajustar os alertas de progresso.',
      'Cada aluno ganha automaticamente um código exclusivo (ex.: MM-4A92C1) para o Portal do Aluno.',
    ],
    tip: 'Na barra lateral, alterne rapidamente entre Visão Geral, Alunos e Acessos.',
    icon: Users,
  },
  {
    badge: 'Passo 3 • Avaliações Rápidas',
    title: 'Registre avaliações no celular sem erros de digitação',
    description:
      'Dentro do perfil do aluno, toque em "Nova Avaliação" para preencher bioimpedância e as 10 circunferências corporais com agilidade.',
    highlights: [
      'Cada campo mostra o valor da avaliação anterior logo abaixo para você não precisar consultar fichas antigas.',
      'O IMC é calculado automaticamente assim que você digita o peso.',
      'Valores fora do padrão clínico disparam um aviso de confirmação para evitar erros de vírgula.',
    ],
    tip: 'Ao salvar uma nova avaliação, o sistema já abre o Card evolutivo pronto para exportar.',
    icon: ClipboardCheck,
  },
  {
    badge: 'Passo 4 • Mapa Corporal e Card PNG',
    title: 'Mostre a evolução visual e envie o Card no WhatsApp',
    description:
      'Transforme números em motivação real com o mapa anatômico interativo e o gerador de Card PNG em alta definição.',
    highlights: [
      'No mapa corporal, alterne entre Frente e Costas e toque nos músculos para comparar Inicial → Atual.',
      'Verde indica redução/definição e Laranja indica ganho de volume muscular.',
      'Exporte o Card em 4:5 (Feed/Chat) ou 9:16 (Status/Stories) nos temas Dark Pro ou Clássico.',
    ],
    tip: 'Use o botão "Ver como Aluno" no perfil para conferir exatamente o que seu cliente enxergará.',
    icon: ImageIcon,
  },
  {
    badge: 'Passo 5 • Portal do Aluno e Acessibilidade',
    title: 'Compartilhe links individuais e ajuste a interface',
    description:
      'Na aba "Acessos", gerencie quem pode consultar o portal somente leitura e personalize conforto visual para qualquer ambiente.',
    highlights: [
      'Copie o link direto ou envie o convite pronto no WhatsApp com 1 toque.',
      'Pause o acesso ou gere um novo código de segurança quando precisar.',
      'Use os botões A+, Contraste, Tema Claro/Escuro, Tutorial e Ajuda (?) no menu lateral sempre que quiser.',
    ],
    tip: 'Você pode rever este tutorial a qualquer momento clicando em "Tutorial" no menu.',
    icon: KeyRound,
  },
];

const CLIENT_STEPS: TutorialStep[] = [
  {
    badge: 'Boas-vindas • Portal do Aluno',
    title: 'Acompanhe toda a sua evolução em um só lugar',
    description:
      'Este é o seu portal exclusivo, atualizado pelo seu personal trainer a cada avaliação física. Aqui você visualiza conquistas reais sem complicação.',
    highlights: [
      'No topo da tela você vê seus principais destaques (redução de cintura, gordura e ganho muscular).',
      'Navegue facilmente pelas 3 abas principais: Evolução, Meu Card e Medidas.',
      'O acesso é somente leitura e protegido pelo seu código individual.',
    ],
    tip: 'Dica: salve o link deste portal nos favoritos do celular para consultar sempre que quiser.',
    icon: Sparkles,
  },
  {
    badge: 'Passo 2 • Mapa Anatômico Interativo',
    title: 'Toque nos músculos e anime sua linha do tempo',
    description:
      'Na aba "Evolução", o mapa corporal mostra visualmente onde seu corpo mais mudou desde a primeira avaliação.',
    highlights: [
      'Alterne entre as vistas Frente e Costas para inspecionar todos os grupos musculares.',
      'Toque em qualquer região destacada (verde = redução/definição; laranja = ganho muscular) para ver os centímetros.',
      'Clique em "Animar Evolução" ou arraste a linha do tempo para rever sua jornada etapa por etapa até a Meta.',
    ],
    tip: 'Mesmo quando o peso na balança varia pouco, o mapa mostra sua perda de medidas e ganho de músculo.',
    icon: Activity,
  },
  {
    badge: 'Passo 3 • Meu Card Oficial',
    title: 'Baixe e compartilhe seu Card de resultados',
    description:
      'Na aba "Meu Card" (ou tocando em "Abrir Meu Card PNG"), você gera uma imagem profissional pronta para postar ou guardar.',
    highlights: [
      'Escolha o formato 4:5 (Feed/WhatsApp) ou 9:16 (Stories/Status).',
      'Alterne entre o estilo Dark Pro ou Clássico conforme sua preferência.',
      'Clique em baixar/compartilhar para salvar a imagem em alta definição direto no aparelho.',
    ],
    tip: 'O card compara automaticamente sua avaliação Inicial, Anterior e Atual.',
    icon: ImageIcon,
  },
  {
    badge: 'Passo 4 • Histórico e Acessibilidade',
    title: 'Consulte todas as medidas e ajuste o conforto visual',
    description:
      'Na aba "Medidas", confira o histórico completo de todas as suas avaliações e gráficos de tendência.',
    highlights: [
      'Acompanhe peso, IMC, gordura corporal, musculatura, gordura visceral e todas as circunferências.',
      'No topo da tela, use A+ (texto ampliado), Alto Contraste e Tema Claro/Escuro para ler melhor sob qualquer luz.',
      'Sempre que tiver dúvida sobre alguma função, toque no ícone "?" (Ajuda) no canto superior direito.',
    ],
    tip: 'Você pode reabrir este guia quando quiser clicando no ícone "?" → "Ver Tutorial".',
    icon: Ruler,
  },
];

interface OnboardingTutorialProps {
  role: TutorialRole;
  userName?: string;
  autoOpen?: boolean;
}

export function OnboardingTutorial({
  role,
  userName,
  autoOpen = true,
}: OnboardingTutorialProps) {
  const [open, setOpen] = useState<boolean>(() =>
    autoOpen ? !hasSeenTutorial(role) : false,
  );
  const [stepIndex, setStepIndex] = useState(0);

  const steps = role === 'trainer' ? TRAINER_STEPS : CLIENT_STEPS;
  const current = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const Icon = current.icon;

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const customEvent = event as CustomEvent<TutorialRole>;
      if (!customEvent.detail || customEvent.detail === role) {
        setStepIndex(0);
        setOpen(true);
      }
    };
    window.addEventListener(OPEN_TUTORIAL_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_TUTORIAL_EVENT, handleOpen);
  }, [role]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        markTutorialSeen(role);
        setOpen(false);
      } else if (e.key === 'ArrowRight') {
        setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setStepIndex((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, role, steps.length]);

  if (!open) return null;

  const finishAndClose = () => {
    markTutorialSeen(role);
    setOpen(false);
  };

  const firstName = userName?.trim().split(/\s+/)[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-tutorial-title"
      onClick={finishAndClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-surface border border-line-strong shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandLogo size="sm" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FC4C02]">
                Guia Rápido • {role === 'trainer' ? 'Treinador' : 'Aluno'}
              </p>
              <p className="truncate text-xs font-semibold text-neutral-300">
                {firstName
                  ? `Olá, ${firstName}! Veja como usar o sistema`
                  : 'Veja como aproveitar todas as funções'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={finishAndClose}
            aria-label="Fechar tutorial"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-black text-neutral-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Barra de progresso */}
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 mb-2">
            <span>{current.badge}</span>
            <span className="tabular-nums text-neutral-300">
              {stepIndex + 1} / {steps.length}
            </span>
          </div>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
            {steps.map((s, idx) => (
              <button
                key={s.title}
                type="button"
                onClick={() => setStepIndex(idx)}
                aria-label={`Ir para passo ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx <= stepIndex ? 'bg-[#FC4C02]' : 'bg-line-strong hover:bg-neutral-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Conteúdo do passo */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FC4C02]/15 text-[#FC4C02] border border-[#FC4C02]/25">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="onboarding-tutorial-title"
                className="font-display text-2xl font-extrabold uppercase tracking-tight text-white leading-tight"
              >
                {current.title}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                {current.description}
              </p>
            </div>
          </div>

          <ul className="space-y-2">
            {current.highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 rounded-xl bg-black border border-line px-3.5 py-2.5 text-xs text-neutral-200 leading-relaxed"
              >
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-[#FC4C02] mt-0.5"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl bg-[#FC4C02]/10 border border-[#FC4C02]/25 px-3.5 py-2.5 text-xs text-neutral-200 leading-relaxed">
            {current.tip}
          </div>
        </div>

        {/* Rodapé de navegação */}
        <div className="px-5 py-3.5 border-t border-line bg-black flex items-center justify-between gap-2">
          {isFirst ? (
            <button
              type="button"
              onClick={finishAndClose}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition"
            >
              Pular tutorial
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:text-white transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar</span>
            </button>
          )}

          {isLast ? (
            <button
              type="button"
              onClick={finishAndClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#ffffff] transition"
            >
              <span>Começar a usar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#ffffff] transition"
            >
              <span>Próximo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
