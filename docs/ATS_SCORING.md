# Critérios de Avaliação e Pontuação ATS

## Visão Geral

O sistema de análise ATS (Applicant Tracking System) utiliza uma pontuação de **0 a 100 pontos** baseada em heurísticas que simulam a triagem automática usada por recrutadores canadenses.

A pontuação é calculada localmente no frontend antes do envio para análise completa por IA, permitindo feedback imediato ao usuário.

---

## Estrutura da Pontuação

```
Pontuação Inicial: 100 pontos
  ↓ (subtrações por problemas encontrados)
Pontuação Final: 0-100 pontos
  ↓ (classificação em faixas)
Status: Bom / Regular / Crítico
```

---

## 1. Fatores Eliminatórios (Deal-breakers)

Erros críticos que descartam o currículo imediatamente no mercado canadense.

### 1.1 Foto ou Imagem
- **Regex:** `/\b(foto|photo|imagem|image|picture|retrato|perfil\.jpg|perfil\.png)\b/i`
- **Penalidade:** -30 pontos
- **Motivo:** No Canadá, currículos com foto são descartados automaticamente pela triagem ATS
- **Impacto:** Ativa `hasDealbreaker` (limite máximo de 35 pontos)

### 1.2 Dados Pessoais Sensíveis
- **Regex:** `/\b(cpf|rg|cnh|estado civil|marital status|data de nascimento|date of birth|idade|age|nacionalidade|nationality|casad[oa]|solteir[oa]|brasileir[oa]|sexo|gender|masculino|feminino|male|female|dob)\b/i`
- **Regex CPF:** `/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/`
- **Penalidade:** -30 pontos
- **Motivo:** Prática estritamente proibida em seleções norte-americanas (discriminação)
- **Impacto:** Ativa `hasDealbreaker` (limite máximo de 35 pontos)

### 1.3 Idioma Apenas em Português
- **Regex PT:** `/\b(experiência profissional|formação acadêmica|dados pessoais|ensino fundamental|ensino médio|objetivo profissional|qualificações)\b/i`
- **Regex EN (validação):** `/\b(experience|education|skills|summary|profile|project|university|degree|bachelor|master)\b/i`
- **Penalidade:** -40 pontos
- **Motivo:** O ATS canadense não consegue fazer parsing adequado de currículos 100% em português
- **Impacto:** Ativa `hasDealbreaker` (limite máximo de 35 pontos)

> **Nota:** Se qualquer deal-breaker for encontrado, a pontuação máxima é limitada a 35 pontos, independente de outros fatores.

---

## 2. Avaliação Estrutural

Problemas que afetam a capacidade do ATS de extrair informações corretamente.

| Critério | Regex/Validação | Penalidade | Motivo |
|----------|-----------------|------------|--------|
| **E-mail ausente** | `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/` | -20 | Impossibilita contato do recrutador |
| **Experiência não detectada** | `/\b(experience\|history\|experiência\|trabalho\|emprego\|employment)\b/i` | -15 | ATS não consegue validar tempo de experiência |
| **Educação não detectada** | `/\b(education\|formação\|graduação\|universidade\|university\|bachelor\|master\|mba\|bacharelado\|mestrado\|degree\|college)\b/i` | -15 | Requisito acadêmico não verificável |
| **Skills não detectadas** | `/\b(skills\|competências\|habilidades\|tecnologias\|technologies\|tools\|ferramentas\|expertise\|proficiencies)\b/i` | -10 | ATS não consegue validar match com vaga |
| **LinkedIn omitido** | `/linkedin\.com/i` | -10 | 80% dos recrutadores canadenses usam dupla verificação |

---

## 3. Avaliação de Impacto

Qualidade do conteúdo e conformidade com padrões modernos.

| Critério | Validação | Penalidade | Motivo |
|----------|-----------|------------|--------|
| **Falta de métricas** | Números + `%` ou `$` ou palavras de resultado (aumentou, reduziu, crescimento, etc.) | -10 | ATS prioriza resultados quantificáveis |
| **Falta de verbos de ação** | `/\b(managed\|led\|delivered\|achieved\|designed\|developed\|created\|implemented\|optimized\|spearheaded\|orchestrated\|coorden\|gerenci\|lider\|desenvolv\|cri)\b/i` | -10 | Reduz escore semântico do currículo |
| **Texto muito curto** | `< 500 caracteres` | -15 | Volume insuficiente para indexação |
| **Texto muito longo** | `> 2500 palavras` | -10 | Penalidade de legibilidade (padrão: 1-2 páginas) |
| **Expressões obsoletas** | `/\b(referências\|references available\|disponíveis sob demanda)\b/i` | -5 | Indica não conformidade com templates modernos |

---

## 4. Reguladores de Pontuação

### Cap por Deal-breakers
```typescript
if (hasDealbreaker && score > 35) {
  score = 35; // Força status "Reprovável Crítico"
}
```

### Limite Superior
```typescript
score = Math.min(score, 100);
```

### Pontuação Padrão (Sem Issues)
Se nenhum problema for encontrado, a pontuação padrão é **88 pontos**:
```typescript
if (issues.length === 0) {
  score = 88;
  // Mensagem: Requer análise de IA para garantir compatibilidade sintática
}
```

> **Nota:** A pontuação 88 representa que o currículo atende aos requisitos estruturais básicos, mas requer validação adicional por IA para considerar compatibilidade com NOCs específicos.

---

## 5. Classificação por Faixas

A interface visual classifica a pontuação em três categorias:

| Faixa | Categoria | Cor | Significado |
|-------|-----------|-----|-------------|
| **≥ 70** | Bom / Competitivo | Verde | Currículo adequado para o mercado canadense |
| **40 - 69** | Regular / Razoável | Laranja | Necessita ajustes antes de aplicar |
| **< 40** | Crítico / Reprovável | Vermelho | Rejeitado automaticamente pelos ATS |

---

## 6. Exemplos de Cálculo

### Exemplo 1: Currículo Vazio
**Conteúdo:** Texto aleatório com 100 caracteres

```
Pontuação inicial: 100
- Texto muito curto (< 500 chars): -15
- E-mail ausente: -20
- Experiência não detectada: -15
- Educação não detectada: -15
- Skills não detectadas: -10
- LinkedIn omitido: -10
- Falta de métricas: -10
- Falta de verbos de ação: -10
─────────────────────────────
Pontuação final: 5 pontos (Crítico)
```

### Exemplo 2: Currículo com Foto
**Problema:** Referência a "foto de perfil"

```
Pontuação inicial: 100
- Foto detectada (Deal-breaker): -30 → hasDealbreaker = true
- E-mail ausente: -20
- Experiência não detectada: -15
─────────────────────────────
Subtotal: 35
Cap por deal-breaker: max 35
─────────────────────────────
Pontuação final: 35 pontos (Crítico)
```

### Exemplo 3: Currículo Completo
**Conteúdo:** Bem estruturado, todas as seções presentes

```
Pontuação inicial: 100
- Nenhum problema detectado
─────────────────────────────
Pontuação padrão: 88 pontos (Bom)
```

### Exemplo 4: Currículo Quase Perfeito
**Conteúdo:** Completo mas com algumas falhas menores

```
Pontuação inicial: 100
- LinkedIn omitido: -10
- Falta de métricas: -10
─────────────────────────────
Pontuação final: 80 pontos (Bom)
```

---

## 7. Validação Mínima de Conteúdo

Antes mesmo da análise ATS, existe uma validação de tamanho mínimo:

```typescript
if (cleaned.length < 50) {
  erro: "O currículo está muito curto. Adicione mais conteúdo (mínimo 50 caracteres)."
}
```

Isso garante que não sejam processados arquivos completamente vazios ou com apenas símbolos.

---

## 8. Análise por IA (Edge Function)

Após a análise heurística local, um Edge Function do Supabase realiza análise qualitativa usando modelos de IA (Cerebras, Gemini ou Groq).

### Diferença entre Análises

| Aspecto | Análise Local (Heurística) | Análise por IA |
|---------|---------------------------|----------------|
| **Velocidade** | Instantânea | 5-30 segundos |
| **Pontuação** | Numérica (0-100) | Qualitativa (texto) |
| **Foco** | Estrutura e regras rígidas | Semântica e adequação ao NOC |
| **Score salvo** | Sim (campo `ats_score`) | 65 (placeholder) |

### Score Padrão da IA
```typescript
// Na Edge Function
ats_score: 65 // Baseline para análise aprofundada
```

O score de 65 é um placeholder que indica que o currículo passou pela análise completa, independente do resultado da análise heurística inicial.

---

## 9. Tabela de Resumo de Penalidades

| Categoria | Problema | Penalidade | Deal-breaker |
|-----------|----------|------------|--------------|
| **Eliminatórios** | Foto/imagem | -30 | Sim |
| **Eliminatórios** | Dados pessoais (CPF, idade, etc.) | -30 | Sim |
| **Eliminatórios** | Apenas em português | -40 | Sim |
| **Estrutural** | E-mail ausente | -20 | Não |
| **Estrutural** | Experiência ausente | -15 | Não |
| **Estrutural** | Educação ausente | -15 | Não |
| **Estrutural** | Skills ausentes | -10 | Não |
| **Estrutural** | LinkedIn ausente | -10 | Não |
| **Impacto** | Falta de métricas | -10 | Não |
| **Impacto** | Falta de verbos de ação | -10 | Não |
| **Impacto** | Texto < 500 caracteres | -15 | Não |
| **Impacto** | Texto > 2500 palavras | -10 | Não |
| **Impacto** | Expressões obsoletas | -5 | Não |

---

## 10. Checklist para Usuários

### Para obter pontuação ≥ 70 (Bom):

- [ ] Remover qualquer referência a fotos
- [ ] Remover dados pessoais (CPF, idade, estado civil, etc.)
- [ ] Incluir termos em inglês (experience, education, skills)
- [ ] Adicionar e-mail de contato
- [ ] Ter seção clara de experiência profissional
- [ ] Ter seção clara de educação/formação
- [ ] Ter seção de skills/competências
- [ ] Incluir URL do LinkedIn
- [ ] Incluir números e métricas (% de crescimento, valores em $)
- [ ] Usar verbos de ação fortes (Managed, Led, Developed, etc.)
- [ ] Manter entre 500 caracteres e 2500 palavras
- [ ] Remover expressões como "referências disponíveis"

---

## 11. Arquivos Relacionados

| Arquivo | Propósito |
|---------|-----------|
| `src/components/wizard/StepUpload.tsx` | Lógica de pontuação ATS (`computeAtsPreview`) |
| `src/components/shared/ScoreGauge.tsx` | Visualização do gauge de pontuação |
| `src/components/wizard/StepAtsPreview.tsx` | Tela de preview da análise ATS |
| `src/stores/wizardStore.ts` | Estado global (score, issues) |
| `supabase/functions/generate-analysis/index.ts` | Análise aprofundada por IA |

---

*Documentação gerada em: 2026-04-13*
*Última atualização: Remoção do limite mínimo de 18 pontos*
