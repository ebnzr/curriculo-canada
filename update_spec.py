# -*- coding: utf-8 -*-
import sys

# Ler o arquivo SPEC.md
with open('SPEC.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Encontrar e substituir a seção 9
old_section = """## 9. Integração Google Gemini (IA)

### 9.1 Arquitetura
A IA é orquestrada via Supabase Edge Functions para manter as chaves de API seguras no backend.

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
**Prompt 1 — Raio-X ATS:**
> Você é um Analista de RH e Recrutador Especialista pelo mercado do Canadá. Analise o currículo e gere uma avaliação ATS forte. Analise verbos de ação, uso de métricas (quantificação) e o formato do Canadá (sem fotos, dados pessoais extras). Devolva em formato puro de Markdown.

**Prompt 2 — Reescrita CV:**
> Reescreva em formato ATS canadense (Markdown). Seções: Professional Summary, Work Experience, Education, Skills. Verbos de ação, métricas, keywords NOC + província.

> **Nota:** Todos os prompts retornam JSON ou Markdown conforme indicado. Usar `JSON.parse()` com try/catch para os que retornam JSON."""

new_section = """## 9. Integração de Inteligência Artificial (Multi-LLM)

### 9.1 Arquitetura de Orquestração
Para garantir alta disponibilidade e evitar limites de taxa (rate limits), a aplicação utiliza uma estratégia de **Multi-LLM distribuído** via Supabase Edge Functions.

**Providers Disponíveis:**
1. **Google Gemini (Primário)**: Alta qualidade para revisões e análise detalhada.
2. **Cerebras (Velocidade)**: Utilizado para respostas instantâneas quando disponível.
3. **Groq (Resiliência)**: Fallback robusto baseado em Llama 3.3.

### 9.2 Estratégia de Fallback e Paralelismo
A função `generate-analysis` realiza quatro chamadas pesadas simultaneamente. Para otimizar, distribuímos a carga inicial entre diferentes providers:

| Task | Provider Primário | Ordem de Fallback | Tempo Médio |
|------|-------------------|-------------------|-------------|
| **ATS Review** | Gemini 2.0 Flash | → Cerebras → Groq | ~15-25s |
| **CV Otimizado** | Cerebras (Llama 3.3 70B) | → Gemini → Groq | ~8-15s |
| **Vagas (Jobs)** | Groq (Llama 3.3 70B) | → Cerebras → Gemini | ~5-10s |
| **LinkedIn Profile** | Gemini 2.0 Flash | → Cerebras → Groq | ~10-18s |

**Lógica de Distribuição:**
- **Prompts longos** (ATS, LinkedIn): Gemini-first para qualidade superior
- **Prompts médios** (CV): Cerebras-first para velocidade com qualidade
- **Prompts curtos** (Jobs): Groq-first para resposta rápida
- **Retry automático**: Até 3 tentativas com backoff exponencial (2s, 4s, 8s)

### 9.3 Implementação (Edge Function)
A lógica reside em `supabase/functions/generate-analysis/index.ts`. O frontend invoca a função enviando o token de autenticação.

**Fluxo de Execução:**
```typescript
// 1. Obter token de autenticação (com timeout de 5s)
const accessToken = await getAccessToken()

// 2. Preparar prompts com dados do currículo
const { atsPrompt, optimizedCvPrompt, jobsPrompt, linkedinPrompt } = buildPrompts(...)

// 3. Executar em paralelo com timeout de 120s cada
const [atsText, cvText, jobsText, linkedinText] = await Promise.all([
  withTimeout(callAI_GeminiFirst(atsPrompt), 120000),        // ATS → Gemini-first
  withTimeout(callAI(optimizedCvPrompt), 120000),           // CV → Cerebras-first
  withTimeout(callAI_GroqFirst(jobsPrompt), 120000),        // Jobs → Groq-first
  withTimeout(callAI_GeminiFirst(linkedinPrompt), 120000),  // LinkedIn → Gemini-first
])

// 4. Parsear JSONs e salvar no banco
// 5. Retornar resultado completo
```

**Funções de Fallback Especializadas:**
- `callAI()`: Cerebras → Gemini → Groq (ordem padrão)
- `callAI_GeminiFirst()`: Gemini → Cerebras → Groq (para prompts longos)
- `callAI_GroqFirst()`: Groq → Cerebras → Gemini (para prompts curtos)

### 9.4 Prompts Estruturados
*   **Prompt 1 (Raio-X ATS)**: Diagnóstico completo com 5 seções (Formatação, Verbos, Métricas, Keywords, Certificações canadenses).
*   **Prompt 2 (Reescrita CV)**: Geração de Markdown compatível com padrões canadenses (Professional Summary, Work Experience, Education, Skills).
*   **Prompt 3 (LinkedIn Profile)** **[NOVO]**: Extração de dados estruturados para perfil completo (Headline, About, Experiências, Educação, Skills, Certificações, Idiomas). **Regra estrita**: usar APENAS dados do currículo original.
*   **Prompt 4 (Vagas)**: Sugestão de 3-5 vagas reais no Canadá baseadas em NOC e Província, com match % calculado.

### 9.5 Autenticação com Timeout e Retry
O sistema de autenticação foi aprimorado para evitar timeouts e falhas de sessão:

**Estratégia de Obtenção de Token:**
```typescript
async function getAccessToken(): Promise<string> {
  // 1. Tentar getSession (cache, 5s timeout)
  const session = await withTimeout(supabase.auth.getSession(), 5000)
  
  // 2. Verificar expiração (margem de 2 minutos)
  if (expiresAt > now + 120) return token
  
  // 3. Refresh pró-ativo se próximo da expiração
  const refreshed = await supabase.auth.refreshSession()
  
  // 4. Fallback: usar token existente mesmo se expirando
  return token
}
```

**Retry no Frontend:**
- Timeout total: 90 segundos por requisição
- Até 3 tentativas automáticas
- Backoff exponencial: 2s, 4s, 8s entre tentativas

### 9.6 Tratamento de Erros e Mensagens

| Código HTTP | Causa | Mensagem ao Usuário |
|-------------|-------|---------------------|
| 401/403 | Token expirado/inválido | "Sessão expirada. Faça login novamente." |
| 429 | Rate limit excedido | "Limite diário atingido. Tente amanhã." |
| 500/503 | Erro interno/serviço indisponível | "Serviço temporariamente indisponível. Aguarde 1 minuto." |
| Timeout | Análise demorou mais de 90s | "A análise demorou demais. Tente novamente." |

> **Nota**: Todos os prompts retornam JSON ou Markdown conforme indicado. O sistema faz parse automático com tratamento de erros para respostas malformadas."""

# Substituir
if old_section in content:
    content = content.replace(old_section, new_section)
    print("✅ Seção 9 encontrada e atualizada!")
else:
    print("❌ Seção 9 não encontrada com o padrão exato")
    # Tentar encontrar parcialmente
    if "## 9. Integração Google Gemini (IA)" in content:
        print("✓ Encontrou o título da seção 9")
    if "### 9.1 Arquitetura" in content:
        print("✓ Encontrou a subseção 9.1")
    sys.exit(1)

# Salvar o arquivo atualizado
with open('SPEC.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Arquivo SPEC.md atualizado com sucesso!")
