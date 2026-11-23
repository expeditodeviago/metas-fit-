# Medidas & Metas

Web App **mobile-first** para personal trainers cadastrarem alunos, registrarem avaliações físicas periódicas e gerarem automaticamente um **card visual (PNG de alta resolução)** de evolução pronto para envio no WhatsApp.

## Stack Tecnológica

- **Front-end:** React 18 + TypeScript + Vite + Tailwind CSS + Lucide React
- **Back-end / Banco / Auth:** Supabase (PostgreSQL + RLS + Google OAuth)
- **Exportação de Imagem:** `html-to-image` (PNG 3x + Web Share API com fallback para download)

## Passo a passo de configuração

### 1. Configurar o Banco de Dados no Supabase
1. Crie um projeto no [Supabase](https://supabase.com/).
2. Abra o **SQL Editor**, cole todo o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e clique em **Run**.
3. Isso criará as tabelas `alunos` e `avaliacoes`, índices, triggers de cálculo automático de IMC e políticas de **Row Level Security (RLS)**.

### 2. Ativar Login com Google OAuth
1. No painel do Supabase, acesse **Authentication → Providers → Google** e habilite o provedor com seu *Client ID* e *Client Secret* do Google Cloud Console.
2. Em **Authentication → URL Configuration**, adicione sua URL local (`http://localhost:5173`) e sua URL de produção em **Redirect URLs**.

### 3. Configurar variáveis de ambiente e rodar localmente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env
npm install
npm run dev
```

## Estrutura do Projeto

- `supabase/schema.sql` — Script SQL completo (tabelas, índices, triggers de IMC e políticas RLS)
- `src/lib/supabase.ts` — Cliente Supabase tipado
- `src/types/database.ts` — Tipos TypeScript alinhados ao schema PostgreSQL
- `src/utils/calculations.ts` — Cálculo automático de idade, IMC, comparação Inicial/Anterior/Atual e badges de progresso
- `src/utils/exportCard.ts` — Exportação PNG em alta resolução (`pixelRatio: 3`) e compartilhamento via Web Share API
- `src/hooks/useAuth.ts` — Autenticação Google OAuth com persistência de sessão
- `src/hooks/useStudents.ts` — CRUD completo de alunos e avaliações
- `src/components/LoginScreen.tsx` — Tela de login exclusiva com Google
- `src/components/StudentDashboard.tsx` + `StudentModal.tsx` — Dashboard com busca e modal rápido de cadastro
- `src/components/StudentProfile.tsx` — Perfil do aluno com histórico de avaliações
- `src/components/AssessmentForm.tsx` — Formulário mobile-first dividido em Composição Corporal e Medidas (cm)
- `src/components/EvolutionCard.tsx` + `BodySilhouette.tsx` + `CardViewer.tsx` — Visualizador do card (silhueta masculina/feminina, proporção 4:5 e 9:16, download e envio WhatsApp)
