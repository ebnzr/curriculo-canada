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

---

## Problema 3: Frontend sem Timeouts + Progresso Travado

### Sintoma
A barra de progresso parava em 75% e nunca mostrava erro — ficava pendurada indefinidamente.

### Causa Raiz
Três problemas no frontend:

1. **`refreshSession()` sem timeout** — poderia travar indefinidamente aguardando resposta do Supabase Auth
2. **`fetch()` sem AbortController** — a chamada à Edge Function não tinha timeout nenhum. Se a função demorasse 5 minutos, o fetch ficaria esperando 5 minutos
3. **Barra de progresso com apenas 6 mensagens** — o timer parava em 75% (mensagem 5 de 6) e ficava ali para sempre

---

## checklist de Deploy da Edge Function

Ao fazer qualquer modificação na Edge Function `generate-analysis`, siga estes passos:

```bash
# 1. Deploy com --no-verify-jwt (OBRIGATÓRIO)
npx supabase functions deploy generate-analysis --no-verify-jwt --project-ref kbtbttdwkdtugrcgzwcn

# 2. Verificar que os Secrets necessários existem (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, GEMINI_API_KEY)
npx supabase secrets list --project-ref kbtbttdwkdtugrcgzwcn
```

---

## Troubleshooting Rápido

| Erro | Causa provável | Solução |
|------|---------------|---------|
| `401 Invalid JWT` | Deploy sem `--no-verify-jwt` | Redeploy com a flag |
| Trava sem erro | API keys ausentes nos Secrets | Verificar `npx supabase secrets list` |
| `A análise demorou demais` | Edge Function timeout | Verificar logs no dashboard do Supabase |
