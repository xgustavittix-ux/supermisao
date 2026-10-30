# Regras do Projeto Gustavix (Super Missões Gustavitti)

Este arquivo define diretrizes inegociáveis e o protocolo de execução para o desenvolvimento do **Super Missões Gustavitti** (Gustavix).

---

## 1. Perfil e Contexto do Usuário Final
- **Criança:** Gustavitti, 8 anos.
- **Rotina:** Estuda no período da **tarde**. A rotina diária é dividida em:
  - *Manhã (pré-escola):* Despertar, café, higiene, lição rápida/leitura, conferência de mochila/uniforme.
  - *Tarde (escola):* Foco nos estudos presenciais e convivência.
  - *Noite (pós-escola):* Jantar, colaboração em casa, dever de casa do dia, relaxamento, check-in opcional e rotina de sono.
- **Tom Visual e Linguagem:** **Não infantilizar em excesso.** Linguagem moderna, aventureira, espacial, estilo cockpit/painel de exploração gamer e direto. Sem elementos ou metáforas de bebê.
- **Design Visual Consciente:** 
  - Fundo escuro e limpo (Void Black `#0B0E17`).
  - Cores funcionais com propósito claro: Ciano (`#00F0FF`) para ações e status; Dourado (`#FFD043`) para moedas e recompensas; Roxo (`#8A2BE2`) para conquistas/níveis.
  - Evitar excesso de brilhos, neon saturado ou glassmorphism em todos os cartões. Animações curtas e suporte a `prefers-reduced-motion`.

---

## 2. Padrões de Arquitetura e Engenharia (Render + Atlas)
- **Hospedagem Stateless (Render):** O container do Render é efêmero (reinicia periodicamente e descarta alterações em disco ou memória).
  - **PROIBIDO:** Guardar saldo, missões ou sessões em variáveis globais de memória (`let saldo = 0`), arquivos locais (`fs.writeFileSync`) ou confiar exclusivamente no `localStorage`.
  - **OBRIGATÓRIO:** Toda persistência real deve residir no **MongoDB Atlas**.
  - **Seed Idempotente:** A rotina de inicialização de dados deve criar registros padrão **apenas se a coleção estiver vazia**, sem jamais resetar o progresso existente ao reiniciar o Render.
  - **Tratamento de Indisponibilidade:** Se o banco falhar, o frontend deve acusar erro amigável na tela, jamais simular que salvou uma operação.
  - **Variáveis de Ambiente:** Credenciais (`MONGODB_URI`, `PARENT_PIN_HASH`, `SESSION_SECRET`) ficam no painel de ambiente do Render e no `.env` local (incluso no `.gitignore`). O repositório conterá apenas `.env.example`.

---

## 3. Segurança da Central de Comando (Responsável)
- Autenticação real com **PIN Numérico**:
  - Hash com `bcrypt` ou `argon2` no backend (nunca texto puro).
  - Rate limiting (limite de tentativas com atraso progressivo para evitar brute-force).
  - Sessão autenticada via cookies seguros (`httpOnly`, `sameSite`, `secure`) ou tokens com expiração definida.
  - Todas as rotas administrativas (`/api/admin/*`, aprovações, edições, resgates) protegidas por middleware de autorização no backend. Esconder botões na UI não é segurança.

---

## 4. Economia de Moedas como Sistema Financeiro Imutável
- **Ledger / Histórico de Transações:** Não se deve apenas incrementar ou decrementar um campo `saldo` solto. Cada movimentação é um documento imutável na coleção `transactions`:
  - `credito` (Missão aprovada: +X moedas)
  - `resgate` (Recompensa aprovada: -Y moedas)
  - `estorno` (Cancelamento de resgate com devolução de moedas)
  - `ajuste_administrativo` (Correção manual justificada pelo responsável)
- **Idempotência & Atomicidade:**
  - Garantir via transações do MongoDB ou operações atômicas (`findOneAndUpdate` com checagem de status) que uma mesma missão não gere moedas duplicadas.
  - Impedir que dois resgates concorrentes usem o mesmo saldo.
  - Sem saldo negativo e sem remoção de moedas como castigo.
- **Valores Calibrados (Ponto de Partida Editável):**
  - Missões Comuns: 1 a 3 moedas (higiene, arrumação, leitura básica).
  - Missões Especiais: 5 a 8 moedas (metas semanais, projetos acordados).
  - Recompensas da Loja: 40 a 1.000 moedas (desde pequenas decisões familiares até grandes conquistas).

---

## 5. Estratégia PWA (Mobile-First Realista)
- **Fase 1 (MVP):** Mobile-first responsivo, instalação na tela inicial (modo standalone via `manifest.json`), cache de assets estáticos (HTML, CSS, JS, ícones) via Service Worker para carregamento instantâneo.
- **Aprovações e Moedas Requerem Rede:** A concessão de moedas, validação de PIN e resgates exigem conexão com o servidor. O app **não** concede moedas de forma offline independente.
- **Fase Futura:** Suporte a consultas offline de tarefas diárias e sincronização retroativa segura.

---

## 6. Registro Emocional ("Diário do Astronauta")
- Implementado de forma **simples, opcional e privada**.
- Check-in rápido com tags de sentimento sem transformar emoções em pontuação ou cobrança.
- Focado em gerar histórico de apoio e diálogo para os pais na Central de Comando.

---

## 7. Protocolo de Leitura e Desenvolvimento
1. Ler [docs/stack_tecnologica.md](file:///c:/Users/julia/OneDrive/Desktop/Gustavix/docs/stack_tecnologica.md) para detalhes de arquitetura e infraestrutura.
2. Ler [docs/plano_desenvolvimento_mvp.md](file:///c:/Users/julia/OneDrive/Desktop/Gustavix/docs/plano_desenvolvimento_mvp.md) para ordem cronológica de desenvolvimento.
3. Consultar [manual_super_missoes_gustavitti.md](file:///c:/Users/julia/OneDrive/Desktop/Gustavix/manual_super_missoes_gustavitti.md) como manual de referência conceitual.
