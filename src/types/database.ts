export type Sexo = 'M' | 'F';
export type SkinTone = 'light' | 'tan' | 'brown' | 'deep';

export type Aluno = {
  id: string;
  user_id: string;
  nome: string;
  data_nascimento: string; // YYYY-MM-DD
  altura_cm: number;
  sexo: Sexo;
  email: string | null;
  telefone: string | null;
  objetivo: string;
  peso_meta: number | null;
  gordura_meta: number | null;
  avatar_pele?: SkinTone;
  acesso_codigo: string;
  acesso_token: string;
  acesso_ativo: boolean;
  ultimo_acesso: string | null;
  created_at: string;
};

export type AlunoInsert = {
  id?: string;
  user_id?: string;
  nome: string;
  data_nascimento: string;
  altura_cm: number;
  sexo: Sexo;
  email?: string | null;
  telefone?: string | null;
  objetivo?: string;
  peso_meta?: number | null;
  gordura_meta?: number | null;
  avatar_pele?: SkinTone;
  acesso_codigo?: string;
  acesso_token?: string;
  acesso_ativo?: boolean;
  ultimo_acesso?: string | null;
  created_at?: string;
};

export type AlunoUpdate = {
  nome?: string;
  data_nascimento?: string;
  altura_cm?: number;
  sexo?: Sexo;
  email?: string | null;
  telefone?: string | null;
  objetivo?: string;
  peso_meta?: number | null;
  gordura_meta?: number | null;
  avatar_pele?: SkinTone;
  acesso_codigo?: string;
  acesso_token?: string;
  acesso_ativo?: boolean;
  ultimo_acesso?: string | null;
};

export type Avaliacao = {
  id: string;
  aluno_id: string;
  user_id: string;
  data_avaliacao: string; // YYYY-MM-DD

  // Composição corporal
  peso: number;
  imc: number | null;
  gordura_corporal: number | null;
  musculatura: number | null;
  calorias_necessarias: number | null;
  idade_corporal: number | null;
  gordura_visceral: number | null;

  // Perimetria (cm)
  biceps_d: number | null;
  biceps_e: number | null;
  ombro: number | null;
  peito: number | null;
  cintura: number | null;
  quadril: number | null;
  coxa_d: number | null;
  coxa_e: number | null;
  panturrilha_d: number | null;
  panturrilha_e: number | null;

  observacoes: string | null;
  created_at: string;
};

export type AvaliacaoInsert = {
  id?: string;
  aluno_id: string;
  user_id?: string;
  data_avaliacao?: string;

  peso: number;
  imc?: number | null;
  gordura_corporal?: number | null;
  musculatura?: number | null;
  calorias_necessarias?: number | null;
  idade_corporal?: number | null;
  gordura_visceral?: number | null;

  biceps_d?: number | null;
  biceps_e?: number | null;
  ombro?: number | null;
  peito?: number | null;
  cintura?: number | null;
  quadril?: number | null;
  coxa_d?: number | null;
  coxa_e?: number | null;
  panturrilha_d?: number | null;
  panturrilha_e?: number | null;

  observacoes?: string | null;
  created_at?: string;
};

export type AvaliacaoUpdate = {
  data_avaliacao?: string;
  peso?: number;
  imc?: number | null;
  gordura_corporal?: number | null;
  musculatura?: number | null;
  calorias_necessarias?: number | null;
  idade_corporal?: number | null;
  gordura_visceral?: number | null;

  biceps_d?: number | null;
  biceps_e?: number | null;
  ombro?: number | null;
  peito?: number | null;
  cintura?: number | null;
  quadril?: number | null;
  coxa_d?: number | null;
  coxa_e?: number | null;
  panturrilha_d?: number | null;
  panturrilha_e?: number | null;

  observacoes?: string | null;
};

export type AlunoComResumo = Aluno & {
  avaliacoes: Avaliacao[];
  ultimaAvaliacao: Avaliacao | null;
  primeiraAvaliacao: Avaliacao | null;
  totalAvaliacoes: number;
};

export type ClientPortalPayload = {
  aluno: Aluno;
  avaliacoes: Avaliacao[];
};

export type Database = {
  public: {
    Tables: {
      alunos: {
        Row: Aluno;
        Insert: AlunoInsert;
        Update: AlunoUpdate;
        Relationships: [];
      };
      avaliacoes: {
        Row: Avaliacao;
        Insert: AvaliacaoInsert;
        Update: AvaliacaoUpdate;
        Relationships: [
          {
            foreignKeyName: 'avaliacoes_aluno_id_fkey';
            columns: ['aluno_id'];
            isOneToOne: false;
            referencedRelation: 'alunos';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_client_portal: {
        Args: { p_identifier: string };
        Returns: ClientPortalPayload | null;
      };
      check_trainer_status: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      activate_trainer_key: {
        Args: { p_access_key: string };
        Returns: { ok: boolean; error?: string };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
