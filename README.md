# 🎾 BT Delas · Super 8

Sistema de inscrições do torneio Super 8 de Beach Tennis.

- **Página pública** (link do WhatsApp): mostra contagem regressiva até 10/11 12h, depois abre inscrições.
- **Painel da organização** (`/painel`): login, pagamentos, sorteio dos grupos, ranking do Super 8.

**Stack:** Next.js 14 + Supabase + Vercel.

---

## 📋 Passo a passo (do zero ao site no ar)

### 1. Schema no Supabase
Já feito! Seu projeto `bt-delas` em `zegrmnubfjlvokmdfkqe.supabase.co` já está com as tabelas e funções.

Se precisar recriar, cole `supabase-schema.sql` no SQL Editor.

### 2. Criar usuário da organização (se ainda não fez)
No Supabase → **Authentication** → **Users** → **Add user** → **Create new user**
- Seu e-mail
- Senha forte
- ✅ marque **Auto Confirm User**

Esse login é só pro painel.

### 3. Subir no GitHub
1. Vá em **github.com** → botão verde **New** (repositório)
2. Nome: `bt-delas`
3. Deixe **Private** (recomendado)
4. ✅ Marque **Add a README file**
5. Clique **Create repository**
6. No repo criado, clique em **Add file** → **Upload files**
7. **Arraste toda a pasta do projeto** (menos `node_modules` se existir) na área de upload
8. Embaixo, clique **Commit changes**

> Dica: antes de subir, **apague** qualquer `.env.local` da pasta. As chaves vão na Vercel, não no Git.

### 4. Conectar na Vercel
1. Vá em **vercel.com** → **Add New** → **Project**
2. Escolha **Continue with GitHub** (se já não estiver conectado)
3. Encontre `bt-delas` na lista → **Import**
4. Em **Environment Variables**, adicione duas:

   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://zegrmnubfjlvokmdfkqe.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(sua anon key)* |

5. Clique **Deploy** → espera 1-2 minutos
6. Pronto! O site está no ar em `https://bt-delas-XXXX.vercel.app`

### 5. Apontar o domínio `btdelas.online`
1. No projeto da Vercel → **Settings** → **Domains**
2. Digite `www.btdelas.online` → **Add**
3. A Vercel vai mostrar um registro **CNAME** pra você adicionar no DNS
4. Na **Hostinger**, vá em **Domínios** → `btdelas.online` → **DNS/Nameservers**
5. Adicione o CNAME que a Vercel mostrou
6. Também adicione `btdelas.online` (sem www) na Vercel; ela te dá um registro **A** pra adicionar na Hostinger
7. Em ~15 min o domínio está apontando pra Vercel (às vezes mais rápido)

### 6. Testar
- `https://www.btdelas.online` → deve mostrar a contagem regressiva até 10/11 às 12h
- `https://www.btdelas.online/painel` → tela de login
- Após 10/11 12h, a tela muda sozinha pro formulário de inscrição

---

## 🔁 Pra mudar qualquer coisa depois

1. Edita o arquivo no GitHub (botão lápis)
2. Salva o commit
3. A Vercel faz deploy automático em ~30 segundos

Coisas comuns pra ajustar:
- **Número do WhatsApp da organização**: em `app/page.tsx`, procure por `5582996001624` e troque pelo seu
- **Vagas por categoria**: no Supabase SQL Editor, altere a função `limite_categoria`
- **Data/hora de abertura**: no Supabase, altere `abertura_inscricoes()`

---

## 🎨 Paleta (da camisa oficial)
- Laranja `#FF6A1A`
- Azul índigo `#2A2A9E`
- Pink `#FF3D8B`
- Amarelo `#F7C948`

---

## 🛠 Dev local (opcional)
Se um dia quiser testar antes de subir pro ar:
```bash
npm install
cp .env.local.example .env.local  # preenche as chaves
npm run dev
```
Abre em `http://localhost:3000`.
