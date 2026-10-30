# 🚀 Guia de Publicação no Render (Gustavix)

Este repositório já está **100% configurado e pronto para deploy automático no Render**.

---

## 📋 Configurações Automáticas Detectadas pelo Render

O arquivo [`render.yaml`](file:///c:/Users/julia/OneDrive/Desktop/Gustavix/render.yaml) já configura tudo para você:

| Item | Valor Configurado |
|---|---|
| **Ambiente (Runtime)** | Node.js (`>=18`) |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Binding de Rede** | `0.0.0.0` com porta dinâmica (`process.env.PORT`) |
| **Plano** | Gratuito (Free Web Service) |

---

## 🛠️ Passo a Passo para Deploy (3 Passos Simples)

### 1. Subir para o GitHub
Se ainda não subiu o projeto para o seu repositório GitHub, execute no terminal:
```bash
git add .
git commit -m "feat: preparar projeto para deploy no Render"
git push origin main
```

### 2. Criar o Serviço no Render
1. Acesse [render.com](https://render.com) e faça login.
2. Clique no botão **"New +"** no topo e selecione **"Web Service"**.
3. Conecte sua conta do GitHub e selecione o repositório **Gustavix**.
4. O Render detectará automaticamente:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### 3. Configurar as Variáveis de Ambiente no Render
Na seção **Environment Variables** do Render, adicione:

| Chave (Key) | Valor (Value) | Descrição |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://...` | A sua string de conexão do MongoDB Atlas |
| `PARENT_PIN_DEFAULT` | `1234` | PIN dos pais para acessar a Central de Comando |
| `NODE_ENV` | `production` | Modo de produção otimizado |
| `JWT_SECRET` | *(clique em Generate ou digite um segredo)* | Chave de segurança para sessões |

> 💡 **Nota:** O Render injeta automaticamente a variável `PORT`, portanto não é necessário defini-la manualmente.

---

## 🔄 Como testar localmente
- Para rodar em desenvolvimento com auto-reload:
  ```bash
  npm run dev
  ```
- Para rodar exatamente como o Render executa:
  ```bash
  npm start
  ```
- Acesse em: [http://localhost:3000](http://localhost:3000)
