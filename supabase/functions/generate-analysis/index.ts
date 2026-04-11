import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
const CEREBRAS_API_KEY = Deno.env.get("CEREBRAS_API_KEY")

const DAILY_ANALYSIS_LIMIT = 5

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // Permitir todas as origens em desenvolvimento
  "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

interface GenerateRequest {
  resumeText: string
  noc: string
  province: string
  city?: string
}

function cleanResumeText(text: string): string {
  return String(text)
    .replace(/pasted-image\d*/gi, "")
    .replace(/data:image\S*/gi, "")
    .replace(/data:application\S*/gi, "")
    .replace(/\[image[^\]]*\]/gi, "")
    .replace(/\[.*?\]/gi, "")
    .replace(/png|jpg|jpeg|gif|bmp|webp/gi, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function buildPrompts(cleanedText: string, noc: string, province: string, city?: string) {
  const locationHeader = city ? city : `${province}, Canada`
  
  const atsPrompt = `Você é um Analista de RH e Consultor de Carreira Especialista no mercado canadense, com profundo conhecimento sobre requisitos de certificação e credenciamento profissional em TODAS as áreas de atuação no Canadá.

O candidato almeja vagas para o [NOC: ${noc}] na província de [${province}], Canadá. O currículo original dele é:
"""
${cleanedText}
"""

Gere uma avaliação completa e estruturada em Markdown puro com as seguintes seções:

## 🔍 Diagnóstico Rápido
Comece direto ao ponto: liste os 3-5 problemas mais críticos que fariam este currículo ser REJEITADO por um ATS canadense.

## 📊 Análise Detalhada

### Formatação & Estrutura
Avalie: formato canadense (sem foto, sem dados pessoais como idade/estado civil/CPF), seções obrigatórias (Professional Summary, Work Experience, Education, Skills), uso correto de headers e bullet points.

### Verbos de Ação & Linguagem
Avalie: uso de action verbs fortes (Led, Delivered, Implemented, Optimized), voz ativa, linguagem profissional em inglês.

### Métricas & Quantificação
Avalie: presença de números, percentuais, valores financeiros, tamanho de equipes — dados concretos que provam impacto.

### Keywords & Compatibilidade NOC
Avalie: presença de palavras-chave relevantes para o NOC ${noc}, termos que ATS canadenses buscam para esta categoria.

## 🎓 Certificações e Credenciais Recomendadas

Esta seção é FUNDAMENTAL. Analise a área de atuação do candidato (baseado no NOC ${noc}) e recomende certificações, licenças profissionais ou cursos que são:
1. **Valorizados ou exigidos** por empregadores canadenses nesta área
2. **Reconhecidos** na província de ${province}
3. **Acessíveis** para profissionais internacionais

Considere TODAS as áreas — não apenas TI. Exemplos por área:
- **TI/Tecnologia:** AWS/Azure/GCP certifications, CompTIA, CISSP, PMP, Scrum/Agile
- **Saúde:** NCLEX-RN (enfermagem), LMCC/NAC (medicina), PEBC (farmácia), certificação provincial específica
- **Engenharia:** P.Eng licensing, Iron Ring, FE exam
- **Trades/Ofícios:** Red Seal certification, Provincial Trade Certificate
- **Finanças:** CPA Canada, CFA, CFP
- **Comunicação/Marketing:** Google Analytics, HubSpot, certificações de marketing digital
- **Educação:** Teaching certification provincial, TESL/TESOL
- **Gestão:** PMP, Six Sigma, CHRP (RH)
- **Alimentação/Hotelaria:** Food Handler certification, Smart Serve/Serving It Right
- **Qualquer área:** First Aid/CPR, WHMIS, French language (TEF/TCF se relevante para a província)

Para cada certificação recomendada, inclua:
- **Nome** da certificação
- **Órgão emissor** 
- **Por que é importante** para o mercado canadense nesta área
- **Como obter** (brevemente — online, presencial, tempo estimado)

⚠️ Diferencie claramente entre:
- Certificações **obrigatórias** (sem elas, não pode exercer a profissão)
- Certificações **altamente recomendadas** (forte diferencial competitivo)
- Certificações **nice-to-have** (complementares)

## 💡 Recomendações Finais
Liste 3-5 ações prioritárias que o candidato deveria tomar IMEDIATAMENTE para melhorar suas chances no mercado canadense.

REGRAS:
- Devolva em formato puro de Markdown (sem bloco de código, sem backticks)
- Use emojis nos headers para facilitar a leitura
- Seja direto e construtivo — aponte problemas MAS sempre com solução
- Todas as recomendações devem ser específicas para o NOC ${noc} e a província ${province}`

  const optimizedCvPrompt = `You are a Canadian Career Specialist. Transform the following Brazilian resume into a professional Canadian-format resume.

CRITICAL: You MUST output ONLY valid markdown with the EXACT structure below. Every section must use markdown headers, bullet points, and formatting.

Input resume:
${cleanedText}

Target position: NOC ${noc} in ${province}, Canada
Current residence: ${locationHeader}

OUTPUT FORMAT (use EXACTLY this markdown structure):

# FIRSTNAME LASTNAME
${locationHeader} | email@example.com | (555) 123-4567 | linkedin.com/in/username

## PROFESSIONAL SUMMARY
Results-driven professional with X+ years of experience in [field]. Proven track record of [key achievements]. Seeking to leverage expertise in [skills] to contribute to organizations in ${province}, Canada.

## PROFESSIONAL EXPERIENCE

### Job Title - Company Name
*Month Year - Month Year | City, Country*
- **Achievement:** Led initiative that resulted in [specific metric]% improvement in [area]
- **Impact:** Delivered [project/result] ahead of schedule, saving $[amount] in costs
- **Leadership:** Managed team of [number] to successfully [accomplishment]
- **Innovation:** Implemented [solution] that increased [metric] by [percentage]%

## EDUCATION

### Degree Name - University/Institution Name
*Graduation Year | City, Country*
- Relevant coursework: [Course 1], [Course 2], [Course 3]

## SKILLS

- **Technical:** Skill 1, Skill 2, Skill 3
- **Software:** Tool 1, Tool 2, Tool 3
- **Languages:** English (Proficient), Portuguese (Native)

STRICT RULES:
1. Use # for name, ## for sections, ### for job titles/education
2. Use - for ALL bullet points
3. Use **bold** for key terms within bullets
4. Use *italics* for dates/locations
5. Include METRICS and NUMBERS in every experience bullet
6. Start bullets with strong ACTION VERBS
7. NO photos, age, marital status, or personal details
8. Output ONLY the resume in markdown - no extra text`

  const jobsPrompt = `Você é um Recrutador Canadense.

Sugira 5 vagas reais que existem (ou cargos de alta demanda comuns) no Canadá focado no NOC ${noc} na região de ${province}.

Para o currículo:
${cleanedText.substring(0, 1000)}...

Retorne EXATAMENTE UM JSON ARRAY puro, sem aspas invertidas de markdown, contendo: [{ "title": "", "company": "Empresa Fictícia ou Real da Região", "location": "${province}, Canada", "matchPercentage": 85, "url": "https://ca.indeed.com/jobs?q=exemplo", "source": "Indeed" }]

IMPORTANTE: matchPercentage deve ser um número inteiro (sem o símbolo %), entre 60 e 98.`

  const linkedinPrompt = `You are a LinkedIn Profile Optimization Expert specialized in the Canadian job market.

Based EXCLUSIVELY on the resume below, create an optimized LinkedIn profile for the Canadian market.

The candidate targets NOC ${noc} positions in ${province}, Canada.

Resume:
${cleanedText}

Return EXACTLY a pure JSON object (no markdown backticks) with the following sections:

{
  "headline": "A compelling headline (max 220 chars) based on the candidate's ACTUAL job titles and skills from the resume. Format: Actual Role Title | Key Skill from Resume | Value Proposition",
  "about": "A powerful About section (1500-2000 chars). Start with a hook. Include ONLY: actual years of experience from the resume, real achievements mentioned in the resume, actual core competencies listed. Use line breaks for readability. Write in first person.",
  "experiences": [
    {
      "role": "Exact Job Title from Resume",
      "company": "Exact Company Name from Resume",
      "location": "City, Country as stated in Resume",
      "period": "MMM YYYY - MMM YYYY as stated in Resume",
      "description": "2-3 sentences about the role based on resume content.",
      "bullets": ["Achievement with metrics taken from the resume, enhanced with action verbs"]
    }
  ],
  "education": [
    {
      "degree": "Exact Degree from Resume",
      "institution": "Exact University from Resume",
      "year": "YYYY from Resume",
      "description": "Relevant details from the resume"
    }
  ],
  "skills": ["Only skills explicitly mentioned or clearly demonstrated in the resume"],
  "certifications": [
    {
      "name": "Only certifications explicitly listed in the resume",
      "issuer": "Issuing Organization from the resume",
      "year": "YYYY from the resume"
    }
  ],
  "languages": [
    { "language": "Only languages mentioned in the resume", "proficiency": "Proficiency level from the resume" }
  ]
}

STRICT RULES:
1. ALL text MUST be in English, optimized for Canadian recruiters
2. Use strong ACTION VERBS and METRICS in experience bullets
3. Include keywords relevant to NOC ${noc} where they naturally fit the candidate's REAL background
4. Skills MUST come ONLY from the resume — list only skills the candidate actually has
5. Certifications MUST come ONLY from the resume — if the resume has NO certifications, return an EMPTY array: "certifications": []
6. Languages MUST come ONLY from the resume — do NOT assume or invent languages. If not mentioned, include only Portuguese (Native). Do NOT add French or any other language unless explicitly stated in the resume
7. Do NOT invent, fabricate, or assume ANY information not present in the resume. Every fact must be traceable to the original text
8. The headline must reflect the candidate's ACTUAL role and skills, not generic NOC descriptions
9. Output ONLY valid JSON - no markdown, no backticks, no extra text`

  return { atsPrompt, optimizedCvPrompt, jobsPrompt, linkedinPrompt }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

async function callCerebras(prompt: string, modelIndex = 0): Promise<string> {
  const models = ["llama-3.3-70b", "llama-3.1-70b", "llama-3.1-8b"]
  const model = models[modelIndex]

  for (let attempt = 0; attempt <= 3; attempt++) {
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      const status = response.status
      // Rate limit ou erro de servidor = retry
      if ((status === 429 || status === 503 || status === 500) && attempt < 3) {
        await delay(Math.pow(2, attempt) * 1000)
        continue
      }
      // Tentar próximo modelo se disponível
      if (attempt >= 3 && modelIndex < models.length - 1) {
        return callCerebras(prompt, modelIndex + 1)
      }
      throw new Error(`Cerebras error ${status}: ${err?.error?.message}`)
    }

    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) throw new Error("Cerebras returned empty response")
    return text
  }
  throw new Error("Cerebras: max retries exceeded")
}

async function callGroq(prompt: string, modelIndex = 0): Promise<string> {
  const models = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"]
  const model = models[modelIndex]

  for (let attempt = 0; attempt <= 3; attempt++) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      const status = response.status
      if ((status === 429 || status === 503) && attempt < 3) {
        await delay(Math.pow(2, attempt) * 1000)
        continue
      }
      if (attempt >= 3 && modelIndex < models.length - 1) {
        return callGroq(prompt, modelIndex + 1)
      }
      throw new Error(`Groq error ${status}: ${err?.error?.message}`)
    }

    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) throw new Error("Groq returned empty response")
    return text
  }
  throw new Error("Groq: max retries exceeded")
}

async function callGemini(prompt: string, modelIndex = 0): Promise<string> {
  const models = ["gemini-flash-lite-latest", "gemini-1.5-flash", "gemini-1.5-flash-8b"]
  const model = models[modelIndex]
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`

  for (let attempt = 0; attempt <= 3; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    })

    if (!response.ok) {
      const err = await response.json()
      const status = response.status
      if ((status === 503 || status === 429) && attempt < 3) {
        await delay(Math.pow(2, attempt) * 1000)
        continue
      }
      if (attempt >= 3 && modelIndex < models.length - 1) {
        return callGemini(prompt, modelIndex + 1)
      }
      throw new Error(`Gemini error ${status}: ${err?.error?.message}`)
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error("Gemini returned empty response")
    return text
  }
  throw new Error("Gemini: max retries exceeded")
}

async function callAI(prompt: string): Promise<string> {
  const errors: string[] = []
  
  // 1. Tentar Cerebras primeiro (novo)
  if (CEREBRAS_API_KEY) {
    try {
      console.log("Attempting Cerebras API...")
      return await callCerebras(prompt)
    } catch (cerebrasErr) {
      const errMsg = cerebrasErr instanceof Error ? cerebrasErr.message : String(cerebrasErr)
      console.error("Cerebras failed, trying Gemini:", errMsg)
      errors.push(`Cerebras: ${errMsg}`)
    }
  }
  
  // 2. Gemini como fallback
  if (GEMINI_API_KEY) {
    try {
      console.log("Attempting Gemini API...")
      return await callGemini(prompt)
    } catch (geminiErr) {
      const errMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr)
      console.error("Gemini failed, trying Groq:", errMsg)
      errors.push(`Gemini: ${errMsg}`)
    }
  }
  
  // 3. Groq como último recurso
  if (GROQ_API_KEY) {
    try {
      console.log("Attempting Groq API...")
      return await callGroq(prompt)
    } catch (groqErr) {
      const errMsg = groqErr instanceof Error ? groqErr.message : String(groqErr)
      console.error("Groq also failed:", errMsg)
      errors.push(`Groq: ${errMsg}`)
    }
  }
  
  throw new Error(`All AI providers failed: ${errors.join(" | ")}`)
}

// Distribuir chamadas entre providers para evitar rate limit
// Gemini-first para prompts longos, Groq-first para prompts curtos
async function callAI_GeminiFirst(prompt: string): Promise<string> {
  const errors: string[] = []
  
  if (GEMINI_API_KEY) {
    try {
      return await callGemini(prompt)
    } catch (e) {
      errors.push(`Gemini: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  if (CEREBRAS_API_KEY) {
    try {
      return await callCerebras(prompt)
    } catch (e) {
      errors.push(`Cerebras: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  if (GROQ_API_KEY) {
    try {
      return await callGroq(prompt)
    } catch (e) {
      errors.push(`Groq: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  throw new Error(`All providers failed (Gemini-first): ${errors.join(" | ")}`)
}

async function callAI_GroqFirst(prompt: string): Promise<string> {
  const errors: string[] = []
  
  if (GROQ_API_KEY) {
    try {
      return await callGroq(prompt)
    } catch (e) {
      errors.push(`Groq: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  if (CEREBRAS_API_KEY) {
    try {
      return await callCerebras(prompt)
    } catch (e) {
      errors.push(`Cerebras: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  if (GEMINI_API_KEY) {
    try {
      return await callGemini(prompt)
    } catch (e) {
      errors.push(`Gemini: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  throw new Error(`All providers failed (Groq-first): ${errors.join(" | ")}`)
}

serve(async (req: Request) => {
  console.log(`[${Date.now()}] Request received: ${req.method}`)
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  // Ler o body primeiro para pegar o token (bypassando validação do gateway)
  let body: GenerateRequest & { accessToken?: string }
  try {
    body = await req.json()
    console.log(`[${Date.now()}] Body received, has accessToken:`, !!body.accessToken)
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  // Pegar token do body ou do header Authorization
  const authHeader = req.headers.get("Authorization")
  const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null
  const token = body.accessToken || tokenFromHeader
  
  // Tentar pegar user_id do header do gateway (quando auth é válida)
  const userIdFromGateway = req.headers.get("x-supabase-user-id")
  
  console.log(`[${Date.now()}] Token source:`, body.accessToken ? "body" : (tokenFromHeader ? "header" : "none"))
  console.log(`[${Date.now()}] User from gateway:`, userIdFromGateway)
  
  if (!token && !userIdFromGateway) {
    return new Response(JSON.stringify({ error: "Missing authorization token" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let userId: string | null = userIdFromGateway
  let userEmail: string | null = null

  // Se não temos userId do gateway, verificar o token manualmente
  if (!userId && token) {
    console.log(`[${Date.now()}] Verifying token manually...`)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError) {
      console.log(`[${Date.now()}] Auth error:`, authError.message)
    }
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token", debug: authError?.message }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }
    
    userId = user.id
    userEmail = user.email || null
    console.log(`[${Date.now()}] User authenticated via token:`, userId)
  } else if (userId) {
    console.log(`[${Date.now()}] User authenticated via gateway:`, userId)
    // Buscar email do perfil ou usar um padrão para dev mode
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    userEmail = userData?.user?.email || null
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", userId)
    .single()

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: "User profile not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  const isDevMode = req.headers.get("x-dev-mode") === "true" || userEmail?.includes("@localhost")
  
  if (!profile.is_premium && !isDevMode) {
    return new Response(JSON.stringify({ error: "Premium subscription required" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  const { resumeText, noc, province, city } = body

  if (!resumeText || !noc || !province) {
    return new Response(JSON.stringify({ error: "Missing required fields: resumeText, noc, province" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  const cleanedText = cleanResumeText(resumeText)

  if (cleanedText.length < 50) {
    return new Response(
      JSON.stringify({ error: "O texto do currículo está muito curto (mínimo 50 caracteres de texto puro)." }),
      { status: 422, headers: { "Content-Type": "application/json", ...corsHeaders } }
    )
  }

  if (cleanedText.length > 50000) {
    return new Response(
      JSON.stringify({ error: "O texto do currículo é muito longo. Por favor, cole apenas o conteúdo principal." }),
      { status: 422, headers: { "Content-Type": "application/json", ...corsHeaders } }
    )
  }

  try {
    const { atsPrompt, optimizedCvPrompt, jobsPrompt, linkedinPrompt } = buildPrompts(cleanedText, noc, province, city)

    console.log("Starting AI analysis for user:", userId)
    console.log("Available providers - Cerebras:", !!CEREBRAS_API_KEY, "Gemini:", !!GEMINI_API_KEY, "Groq:", !!GROQ_API_KEY)
    
    const startTime = Date.now()
    
    // Distribuir entre providers para evitar rate limit
    // ATS → Gemini-first, CV → default (Cerebras→Gemini→Groq), Jobs → Groq-first, LinkedIn → Gemini-first
    const [atsText, cvText, jobsTextRaw, linkedinTextRaw] = await Promise.all([
      withTimeout(callAI_GeminiFirst(atsPrompt), 120000).then(r => { console.log(`ATS done in ${Date.now() - startTime}ms`); return r }),
      withTimeout(callAI(optimizedCvPrompt), 120000).then(r => { console.log(`CV done in ${Date.now() - startTime}ms`); return r }),
      withTimeout(callAI_GroqFirst(jobsPrompt), 120000).then(r => { console.log(`Jobs done in ${Date.now() - startTime}ms`); return r }),
      withTimeout(callAI_GeminiFirst(linkedinPrompt), 120000).then(r => { console.log(`LinkedIn done in ${Date.now() - startTime}ms`); return r }),
    ])
    
    console.log("AI analysis completed successfully")

    let jobs: unknown[] = []
    try {
      let cleanJson = jobsTextRaw.trim()
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.replace(/```json/g, "").replace(/```/g, "").trim()
      }
      const parsed = JSON.parse(cleanJson)
      jobs = Array.isArray(parsed)
        ? parsed.map((job: Record<string, unknown>) => ({
            ...job,
            matchPercentage:
              typeof job.matchPercentage === "string"
                ? parseInt(String(job.matchPercentage).replace("%", ""), 10) || 75
                : typeof job.matchPercentage === "number"
                ? job.matchPercentage
                : 75,
          }))
        : []
    } catch {
      console.error("Failed to parse jobs JSON:", jobsTextRaw)
      jobs = []
    }

    // Parse LinkedIn JSON
    let linkedinProfile: Record<string, unknown> | null = null
    try {
      let cleanLinkedinJson = linkedinTextRaw.trim()
      if (cleanLinkedinJson.startsWith("```json")) {
        cleanLinkedinJson = cleanLinkedinJson.replace(/```json/g, "").replace(/```/g, "").trim()
      }
      if (cleanLinkedinJson.startsWith("```")) {
        cleanLinkedinJson = cleanLinkedinJson.replace(/```/g, "").trim()
      }
      linkedinProfile = JSON.parse(cleanLinkedinJson)
      console.log("LinkedIn profile parsed successfully")
    } catch {
      console.error("Failed to parse LinkedIn JSON:", linkedinTextRaw)
      linkedinProfile = null
    }

    console.log("Saving analysis to database for user:", userId)
    const { error: insertError } = await supabase.from("analyses").insert({
      user_id: userId,
      original_text: cleanedText,
      ats_score: 65,
      critical_flaws: [],
      generated_resume: cvText,
      ats_review: atsText,
      suggested_jobs: jobs,
      generated_linkedin: linkedinProfile,
    })

    if (insertError) {
      console.error("Failed to insert analysis:", insertError)
      return new Response(JSON.stringify({ error: "Failed to save analysis to database." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }

    console.log("Analysis completed and saved successfully for user:", userId)
    return new Response(
      JSON.stringify({
        atsReview: atsText,
        optimizedCv: cvText,
        jobRecommendations: jobs,
        linkedinProfile,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    )
  } catch (err) {
    console.error("Analysis generation error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"

    if (message.includes("503") || message.includes("high demand") || message.includes("Service Unavailable")) {
      return new Response(
        JSON.stringify({ error: "Os servidores da IA estão temporariamente ocupados. Aguarde 1-2 minutos e tente novamente." }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }
})
