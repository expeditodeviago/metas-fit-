import { useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import type { AlunoComResumo } from '../types/database';
import {
  buildClientPortalUrl,
  buildWhatsAppInviteUrl,
  formatDateTimePtBr,
  getInitials,
} from '../utils/calculations';

interface AccessManagerProps {
  students: AlunoComResumo[];
  onToggleAccess: (studentId: string, active: boolean) => Promise<void>;
  onRegenerateAccess: (studentId: string, studentName: string) => Promise<string>;
  onPreviewAsClient: (studentId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export function AccessManager({
  students,
  onToggleAccess,
  onRegenerateAccess,
  onPreviewAsClient,
  onSelectStudent,
}: AccessManagerProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const activeCount = students.filter((s) => s.acesso_ativo).length;
  const pausedCount = students.length - activeCount;

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Ignora erro
    }
  };

  const handleToggle = async (student: AlunoComResumo) => {
    setBusyId(student.id);
    try {
      await onToggleAccess(student.id, !student.acesso_ativo);
    } finally {
      setBusyId(null);
    }
  };

  const handleRegenerate = async (student: AlunoComResumo) => {
    setBusyId(student.id);
    try {
      await onRegenerateAccess(student.id, student.nome);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-line">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FC4C02]">
            Controle de Portais
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-white leading-none mt-1">
            Acessos dos Clientes
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-green-500/15 px-3 py-1.5 text-xs font-bold text-green-400">
            {activeCount} ativos
          </span>
          <span className="rounded-lg bg-surface-2 border border-line-strong px-3 py-1.5 text-xs font-bold text-neutral-400">
            {pausedCount} pausados
          </span>
        </div>
      </div>

      {/* Status de Segurança */}
      <div className="sport-card rounded-2xl p-4 sm:p-5 border-l-2 border-l-[#FC4C02] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FC4C02]/15 text-[#FC4C02]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            <strong className="text-white">Segurança Máxima Ativa:</strong> painel
            protegido por <strong>Google OAuth + Chave Bcrypt + RLS</strong>. Cada
            aluno acessa apenas a própria evolução via código/link individual (somente
            leitura).
          </div>
        </div>
      </div>

      {/* Lista */}
      {students.length === 0 ? (
        <div className="sport-card rounded-2xl p-12 text-center text-sm text-neutral-400">
          Cadastre seus alunos para liberar códigos e links de acesso.
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => {
            const portalUrl = buildClientPortalUrl(student.acesso_codigo);
            const whatsappUrl = buildWhatsAppInviteUrl(
              student.nome,
              student.acesso_codigo,
              student.telefone,
            );
            const isBusy = busyId === student.id;

            return (
              <div
                key={student.id}
                className="sport-card-hover rounded-2xl p-4 sm:p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Identidade */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-lg font-extrabold ${
                        student.acesso_ativo
                          ? 'bg-white text-black'
                          : 'bg-surface-2 text-neutral-500'
                      }`}
                    >
                      {getInitials(student.nome)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onSelectStudent(student.id)}
                          className="text-base font-bold text-white hover:text-[#FC4C02] transition truncate"
                        >
                          {student.nome}
                        </button>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            student.acesso_ativo
                              ? 'bg-green-500/15 text-green-400'
                              : 'bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          {student.acesso_ativo ? (
                            <ShieldCheck className="h-3 w-3" />
                          ) : (
                            <ShieldOff className="h-3 w-3" />
                          )}
                          {student.acesso_ativo ? 'Ativo' : 'Pausado'}
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center gap-3 flex-wrap text-xs">
                        <span className="font-mono font-bold text-[#FC4C02] bg-black border border-line-strong rounded-md px-2 py-0.5">
                          {student.acesso_codigo}
                        </span>
                        <span className="inline-flex items-center gap-1 text-neutral-500">
                          <Clock className="h-3.5 w-3.5" />
                          Último acesso: {formatDateTimePtBr(student.ultimo_acesso)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => copyText(`link-${student.id}`, portalUrl)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-black border border-line-strong hover:border-white px-3 py-2 text-xs font-semibold text-neutral-200 transition"
                    >
                      {copiedKey === `link-${student.id}` ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-400" />
                          <span className="text-green-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#FC4C02]" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] hover:bg-[#1EBE5B] px-3 py-2 text-xs font-bold text-[#000000] transition"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                      <ExternalLink className="h-3 w-3 opacity-75" />
                    </a>

                    <button
                      type="button"
                      onClick={() => onPreviewAsClient(student.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#FC4C02] hover:bg-[#FF5E1A] px-3 py-2 text-xs font-bold text-[#ffffff] transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Ver Portal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRegenerate(student)}
                      disabled={isBusy}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-black border border-line-strong hover:border-white text-neutral-400 hover:text-white transition disabled:opacity-50"
                      title="Gerar novo código"
                      aria-label="Gerar novo código"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${isBusy ? 'animate-spin' : ''}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggle(student)}
                      disabled={isBusy}
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                        student.acesso_ativo
                          ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400'
                          : 'bg-green-500/15 hover:bg-green-500/25 text-green-400'
                      }`}
                    >
                      {student.acesso_ativo ? 'Pausar' : 'Reativar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
