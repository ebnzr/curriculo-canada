# CanadaPath AI

Otimizador de currículos para o mercado canadense, impulsionado por Inteligência Artificial.

## 🚀 Sobre o Projeto

CanadaPath AI ajuda profissionais brasileiros a adaptarem seus currículos para o padrão canadense, aumentando as chances de contratação através de:

- **Análise ATS completa**: Identifica problemas que fazem currículos serem rejeitados por sistemas automatizados
- **Currículo otimizado gerado por IA**: Formato canadense profissional em PDF e DOCX
- **Vagas compatíveis**: Recomendações de vagas reais no Canadá baseadas no seu perfil

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Autenticação**: Supabase Auth com Google OAuth
- **Pagamentos**: AbacatePay
- **IA**: Groq (Llama) + Google Gemini

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase
- Conta no Groq (para API de IA)
- Conta no Google Cloud (para OAuth)
- Conta na AbacatePay (para pagamentos)

## 🚀 Começando

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/curriculo-canada.git
cd curriculo-canada
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key

# URL da aplicação
VITE_APP_URL=http://localhost:5173

# Chaves de API (opcional para desenvolvimento)
VITE_GROQ_API_KEY=sua-chave-groq
VITE_GEMINI_API_KEY=sua-chave-gemini
```

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

## 🏗️ Deploy

Veja o guia completo em [DEPLOYMENT.md](./DEPLOYMENT.md)

### Deploy rápido da Edge Function

```bash
npx supabase functions deploy generate-analysis --no-verify-jwt
```

⚠️ **IMPORTANTE**: Sempre use `--no-verify-jwt` para autenticação OAuth funcionar corretamente.

## 🐛 Troubleshooting

### Erro 401 - "Invalid JWT"

**Problema**: Autenticação falhando ao gerar currículo.

**Solução**:
```bash
npx supabase functions deploy generate-analysis --no-verify-jwt
```

**Documentação completa**: [docs/ERRO_401_JWT_RESOLVIDO.md](./docs/ERRO_401_JWT_RESOLVIDO.md)

### Erro CORS

**Problema**: Requisições bloqueadas por política de CORS.

**Solução**: Verifique se o header `Access-Control-Allow-Origin` na Edge Function corresponde à URL do frontend.

### Erro "Failed to fetch"

**Problema**: Edge Function não está respondendo.

**Solução**: Verifique os logs:
```bash
npx supabase functions logs generate-analysis --tail
```

## 📚 Documentação

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guia completo de deploy
- [docs/ERRO_401_JWT_RESOLVIDO.md](./docs/ERRO_401_JWT_RESOLVIDO.md) - Documentação técnica do erro 401
- [SPEC.md](./SPEC.md) - Especificação técnica do projeto
- [PRD.md](./PRD.md) - Documento de requisitos do produto

## 🏛️ Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Supabase   │────▶│   Google    │
│  (React)    │     │    Auth      │     │   OAuth     │
└─────────────┘     └──────────────┘     └─────────────┘
       │
       │ 2. Chamar Edge Function
       ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase Edge Function                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  generate-analysis                                │  │
│  │  - Recebe currículo do usuário                    │  │
│  │  - Verifica autenticação                          │  │
│  │  - Chama APIs de IA (Groq/Gemini)                 │  │
│  │  - Gera análise ATS + currículo otimizado         │  │
│  │  - Busca vagas compatíveis                        │  │
│  │  - Salva no banco de dados                        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              Integrações Externas                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │    Groq     │  │   Gemini    │  │   AbacatePay    │ │
│  │   (IA)      │  │    (IA)     │  │   (Pagamentos)  │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🔒 Autenticação

O projeto usa **Supabase Auth** com **Google OAuth**:

1. Usuário faz login com Google
2. Supabase cria sessão com JWT
3. Frontend envia token para Edge Function no body da requisição
4. Edge Function verifica token manualmente
5. Acesso concedido às funcionalidades premium

**Nota técnica**: A verificação JWT no Gateway do Supabase está desabilitada (`--no-verify-jwt`) para permitir tokens OAuth. A verificação é feita manualmente na Edge Function.

## 💳 Pagamentos

Integração com **AbacatePay** para pagamentos brasileiros:

- Pagamento único (não é assinatura)
- Emissão de nota fiscal
- Webhook para ativação automática do premium

## 📝 Licença

Este projeto é privado e de propriedade da CanadaPath AI.

## 🤝 Suporte

Para dúvidas ou problemas:

1. Consulte a documentação em `/docs`
2. Verifique os logs da Edge Function
3. Abra uma issue no repositório

---

Desenvolvido com ❤️ para ajudar brasileiros a conquistarem oportunidades no Canadá.
