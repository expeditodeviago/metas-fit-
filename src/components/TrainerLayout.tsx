import { useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Flame,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  RefreshCw,
  Sun,
  Users,
} from 'lucide-react';
import {
  AccessibilityControls,
  SkipToContent,
} from '../hooks/useAccessibility';
import { ThemeToggle, useTheme } from '../hooks/useTheme';
import { HelpModal } from './HelpModal';

export type TrainerNavTab = 'overview' | 'students' | 'access';

interface TrainerLayoutProps {
  user: User;
  isDemoMode: boolean;
  activeTab: TrainerNavTab;
  onChangeTab: (tab: TrainerNavTab) => void;
  onOpenNewStudent: () => void;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
  refreshing?: boolean;
  children: ReactNode;
}

const NAV_ITEMS: {
  id: TrainerNavTab;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    shortLabel: 'Início',
    icon: LayoutDashboard,
  },
  {
    id: 'students',
    label: 'Alunos',
    shortLabel: 'Alunos',
    icon: Users,
  },
  {
    id: 'access',
    label: 'Acessos',
    shortLabel: 'Acessos',
    icon: KeyRound,
  },
];

export function TrainerLayout({
  user,
  isDemoMode,
  activeTab,
  onChangeTab,
  onOpenNewStudent,
  onRefresh,
  onSignOut,
  refreshing = false,
  children,
}: TrainerLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);
  const isDarkTheme = theme === 'dark';
  const trainerName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Personal Trainer';
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="min-h-screen bg-black text-white flex">
      <SkipToContent />
      <HelpModal open={helpOpen} context="trainer" onClose={() => setHelpOpen(false)} />
      {/* ==================== SIDEBAR DESKTOP ==================== */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 border-r border-line bg-app sticky top-0 h-screen">
        {/* Marca */}
        <div className="px-6 pt-6 pb-5 flex items-center gap-3 border-b border-line">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FC4C02] text-[#ffffff] shrink-0">
            <Flame className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="font-display text-xl font-extrabold uppercase tracking-wider text-white leading-none">
              MEDIDAS <span className="text-[#FC4C02]">&amp;</span> METAS
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 mt-0.5">
              Coach Console
            </p>
          </div>
        </div>

        {/* Botão primário */}
        <div className="p-4">
          <button
            type="button"
            onClick={onOpenNewStudent}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] active:scale-[0.99] text-[#ffffff] font-bold text-xs uppercase tracking-wider py-3 px-4 transition"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span>Novo Aluno</span>
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`relative w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-surface-2 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-surface'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#FC4C02]" />
                )}
                <Icon
                  className={`h-4 w-4 ${active ? 'text-[#FC4C02]' : 'text-neutral-500'}`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Perfil do treinador */}
        <div className="p-4 border-t border-line space-y-2.5">
          <div className="flex items-center justify-between gap-1.5">
            <AccessibilityControls />
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="flex h-9 items-center justify-center gap-1 rounded-lg bg-surface-2 border border-line-strong px-2.5 text-xs font-bold text-neutral-300 hover:text-[#FC4C02] transition"
              title="Ajuda e Heurísticas"
              aria-label="Abrir ajuda do treinador"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Ajuda</span>
            </button>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between rounded-xl bg-surface border border-line hover:border-line-strong px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition"
          >
            <span className="inline-flex items-center gap-2">
              {isDarkTheme ? (
                <Sun className="h-3.5 w-3.5 text-[#FC4C02]" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-[#FC4C02]" />
              )}
              <span>{isDarkTheme ? 'Tema Claro' : 'Tema Escuro'}</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-neutral-500">
              {isDarkTheme ? 'Off' : 'On'}
            </span>
          </button>

          {isDemoMode && (
            <div className="rounded-lg bg-surface-2 border border-line px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Modo Local (Demo)
            </div>
          )}

          <div className="flex items-center gap-2.5 rounded-xl bg-surface border border-line p-2.5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={trainerName}
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black text-xs font-extrabold">
                {trainerName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">
                {trainerName}
              </p>
              <p className="truncate text-[10px] text-neutral-500">
                Personal Trainer
              </p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-line hover:text-white transition"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ==================== CONTEÚDO PRINCIPAL ==================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden sticky top-0 z-30 border-b border-line bg-black/95 backdrop-blur px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FC4C02] text-[#ffffff]">
                <Flame className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <p className="font-display text-lg font-extrabold uppercase tracking-wider text-white leading-none">
                MEDIDAS <span className="text-[#FC4C02]">&amp;</span> METAS
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <AccessibilityControls compact />
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 border border-line text-neutral-300 hover:text-[#FC4C02]"
                aria-label="Abrir ajuda"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 border border-line text-neutral-300"
                aria-label="Atualizar"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                />
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 border border-line text-neutral-300"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-28 lg:pb-12">
          {children}
        </main>
      </div>

      {/* ==================== BOTTOM NAV MOBILE ==================== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-line bg-app px-3 pt-2 safe-bottom">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 transition ${
                  active ? 'text-[#FC4C02]' : 'text-neutral-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onOpenNewStudent}
            className="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-white"
          >
            <span className="flex h-6 w-10 items-center justify-center rounded-md bg-[#FC4C02]">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300">
              Novo
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
