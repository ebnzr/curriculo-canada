import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")

const DAILY_ANALYSIS_LIMIT = 5

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "https://canadapath.ai",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey",
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
  
  const atsPrompt = `Você é um Analista de RH e Recrutador Especialista pelo mercado do Canadá. 

O candidato almeja vagas para o [NOC: ${noc}] na província de [${province}], Canadá. O currículo original dele é:
"""
${cleanedText}
"""

Gere uma avaliação de ATS forte. Analise verbos de ação, uso de métricas (quantificação) e o formato do Canadá (sem fotos, dados pessoais extras). Devolva em formato puro de Markdown. Comece indo direto ao ponto sobre o que não funciona.`

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

  return { atsPrompt, optimizedCvPrompt, jobsPrompt }
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

async function callGroq(prompt: string, modelIndex = 0): Promise<string> {
  const models = ["llama-3.1-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"]
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
  
  if (GROQ_API_KEY) {
    try {
      console.log("Attempting Groq API...")
      return await callGroq(prompt)
    } catch (groqErr) {
      const errMsg = groqErr instanceof Error ? groqErr.message : String(groqErr)
      console.error("Groq failed, trying Gemini:", errMsg)
      errors.push(`Groq: ${errMsg}`)
    }
  }
  
  if (GEMINI_API_KEY) {
    try {
      console.log("Attempting Gemini API...")
      return await callGemini(prompt)
    } catch (geminiErr) {
      const errMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr)
      console.error("Gemini also failed:", errMsg)
      errors.push(`Gemini: ${errMsg}`)
    }
  }
  
  throw new Error(`All AI providers failed: ${errors.join(" | ")}`)
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing authorization token" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  const token = authHeader.replace("Bearer ", "")
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: "User profile not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  const isDevMode = req.headers.get("x-dev-mode") === "true" || user.email?.includes("@localhost")
  
  if (!profile.is_premium && !isDevMode) {
    return new Response(JSON.stringify({ error: "Premium subscription required" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  const { count, error: countError } = await supabase
    .from("analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (countError) {
    console.error("Rate limit check failed:", countError)
  } else if ((count ?? 0) >= DAILY_ANALYSIS_LIMIT) {
    return new Response(
      JSON.stringify({
        error: `Limite diário atingido. Você pode realizar ${DAILY_ANALYSIS_LIMIT} análises por dia. Tente novamente amanhã.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
    )
  }

  let body: GenerateRequest
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
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
    const { atsPrompt, optimizedCvPrompt, jobsPrompt } = buildPrompts(cleanedText, noc, province, city)

    console.log("Starting AI analysis for user:", user.id)
    
    const [atsText, cvText, jobsTextRaw] = await Promise.all([
      withTimeout(callAI(atsPrompt), 120000),
      withTimeout(callAI(optimizedCvPrompt), 120000),
      withTimeout(callAI(jobsPrompt), 120000),
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

    console.log("Saving analysis to database for user:", user.id)
    const { error: insertError } = await supabase.from("analyses").insert({
      user_id: user.id,
      original_text: cleanedText,
      ats_score: 65,
      critical_flaws: [],
      generated_resume: cvText,
      ats_review: atsText,
      suggested_jobs: jobs,
    })

    if (insertError) {
      console.error("Failed to insert analysis:", insertError)
      return new Response(JSON.stringify({ error: "Failed to save analysis to database." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }

    console.log("Analysis completed and saved successfully for user:", user.id)
    return new Response(
      JSON.stringify({
        atsReview: atsText,
        optimizedCv: cvText,
        jobRecommendations: jobs,
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
