import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calculator,
  Calendar,
  Loader2,
  MessageSquareQuote,
  Ruler,
  Save,
} from 'lucide-react';
import type {
  AlunoComResumo,
  Avaliacao,
  AvaliacaoInsert,
  AvaliacaoUpdate,
} from '../types/database';
import {
  calculateIMC,
  formatPtBrNumber,
  getIMCClassification,
  getTodayIsoDate,
  parseDecimalInput,
  parseIntegerInput,
} from '../utils/calculations';

interface AssessmentFormProps {
  student: AlunoComResumo;
  editingAssessment?: Avaliacao | null;
  onBack: () => void;
  onSaveNew: (payload: Omit<AvaliacaoInsert, 'user_id'>) => Promise<Avaliacao>;
  onSaveEdit: (id: string, payload: AvaliacaoUpdate) => Promise<Avaliacao>;
}

interface FormState {
  data_avaliacao: string;
  peso: string;
  gordura_corporal: string;
  musculatura: string;
  calorias_necessarias: string;
  idade_corporal: string;
  gordura_visceral: string;
  biceps_d: string;
  biceps_e: string;
  ombro: string;
  peito: string;
  cintura: string;
  quadril: string;
  coxa_d: string;
  coxa_e: string;
  panturrilha_d: string;
  panturrilha_e: string;
  observacoes: string;
}

type NumericFormKey = Exclude<keyof FormState, 'data_avaliacao' | 'observacoes'>;

function toInputString(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '';
  return formatPtBrNumber(value, decimals, true);
}

function buildInitialState(editing?: Avaliacao | null): FormState {
  if (!editing) {
    return {
      data_avaliacao: getTodayIsoDate(),
      peso: '',
      gordura_corporal: '',
      musculatura: '',
      calorias_necessarias: '',
      idade_corporal: '',
      gordura_visceral: '',
      biceps_d: '',
      biceps_e: '',
      ombro: '',
      peito: '',
      cintura: '',
      quadril: '',
      coxa_d: '',
      coxa_e: '',
      panturrilha_d: '',
      panturrilha_e: '',
      observacoes: '',
    };
  }

  return {
    data_avaliacao: editing.data_avaliacao.slice(0, 10),
    peso: toInputString(editing.peso, 2),
    gordura_corporal: toInputString(editing.gordura_corporal, 1),
    musculatura: toInputString(editing.musculatura, 1),
    calorias_necessarias: toInputString(editing.calorias_necessarias, 0),
    idade_corporal: toInputString(editing.idade_corporal, 0),
    gordura_visceral: toInputString(editing.gordura_visceral, 0),
    biceps_d: toInputString(editing.biceps_d, 1),
    biceps_e: toInputString(editing.biceps_e, 1),
    ombro: toInputString(editing.ombro, 1),
    peito: toInputString(editing.peito, 1),
    cintura: toInputString(editing.cintura, 1),
    quadril: toInputString(editing.quadril, 1),
    coxa_d: toInputString(editing.coxa_d, 1),
    coxa_e: toInputString(editing.coxa_e, 1),
    panturrilha_d: toInputString(editing.panturrilha_d, 1),
    panturrilha_e: toInputString(editing.panturrilha_e, 1),
    observacoes: editing.observacoes ?? '',
  };
}

interface MetricFieldConfig {
  key: NumericFormKey;
  label: string;
  unit: string;
  placeholder: string;
  integer?: boolean;
  required?: boolean;
}

const COMPOSITION_FIELDS: MetricFieldConfig[] = [
  { key: 'peso', label: 'Peso', unit: 'kg', placeholder: '76,0', required: true },
  { key: 'gordura_corporal', label: 'Gordura Corporal', unit: '%', placeholder: '37,3' },
  { key: 'musculatura', label: 'Musculatura', unit: '%', placeholder: '26,9' },
  {
    key: 'calorias_necessarias',
    label: 'Calorias Necessárias',
    unit: 'kcal',
    placeholder: '1523',
    integer: true,
  },
  {
    key: 'idade_corporal',
    label: 'Idade Corporal',
    unit: 'anos',
    placeholder: '43',
    integer: true,
  },
  {
    key: 'gordura_visceral',
    label: 'Gordura Visceral',
    unit: 'nível',
    placeholder: '6',
    integer: true,
  },
];

const PERIMETRY_FIELDS: MetricFieldConfig[] = [
  { key: 'biceps_d', label: 'Bíceps Direito', unit: 'cm', placeholder: '28,0' },
  { key: 'biceps_e', label: 'Bíceps Esquerdo', unit: 'cm', placeholder: '29,0' },
  { key: 'ombro', label: 'Ombro', unit: 'cm', placeholder: '110,0' },
  { key: 'peito', label: 'Peito', unit: 'cm', placeholder: '97,0' },
  { key: 'cintura', label: 'Cintura', unit: 'cm', placeholder: '78,0' },
  { key: 'quadril', label: 'Quadril', unit: 'cm', placeholder: '109,0' },
  { key: 'coxa_d', label: 'Coxa Direita', unit: 'cm', placeholder: '54,0' },
  { key: 'coxa_e', label: 'Coxa Esquerda', unit: 'cm', placeholder: '53,0' },
  { key: 'panturrilha_d', label: 'Panturrilha D', unit: 'cm', placeholder: '39,0' },
  { key: 'panturrilha_e', label: 'Panturrilha E', unit: 'cm', placeholder: '38,0' },
];

export function AssessmentForm({
  student,
  editingAssessment,
  onBack,
  onSaveNew,
  onSaveEdit,
}: AssessmentFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(editingAssessment),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingWarnings, setPendingWarnings] = useState<string[]>([]);
  const [pendingPayload, setPendingPayload] = useState<Omit<
    AvaliacaoInsert,
    'user_id'
  > | null>(null);

  const previousRef = editingAssessment ? null : student.ultimaAvaliacao;

  const livePeso = useMemo(() => parseDecimalInput(form.peso), [form.peso]);
  const liveImc = useMemo(
    () => calculateIMC(livePeso, student.altura_cm),
    [livePeso, student.altura_cm],
  );
  const liveImcInfo = useMemo(() => getIMCClassification(liveImc), [liveImc]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const persistPayload = async (
    payload: Omit<AvaliacaoInsert, 'user_id'>,
  ) => {
    setSaving(true);
    try {
      if (editingAssessment) {
        const { aluno_id: _omit, ...updateFields } = payload;
        await onSaveEdit(editingAssessment.id, updateFields);
      } else {
        await onSaveNew(payload);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao salvar a avaliação.',
      );
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const peso = parseDecimalInput(form.peso);
    if (!peso || peso <= 0 || peso > 400) {
      setError('Informe um peso válido em kg (campo obrigatório).');
      return;
    }

    if (!form.data_avaliacao) {
      setError('Informe a data da avaliação.');
      return;
    }

    const commonPayload: Omit<AvaliacaoInsert, 'user_id'> = {
      aluno_id: student.id,
      data_avaliacao: form.data_avaliacao,
      peso,
      imc: calculateIMC(peso, student.altura_cm),
      gordura_corporal: parseDecimalInput(form.gordura_corporal),
      musculatura: parseDecimalInput(form.musculatura),
      calorias_necessarias: parseIntegerInput(form.calorias_necessarias),
      idade_corporal: parseIntegerInput(form.idade_corporal),
      gordura_visceral: parseIntegerInput(form.gordura_visceral),
      biceps_d: parseDecimalInput(form.biceps_d),
      biceps_e: parseDecimalInput(form.biceps_e),
      ombro: parseDecimalInput(form.ombro),
      peito: parseDecimalInput(form.peito),
      cintura: parseDecimalInput(form.cintura),
      quadril: parseDecimalInput(form.quadril),
      coxa_d: parseDecimalInput(form.coxa_d),
      coxa_e: parseDecimalInput(form.coxa_e),
      panturrilha_d: parseDecimalInput(form.panturrilha_d),
      panturrilha_e: parseDecimalInput(form.panturrilha_e),
      observacoes: form.observacoes.trim() || null,
    };

    // Prevenção de Erros (Heurística #5 de Nielsen)
    const warnings: string[] = [];
    if (peso < 30 || peso > 220) {
      warnings.push(
        `Peso (${formatPtBrNumber(peso, 1)} kg) fora da faixa habitual (30 a 220 kg).`,
      );
    }
    if (previousRef && Math.abs(peso - previousRef.peso) > 12) {
      warnings.push(
        `Variação abrupta de peso vs avaliação anterior (${formatPtBrNumber(previousRef.peso, 1)} kg → ${formatPtBrNumber(peso, 1)} kg).`,
      );
    }
    if (
      commonPayload.gordura_corporal != null &&
      (commonPayload.gordura_corporal < 4 || commonPayload.gordura_corporal > 55)
    ) {
      warnings.push(
        `Gordura corporal (${formatPtBrNumber(commonPayload.gordura_corporal, 1)}%) fora da faixa esperada (4% a 55%).`,
      );
    }
    if (
      commonPayload.gordura_visceral != null &&
      commonPayload.gordura_visceral > 20
    ) {
      warnings.push(
        `Gordura visceral (${commonPayload.gordura_visceral}) acima do limite habitual (20).`,
      );
    }
    if (
      commonPayload.cintura != null &&
      (commonPayload.cintura < 45 || commonPayload.cintura > 160)
    ) {
      warnings.push(
        `Cintura (${formatPtBrNumber(commonPayload.cintura, 1)} cm) fora da faixa habitual (45 a 160 cm).`,
      );
    }

    if (warnings.length > 0) {
      setPendingWarnings(warnings);
      setPendingPayload(commonPayload);
      return;
    }

    await persistPayload(commonPayload);
  };

  const renderField = (field: MetricFieldConfig) => {
    const prevValue = previousRef ? previousRef[field.key] : null;
    const prevHint =
      prevValue !== null && prevValue !== undefined
        ? `Anterior: ${formatPtBrNumber(prevValue, field.integer ? 0 : 1)}`
        : null;

    return (
      <div key={field.key}>
        <div className="flex items-baseline justify-between gap-1 mb-1.5">
          <label
            htmlFor={`field-${field.key}`}
            className="text-xs font-semibold text-neutral-300 truncate"
          >
            {field.label}
            {field.required && <span className="text-[#FC4C02] ml-0.5">*</span>}
          </label>
          <span className="text-[10px] font-bold uppercase text-neutral-500 shrink-0">
            {field.unit}
          </span>
        </div>

        <input
          id={`field-${field.key}`}
          type="text"
          inputMode={field.integer ? 'numeric' : 'decimal'}
          autoComplete="off"
          required={field.required}
          value={form[field.key]}
          onChange={(e) => updateField(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-xl border border-line-strong bg-black px-3.5 py-2.5 text-sm font-bold text-white placeholder:font-normal placeholder:text-neutral-600 focus:border-[#FC4C02] focus:outline-none transition tabular-nums"
        />

        {prevHint && (
          <p className="mt-1 text-[10px] text-neutral-500">{prevHint}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3.5 pb-5 border-b border-line">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-line-strong hover:border-white text-white transition"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FC4C02]">
            {student.nome} • {formatPtBrNumber(student.altura_cm, 0)} cm
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-none mt-0.5">
            {editingAssessment ? 'Editar Avaliação' : 'Nova Avaliação'}
          </h1>
        </div>
      </div>

      <form id="assessment-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Data + IMC ao vivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="sport-card rounded-2xl p-5">
            <label
              htmlFor="data-avaliacao"
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5"
            >
              <Calendar className="h-4 w-4 text-[#FC4C02]" />
              <span>Data da Avaliação</span>
            </label>
            <input
              id="data-avaliacao"
              type="date"
              required
              value={form.data_avaliacao}
              onChange={(e) => updateField('data_avaliacao', e.target.value)}
              className="w-full rounded-xl border border-line-strong bg-black px-4 py-3 text-sm font-bold text-white focus:border-[#FC4C02] focus:outline-none transition"
            />
          </section>

          <section className="sport-card rounded-2xl p-5 border-l-2 border-l-[#FC4C02] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FC4C02]/15 text-[#FC4C02]">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  IMC Automático
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Atualizado ao digitar o peso
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-display text-4xl font-extrabold text-white leading-none tabular-nums">
                {liveImc != null ? formatPtBrNumber(liveImc, 1, false) : '—'}
              </p>
              {liveImc != null && (
                <span
                  className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${liveImcInfo.badgeClass}`}
                >
                  {liveImcInfo.label}
                </span>
              )}
            </div>
          </section>
        </div>

        {/* 2 Blocos principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="sport-card rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-line">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FC4C02] text-[#ffffff]">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-xl font-extrabold uppercase text-white leading-none">
                  1. Composição Corporal
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Barras superiores do card e gráficos de evolução
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {COMPOSITION_FIELDS.map(renderField)}
            </div>
          </section>

          <section className="sport-card rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-line">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black">
                <Ruler className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-xl font-extrabold uppercase text-white leading-none">
                  2. Medidas (cm)
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Perimetria conectada à silhueta do card
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {PERIMETRY_FIELDS.map(renderField)}
            </div>
          </section>
        </div>

        {/* Feedback do Treinador */}
        <section className="sport-card rounded-2xl p-5 sm:p-6 space-y-3">
          <label
            htmlFor="field-observacoes"
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#FC4C02]"
          >
            <MessageSquareQuote className="h-4 w-4" />
            <span>Feedback do Treinador (aparece no Portal do Aluno)</span>
          </label>
          <textarea
            id="field-observacoes"
            rows={3}
            value={form.observacoes}
            onChange={(e) => updateField('observacoes', e.target.value)}
            placeholder="Ex.: Excelente evolução! Redução de 3% de gordura com ganho de massa magra. Próximo foco: definição de abdômen e glúteos."
            className="w-full rounded-xl border border-line-strong bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-[#FC4C02] focus:outline-none transition resize-none"
          />
        </section>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-line-strong bg-black px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:border-white transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] active:scale-[0.99] text-[#ffffff] font-bold text-xs uppercase tracking-wider py-3.5 px-7 transition disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>
              {saving
                ? 'Salvando...'
                : editingAssessment
                  ? 'Atualizar Avaliação'
                  : 'Salvar e Gerar Card'}
            </span>
          </button>
        </div>
      </form>

      {pendingWarnings.length > 0 && pendingPayload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assessment-warning-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-surface border border-line-strong p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FC4C02]/15 text-[#FC4C02]">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id="assessment-warning-title"
                  className="font-display text-xl font-extrabold uppercase text-white"
                >
                  Confirmar Medidas Atípicas
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Detectamos valores fora do padrão clínico esperado. Deseja
                  confirmar antes de salvar?
                </p>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs text-neutral-200">
              {pendingWarnings.map((w) => (
                <li
                  key={w}
                  className="rounded-lg bg-black border border-line px-3 py-2"
                >
                  • {w}
                </li>
              ))}
            </ul>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPendingWarnings([]);
                  setPendingPayload(null);
                }}
                className="rounded-xl border border-line-strong bg-black px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-200 hover:border-white transition"
              >
                Voltar e Corrigir
              </button>
              <button
                type="button"
                onClick={() => {
                  const payload = pendingPayload;
                  setPendingWarnings([]);
                  setPendingPayload(null);
                  void persistPayload(payload);
                }}
                className="rounded-xl bg-[#FC4C02] hover:bg-[#FF5E1A] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#ffffff] transition"
              >
                Confirmar e Salvar mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
