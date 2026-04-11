# 🛠️ Relatório de Correções — Erro 401 e Travamento na Geração de Currículo

**Data:** 10/04/2026  
**Projeto:** CurrículoCanada (curriculo-canada)  
**Status:** ✅ Resolvido

---

## Resumo Executivo

A geração de currículo falhava com o erro `"Sessão expirada ou não autorizado (401). Faça login novamente."` e, após a primeira correção, travava em 75% sem resposta. Foram identificadas e corrigidas **3 causas raiz** distintas que se somavam.

---

## Problema 1: JWT Rejeitado pelo API Gateway do Supabase

### Sintoma
```
HTTP 401: {"code":401,"message":"Invalid JWT"}
```
O erro ocorria antes da Edge Function executar — o **API Gateway do Supabase** rejeitava o JWT.

### Causa Raiz
A Edge Function `generate-analysis` estava deployada **com verificação JWT no Gateway habilitada**. O arquivo local `supabase/functions/generate-analysis/config.toml` tinha `verify_jwt = false`, mas essa configuração **só funciona localmente** — não se aplica ao deploy remoto.

### Correção
```bash
npx supabase functions deploy generate-analysis --no-verify-jwt --project-ref kbtbttdwkdtugrcgzwcn
```

> [!IMPORTANT]
> A flag `--no-verify-jwt` no deploy é necessária porque a Edge Function já faz validação de autenticação internamente usando `supabase.auth.getUser(token)` com a `SUPABASE_SERVICE_ROLE_KEY`. A verificação dupla pelo Gateway é redundante.

### Arquivos afetados
- Nenhum arquivo modificado — apenas configuração de deploy

### Como reproduzir se voltar
Se alguém fizer `supabase functions deploy generate-analysis` **sem** `--no-verify-jwt`, o problema volta.

---

## Problema 2: Ausência de GEMINI_API_KEY nos Secrets + Rate Limit do Groq

### Sintoma
Após corrigir o 401, a análise travava indefinidamente em 75% sem retornar resposta.

### Causa Raiz
Nos **Secrets** da Edge Function no Supabase, faltava a `GEMINI_API_KEY`. A Edge Function faz 3 chamadas de IA em paralelo (ATS Review, CV Otimizado, Vagas) e o fluxo de fallback era:

1. ~~Cerebras~~ → `CEREBRAS_API_KEY` **ausente** → pulado  
2. ~~Gemini~~ → `GEMINI_API_KEY` **ausente** → pulado  
3. Groq → `GROQ_API_KEY` presente → **todas 3 chamadas caíam aqui**

Com 3 chamadas paralelas no Groq, o rate limit era atingido, causando retries com backoff exponencial que faziam a Edge Function exceder o timeout de execução.

### Correção
```bash
npx supabase secrets set GEMINI_API_KEY=AIzaSyAHPbgluMRR0bL8Iih6mcp4K8DG3Vfy3KY --project-ref kbtbttdwkdtugrcgzwcn
```

E a Edge Function foi atualizada para **distribuir chamadas entre providers**:

| Chamada | Provider Primário | Fallbacks |
|---------|:---:|---|
| ATS Review | **Gemini** | → Cerebras → Groq |
| CV Otimizado | **Cerebras** | → Gemini → Groq |
| Vagas | **Groq** | → Cerebras → Gemini |

### Arquivos afetados
- [index.ts](file:///i:/Projetos/curriculo-canada/supabase/functions/generate-analysis/index.ts) — Adicionadas funções `callAI_GeminiFirst()` e `callAI_GroqFirst()` + logs de timing

### Como reproduzir se voltar
Se a `GEMINI_API_KEY` expirar ou for removida dos Secrets, todas as chamadas voltam a cair no Groq e o problema retorna.

---

## Problema 3: Frontend sem Timeouts + Progresso Travado

### Sintoma
A barra de progresso parava em 75% e nunca mostrava erro — ficava pendurada indefinidamente.

### Causa Raiz
Três problemas no frontend:

1. **`refreshSession()` sem timeout** — poderia travar indefinidamente aguardando resposta do Supabase Auth
2. **`fetch()` sem AbortController** — a chamada à Edge Function não tinha timeout nenhum. Se a função demorasse 5 minutos, o fetch ficaria esperando 5 minutos
3. **Barra de progresso com apenas 6 mensagens** — o timer parava em 75% (mensagem 5 de 6) e ficava ali para sempre

### Correção

#### `aiProvider.ts` — Reescrito com proteções:

```typescript
// ANTES: refreshSession() sem timeout podia pendurar
const { data: refreshData } = await supabase.auth.refreshSession()

// DEPOIS: getSession() primeiro (cache, rápido) + timeouts em tudo
const { data: { session } } = await withTimeout(
  supabase.auth.getSession(), 5000, 'getSession'
)
```

```typescript
// ANTES: fetch sem timeout
const response = await fetch(functionUrl, { ... })

// DEPOIS: AbortController com 90s de timeout
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 90000)
const response = await fetch(functionUrl, { ..., signal: controller.signal })
```

Outras melhorias:
- `getSession()` primeiro (rápido, do cache) → `refreshSession()` só se token expirando
- Retries reduzidos de 4 para 3
- Sem retry para erros 4xx (validação, auth)
- Mensagens de erro reais do servidor (não mais genéricas)

#### `StepAnalysis.tsx` — Progresso melhorado:

```typescript
// ANTES: 6 mensagens, parava em 75%
const messages = [/* 6 items */]
setInterval(() => { ... }, 2000)

// DEPOIS: 10 mensagens, vai até 95% + timeout global de 120s
const messages = [/* 10 items */]
setInterval(() => { ... }, 3000)
const globalTimeout = setTimeout(() => {
  setError("A análise demorou mais do que o esperado.")
}, 120000)
```

### Arquivos afetados
- [aiProvider.ts](file:///i:/Projetos/curriculo-canada/src/lib/aiProvider.ts) — Reescrito completamente
- [StepAnalysis.tsx](file:///i:/Projetos/curriculo-canada/src/components/wizard/StepAnalysis.tsx) — Progress bar e timeout global

---

## Checklist de Deploy da Edge Function

Ao fazer qualquer modificação na Edge Function `generate-analysis`, siga estes passos:

```bash
# 1. Deploy com --no-verify-jwt (OBRIGATÓRIO)
npx supabase functions deploy generate-analysis --no-verify-jwt --project-ref kbtbttdwkdtugrcgzwcn

# 2. Verificar que os Secrets necessários existem
npx supabase secrets list --project-ref kbtbttdwkdtugrcgzwcn
```

### Secrets obrigatórios:
| Secret | Descrição |
|--------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (admin) |
| `GROQ_API_KEY` | API key do Groq (LLM provider) |
| `GEMINI_API_KEY` | API key do Google Gemini (LLM provider) |

### Secrets opcionais:
| Secret | Descrição |
|--------|-----------|
| `CEREBRAS_API_KEY` | API key do Cerebras (LLM provider — mais rápido) |

---

## Diagrama do Fluxo Corrigido

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant S as Supabase Gateway
    participant EF as Edge Function
    participant G as Gemini
    participant Q as Groq

    U->>F: Clica "Gerar Currículo"
    F->>F: getSession() (cache, 5s timeout)
    F->>F: refreshSession() se token expirando (10s timeout)
    F->>S: POST /generate-analysis (Bearer token, 90s timeout)
    
    Note over S: --no-verify-jwt<br/>Gateway NÃO valida JWT
    
    S->>EF: Forward request
    EF->>EF: auth.getUser(token) — validação interna
    EF->>EF: Verificar is_premium
    
    par Chamadas paralelas distribuídas
        EF->>G: ATS Review (Gemini-first)
        EF->>G: CV Otimizado (Gemini-first)
        EF->>Q: Vagas (Groq-first)
    end
    
    G-->>EF: Respostas
    Q-->>EF: Respostas
    EF->>EF: Salvar no banco (analyses)
    EF-->>F: 200 OK + JSON
    F->>U: Redireciona para /dashboard
```

---

## Troubleshooting Rápido

| Erro | Causa provável | Solução |
|------|---------------|---------|
| `401 Invalid JWT` do Gateway | Deploy sem `--no-verify-jwt` | Redeploy com a flag |
| `403 Premium subscription required` | Usuário não é premium | Verificar `profiles.is_premium` no banco |
| `404 User profile not found` | Profile não criado | Verificar tabela `profiles` |
| Trava sem erro | API keys ausentes nos Secrets | Verificar `npx supabase secrets list` |
| Trava sem erro | Groq com rate limit | Adicionar `GEMINI_API_KEY` e/ou `CEREBRAS_API_KEY` |
| `A análise demorou demais` | Edge Function timeout | Verificar logs no dashboard do Supabase |
| `Sessão não encontrada` | Token expirado, sem refresh token | Usuário deve fazer logout/login |
