# Clube BT Delas — login das atletas + check-ins (estilo Gym Rats)

Estes arquivos entram **dentro do projeto Next.js que já existe** (o mesmo do site de inscrição). Nada do que já funciona é alterado.

```
supabase/clube_gamificacao.sql   → rodar no SQL Editor do Supabase (1º)
supabase/clube_parcerias.sql     → rodar logo depois (2º)
lib/clube/                       → conexão, sessão e utilidades
components/clube/                → botões, campos, card do feed
app/clube/                       → as telas (site.com/clube)
public/clube/logo-btdelas.png    → logo (recortado do print; troque pelo original em alta se tiver)
```

## Telas

| Endereço | O que faz |
|---|---|
| `/clube/cadastro` | Cadastro grátis: nome, apelido, WhatsApp, categoria, e-mail e senha |
| `/clube/entrar` | Login com e-mail e senha |
| `/clube/recuperar` e `/clube/nova-senha` | "Esqueci minha senha" por e-mail |
| `/clube` | Pontos do mês, posição, sequência 🔥 e o feed de check-ins com curtidas |
| `/clube/checkin` | Escolhe a atividade, tira/escolhe a foto, legenda e posta |
| `/clube/ranking` | Ranking do mês, com filtro Cat. C / Cat. D e meses anteriores |
| `/clube/parcerias` | Lista de parceiros e descontos, com filtro por categoria e destaque no topo |
| `/clube/parcerias/[id]` | Detalhes, contatos (WhatsApp, Instagram, mapa) e o **cartão do Clube** pra mostrar no balcão |
| `/clube/perfil` | Editar dados, ver e apagar os próprios check-ins, sair |

## Passo a passo

1. **Banco:** Supabase → SQL Editor → colar `supabase/clube_gamificacao.sql` → Run. Depois, o mesmo com `supabase/clube_parcerias.sql`.
2. **Virar admin:** no fim do SQL tem o comando comentado. Troque pelo seu e-mail **depois** de criar sua conta em `/clube/cadastro`.
3. **Copiar as pastas** `lib/clube`, `components/clube`, `app/clube` e `public/clube` para o projeto (mesmos caminhos).
4. **Tailwind:** confira se o `tailwind.config` tem `./components/**/*.{ts,tsx}` e `./app/**/*.{ts,tsx}` em `content`.
5. **Variáveis:** usa as mesmas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` que o site já tem. Se no seu `.env` os nomes forem outros, ajuste em `lib/clube/supabase.ts`.
6. **Supabase → Authentication → URL Configuration:**
   - Site URL: `https://www.btdelas.online`
   - Redirect URLs: `https://www.btdelas.online/clube/**` (e `http://localhost:3000/clube/**` para testar)
7. **⚠️ Confirmação de e-mail:** o envio de e-mail embutido do Supabase só manda **poucos e-mails por hora**. Com várias meninas se cadastrando ao mesmo tempo, muitas não vão receber o link. Escolha uma:
   - **Mais simples:** Authentication → Providers → Email → desligar *Confirm email*. A atleta já entra direto depois do cadastro.
   - **Mais seguro:** configurar um SMTP próprio (Resend, Brevo…) em Authentication → SMTP Settings. Também é necessário para o "esqueci a senha" funcionar bem em escala.
8. `git push` e a Vercel publica.

## Regras de pontuação (já no banco)

- Jogo, treino ou aula de beach: **3 pts** · Outra atividade física: **1 pt**
- **1 check-in pontuado por dia**: conta o de maior valor. Até 3 posts por dia aparecem no feed.
- **+2 pts** a cada 4 semanas seguidas (seg–dom) com pelo menos 1 beach
- **Torneio BT Delas: 5 pts**, lançados pela organização:
  ```sql
  select public.lancar_pontos_torneio(
    array(select id from public.atletas where whatsapp in ('82999990000','82988880000')),
    '2026-12-13', 'Super 8 — 13/12');
  ```
  Se rodar duas vezes, não duplica.
- Empate no ranking: fica na frente quem tem mais dias de beach.
- Mudar pontos: edite a tabela `tipos_atividade` (Table Editor). Vale para os próximos check-ins; os antigos mantêm o valor da época.

## Proteções

- A data do check-in é sempre "hoje em Maceió" e os pontos vêm da tabela. A atleta não consegue postar retroativo nem inventar pontos.
- WhatsApp fica privado: feed e ranking só mostram nome, apelido, Instagram e categoria.
- Cada atleta só sobe foto na própria pasta e só apaga o que é dela.
- Fotos são reduzidas no celular antes de subir (~200 KB cada).
- Para remover um check-in falso: Table Editor → `checkins` → mude `status` para `removido`.

## Parcerias

- **Cadastrar parceiro:** Table Editor → `parceiros` → Insert row. Obrigatórios: `nome`, `resumo` (a oferta em uma linha). O resto é opcional: `categoria`, `descricao`, `cupom`, `como_usar`, `instagram`, `whatsapp`, `site`, `endereco`, `valido_ate`, `destaque`.
- **Logo:** Storage → bucket `parceiros` → upload → coloque o nome do arquivo em `logo_path`. Sem logo, aparece a inicial numa cor (`cor`).
- **Tirar do ar:** `ativo = false`. Quando passa do `valido_ate`, a oferta some sozinha.
- **Cartão do Clube:** mostra nome da atleta, a oferta, o cupom e um relógio ao vivo. Assim o parceiro sabe que não é print antigo.
- **Relatório pro parceiro:** cada vez que uma atleta abre o cartão, fica registrado.
  ```sql
  select * from public.relatorio_parcerias;
  ```
  Mostra usos no total, no mês e quantas atletas diferentes usaram. É um bom argumento pra renovar ou fechar parcerias novas.
- Enquanto não houver parceiro cadastrado, a aba mostra "Em breve".
