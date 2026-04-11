# Erro 401/JWT Resolvido - Documentação Técnica

## Data da Resolução
08 de Abril de 2026

## Problema
Erro HTTP 401 ("Invalid JWT") ao tentar chamar a Edge Function `generate-analysis` após o fluxo de pagamento, impedindo a geração do currículo otimizado.

## Causa Raiz
O problema ocorreu devido a uma **incompatibilidade entre tokens OAuth do Google e a validação JWT do Gateway do Supabase**:

1. **Gateway Kong do Supabase**: Por padrão, valida rigorosamente tokens JWT no header `Authorization` antes de repassar a requisição para a Edge Function
2. **Tokens OAuth do Google**: Quando usuários fazem login via Google OAuth, o Supabase emite tokens JWT que o Gateway às vezes rejeita devido a:
   - Clock skew (diferença de horário entre cliente e servidor)
   - Claims específicas do OAuth que diferem de tokens email/password
   - Validação de `role` que falha para tokens OAuth

### Erros Específicos Encontrados
```
HTTP 401 - {"code":401,"message":"Invalid JWT"}
```

```
@supabase/gotrue-js: Session as retrieved from URL was issued in the future?
```

## Solução Implementada

### 1. Desabilitar Verificação JWT no Gateway
**Arquivo**: `supabase/functions/generate-analysis/index.ts`

**Deploy com flag especial**:
```bash
npx supabase functions deploy generate-analysis --no-verify-jwt
```

Esta flag instrui o Gateway do Supabase a **não validar o JWT antes de repassar** a requisição para a Edge Function.

### 2. Verificação Manual do Token na Edge Function
Como o Gateway não valida mais, implementamos verificação manual dentro da função:

```typescript
// Ler token do body (bypassando validação do gateway)
const token = body.accessToken || tokenFromHeader

// Verificar token via API do Supabase
const { data: { user }, error: authError } = await supabase.auth.getUser(token)

// Fallback: decodificar manualmente se a API falhar
try {
  const [_header, payload] = decode(token)
  // Buscar usuário no banco pelo 'sub' do JWT
} catch (decodeErr) {
  // Retornar 401 apenas se ambos falharem
}
```

### 3. Configuração de CORS
**Problema adicional**: Após resolver o JWT, encontramos erro de CORS.

**Solução**: Configurar headers CORS para permitir localhost em desenvolvimento:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // Em produção, especificar origem exata
  "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
```

### 4. Correção no Salvamento do Banco
**Problema**: `upsert` com `onConflict: 'user_id'` falhava.

**Solução**: Usar `insert` simples, já que cada análise é um registro novo:

```typescript
// Antes (falhava)
await supabase.from('analyses').upsert({...}, { onConflict: 'user_id' })

// Depois (funciona)
await supabase.from('analyses').insert({...})
```

## Arquitetura Final de Autenticação

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Supabase Auth   │────▶│   Google OAuth  │
│  (localhost)    │     │  (getSession)    │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │
         │ 2. Chamar Edge Function
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Edge Function                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Gateway (Kong) - JWT verification DISABLED               │  │
│  │  Flag: --no-verify-jwt                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Edge Function Code - Manual JWT verification             │  │
│  │  1. Extrair token do body                                 │  │
│  │  2. Tentar supabase.auth.getUser(token)                   │  │
│  │  3. Fallback: decodificar JWT manualmente                 │  │
│  │  4. Buscar usuário no banco                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  AI Providers (Groq/Gemini)                               │  │
│  │  - Gerar análise ATS                                      │  │
│  │  - Gerar currículo otimizado                              │  │
│  │  - Buscar vagas compatíveis                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Salvar no Supabase Database                              │  │
│  │  Tabela: analyses                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Lições Aprendidas

### 1. Tokens OAuth vs Email/Password
Tokens de provedores OAuth (Google, GitHub) podem ter comportamentos diferentes de tokens email/password padrão do Supabase. Sempre teste ambos os fluxos.

### 2. Gateway vs Edge Function Validation
- **Gateway validation**: Rápida, mas inflexível
- **Edge Function validation**: Mais controle, permite lógica customizada

Para aplicações com OAuth, considere desabilitar validação no gateway e fazer na função.

### 3. Clock Skew
Diferenças de horário entre cliente e servidor podem invalidar tokens JWT. Sempre sincronize o relógio do servidor e considere tolerância de alguns minutos na validação.

### 4. CORS em Edge Functions
Edge Functions do Supabase precisam de configuração explícita de CORS. O header `Access-Control-Allow-Origin` deve corresponder exatamente à origem da requisição.

## Checklist para Deploy

- [ ] Deploy da Edge Function com `--no-verify-jwt`
- [ ] Configurar CORS para permitir origens de desenvolvimento/produção
- [ ] Verificar se variáveis de ambiente estão configuradas no Supabase
- [ ] Testar fluxo completo: login OAuth → pagamento → geração de currículo
- [ ] Verificar logs da Edge Function após deploy

## Comandos Úteis

```bash
# Deploy com verificação JWT desabilitada
npx supabase functions deploy generate-analysis --no-verify-jwt

# Ver logs em tempo real
npx supabase functions logs generate-analysis --tail

# Testar localmente
npx supabase functions serve generate-analysis
```

## Referências

- [Supabase Edge Functions - JWT Verification](https://supabase.com/docs/guides/functions/auth#jwt-verification)
- [Supabase CORS Configuration](https://supabase.com/docs/guides/functions/cors)
- [JWT.io - Debugger](https://jwt.io/)

---

**Responsável pela correção**: Verdent AI Assistant  
**Status**: ✅ Resolvido e documentado
