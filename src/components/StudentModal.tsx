import { useEffect, useState } from 'react';
import { Loader2, UserPlus, X } from 'lucide-react';
import type { Aluno, AlunoInsert, Sexo } from '../types/database';
import {
  formatPtBrNumber,
  generateAccessCode,
  getTodayIsoDate,
  parseDecimalInput,
} from '../utils/calculations';

interface StudentModalProps {
  isOpen: boolean;
  initialStudent?: Aluno | null;
  onClose: () => void;
  onSubmit: (data: Omit<AlunoInsert, 'user_id'>) => Promise<void>;
}

const OBJETIVO_PRESETS = [
  'Recomposição Corporal',
  'Emagrecimento',
  'Hipertrofia',
  'Definição & Massa Magra',
  'Condicionamento Físico',
];

export function StudentModal({
  isOpen,
  initialStudent,
  onClose,
  onSubmit,
}: StudentModalProps) {
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [alturaCm, setAlturaCm] = useState('');
  const [sexo, setSexo] = useState<Sexo>('F');
  const [objetivo, setObjetivo] = useState('Recomposição Corporal');
  const [pesoMeta, setPesoMeta] = useState('');
  const [gorduraMeta, setGorduraMeta] = useState('');
  const [telefone, setTelefone] = useState('');
  const [acessoCodigo, setAcessoCodigo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (initialStudent) {
      setNome(initialStudent.nome);
      setDataNascimento(initialStudent.data_nascimento.slice(0, 10));
      setAlturaCm(formatPtBrNumber(initialStudent.altura_cm, 1, true));
      setSexo(initialStudent.sexo);
      setObjetivo(initialStudent.objetivo || 'Recomposição Corporal');
      setPesoMeta(
        initialStudent.peso_meta != null
          ? formatPtBrNumber(initialStudent.peso_meta, 1, true)
          : '',
      );
      setGorduraMeta(
        initialStudent.gordura_meta != null
          ? formatPtBrNumber(initialStudent.gordura_meta, 1, true)
          : '',
      );
      setTelefone(initialStudent.telefone ?? '');
      setAcessoCodigo(initialStudent.acesso_codigo);
    } else {
      setNome('');
      setDataNascimento('');
      setAlturaCm('');
      setSexo('F');
      setObjetivo('Recomposição Corporal');
      setPesoMeta('');
      setGorduraMeta('');
      setTelefone('');
      setAcessoCodigo('');
    }
    setError(null);
  }, [isOpen, initialStudent]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = nome.trim();
    const parsedHeight = parseDecimalInput(alturaCm);

    if (!trimmedName) {
      setError('Informe o nome completo do aluno.');
      return;
    }
    if (!dataNascimento) {
      setError('Informe a data de nascimento.');
      return;
    }
    if (!parsedHeight || parsedHeight < 50 || parsedHeight > 260) {
      setError('Informe uma altura válida em centímetros (ex.: 168).');
      return;
    }

    const code =
      acessoCodigo.trim().toUpperCase() || generateAccessCode(trimmedName);

    setSaving(true);
    try {
      await onSubmit({
        nome: trimmedName,
        data_nascimento: dataNascimento,
        altura_cm: parsedHeight,
        sexo,
        objetivo: objetivo.trim() || 'Recomposição Corporal',
        peso_meta: parseDecimalInput(pesoMeta),
        gordura_meta: parseDecimalInput(gorduraMeta),
        telefone: telefone.trim() || null,
        email: null,
        acesso_codigo: code,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao salvar cadastro do aluno.',
      );
    } finally {
      setSaving(false);
    }
  };

  const isEditing = Boolean(initialStudent);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#000000]/70 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-modal-title"
    >
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-surface rounded-t-2xl sm:rounded-2xl border border-line-strong">
        <div className="sticky top-0 z-10 bg-surface flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FC4C02] text-[#ffffff]">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="student-modal-title"
                className="font-display text-2xl font-extrabold uppercase text-white leading-none"
              >
                {isEditing ? 'Editar Aluno' : 'Novo Aluno'}
              </h2>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Código de acesso gerado automaticamente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-black border border-line-strong text-neutral-400 hover:text-white transition"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-6 py-5 space-y-5 safe-bottom"
        >
          <div>
            <label
              htmlFor="aluno-nome"
              className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5"
            >
              Nome completo *
            </label>
            <input
              id="aluno-nome"
              type="text"
              required
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Nome completo do aluno"
              className="w-full rounded-xl border border-line-strong bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-[#FC4C02] focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="aluno-nascimento"
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5"
              >
                Nascimento *
              </label>
              <input
                id="aluno-nascimento"
                type="date"
                required
                max={getTodayIsoDate()}
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full rounded-xl border border-line-strong bg-black px-3.5 py-3 text-sm text-white focus:border-[#FC4C02] focus:outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="aluno-altura"
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5"
              >
                Altura (cm) *
              </label>
              <input
                id="aluno-altura"
                type="text"
                inputMode="decimal"
                required
                value={alturaCm}
                onChange={(e) => setAlturaCm(e.target.value)}
                placeholder="Ex.: 170"
                className="w-full rounded-xl border border-line-strong bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-[#FC4C02] focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Sexo (define a silhueta do card)
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSexo('F')}
                className={`rounded-xl py-3 px-4 text-xs font-bold uppercase tracking-wider border transition ${sexo === 'F'
                  ? 'border-[#FC4C02] bg-[#FC4C02] text-[#ffffff]'
                  : 'border-line-strong bg-black text-neutral-400 hover:text-white'
                  }`}
              >
                Feminino
              </button>
              <button
                type="button"
                onClick={() => setSexo('M')}
                className={`rounded-xl py-3 px-4 text-xs font-bold uppercase tracking-wider border transition ${sexo === 'M'
                  ? 'border-[#FC4C02] bg-[#FC4C02] text-[#ffffff]'
                  : 'border-line-strong bg-black text-neutral-400 hover:text-white'
                  }`}
              >
                Masculino
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-line space-y-3">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-[#FC4C02]">
              Objetivo &amp; Metas
            </span>

            <div className="flex flex-wrap gap-1.5">
              {OBJETIVO_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setObjetivo(preset)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition ${objetivo === preset
                    ? 'bg-white text-black border-white'
                    : 'bg-black border-line-strong text-neutral-400 hover:text-white'
                    }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="aluno-peso-meta"
                  className="block text-[11px] font-medium text-neutral-400 mb-1"
                >
                  Peso Meta (kg)
                </label>
                <input
                  id="aluno-peso-meta"
                  type="text"
                  inputMode="decimal"
                  value={pesoMeta}
                  onChange={(e) => setPesoMeta(e.target.value)}
                  placeholder="Ex.: 70,0"
                  className="w-full rounded-xl border border-line-strong bg-black px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#FC4C02] focus:outline-none transition"
                />
              </div>

              <div>
                <label
                  htmlFor="aluno-gordura-meta"
                  className="block text-[11px] font-medium text-neutral-400 mb-1"
                >
                  Gordura Meta (%)
                </label>
                <input
                  id="aluno-gordura-meta"
                  type="text"
                  inputMode="decimal"
                  value={gorduraMeta}
                  onChange={(e) => setGorduraMeta(e.target.value)}
                  placeholder="Ex.: 28,0"
                  className="w-full rounded-xl border border-line-strong bg-black px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#FC4C02] focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-line space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="aluno-whatsapp"
                  className="block text-[11px] font-medium text-neutral-400 mb-1"
                >
                  WhatsApp (opcional — envio do card)
                </label>
                <input
                  id="aluno-whatsapp"
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Ex.: 5511999999999"
                  className="w-full rounded-xl border border-line-strong bg-black px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#FC4C02] focus:outline-none transition"
                />
              </div>

              <div>
                <label
                  htmlFor="aluno-codigo"
                  className="block text-[11px] font-medium text-neutral-400 mb-1"
                >
                  Código de Acesso (opcional)
                </label>
                <input
                  id="aluno-codigo"
                  type="text"
                  value={acessoCodigo}
                  onChange={(e) => setAcessoCodigo(e.target.value.toUpperCase())}
                  placeholder="Gerado automático"
                  className="w-full rounded-xl border border-line-strong bg-black px-3.5 py-2.5 text-sm font-mono font-bold text-[#FC4C02] placeholder:font-sans placeholder:font-normal placeholder:text-neutral-600 focus:border-[#FC4C02] focus:outline-none transition uppercase"
                />
              </div>
            </div>
            <p className="text-[11px] text-neutral-500">
              Minimização de dados (LGPD): coletamos apenas os dados físicos essenciais para a avaliação e o acompanhamento do aluno.
            </p>
          </div>

          {error && (
            <p className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-xs text-red-300">
              {error}
            </p>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-line-strong bg-black py-3.5 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:border-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] text-[#ffffff] py-3.5 text-xs font-bold uppercase tracking-wider transition disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Aluno'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
