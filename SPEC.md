# SPEC.md — Especificação Técnica de Implementação

## CurrículoCanada — Micro SaaS

> **Fase 3: Implementação**
> Última atualização: 2026-04-01

---

## Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Setup do Projeto](#2-setup-do-projeto)
3. [Design System & Estilização](#3-design-system--estilização)
4. [Estrutura de Pastas](#4-estrutura-de-pastas)
5. [Componentes & Páginas](#5-componentes--páginas)
6. [Rotas da Aplicação](#6-rotas-da-aplicação)
7. [Modelos de Dados (Firestore)](#7-modelos-de-dados-firestore)
8. [Integração Firebase Auth](#8-integração-firebase-auth)
9. [Integração Google Gemini (IA)](#9-integração-google-gemini-ia)
10. [Integração Stripe (Pagamentos)](#10-integração-stripe-pagamentos)
11. [Exportação PDF](#11-exportação-pdf)
12. [Responsividade & Acessibilidade](#12-responsividade--acessibilidade)
13. [Variáveis de Ambiente](#13-variáveis-de-ambiente)
14. [Roadmap de Sprints](#14-roadmap-de-sprints)

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (SPA)                    │
│            Vite + React 18 + TypeScript             │
│          Tailwind CSS 4 + shadcn/ui                 │
├─────────────────────────────────────────────────────┤
│  Landing Page │ Wizard (4 steps) │ Dashboard (3 tabs)│
└──────┬──────────────┬───────────────┬───────────────┘
       │              │               │
       ▼              ▼               ▼
┌─────────────┐ ┌───────────┐ ┌──────────────┐
│ Firebase    │ │ Gemini AI │ │   Stripe     │
│ Auth + DB   │ │   API     │ │  Checkout    │
└─────────────┘ └───────────┘ └──────────────┘
```

**Stack definitiva:**

| Camada        | Tecnologia                          |
|---------------|-------------------------------------|
| Framework     | React 18 + TypeScript (Vite 6)      |
| Estilização   | Tailwind CSS 4 + shadcn/ui          |
| Roteamento    | React Router v7                     |
| Estado        | Zustand                             |
| Backend/BaaS  | Supabase (Auth + PostgreSQL)        |
| IA            | Google Gemini API (`@google/genai`) |
| Pagamentos    | AbacatePay (Checkout PIX/Cartão)    |
| Hospedagem    | Cloudflare Pages                    |
| Markdown      | `react-markdown` + `remark-gfm`    |
| PDF           | `html2pdf.js`                       |
| Ícones        | Lucide React                        |

---

## 2. Setup do Projeto

### 2.1 Inicialização

```bash
npx -y create-vite@latest ./ --template react-ts
npm install
```

### 2.2 Dependências principais

```bash
# UI & Estilização
npm install tailwindcss @tailwindcss/vite
npm install lucide-react class-variance-authority clsx tailwind-merge

# Roteamento & Estado
npm install react-router-dom zustand

# Supabase
npm install @supabase/supabase-js

# Google Gemini
npm install @google/genai

# Markdown & PDF
npm install react-markdown remark-gfm html2pdf.js

# Utilitários
npm install react-hook-form zod @hookform/resolvers
```

### 2.3 shadcn/ui

```bash
npx shadcn@latest init
npx shadcn@latest add button card input label tabs progress dialog badge separator textarea select
```

---

## 3. Design System & Estilização

### 3.1 Paleta de Cores

Inspirada na bandeira canadense com tons modernos:

```css
:root {
  --maple-red: #D32F2F;
  --maple-red-light: #FF5252;
  --maple-red-dark: #B71C1C;
  --snow-white: #FAFAFA;
  --cloud-gray: #F5F5F5;
  --slate: #334155;
  --charcoal: #1E293B;
  --aurora-blue: #1976D2;
  --forest-green: #2E7D32;
  --gold-accent: #F9A825;
  --success: #4CAF50;
  --warning: #FF9800;
  --error: #F44336;
  --info: #2196F3;
}
```

### 3.2 Tipografia

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap');
body { font-family: 'Inter', sans-serif; }
h1, h2, h3 { font-family: 'Outfit', sans-serif; }
```

### 3.3 Animações

- **Fade-in** suave em cada step do wizard (300ms ease-out)
- **Skeleton loading** durante chamadas à API
- **Progress bar** animada no score ATS
- **Confetti** sutil ao desbloquear conteúdo premium
- **Hover scale** (1.02) nos cards de vagas

---

## 4. Estrutura de Pastas

```
src/
├── assets/
├── components/
│   ├── ui/              # shadcn/ui
│   ├── layout/          # Header, Footer, Layout
│   ├── landing/         # Hero, HowItWorks, Testimonials, FAQ, CTA
│   ├── wizard/          # WizardContainer, StepContext, StepUpload, StepAnalysis, StepPaywall
│   ├── dashboard/       # DashboardLayout, TabResume, TabLinkedIn, TabJobs
│   └── shared/          # ScoreGauge, CopyButton, LoadingAnalysis, ProtectedRoute
├── hooks/               # useAuth, useAnalysis, useGemini, usePayment
├── lib/                 # supabase.ts, gemini.ts, abacatepay.ts, utils.ts
├── stores/              # wizardStore.ts (Zustand)
├── types/               # index.ts (interfaces)
├── pages/               # LandingPage, WizardPage, DashboardPage, NotFoundPage
├── App.tsx
├── main.tsx
└── index.css
```

---

## 5. Componentes & Páginas

### 5.1 Landing Page (`/`)

| Seção           | Conteúdo                                                     |
|-----------------|--------------------------------------------------------------|
| **Hero**        | Headline, subtitle, CTA "Descubra sua nota ATS grátis", gradient bg |
| **HowItWorks**  | 3 cards: Upload → Análise IA → Resultado          |
| **Social Proof**| Número de CVs otimizados, depoimentos                       |
| **FAQ**         | 4 perguntas do PRD em accordion (shadcn)                     |
| **CTA Final**   | Repetição do CTA com urgência                      |

### 5.2 Wizard (`/wizard`) — 4 Steps

**Step 1 — Contexto:** Select NOC + Província (validação Zod)

**Step 2 — Upload:** Textarea para colar CV ou upload PDF (mín 100 chars)

**Step 3 — Análise (Teaser):**
- Loading com mensagens rotativas (5s total)
- Chamada Gemini (Prompt 1)
- Exibe: Score gauge (0-100) + 1 erro crítico (restante com blur)

**Step 4 — Paywall:**
- Login com Google → Stripe Checkout → Redireciona ao Dashboard

### 5.3 Dashboard (`/dashboard`) — 3 Abas

**Aba 1 — CV:** Markdown renderizado + Exportar PDF + Copiar

**Aba 2 — LinkedIn:** Cards (Headline, About, Experiências) + Copiar cada

**Aba 3 — Vagas:** Lista de cards com Título, Empresa, Match %, Link externo

---

## 6. Rotas da Aplicação

```typescript
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/wizard" element={<WizardPage />} />
  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

---

## 7. Modelos de Dados (PostgreSQL)

### 7.1 Interfaces TypeScript

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  targetProvince: string;
  targetNoc: string;
  isPremium: boolean;
  createdAt: Timestamp;
}

interface Analysis {
  id: string;
  userId: string;
  originalText: string;
  atsScore: number;
  criticalFlaws: CriticalFlaw[];
  generatedResume?: string;
  generatedLinkedIn?: LinkedInProfile;
  suggestedJobs?: Job[];
  createdAt: Timestamp;
}

interface CriticalFlaw {
  category: 'format' | 'content' | 'keywords' | 'structure';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

interface LinkedInProfile {
  headline: string;
  about: string;
  experiences: { role: string; company: string; bullets: string[] }[];
}

interface Job {
  title: string;
  company: string;
  location: string;
  matchPercentage: number;
  url: string;
  source: string;
}
```

### 7.2 Zustand Store

```typescript
interface WizardState {
  currentStep: number;
  noc: string;
  province: string;
  resumeText: string;
  analysis: Analysis | null;
  isLoading: boolean;
  setStep: (step: number) => void;
  setContext: (noc: string, province: string) => void;
  setResumeText: (text: string) => void;
  setAnalysis: (analysis: Analysis) => void;
  reset: () => void;
}
```

### 7.3 Schema SQL (Supabase)

```sql
-- Habilitar pgvector para busca semântica por IA no futuro
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de Perfis de Usuário
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  target_province TEXT,
  target_noc TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Análises
CREATE TABLE analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  original_text TEXT,
  ats_score INT CHECK (ats_score >= 0 AND ats_score <= 100),
  critical_flaws JSONB, -- Array de objetos
  generated_resume TEXT, -- Markdown
  generated_linkedin JSONB, -- Objeto estruturado
  suggested_jobs JSONB, -- Array de objetos
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) - Segurança total
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own analyses" ON analyses FOR SELECT USING (auth.uid() = user_id);
```

---

## 8. Integração Supabase Auth

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: import.meta.env.VITE_APP_URL }
  });

  const logout = () => supabase.auth.signOut();

  return { user, loading, loginWithGoogle, logout };
}
```

---

## 9. Integração Google Gemini (IA)

### 9.1 Setup

```typescript
// lib/gemini.ts
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function callGemini(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });
  return response.text ?? '';
}
```

### 9.2 Prompts

**Prompt 1 — Análise ATS:**
> Analise o currículo e retorne JSON: `{ atsScore: number, criticalFlaws: CriticalFlaw[] }`. Critérios: sem foto, verbos de ação, métricas, keywords NOC, formato cronológico reverso.

**Prompt 2 — Reescrita CV:**
> Reescreva em formato ATS canadense (Markdown). Seções: Professional Summary, Work Experience, Education, Skills. Verbos de ação, métricas, keywords NOC + província.

**Prompt 3 — LinkedIn:**
> Retorne JSON: `{ headline, about, experiences[] }`. SEO otimizado para recrutadores canadenses.

**Prompt 4 — Vagas:**
> Sugira 5 vagas reais no Canadá. Retorne JSON: `[{ title, company, location, matchPercentage, url, source }]`.

> **Nota:** Todos os prompts retornam JSON. Usar `JSON.parse()` com try/catch.

---

## 10. Integração AbacatePay (Pagamentos)

```typescript
// lib/abacatepay.ts
import { supabase } from './supabase';

/**
 * Chama a Supabase Edge Function de forma segura sem expor chaves ao cliente
 */
export async function createCheckoutSession(returnUrl?: string) {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { returnUrl: returnUrl || window.location.href },
  });

  if (error) throw error;
  return data.url as string;
}
```

**Fluxo Seguro (Edge Functions):**
1. O Frontend chama `createCheckoutSession()` (acima)
2. `create-checkout` (Edge Func) chama a AbacatePay usando segredos do backend e gera a URL.
3. Usuário paga na AbacatePay.
4. AbacatePay aciona a função `abacatepay-webhook` (Edge Func).
5. Webhook atualiza `is_premium: true` no perfil via Service Role no Supabase.

---

## 11. Exportação PDF

```typescript
import html2pdf from 'html2pdf.js';

export function exportToPDF(elementId: string, filename: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  html2pdf().set({
    margin: [10, 10, 10, 10],
    filename: `${filename}.pdf`,
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
  }).from(el).save();
}
```

---

## 12. Responsividade & Acessibilidade

| Breakpoint | Largura   | Layout                   |
|------------|-----------|--------------------------|
| Mobile     | < 640px   | Stack vertical, 1 coluna |
| Tablet     | 640-1024  | 2 colunas onde aplicável |
| Desktop    | > 1024px  | Layout completo          |

**Checklist:** aria-labels, contraste 4.5:1, navegação Tab, alt text, focus ring, `role="progressbar"`.

---

## 13. Variáveis de Ambiente

```env
# .env.local
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
VITE_ABACATEPAY_API_KEY= # REMOVIDO: NUNCA expor no Frontend. Coloque no Supabase Edge Function Secrets como ABACATEPAY_API_KEY
VITE_APP_URL=http://localhost:5173
```

---

## 14. Roadmap de Sprints

### Sprint 1 — Fundação (3 dias)
- [x] Criar projeto Vite + React + TS
- [x] Configurar Tailwind CSS 4 + shadcn/ui
- [x] Configurar React Router v7 + Zustand
- [x] Criar Layout (Header, Footer)
- [x] Design tokens (cores, fontes)

### Sprint 2 — Landing Page (3 dias)
- [x] Hero section com CTA
- [x] Seção "Como Funciona" (3 passos)
- [x] Social Proof / Depoimentos
- [x] FAQ com accordion
- [x] CTA final + animações

### Sprint 3 — Wizard (4 dias)
- [x] WizardContainer + progress bar
- [x] Step 1: NOC + Província (Zod)
- [x] Step 2: Textarea + upload PDF
- [x] Step 3: Loading animado + Gemini Prompt 1 + Score gauge
- [x] Step 4: Paywall UI

### Sprint 4 — Auth + Pagamento (3 dias)
- [x] Supabase project setup & SQL Table creation
- [x] Supabase Auth (Google OAuth)
- [x] ProtectedRoute component
- [x] AbacatePay API Integration (Checkout)
- [x] Webhook para atualizar `is_premium` no Supabase

### Sprint 5 — Dashboard Premium (4 dias)
- [x] Tabs layout (shadcn)
- [x] Aba CV/ATS: Gemini SDK → Avaliação ATS e Rewrite completo
- [x] Ação de Baixar Currículo: Exportação HTML para PDF (`html2pdf.js`)
- [x] Persistência: Banco de Dados registrando as respostas com resiliência
- [x] Aba Vagas: Gemini SDK → Lista de oportunidades reais baseadas no NOC e Província
- [x] Estados de carregamento e interface Premium

### Sprint 6 — Polish & Deploy (3 dias)
- [ ] Testes manuais E2E
- [x] SEO: meta tags, OG, titles
- [x] Performance: lazy loading de rotas, otimizar imagens
- [x] Responsividade mobile/tablet/desktop
- [x] Acessibilidade (Lighthouse ≥ 90)
- [ ] Deploy (Cloudflare Pages)
- [ ] Configurar domínio customizado (Opcional)

> **Tempo total estimado: ~20 dias úteis**

---

## Critérios de Conclusão (Definition of Done)

1. ✅ Landing page funcional e responsiva
2. ✅ Wizard completo: contexto → upload → análise → paywall
3. ✅ Login com Google funcionando via Supabase
4. ✅ Pagamento AbacatePay processando (PIX/Cartão)
5. ✅ Dashboard com 3 abas via Gemini
6. ✅ Exportação PDF do currículo
7. ✅ Botões "Copiar" no LinkedIn
8. ✅ Lighthouse ≥ 90 (Performance + Accessibility + SEO)
9. ✅ Deploy em produção via Cloudflare Pages

---

## 15. Setup de Edge Functions (AbacatePay)

### 15.1 Visão Geral

As Edge Functions handle the secure communication with AbacatePay for payment processing, keeping API keys off the frontend.

### 15.2 Funções Criadas

| Função | Endpoint | Propósito |
|--------|----------|-----------|
| `create-checkout` | `/functions/v1/create-checkout` | Gera URL de checkout |
| `abacatepay-webhook` | `/functions/v1/abacatepay-webhook` | Recebe confirmação de pagamento |

### 15.3 Configuração (Supabase Dashboard)

1. Acesse **Supabase Dashboard** → **Edge Functions** → **Secrets**

2. Adicione os seguintes secrets:
   ```
   ABACATEPAY_API_KEY=sua_chave_da_abacatepay
   ABACATEPAY_WEBHOOK_SECRET=seu_webhook_secret
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
   ```

3. Para obter `SUPABASE_SERVICE_ROLE_KEY`:
   - Supabase Dashboard → **Project Settings** → **API**
   - Copie a chave `service_role` (não use a anon key!)

### 15.4 Configurar Webhook na AbacatePay

1. Acesse seu dashboard na **AbacatePay**
2. Vá em **Configurações** → **Webhooks**
3. Adicione o endpoint:
   ```
   https://kbtbttdwkdtugrcgzwcn.supabase.co/functions/v1/abacatepay-webhook
   ```
4. Copie o **Webhook Secret** e adicione nos Edge Function Secrets

### 15.5 Secrets Necessários

| Secret | Descrição |
|--------|-----------|
| `ABACATEPAY_API_KEY` | Chave da API AbacatePay (não exponha!) |
| `ABACATEPAY_WEBHOOK_SECRET` | Assinatura para validar webhooks |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin do Supabase (não exponha!) |

### 15.6 Testando Localmente

```bash
# Inicie o emulador local do Supabase
npx supabase start

# Deploy das functions para staging
npx supabase functions deploy create-checkout
npx supabase functions deploy abacatepay-webhook

# Teste a function
npx supabase functions serve create-checkout --verify-jwt
```

### 15.7 Monitoramento

- Logs: **Supabase Dashboard** → **Edge Functions** → **Logs**
- Métricas: Verifique o dashboard da AbacatePay para status de pagamentos

### 15.8 Troubleshooting

| Problema | Solução |
|----------|---------|
| `401 Unauthorized` no webhook | Verifique se o `ABACATEPAY_WEBHOOK_SECRET` está correto |
| `is_premium` não atualiza | Verifique se a tabela `profiles` existe e se RLS permite updates |
| Checkout não cria URL | Verifique se `ABACATEPAY_API_KEY` está configurado corretamente |
