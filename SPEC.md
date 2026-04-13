# SPEC.md â€” EspecificaÃ§Ã£o TÃ©cnica de ImplementaÃ§Ã£o

## CurrÃ­culoCanada â€” Micro SaaS

> **Fase 3: ImplementaÃ§Ã£o**
> Ãšltima atualizaÃ§Ã£o: 2026-04-01

---

## SumÃ¡rio

1. [VisÃ£o Geral da Arquitetura](#1-visÃ£o-geral-da-arquitetura)
2. [Setup do Projeto](#2-setup-do-projeto)
3. [Design System & EstilizaÃ§Ã£o](#3-design-system--estilizaÃ§Ã£o)
4. [Estrutura de Pastas](#4-estrutura-de-pastas)
5. [Componentes & PÃ¡ginas](#5-componentes--pÃ¡ginas)
6. [Rotas da AplicaÃ§Ã£o](#6-rotas-da-aplicaÃ§Ã£o)
7. [Modelos de Dados (Firestore)](#7-modelos-de-dados-firestore)
8. [IntegraÃ§Ã£o Firebase Auth](#8-integraÃ§Ã£o-firebase-auth)
9. [IntegraÃ§Ã£o Google Gemini (IA)](#9-integraÃ§Ã£o-google-gemini-ia)
10. [IntegraÃ§Ã£o Stripe (Pagamentos)](#10-integraÃ§Ã£o-stripe-pagamentos)
11. [ExportaÃ§Ã£o PDF](#11-exportaÃ§Ã£o-pdf)
12. [Responsividade & Acessibilidade](#12-responsividade--acessibilidade)
13. [VariÃ¡veis de Ambiente](#13-variÃ¡veis-de-ambiente)
14. [Roadmap de Sprints](#14-roadmap-de-sprints)

---

## 1. VisÃ£o Geral da Arquitetura

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                   FRONTEND (SPA)                    â”‚
â”‚            Vite + React 18 + TypeScript             â”‚
â”‚          Tailwind CSS 4 + shadcn/ui                 â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”        â–¼              â–¼               â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Supabase   â”‚ â”‚ IA (Edge) â”‚ â”‚   Stripe     â”‚
â”‚  Auth + DB  â”‚ â”‚ Gemini/Groqâ”‚ â”‚  Checkout    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Stack definitiva:**

| Camada        | Tecnologia                          |
|---------------|-------------------------------------|
| Framework     | React 18 + TypeScript (Vite 5.4)   |
| EstilizaÃ§Ã£o   | Tailwind CSS 4 + shadcn/ui          |
| Roteamento    | React Router v7                     |
| Estado        | Zustand                             |
| Backend       | Supabase (Auth + PostgreSQL)        |
| OrquestraÃ§Ã£o  | Supabase Edge Functions (Deno)      |
| IA (Multi-LLM)| Gemini 2.0, Groq (Llama), Cerebras  |
| Pagamentos    | AbacatePay (Pix/CartÃ£o)             |
| Hospedagem    | Cloudflare Pages                    |
va:**

| Camada        | Tecnologia                          |
|---------------|-------------------------------------|
| Framework     | React 18 + TypeScript (Vite 5.4) âš ï¸ **NÃ£o atualizar para Vite 8** |
| EstilizaÃ§Ã£o   | Tailwind CSS 4 + shadcn/ui          |
| Roteamento    | React Router v7                     |
| Estado        | Zustand                             |
| Backend/BaaS  | Supabase (Auth + PostgreSQL)        |
| IA            | Google Gemini API (`@google/genai`) |
| Pagamentos    | AbacatePay (Checkout PIX/CartÃ£o)    |
| Hospedagem    | Cloudflare Pages                    |
| Markdown      | `react-markdown` + `remark-gfm`    |
| PDF           | `html2pdf.js`                       |
| Ãcones        | Lucide React                        |

---

## 2. Setup do Projeto

### 2.1 InicializaÃ§Ã£o

```bash
npx -y create-vite@latest ./ --template react-ts
npm install
```

### 2.2 DependÃªncias principais

```bash
# UI & EstilizaÃ§Ã£o
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

# UtilitÃ¡rios
npm install react-hook-form zod @hookform/resolvers
```

### 2.3 shadcn/ui

```bash
npx shadcn@latest init
npx shadcn@latest add button card input label tabs progress dialog badge separator textarea select
```

---

## âš ï¸ NOTA IMPORTANTE: RestriÃ§Ãµes de VersÃ£o (Windows)

> **âš¡ ATENÃ‡ÃƒO para IAs e Desenvolvedores futuros:**
> 
> Este projeto possui **restriÃ§Ãµes de versÃ£o especÃ­ficas** que devem ser mantidas para garantir compatibilidade com Windows. NÃ£o atualize estas versÃµes sem testar exaustivamente.

### VersÃµes Fixas ObrigatÃ³rias

| Pacote | VersÃ£o Atual | VersÃ£o Proibida | Motivo |
|--------|--------------|-----------------|--------|
| `vite` | `^5.4.0` | `^8.x` | Vite 8 usa `rolldown` que tem bugs crÃ­ticos de resoluÃ§Ã£o de mÃ³dulos no Windows (falha ao resolver `fdir/dist/index.mjs`, `@rollup/rollup-win32-x64-msvc`, etc.) |
| `@vitejs/plugin-react` | `^4.3.0` | `^6.x` | Requer Vite 8, que Ã© incompatÃ­vel |
| `@tailwindcss/vite` | `^^4.0.0` | `^4.2.x` | VersÃµes mais recentes podem causar conflitos com Vite 5 |

### Erros Conhecidos se as versÃµes forem atualizadas

```
Error: Cannot find module '.../node_modules/fdir/dist/index.mjs'
Error: Cannot find module @rollup/rollup-win32-x64-msvc
Error: Build failed with 1 error: [UNRESOLVED_IMPORT] Could not resolve './cjs/react-dom-client.development.js'
```

### InstruÃ§Ãµes de ManutenÃ§Ã£o

1. **Sempre** mantenha `package.json` com as versÃµes fixas listadas acima
2. Se precisar de features do Vite 8+, considere migrar para um ambiente WSL2 ou Docker
3. Ao reinstalar dependÃªncias, use `npm ci` ou delete `node_modules` completamente antes

### Como verificar se estÃ¡ correto

```bash
npm list vite @vitejs/plugin-react @tailwindcss/vite
```

SaÃ­da esperada:
```
â”œâ”€â”€ @tailwindcss/vite@4.0.0
â”œâ”€â”€ @vitejs/plugin-react@4.3.0
â”œâ”€â”€ vite@5.4.21
```

---

## 3. Design System & EstilizaÃ§Ã£o

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

### 3.3 AnimaÃ§Ãµes

- **Fade-in** suave em cada step do wizard (300ms ease-out)
- **Skeleton loading** durante chamadas Ã  API
- **Progress bar** animada no score ATS
- **Confetti** sutil ao desbloquear conteÃºdo premium
- **Hover scale** (1.02) nos cards de vagas

---

## 4. Estrutura de Pastas

```
src/
â”œâ”€â”€ assets/
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ ui/              # shadcn/ui
â”‚   â”œâ”€â”€ layout/          # Header, Footer, Layout
â”‚   â”œâ”€â”€ landing/         # Hero, HowItWorks, Testimonials, FAQ, CTA
â”‚   â”œâ”€â”€ wizard/          # WizardContainer, StepContext, StepUpload, StepAnalysis, StepPaywall
â”‚   â”œâ”€â”€ dashboard/       # DashboardLayout, TabResume, TabLinkedIn, TabJobs
â”‚   â””â”€â”€ shared/          # ScoreGauge, CopyButton, LoadingAnalysis, ProtectedRoute
â”œâ”€â”€ hooks/               # useAuth, useAnalysis, useGemini, usePayment
â”œâ”€â”€ lib/                 # supabase.ts, gemini.ts, abacatepay.ts, utils.ts
â”œâ”€â”€ stores/              # wizardStore.ts (Zustand)
â”œâ”€â”€ types/               # index.ts (interfaces)
â”œâ”€â”€ pages/               # LandingPage, WizardPage, DashboardPage, NotFoundPage
â”œâ”€â”€ App.tsx
â”œâ”€â”€ main.tsx
â””â”€â”€ index.css
```

---

## 5. Componentes & PÃ¡ginas

### 5.1 Landing Page (`/`)

| SeÃ§Ã£o           | ConteÃºdo                                                     |
|-----------------|--------------------------------------------------------------|
| **Hero**        | Headline, subtitle, CTA "Descubra sua nota ATS grÃ¡tis", gradient bg |
| **HowItWorks**  | 3 cards: Upload â†’ AnÃ¡lise IA â†’ Resultado          |
| **Social Proof**| NÃºmero de CVs otimizados, depoimentos                       |
| **FAQ**         | 4 perguntas do PRD em accordion (shadcn)                     |
| **CTA Final**   | RepetiÃ§Ã£o do CTA com urgÃªncia                      |

### 5.2 Wizard (`/wizard`) â€” 4 Steps

**Step 1 â€” Contexto:** Select NOC + ProvÃ­ncia (validaÃ§Ã£o Zod)

**Step 2 â€” Upload:** Textarea para colar CV ou upload PDF (mÃ­n 100 chars)

**Step 3 â€” AnÃ¡lise (Teaser):**
- Loading com mensagens rotativas (5s total)
- Chamada Gemini (Prompt 1)
- Exibe: Score gauge (0-100) + 1 erro crÃ­tico (restante com blur)

**Step 4 â€” Paywall:**
- Login com Google â†’ Stripe Checkout â†’ Redireciona ao Dashboard

### 5.3 Dashboard (`/dashboard`) â€” 4 Abas

**Aba 1 â€” Raio-X (Original):** AvaliaÃ§Ã£o ATS detalhada do currÃ­culo original em Markdown

**Aba 2 â€” CurrÃ­culo Otimizado:** Markdown renderizado + Exportar PDF + Copiar

**Aba 3 â€” Perfil LinkedIn:** Cards copiÃ¡veis (Headline, About, ExperiÃªncias, EducaÃ§Ã£o, Skills, CertificaÃ§Ãµes, Idiomas)

**Aba 4 â€” Vagas:** Lista de cards com TÃ­tulo, Empresa, Match %, Link externo

---

## 6. Rotas da AplicaÃ§Ã£o

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
-- Habilitar pgvector para busca semÃ¢ntica por IA no futuro
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de Perfis de UsuÃ¡rio
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  target_province TEXT,
  target_noc TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de AnÃ¡lises
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

-- RLS (Row Level Security) - SeguranÃ§a total
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own analyses" ON analyses FOR SELECT USING (auth.uid() = user_id);
```

---

## 8. IntegraÃ§Ã£o Supabase Auth

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

## 9. IntegraÃ§Ã£o de InteligÃªncia Artificial (Multi-LLM)

### 9.1 Arquitetura de OrquestraÃ§Ã£o
Para garantir alta disponibilidade e evitar limites de taxa (rate limits), a aplicaÃ§Ã£o utiliza uma estratÃ©gia de **Multi-LLM distribuÃ­do** via Supabase Edge Functions.

**Providers DisponÃ­veis:**
1. **Google Gemini (PrimÃ¡rio)**: Alta qualidade para revisÃµes e anÃ¡lise detalhada.
2. **Cerebras (Velocidade)**: Utilizado para respostas instantÃ¢neas quando disponÃ­vel.
3. **Groq (ResiliÃªncia)**: Fallback robusto baseado em Llama 3.

### 9.2 EstratÃ©gia de Fallback e Paralelismo
A funÃ§Ã£o `generate-analysis` realiza trÃªs chamadas pesadas simultaneamente. Para otimizar, distribuÃ­mos a carga inicial entre diferentes providers:

| Task | Provider PrimÃ¡rio | Ordem de Fallback |
|------|-------------------|-------------------|
| **ATS Review** | Gemini 2.0 Flash | â†’ Cerebras â†’ Groq |
| **CV Otimizado** | Cerebras (Llama 70B) | â†’ Gemini â†’ Groq |
| **Vagas (Jobs)** | Groq (Llama 70B) | â†’ Cerebras â†’ Gemini |

### 9.3 ImplementaÃ§Ã£o (Edge Function)
A lÃ³gica reside em `supabase/functions/generate-analysis/index.ts`. O frontend apenas invoca a funÃ§Ã£o enviando o Bearer Token do usuÃ¡rio.

```typescript
// LÃ³gica interna simplificada:
async function callAI(prompt, preference) {
  // Tenta o preferido, se falhar ou timeout, tenta o prÃ³ximo da lista
  // ProteÃ§Ã£o contra rate-limit e indisponibilidade de API
}
```

### 9.4 Prompts Estruturados
*   **Prompt 1 (Raio-X ATS)**: Diagnóstico de 5 seções + Validação de certificações locais.
*   **Prompt 2 (Reescrita CV)**: Geração de Markdown compatível com padrões canadenses.
*   **Prompt 3 (LinkedIn)**: Extração de dados estruturados para perfil (Headline, About, etc).
*   **Prompt 4 (Vagas)**: Sugestão de vagas baseada em NOC e Província.

### 9.5 Estratégia de Análise Híbrida (Client-side vs Server-side)
Para otimizar os custos com tokens de Inteligência Artificial e entregar uma experiência instantânea no funil de vendas, o projeto aplica a seguinte arquitetura de validação do Currículo:

1. **Preview Gratuito (Client-side / Browser):** O upload do currículo (via `pdfjs-dist`) e a primeira avaliação (Free ATS Preview), ocorrem integralmente no frontend (`StepUpload.tsx`). Um motor proprietário em TypeScript analisa o currículo utilizando regras rigorosas baseadas em Expressões Regulares de "Deal-breakers" Canadenses (foto, dados sensíveis, idioma, falta de verbos de ação). Isso exibe os erros para o usuário **sem consumir nenhuma cota ou envolver APIs de LLM**.
2. **Análise Premium (Server-side / Edge Functions):** Após a conversão no painel de pagamento, a Edge Function (`generate-analysis`) é invocada. Somente neste momento os agentes LLMs (Gemini, Groq, Cerebras) processam o documento utilizando prompts complexos para reescrita estrutural, análise profunda de habilidades, busca de LinkedIn e Matching Profissional.

---

## 10. IntegraÃ§Ã£o AbacatePay (Pagamentos)

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
3. UsuÃ¡rio paga na AbacatePay.
4. AbacatePay aciona a funÃ§Ã£o `abacatepay-webhook` (Edge Func).
5. Webhook atualiza `is_premium: true` no perfil via Service Role no Supabase.

---

## 11. ExportaÃ§Ã£o PDF

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
| Tablet     | 640-1024  | 2 colunas onde aplicÃ¡vel |
| Desktop    | > 1024px  | Layout completo          |

**Checklist:** aria-labels, contraste 4.5:1, navegaÃ§Ã£o Tab, alt text, focus ring, `role="progressbar"`.

---

## 13. VariÃ¡veis de Ambiente

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

### Sprint 1 â€” FundaÃ§Ã£o (3 dias)
- [x] Criar projeto Vite + React + TS
- [x] Configurar Tailwind CSS 4 + shadcn/ui
- [x] Configurar React Router v7 + Zustand
- [x] Criar Layout (Header, Footer)
- [x] Design tokens (cores, fontes)

### Sprint 2 â€” Landing Page (3 dias)
- [x] Hero section com CTA
- [x] SeÃ§Ã£o "Como Funciona" (3 passos)
- [x] Social Proof / Depoimentos
- [x] FAQ com accordion
- [x] CTA final + animaÃ§Ãµes

### Sprint 3 â€” Wizard (4 dias)
- [x] WizardContainer + progress bar
- [x] Step 1: NOC + ProvÃ­ncia (Zod)
- [x] Step 2: Textarea + upload PDF
- [x] Step 3: Loading animado + Gemini Prompt 1 + Score gauge
- [x] Step 4: Paywall UI

### Sprint 4 â€” Auth + Pagamento (3 dias)
- [x] Supabase project setup & SQL Table creation
- [x] Supabase Auth (Google OAuth)
- [x] ProtectedRoute component
- [x] AbacatePay API Integration (Checkout)
- [x] Webhook para atualizar `is_premium` no Supabase

### Sprint 5 â€” Dashboard Premium (4 dias)
- [x] Tabs layout (shadcn)
- [x] Aba CV/ATS: Gemini SDK â†’ AvaliaÃ§Ã£o ATS e Rewrite completo
- [x] AÃ§Ã£o de Baixar CurrÃ­culo: ExportaÃ§Ã£o HTML para PDF (`html2pdf.js`)
- [x] PersistÃªncia: Banco de Dados registrando as respostas com resiliÃªncia
- [x] Aba Vagas: Gemini SDK â†’ Lista de oportunidades reais baseadas no NOC e ProvÃ­ncia
- [x] Estados de carregamento e interface Premium

### Sprint 6 â€” Polish & Deploy (3 dias)
- [ ] Testes manuais E2E
- [x] SEO: meta tags, OG, titles
- [x] Performance: lazy loading de rotas, otimizar imagens
- [x] Responsividade mobile/tablet/desktop
- [x] Acessibilidade (Lighthouse â‰¥ 90)
- [ ] Deploy (Cloudflare Pages)
- [ ] Configurar domÃ­nio customizado (Opcional)

> **Tempo total estimado: ~20 dias Ãºteis**

---

## CritÃ©rios de ConclusÃ£o (Definition of Done)

1. âœ… Landing page funcional e responsiva
2. âœ… Wizard completo: contexto â†’ upload â†’ anÃ¡lise â†’ paywall
3. âœ… Login com Google funcionando via Supabase
4. âœ… Pagamento AbacatePay processando (PIX/CartÃ£o)
5. âœ… Dashboard com 3 abas via Gemini
6. âœ… ExportaÃ§Ã£o PDF do currÃ­culo
7. âœ… BotÃµes "Copiar" no LinkedIn
8. âœ… Lighthouse â‰¥ 90 (Performance + Accessibility + SEO)
9. âœ… Deploy em produÃ§Ã£o via Cloudflare Pages

---

## 15. Setup de Edge Functions (AbacatePay)

### 15.1 VisÃ£o Geral

As Edge Functions handle the secure communication with AbacatePay for payment processing, keeping API keys off the frontend.

### 15.2 FunÃ§Ãµes Criadas

| FunÃ§Ã£o | Endpoint | PropÃ³sito |
|--------|----------|-----------|
| `generate-analysis` | `/functions/v1/generate-analysis` | Processa anÃ¡lise completa via IA (Gemini/Groq) |
| `create-checkout` | `/functions/v1/create-checkout` | Gera URL de checkout (AbacatePay) |
| `abacatepay-webhook` | `/functions/v1/abacatepay-webhook` | Recebe confirmaÃ§Ã£o de pagamento |

### 15.3 ConfiguraÃ§Ã£o (Supabase Dashboard)

1. Acesse **Supabase Dashboard** â†’ **Edge Functions** â†’ **Secrets**

2. Adicione os seguintes secrets:
   ```
   ABACATEPAY_API_KEY=sua_chave_da_abacatepay
   ABACATEPAY_WEBHOOK_SECRET=seu_webhook_secret
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
   ```

3. Para obter `SUPABASE_SERVICE_ROLE_KEY`:
   - Supabase Dashboard â†’ **Project Settings** â†’ **API**
   - Copie a chave `service_role` (nÃ£o use a anon key!)

### 15.4 Configurar Webhook na AbacatePay

1. Acesse seu dashboard na **AbacatePay**
2. VÃ¡ em **ConfiguraÃ§Ãµes** â†’ **Webhooks**
3. Adicione o endpoint:
   ```
   https://kbtbttdwkdtugrcgzwcn.supabase.co/functions/v1/abacatepay-webhook
   ```
4. Copie o **Webhook Secret** e adicione nos Edge Function Secrets

### 15.5 Secrets NecessÃ¡rios

| Secret | DescriÃ§Ã£o |
|--------|-----------|
| `ABACATEPAY_API_KEY` | Chave da API AbacatePay (nÃ£o exponha!) |
| `ABACATEPAY_WEBHOOK_SECRET` | Assinatura para validar webhooks |
| `GEMINI_API_KEY` | Chave da API Google Gemini para anÃ¡lise |
| `GROQ_API_KEY` | Chave da API Groq (fallback de anÃ¡lise) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin do Supabase (nÃ£o exponha!) |

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

- Logs: **Supabase Dashboard** â†’ **Edge Functions** â†’ **Logs**
- MÃ©tricas: Verifique o dashboard da AbacatePay para status de pagamentos

### 15.8 Troubleshooting

| Problema | Causa ProvÃ¡vel | SoluÃ§Ã£o |
|----------|----------------|---------|
| `401 Invalid JWT` | Deploy sem a flag `--no-verify-jwt` | Refazer o deploy da funÃ§Ã£o com a flag: `npx supabase functions deploy <nome> --no-verify-jwt`. |
| `401 Unauthorized` (Webhook) | `ABACATEPAY_WEBHOOK_SECRET` incorreto | Verificar o secret no dashboard da AbacatePay e atualizar nos Secrets do Supabase. |
| AnÃ¡lise travada (ex: em 75%) | Secrets de IA ausentes | Garanta que `GEMINI_API_KEY` e `GROQ_API_KEY` estÃ£o configurados no Supabase. |
| `is_premium` nÃ£o atualiza | Falha na Service Role ou RLS | Verificar logs da funÃ§Ã£o `abacatepay-webhook` e permissÃµes da tabela `profiles`. |
| Erro de timeout na anÃ¡lise | Rate limit em Ãºnico provider | Confirmar que as chamadas estÃ£o sendo distribuÃ­das entre Gemini, Cerebras e Groq. |

### 15.9 Checklist de Deploy (ObrigatÃ³rio)

Sempre que realizar o deploy de uma Edge Function, siga estes passos para evitar erros conhecidos:

1. **Deploy com Bypass de JWT:**
   ```bash
   npx supabase functions deploy <NOME_DA_FUNCAO> --no-verify-jwt --project-ref kbtbttdwkdtugrcgzwcn
   ```

2. **VerificaÃ§Ã£o de Secrets:**
   ```bash
   npx supabase secrets list --project-ref kbtbttdwkdtugrcgzwcn
   ```
   *Certifique-se de que ABACATEPAY_API_KEY, ABACATEPAY_WEBHOOK_SECRET, GEMINI_API_KEY, GROQ_API_KEY e SUPABASE_SERVICE_ROLE_KEY estÃ£o lÃ¡.*
