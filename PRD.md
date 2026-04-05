# Product Requirements Document (PRD)

## Nome do Produto: CurrículoCanada

**Visão Geral:** Um Micro SaaS focado em ajudar imigrantes a adaptarem seus currículos para o rigoroso padrão canadense (ATS - Applicant Tracking System) e otimizarem seus perfis do LinkedIn para serem encontrados por recrutadores no Canadá.

---

## 1. O Problema

Imigrantes perdem meses enviando currículos no formato de seus países de origem e são eliminados silenciosamente pelos robôs de RH (ATS). Além disso, possuem perfis no LinkedIn que não atraem recrutadores canadenses por falta de palavras-chave (SEO) e formatação adequada (Headline e About).

## 2. A Solução

Uma ferramenta de passo a passo (Wizard) que:

1. Analisa o currículo atual e aponta falhas críticas (ATS).
2. Utiliza IA para reescrever o currículo perfeitamente para o Canadá.
3. **[NOVO]** Gera um perfil de LinkedIn otimizado (Headline, About, Experiências e SEO) em inglês ou francês.
4. Sugere vagas reais compatíveis.

---

## 3. Referências e Estratégia de Vendas (Benchmarking)

**Referências de Mercado:** `scoresu.me` (focado em LinkedIn) e `cvporvaga.com.br` (focado em ATS).

**Estratégia de Monetização (Freemium / Paywall):**

* **A Isca (Grátis):** O usuário faz upload do currículo. O sistema dá uma "Nota ATS" (ex: 45/100) e mostra apenas 1 erro crítico (ex: "Seu currículo tem foto, rejeição automática").
* **A Dor:** Explicar que o "Robô do RH" elimina 98% dos candidatos que não têm o formato certo.
* **A Solução (Pago/Premium):** Para desbloquear o currículo reescrito em PDF, a otimização completa do LinkedIn e o match com vagas, o usuário precisa pagar uma taxa única (ex: $9.90) ou assinar um plano.

---

## 4. Jornada do Usuário (Funil de Conversão)

* **Passo 1: Landing Page (A Isca)**
  
  * Headline forte: "Chega de enviar currículos para o Canadá e ser ignorado pelo robô do RH."
  * CTA: "Descubra sua nota ATS e otimize seu LinkedIn grátis".

* **Passo 2: Wizard de Contexto**
  
  * "Qual sua área de atuação (NOC)?" e "Qual província alvo?".

* **Passo 3: Upload**
  
  * Área para colar o texto do currículo atual ou importar PDF.

* **Passo 4: Análise e Teaser (Efeito "Uau")**
  
  * Tela de loading gerando antecipação ("Analisando palavras-chave...", "Testando contra ATS canadense...").
  * Mostra o Score baixo e 1 erro crítico.

* **Passo 5: Paywall / Auth Wall**
  
  * CTA: "Desbloqueie seu Currículo Canadense Perfeito + Perfil do LinkedIn Otimizado". (Login com Google + Pagamento Stripe).

* **Passo 6: Dashboard do Usuário (A Entrega)**
  
  * **Aba 1 (Currículo):** Currículo reescrito em Markdown, pronto para exportar em PDF.
  * **Aba 2 (LinkedIn):** Sugestões prontas para copiar e colar no LinkedIn (Headline magnética, Summary focado em conquistas, Experiências otimizadas com SEO).
  * **Aba 3 (Vagas):** Lista de vagas recomendadas.

---

## 5. Requisitos Funcionais (Features Core)

1. **Wizard Multi-step:** Navegação fluida sem recarregar a página.
2. **Integração com IA (Google Gemini):**
   * **Prompt 1 (Análise ATS):** Avaliar currículo e gerar score/falhas.
   * **Prompt 2 (Reescrita CV):** Reescrever no formato ATS canadense (verbos de ação, métricas).
   * **Prompt 3 (LinkedIn):** Gerar Headline (título), About (resumo) e bullet points de experiência otimizados para o algoritmo de busca do LinkedIn.
   * **Prompt 4 (Vagas):** Buscar vagas baseadas no perfil.
3. **Autenticação:** Login via Google (Firebase Auth).
4. **Exportação:** Baixar CV em PDF e botões de "Copiar" fáceis para o LinkedIn.

---

## 6. Seção de FAQ (Para a Landing Page)

Baseado nas referências, a Landing Page deve ter um FAQ para quebrar objeções:

* **O que é ATS e por que estou sendo ignorado?** (Explicação sobre os robôs de triagem).
* **Como a IA sabe o padrão canadense?** (Treinada com diretrizes do IRCC e recrutadores do Canadá).
* **O LinkedIn realmente importa no Canadá?** (Sim, 90% dos recrutadores canadenses usam o LinkedIn como ferramenta principal).
* **Meus dados estão seguros?** (Não armazenamos dados sensíveis, usamos apenas para gerar o documento).

---

## 7. Stack Tecnológico Recomendado

* **Frontend:** React (Vite) ou Next.js (App Router).
* **Estilização:** Tailwind CSS + shadcn/ui.
* **Backend/BaaS:** Firebase (Auth e Firestore).
* **Pagamentos:** Stripe Payment Links ou Checkout.
* **Inteligência Artificial:** Google Gemini API (`@google/genai`).
* **Markdown:** `react-markdown` para renderizar os textos.

---

## 8. Estrutura de Dados (Firestore)

**Coleção: `users`**

* `uid`, `email`, `targetProvince`, `targetNoc`, `isPremium` (boolean)

**Coleção: `analyses`**

* `id`, `userId`, `originalText`, `atsScore`, `criticalFlaws`
* `generatedResume` (string/markdown)
* `generatedLinkedIn` (object: `{ headline, about, experiences }`)
* `createdAt` (timestamp)
