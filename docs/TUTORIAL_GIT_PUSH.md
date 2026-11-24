# Tutorial Prático de `git push` — Projeto Medidas & Metas

Este guia explica passo a passo como enviar alterações do seu computador para o **GitHub** e atualizar automaticamente o site em produção na **Vercel**.

- **Pasta do projeto:** `c:\Users\OPERACIONAL\Desktop\italo`
- **Repositório GitHub:** `https://github.com/expeditodeviago/metas-fit-`
- **Branch principal:** `main`
- **Site em produção (deploy automático):** `https://metas-fit.vercel.app`

---

## 1. Fluxo do dia a dia (4 comandos)

Abra o terminal (**PowerShell** ou **Terminal do VS Code**) na pasta do projeto e execute um comando por vez:

### Passo 1 — Conferir quais arquivos foram alterados
```powershell
git status
```
Esse comando mostra:
- Em **vermelho**: arquivos modificados ou novos que ainda não foram selecionados.
- Em **verde**: arquivos prontos para entrar no commit.

> **Atenção:** verifique sempre se o arquivo `.env` **não** aparece na lista. Ele já está bloqueado no `.gitignore` para proteger suas chaves.

### Passo 2 — Adicionar os arquivos que deseja enviar
Para selecionar **todas** as alterações do projeto:
```powershell
git add .
```
Ou, se quiser enviar apenas um arquivo específico:
```powershell
git add src/components/LoginScreen.tsx
```

### Passo 3 — Criar o commit (salvar um ponto na história)
Escreva uma mensagem curta explicando o que mudou:
```powershell
git commit -m "feat: descreva aqui sua alteracao"
```
Bons exemplos de mensagem:
- `git commit -m "fix: ajusta texto do card de evolucao"`
- `git commit -m "feat: adiciona filtro por objetivo no painel"`
- `git commit -m "docs: atualiza relatorio IHC"`

### Passo 4 — Enviar para o GitHub (`git push`)
```powershell
git push origin main
```
Pronto! Assim que o `git push` terminar:
1. O código atualizado aparece no GitHub (`expeditodeviago/metas-fit-`).
2. A **Vercel detecta o push automaticamente**, roda `npm run build` e publica a nova versão em **https://metas-fit.vercel.app** em cerca de 20–40 segundos.

---

## 2. Antes de subir: teste o build local (recomendado)

Para evitar quebrar o site em produção por um erro de TypeScript, teste o build antes do `git push`:

```powershell
npm.cmd run build
```
Se aparecer `built in ...` sem erros em vermelho, está seguro para fazer `git add .`, `git commit` e `git push origin main`.

---

## 3. Problemas mais comuns e como resolver

### Erro: `rejected — non-fast-forward` / `Updates were rejected`
Acontece quando o GitHub tem algum commit mais novo do que o seu computador. Resolva puxando as mudanças primeiro e depois enviando:
```powershell
git pull --rebase origin main
git push origin main
```

### Mensagem: `nothing to commit, working tree clean`
Significa que você não salvou nenhuma alteração nova (ou já enviou tudo). Confira se salvou os arquivos editados (`Ctrl + S`).

### Erro de autenticação no GitHub
Na primeira vez em um PC novo, o Windows abre uma janela do **Git Credential Manager** pedindo login no GitHub. Basta entrar com sua conta `expeditodeviago` e autorizar.

### Quero desfazer um `git add` antes do commit
```powershell
git reset
```
*(Não apaga suas edições nos arquivos — apenas tira da área de staging).*

### Quero ver os últimos commits enviados
```powershell
git log --oneline -n 10
```

---

## 4. Resumo rápido para copiar

```powershell
git status
git add .
git commit -m "atualiza projeto medidas e metas"
git push origin main
```
