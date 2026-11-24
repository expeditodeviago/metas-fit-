import { useEffect, useState } from 'react';
import {
  Check,
  Cookie,
  FileText,
  Lock,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';

const CONSENT_STORAGE_KEY = 'mm_cookie_consent_v1';
const OPEN_PRIVACY_EVENT = 'mm:open-privacy';

export interface CookieConsentState {
  essential: true;
  preferences: boolean;
  decidedAt: string;
  version: string;
}

export function openPrivacyModal() {
  window.dispatchEvent(new CustomEvent(OPEN_PRIVACY_EVENT));
}

function readStoredConsent(): CookieConsentState | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (typeof parsed.preferences === 'boolean' && parsed.decidedAt) {
      return {
        essential: true,
        preferences: parsed.preferences,
        decidedAt: parsed.decidedAt,
        version: parsed.version || '1.0',
      };
    }
    return null;
  } catch {
    return null;
  }
}

function saveStoredConsent(preferences: boolean): CookieConsentState {
  const next: CookieConsentState = {
    essential: true,
    preferences,
    decidedAt: new Date().toISOString(),
    version: '1.0',
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignora falhas de storage em modo privado restrito
  }
  return next;
}

export function CookieConsentManager() {
  const [consent, setConsent] = useState<CookieConsentState | null>(() =>
    readStoredConsent(),
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'cookies' | 'privacy' | 'terms'>(
    'cookies',
  );
  const [prefToggle, setPrefToggle] = useState<boolean>(
    () => readStoredConsent()?.preferences ?? true,
  );

  useEffect(() => {
    const handleOpen = () => {
      const current = readStoredConsent();
      setPrefToggle(current?.preferences ?? true);
      setModalOpen(true);
    };
    window.addEventListener(OPEN_PRIVACY_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_PRIVACY_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [modalOpen]);

  const handleAcceptAll = () => {
    setConsent(saveStoredConsent(true));
    setPrefToggle(true);
    setModalOpen(false);
  };

  const handleEssentialOnly = () => {
    setConsent(saveStoredConsent(false));
    setPrefToggle(false);
    setModalOpen(false);
  };

  const handleSaveCustom = () => {
    setConsent(saveStoredConsent(prefToggle));
    setModalOpen(false);
  };

  return (
    <>
      {/* ==================== BANNER DE COOKIES (LGPD) ==================== */}
      {!consent && !modalOpen && (
        <aside
          role="region"
          aria-label="Aviso de cookies e privacidade"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:max-w-md z-40 rounded-2xl bg-surface border border-line-strong shadow-2xl p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FC4C02]/15 text-[#FC4C02]">
              <Cookie className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-white">
                Cookies e Privacidade (LGPD)
              </h2>
              <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                Utilizamos cookies e armazenamento local essenciais para manter
                sua sessão segura com o Google, tema e acessibilidade. Não
                usamos rastreadores de anúncios.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="flex-1 min-w-[120px] rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] px-3.5 py-2 text-xs font-bold text-[#ffffff] transition"
            >
              Aceitar todos
            </button>
            <button
              type="button"
              onClick={handleEssentialOnly}
              className="flex-1 min-w-[120px] rounded-xl border border-line-strong bg-black hover:bg-surface-2 px-3.5 py-2 text-xs font-semibold text-neutral-200 transition"
            >
              Apenas essenciais
            </button>
            <button
              type="button"
              onClick={() => {
                setModalTab('cookies');
                setModalOpen(true);
              }}
              className="w-full rounded-xl px-3 py-1.5 text-[11px] font-semibold text-neutral-400 hover:text-white transition inline-flex items-center justify-center gap-1.5"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Configurar preferências e ler Política de Privacidade</span>
            </button>
          </div>
        </aside>
      )}

      {/* ==================== MODAL DE PRIVACIDADE, COOKIES E TERMOS ==================== */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-surface border border-line-strong shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FC4C02]/15 text-[#FC4C02]">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="privacy-modal-title"
                    className="font-display text-xl font-extrabold uppercase tracking-tight text-white"
                  >
                    Privacidade, Cookies e Termos
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Transparência de dados conforme a LGPD (Lei nº 13.709/2018)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar janela de privacidade"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-black text-neutral-300 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-5 pt-3 border-b border-line flex gap-1.5 bg-black/40">
              {(
                [
                  { id: 'cookies', label: 'Cookies', icon: Cookie },
                  { id: 'privacy', label: 'Privacidade (LGPD)', icon: Lock },
                  { id: 'terms', label: 'Termos de Uso', icon: FileText },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = modalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModalTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition ${
                      active
                        ? 'border-[#FC4C02] text-white'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Conteúdo */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-neutral-300 leading-relaxed">
              {modalTab === 'cookies' && (
                <>
                  <p>
                    O <strong>Medidas &amp; Metas</strong> utiliza apenas
                    cookies e armazenamento local necessários para o
                    funcionamento da aplicação. Não compartilhamos dados de
                    navegação com redes de publicidade.
                  </p>

                  {/* Essenciais */}
                  <div className="rounded-xl bg-black border border-line p-3.5 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">
                        Cookies e Armazenamento Essenciais
                      </p>
                      <p className="mt-1 text-neutral-400">
                        Mantêm o login seguro via Google OAuth (Supabase Auth),
                        o código de acesso do Portal do Aluno e o registro da
                        sua escolha de consentimento.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-green-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
                      Sempre ativo
                    </span>
                  </div>

                  {/* Preferências */}
                  <div className="rounded-xl bg-black border border-line p-3.5 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">
                        Preferências de Interface e Acessibilidade
                      </p>
                      <p className="mt-1 text-neutral-400">
                        Lembram sua preferência de tema (Claro/Escuro), tamanho
                        de fonte (<strong>A+</strong>) e modo de{' '}
                        <strong>Alto Contraste</strong> entre sessões.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={prefToggle}
                      aria-label="Ativar preferências de interface e acessibilidade"
                      onClick={() => setPrefToggle((prev) => !prev)}
                      className={`relative shrink-0 h-6 w-11 rounded-full transition ${
                        prefToggle ? 'bg-[#FC4C02]' : 'bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                          prefToggle ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="rounded-xl bg-black border border-line p-3.5">
                    <p className="font-bold text-white mb-2">
                      Chaves armazenadas no navegador (sem rastreadores)
                    </p>
                    <ul className="space-y-1 text-neutral-400">
                      <li>
                        <code className="text-neutral-200">sb-*-auth-token</code>{' '}
                        — Sessão autenticada do treinador (essencial).
                      </li>
                      <li>
                        <code className="text-neutral-200">
                          mm_cookie_consent_v1
                        </code>{' '}
                        — Sua escolha de consentimento LGPD (essencial).
                      </li>
                      <li>
                        <code className="text-neutral-200">
                          medidas_metas_client_code
                        </code>{' '}
                        — Código da aba atual no Portal do Aluno (<code>sessionStorage</code>, apagado ao fechar o navegador).
                      </li>
                      <li>
                        <code className="text-neutral-200">
                          medidas_metas_theme / medidas_metas_a11y / mm_onboarding_*
                        </code>{' '}
                        — Tema claro/escuro, A+, alto contraste e controle para não repetir o tutorial inicial (preferências).
                      </li>
                    </ul>
                  </div>
                </>
              )}

              {modalTab === 'privacy' && (
                <>
                  <div className="space-y-2">
                    <h3 className="font-bold text-white">
                      1. Quais dados são tratados (Minimização — Art. 6º III)
                    </h3>
                    <p className="text-neutral-400">
                      Coletamos apenas os dados estritamente necessários. Para
                      treinadores: nome, e-mail e foto fornecidos pelo Google
                      OAuth para autenticação. Para alunos: nome, data de
                      nascimento, altura, sexo (para o modelo anatômico),
                      medidas físicas, metas e WhatsApp opcional caso o
                      treinador queira enviar o card. No Portal do Aluno, dados
                      de contato e identificadores internos nunca são expostos.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-white">
                      2. Isolamento e Segurança
                    </h3>
                    <p className="text-neutral-400">
                      Todo tráfego utiliza criptografia HTTPS/TLS. No banco de
                      dados PostgreSQL (Supabase), as políticas de{' '}
                      <strong>Row Level Security (RLS)</strong> garantem que
                      cada treinador visualize e gerencie exclusivamente os seus
                      próprios alunos. O Portal do Aluno libera leitura apenas
                      para o código individual ativo, que pode ser pausado ou
                      regenerado a qualquer momento.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-white">
                      3. Seus direitos na LGPD (Art. 18)
                    </h3>
                    <p className="text-neutral-400">
                      O titular ou responsável pelos registros pode consultar,
                      corrigir, pausar o compartilhamento do portal ou excluir
                      permanentemente alunos e avaliações diretamente no painel
                      da aplicação, com remoção imediata em cascata no banco de
                      dados.
                    </p>
                  </div>
                </>
              )}

              {modalTab === 'terms' && (
                <>
                  <div className="space-y-2">
                    <h3 className="font-bold text-white">
                      1. Finalidade da Plataforma
                    </h3>
                    <p className="text-neutral-400">
                      O <strong>Medidas &amp; Metas</strong> é uma ferramenta
                      digital de acompanhamento de avaliação física, metas e
                      evolução corporal voltada para personal trainers e alunos
                      acompanhados.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-white">
                      2. Aviso de Saúde
                    </h3>
                    <p className="text-neutral-400">
                      Os cálculos exibidos (como IMC, variações de perimetria e
                      percentuais de composição corporal) têm caráter
                      exclusivamente informativo e educacional, não substituindo
                      diagnóstico médico, nutricional ou prescrição clínica
                      individualizada.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-white">
                      3. Responsabilidade pelo Uso
                    </h3>
                    <p className="text-neutral-400">
                      O treinador autenticado é responsável pela veracidade das
                      medidas registradas e pelo consentimento de seus alunos ao
                      cadastrar seus dados. Novos usuários recebem 2 perfis de
                      exemplo fictícios (<em>Camila Ferreira</em> e{' '}
                      <em>Rafael Nogueira</em>), que podem ser editados ou
                      excluídos livremente.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-line bg-black flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="rounded-xl border border-line-strong px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition"
              >
                Apenas essenciais
              </button>
              <div className="flex items-center gap-2">
                {modalTab === 'cookies' && (
                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    className="rounded-xl border border-line-strong bg-surface-2 px-3.5 py-2 text-xs font-bold text-white hover:border-[#FC4C02] transition inline-flex items-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5 text-[#FC4C02]" />
                    <span>Salvar escolhas</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] px-4 py-2 text-xs font-bold text-[#ffffff] transition"
                >
                  Aceitar todos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
