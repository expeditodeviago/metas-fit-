import type { User } from '@supabase/supabase-js';
import type { Aluno, Avaliacao } from '../types/database';

export const DEMO_STORAGE_KEY = 'medidas_metas_studio_v2';

export const DEMO_USER: User = {
  id: 'demo-personal-0001',
  app_metadata: { provider: 'google' },
  user_metadata: {
    full_name: 'Ítalo Personal',
    email: 'personal@medidasemetas.app',
  },
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
  email: 'personal@medidasemetas.app',
} as User;

export const DEMO_ALUNOS: Aluno[] = [
  {
    id: 'demo-aluno-divina',
    user_id: DEMO_USER.id,
    nome: 'Divina Eterna',
    data_nascimento: '1983-05-12',
    altura_cm: 170,
    sexo: 'F',
    email: 'divina.eterna@email.com',
    telefone: '5511998765432',
    objetivo: 'Recomposição Corporal',
    peso_meta: 71,
    gordura_meta: 32,
    avatar_pele: 'tan',
    acesso_codigo: 'DIVINA-2026',
    acesso_token: '8c1b8a10-2a4c-4c3f-a9a1-divina202601',
    acesso_ativo: true,
    ultimo_acesso: '2026-11-22T18:30:00.000Z',
    created_at: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'demo-aluno-lucas',
    user_id: DEMO_USER.id,
    nome: 'Lucas Ferreira',
    data_nascimento: '1994-08-20',
    altura_cm: 178,
    sexo: 'M',
    email: 'lucas.ferreira@email.com',
    telefone: '5511991234567',
    objetivo: 'Definição & Massa Magra',
    peso_meta: 79,
    gordura_meta: 14,
    avatar_pele: 'brown',
    acesso_codigo: 'LUCAS-2026',
    acesso_token: '9d2c9b20-3b5d-4d4e-b8b2-lucas202602',
    acesso_ativo: true,
    ultimo_acesso: '2026-11-23T09:15:00.000Z',
    created_at: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'demo-aluno-camila',
    user_id: DEMO_USER.id,
    nome: 'Camila Duarte',
    data_nascimento: '1997-02-14',
    altura_cm: 164,
    sexo: 'F',
    email: 'camila.duarte@email.com',
    telefone: '5511987651234',
    objetivo: 'Hipertrofia',
    peso_meta: 62,
    gordura_meta: 21,
    avatar_pele: 'light',
    acesso_codigo: 'CAMILA-2026',
    acesso_token: '7a3d7c30-4c6e-4e5f-c7c3-camila202603',
    acesso_ativo: true,
    ultimo_acesso: '2026-11-18T14:20:00.000Z',
    created_at: '2026-09-01T10:00:00.000Z',
  },
];

export const DEMO_AVALIACOES: Avaliacao[] = [
  // Divina Eterna (dados fiéis ao card de referência)
  {
    id: 'demo-av-divina-1',
    aluno_id: 'demo-aluno-divina',
    user_id: DEMO_USER.id,
    data_avaliacao: '2026-08-15',
    peso: 77,
    imc: 26.6,
    gordura_corporal: 40.3,
    musculatura: 25.6,
    calorias_necessarias: 1506,
    idade_corporal: 48,
    gordura_visceral: 7,
    biceps_d: 28,
    biceps_e: 28,
    ombro: 109,
    peito: 108,
    cintura: 86,
    quadril: 106,
    coxa_d: 49,
    coxa_e: 51,
    panturrilha_d: 38,
    panturrilha_e: 38,
    observacoes:
      'Avaliação inicial concluída. Foco nos primeiros 60 dias em adaptação neuromuscular, constância nos treinos de força e redução gradual de gordura visceral.',
    created_at: '2026-08-15T10:00:00.000Z',
  },
  {
    id: 'demo-av-divina-2',
    aluno_id: 'demo-aluno-divina',
    user_id: DEMO_USER.id,
    data_avaliacao: '2026-10-01',
    peso: 76.5,
    imc: 26.1,
    gordura_corporal: 38.6,
    musculatura: 26.2,
    calorias_necessarias: 1515,
    idade_corporal: 45,
    gordura_visceral: 6,
    biceps_d: 27.5,
    biceps_e: 27,
    ombro: 105,
    peito: 95,
    cintura: 78,
    quadril: 105.5,
    coxa_d: 50,
    coxa_e: 52,
    panturrilha_d: 39,
    panturrilha_e: 38,
    observacoes:
      'Excelente resposta! Redução expressiva de 8 cm na cintura e queda de 3 anos na idade corporal. Vamos progredir cargas de membros inferiores.',
    created_at: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'demo-av-divina-3',
    aluno_id: 'demo-aluno-divina',
    user_id: DEMO_USER.id,
    data_avaliacao: '2026-11-20',
    peso: 76,
    imc: 25.2,
    gordura_corporal: 37.3,
    musculatura: 26.9,
    calorias_necessarias: 1523,
    idade_corporal: 43,
    gordura_visceral: 6,
    biceps_d: 28,
    biceps_e: 29,
    ombro: 110,
    peito: 97,
    cintura: 78,
    quadril: 109,
    coxa_d: 54,
    coxa_e: 53,
    panturrilha_d: 39,
    panturrilha_e: 38,
    observacoes:
      'Recomposição exemplar: -3,0% de gordura corporal com +1,3% de musculatura e idade corporal igual à idade real (43). Próximo ciclo focado em definição de abdômen e glúteos.',
    created_at: '2026-11-20T10:00:00.000Z',
  },

  // Lucas Ferreira (masculino)
  {
    id: 'demo-av-lucas-1',
    aluno_id: 'demo-aluno-lucas',
    user_id: DEMO_USER.id,
    data_avaliacao: '2026-08-20',
    peso: 86.5,
    imc: 27.3,
    gordura_corporal: 22.8,
    musculatura: 37.4,
    calorias_necessarias: 1940,
    idade_corporal: 36,
    gordura_visceral: 9,
    biceps_d: 35.5,
    biceps_e: 35,
    ombro: 118,
    peito: 102,
    cintura: 91,
    quadril: 101,
    coxa_d: 57,
    coxa_e: 56.5,
    panturrilha_d: 38,
    panturrilha_e: 38,
    observacoes:
      'Início do protocolo de definição mantendo força nos compostos. Meta de déficit moderado e 4 treinos semanais.',
    created_at: '2026-08-20T10:00:00.000Z',
  },
  {
    id: 'demo-av-lucas-2',
    aluno_id: 'demo-aluno-lucas',
    user_id: DEMO_USER.id,
    data_avaliacao: '2026-10-05',
    peso: 83.2,
    imc: 26.3,
    gordura_corporal: 19.6,
    musculatura: 39.1,
    calorias_necessarias: 1985,
    idade_corporal: 33,
    gordura_visceral: 7,
    biceps_d: 36.5,
    biceps_e: 36,
    ombro: 120,
    peito: 104,
    cintura: 86,
    quadril: 99,
    coxa_d: 58.5,
    coxa_e: 58,
    panturrilha_d: 38.5,
    panturrilha_e: 38.5,
    observacoes:
      'Ótima aderência! Perdeu 5 cm de cintura ganhando volume em braços e dorsais.',
    created_at: '2026-10-05T10:00:00.000Z',
  },
  {
    id: 'demo-av-lucas-3',
    aluno_id: 'demo-aluno-lucas',
    user_id: DEMO_USER.id,
    data_avaliacao: '2026-11-22',
    peso: 81.4,
    imc: 25.7,
    gordura_corporal: 17.4,
    musculatura: 40.8,
    calorias_necessarias: 2020,
    idade_corporal: 30,
    gordura_visceral: 6,
    biceps_d: 37.5,
    biceps_e: 37,
    ombro: 122,
    peito: 106,
    cintura: 83,
    quadril: 98,
    coxa_d: 60,
    coxa_e: 59.5,
    panturrilha_d: 39,
    panturrilha_e: 39,
    observacoes:
      'Evolução absurda! -5,4% de gordura, +3,4% de musculatura e visceral em 6. Mantendo o ritmo, bate os 14% antes do fim do trimestre.',
    created_at: '2026-11-22T10:00:00.000Z',
  },

  // Camila Duarte (hipertrofia)
  {
    id: 'demo-av-camila-1',
    aluno_id: 'demo-aluno-camila',
    user_id: DEMO_USER.id,
    data_avaliacao: '2026-09-10',
    peso: 57.2,
    imc: 21.3,
    gordura_corporal: 23.4,
    musculatura: 30.1,
    calorias_necessarias: 1410,
    idade_corporal: 28,
    gordura_visceral: 3,
    biceps_d: 25,
    biceps_e: 24.8,
    ombro: 96,
    peito: 85,
    cintura: 67,
    quadril: 95,
    coxa_d: 52,
    coxa_e: 52,
    panturrilha_d: 34.5,
    panturrilha_e: 34.5,
    observacoes:
      'Início de superávit leve com foco em quadríceps, glúteo e estabilidade escapular.',
    created_at: '2026-09-10T10:00:00.000Z',
  },
  {
    id: 'demo-av-camila-2',
    aluno_id: 'demo-aluno-camila',
    user_id: DEMO_USER.id,
    data_avaliacao: '2026-11-15',
    peso: 59.4,
    imc: 22.1,
    gordura_corporal: 22.5,
    musculatura: 32.0,
    calorias_necessarias: 1465,
    idade_corporal: 25,
    gordura_visceral: 3,
    biceps_d: 26.2,
    biceps_e: 26,
    ombro: 98.5,
    peito: 86.5,
    cintura: 66.5,
    quadril: 98.5,
    coxa_d: 55,
    coxa_e: 54.8,
    panturrilha_d: 35.5,
    panturrilha_e: 35.5,
    observacoes:
      'Ganho limpo de +2,2 kg reduzindo % de gordura! +3 cm em coxas e +3,5 cm de quadril.',
    created_at: '2026-11-15T10:00:00.000Z',
  },
];

export type DemoStoreData = {
  alunos: Aluno[];
  avaliacoes: Avaliacao[];
};

export function loadDemoStore(): DemoStoreData {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) {
      return { alunos: DEMO_ALUNOS, avaliacoes: DEMO_AVALIACOES };
    }
    const parsed = JSON.parse(raw) as Partial<DemoStoreData>;
    if (Array.isArray(parsed.alunos) && Array.isArray(parsed.avaliacoes)) {
      return { alunos: parsed.alunos, avaliacoes: parsed.avaliacoes };
    }
  } catch {
    // Fallback para dados iniciais
  }
  return { alunos: DEMO_ALUNOS, avaliacoes: DEMO_AVALIACOES };
}

export function saveDemoStore(data: DemoStoreData): void {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('medidas-demo-sync'));
  } catch {
    // Ignora quota errors
  }
}

export function resetDemoStore(): DemoStoreData {
  const initial: DemoStoreData = {
    alunos: DEMO_ALUNOS,
    avaliacoes: DEMO_AVALIACOES,
  };
  saveDemoStore(initial);
  return initial;
}
