# 🎾 BT Delas · Super 8 — Passo a Passo COMPLETO

**Siga estes passos NA ORDEM. Não pule nenhum.**

---

## 📦 O que você tem em mãos

- `bt-delas.zip` → o projeto todo
- `README-COMECE-AQUI.md` → este arquivo

## 🗑 Passo 0 — Limpar o que estava quebrado

### 0A. Deletar o projeto da Vercel
1. Entre em vercel.com → projeto **bt-delas**
2. **Settings** (topo)
3. Role até o fim → **Delete Project**
4. Digite o nome pra confirmar → deletar

### 0B. Deletar o repositório do GitHub
1. Entre em github.com → repo **bt-delas** (`Quitoprev/bt-delas`)
2. **Settings** (topo do repo)
3. Role até o fim → seção vermelha "Danger Zone" → **Delete this repository**
4. Digite `Quitoprev/bt-delas` pra confirmar

---

## 💻 Passo 1 — Instalar o GitHub Desktop

Isso vai fazer o upload funcionar de verdade. Drag-and-drop pelo navegador tem falhado.

1. Baixe em **https://desktop.github.com** (grátis, oficial)
2. Instale e abra
3. Faça login com sua conta GitHub (`Quitoprev`)

---

## 📁 Passo 2 — Descompactar o projeto

1. Clique duas vezes em `bt-delas.zip` → vai criar uma pasta `bt-delas`
2. **Confirme** que dentro dela tem:
   - 📁 `app/`
   - 📁 `lib/`
   - 📁 `public/`
   - 📄 `package.json`
   - 📄 `next.config.js`
   - 📄 `postcss.config.js`
   - 📄 `tailwind.config.ts`
   - 📄 `tsconfig.json`
   - 📄 `README.md`
   - 📄 `supabase-schema.sql`
3. **Se faltar alguma coisa, me avise AGORA** antes de seguir.

---

## 🆕 Passo 3 — Criar repositório novo pelo GitHub Desktop

1. No GitHub Desktop: menu **File** → **New Repository**
2. Preencha:
   - **Name:** `bt-delas`
   - **Local path:** escolha onde no Mac (ex: `~/Documents`)
   - **Initialize this repository with a README:** ✅ marque
3. Clique **Create Repository**
4. No topo da janela, botão azul **Publish repository**
5. Na janela que abre:
   - **Name:** `bt-delas` (já vem)
   - **Keep this code private:** ✅ marque (recomendado)
6. **Publish Repository**

Agora você tem um repo vazio no GitHub, criado certinho.

---

## 📂 Passo 4 — Copiar os arquivos do projeto pro repo

1. Abra o Finder → vá na pasta `bt-delas` descompactada (Passo 2)
2. **Cmd + A** pra selecionar tudo dentro dela
3. **Cmd + C** pra copiar
4. Agora abra a pasta do repo que o GitHub Desktop criou (Passo 3, em `~/Documents/bt-delas` ou onde você escolheu)
5. **Cmd + V** pra colar
6. Se perguntar "substituir README?", clique **Substituir**

---

## ⬆️ Passo 5 — Enviar pro GitHub

1. Volte pro **GitHub Desktop**
2. Na barra lateral esquerda, você vai ver uma lista de ~10 arquivos novos
3. Embaixo à esquerda, na caixa **Summary**, escreva: `projeto completo`
4. Clique no botão azul **Commit to main**
5. No topo, clique no botão azul **Push origin**
6. Pronto — todos os arquivos estão no GitHub

Confirme abrindo `github.com/Quitoprev/bt-delas` — deve mostrar `app/`, `lib/`, `package.json`, etc.

---

## 🚀 Passo 6 — Conectar na Vercel

1. Entre em **vercel.com**
2. **Add New** (topo direito) → **Project**
3. Na lista do GitHub, encontre **bt-delas** → clique **Import**
4. **IMPORTANTE:** confira os campos:
   - **Framework Preset:** deve detectar **Next.js** automaticamente ✅
   - **Root Directory:** `./` (deixe assim)
   - **Build Command:** DEIXE EM BRANCO
   - **Output Directory:** DEIXE EM BRANCO
5. Expanda **Environment Variables** e adicione DUAS:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://zegrmnubfjlvokmdfkqe.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(sua anon key — a longa que começa com `eyJhbGc...`)* |

6. Clique **Deploy**
7. Aguarde ~1 minuto
8. Quando terminar, clique no **preview da página** que aparece

---

## ✅ Se deu certo

Você vai ver uma página **laranja** com:
- Logo "Bt delas"
- Título "Super 8"
- Um card branco no meio com **contagem regressiva** até 10/11 às 12h

**Teste também:** `/painel` no fim da URL → tela de login azul.

---

## ❌ Se deu errado em qualquer passo

**PARE** no passo que deu problema. Tire um print. Me mande com uma mensagem tipo:

> "Travei no Passo X. A tela mostra isso: [print]"

NÃO siga em frente se algo saiu diferente do descrito aqui.
