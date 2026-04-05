const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export interface GenerativeResponse {
  atsReview: string;
  optimizedCv: string;
  jobRecommendations: {
    title: string;
    company: string;
    location: string;
    matchPercentage: string;
    url: string;
    source: string;
  }[];
}

// Lista de modelos para tentar (fallback)
const GEMINI_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash-002',
];

// Delay com exponential backoff
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGeminiWithRetry(
  prompt: string, 
  maxRetries = 3,
  modelIndex = 0
): Promise<string> {
  const model = GEMINI_MODELS[modelIndex];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  console.log(`=== CALLGEMINI - Modelo: ${model} ===`);
  console.log(`=== CALLGEMINI - Prompt length: ${prompt.length}`);
  console.log(`=== CALLGEMINI - Contains pasted-image? ${prompt.includes('pasted-image')}`);
  console.log(`=== CALLGEMINI - First 100 chars: ${prompt.substring(0, 100)}`);
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`>>> Tentativa ${attempt + 1}/${maxRetries + 1} com modelo ${model}...`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.error?.message || response.statusText;
        const statusCode = response.status;
        
        console.error(`Erro ${statusCode}:`, errorMessage);
        
        // Se for erro 503 (sobrecarga) ou 429 (rate limit), tentar novamente
        if ((statusCode === 503 || statusCode === 429) && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`Servidor ocupado. Aguardando ${waitTime}ms antes de tentar novamente...`);
          await delay(waitTime);
          continue;
        }
        
        // Se for erro de imagem, propagar imediatamente
        if (errorMessage.includes('pasted-image') || errorMessage.includes('image input')) {
          throw new Error("O texto do currículo contém dados de imagem. Por favor, faça upload de um novo currículo em formato PDF com texto selecionável.");
        }
        
        // Se esgotou as tentativas com este modelo
        if (attempt >= maxRetries && modelIndex < GEMINI_MODELS.length - 1) {
          console.log(`Modelo ${model} falhou após ${maxRetries + 1} tentativas. Tentando modelo alternativo...`);
          return callGeminiWithRetry(prompt, maxRetries, modelIndex + 1);
        }
        
        throw new Error(`Erro ${statusCode}: ${errorMessage}`);
      }

      const data = await response.json();
      
      if (!data?.candidates || data.candidates.length === 0) {
        if (data?.error?.message) {
          throw new Error(data.error.message);
        }
        throw new Error("A IA não conseguiu processar seu currículo. Por favor, tente novamente.");
      }
      
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("A IA não gerou conteúdo. Por favor, tente novamente.");
      }
      
      console.log(`✓ Sucesso com modelo ${model} na tentativa ${attempt + 1}`);
      return text;
      
    } catch (error) {
      // Se for o último modelo e última tentativa
      if (modelIndex >= GEMINI_MODELS.length - 1 && attempt >= maxRetries) {
        throw error;
      }
      
      // Se ainda tem tentativas, continua o loop
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Erro na tentativa ${attempt + 1}. Aguardando ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      
      // Se esgotou tentativas com este modelo, tenta o próximo
      if (modelIndex < GEMINI_MODELS.length - 1) {
        console.log(`Tentando modelo alternativo ${GEMINI_MODELS[modelIndex + 1]}...`);
        return callGeminiWithRetry(prompt, maxRetries, modelIndex + 1);
      }
      
      throw error;
    }
  }
  
  throw new Error("Não foi possível processar após várias tentativas. Tente novamente em alguns minutos.");
}

export async function generateAllContent(resumeText: string, noc: string, province: string): Promise<GenerativeResponse> {
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY não está configurada no seu arquivo .env.");
  }

  console.log(">>> GEMINI INPUT - Raw length:", resumeText.length);
  console.log(">>> GEMINI INPUT - Has pasted-image?", resumeText.includes('pasted-image'));

  const cleanedText = String(resumeText)
    .replace(/pasted-image\d*/gi, '')
    .replace(/data:image\S*/gi, '')
    .replace(/data:application\S*/gi, '')
    .replace(/\[image[^\]]*\]/gi, '')
    .replace(/\[.*?\]/gi, '')
    .replace(/png|jpg|jpeg|gif|bmp|webp/gi, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  console.log(">>> GEMINI OUTPUT - Cleaned length:", cleanedText.length);
  console.log(">>> GEMINI OUTPUT - Has pasted-image?", cleanedText.includes('pasted-image'));

  if (cleanedText.length < 50) {
    throw new Error("O texto do currículo está vazio ou muito curto. Por favor, envie um currículo com pelo menos 50 caracteres de texto.");
  }

  console.log(">>> GEMINI - Texto limpo (primeiros 200 chars):", cleanedText.substring(0, 200));

  const adsPrompt = `Você é um Analista de RH e Recrutador Especialista pelo mercado do Canadá. 

O candidato almeja vagas para o [NOC: ${noc}] na província de [${province}], Canadá. O currículo original dele é:
"""
${cleanedText}
"""

Gere uma avaliação de ATS forte. Analise verbos de ação, uso de métricas (quantificação) e o formato do Canadá (sem fotos, dados pessoais extras). Devolva em formato puro de Markdown. Comece indo direto ao ponto sobre o que não funciona.`;
  
  const optimizedCvPrompt = `You are a Canadian Career Specialist. Transform the following Brazilian resume into a professional Canadian-format resume.

CRITICAL: You MUST output ONLY valid markdown with the EXACT structure below. Every section must use markdown headers, bullet points, and formatting.

Input resume:
${cleanedText}

Target position: NOC ${noc} in ${province}, Canada

OUTPUT FORMAT (use EXACTLY this markdown structure):

# FIRSTNAME LASTNAME
City, State/Province, Canada | email@example.com | (555) 123-4567 | linkedin.com/in/username

## PROFESSIONAL SUMMARY
Results-driven professional with X+ years of experience in [field]. Proven track record of [key achievements]. Seeking to leverage expertise in [skills] to contribute to organizations in ${province}, Canada.

## PROFESSIONAL EXPERIENCE

### Job Title - Company Name
*Month Year - Month Year | City, Country*
- **Achievement:** Led initiative that resulted in [specific metric]% improvement in [area]
- **Impact:** Delivered [project/result] ahead of schedule, saving $[amount] in costs
- **Leadership:** Managed team of [number] to successfully [accomplishment]
- **Innovation:** Implemented [solution] that increased [metric] by [percentage]%

### Previous Job Title - Previous Company
*Month Year - Month Year | City, Country*
- **Achievement:** [Action verb] [what you did] resulting in [quantifiable result]
- **Impact:** [Action verb] [what you did] which led to [measurable outcome]
- **Collaboration:** Partnered with [teams/departments] to [accomplishment]

## EDUCATION

### Degree Name - University/Institution Name
*Graduation Year | City, Country*
- Relevant coursework: [Course 1], [Course 2], [Course 3]
- Honors: [Any honors, awards, or distinctions]

## SKILLS

- **Technical:** Skill 1, Skill 2, Skill 3, Skill 4, Skill 5
- **Software:** Tool 1, Tool 2, Tool 3
- **Languages:** English (Proficient), Portuguese (Native)
- **Certifications:** Certification 1, Certification 2

STRICT RULES:
1. Use # for name, ## for sections, ### for job titles/education
2. Use - for ALL bullet points
3. Use **bold** for key terms within bullets
4. Use *italics* for dates/locations
5. Include METRICS and NUMBERS in every experience bullet
6. Start bullets with strong ACTION VERBS (Led, Developed, Implemented, etc.)
7. NO photos, age, marital status, or personal details
8. Keep it concise and impactful
9. Output ONLY the resume in markdown - no extra text or explanations`;
  
  const jobsPrompt = `Você é um Recrutador Canadense.

Sugira 5 vagas reais que existem (ou cargos de alta demanda comuns) no Canadá focado no NOC ${noc} na região de ${province}.

Para o currículo:
${cleanedText.substring(0, 1000)}...

Retorne EXATAMENTE UM JSON ARRAY puro, sem aspas invertidas de markdown, contendo: [{ "title": "", "company": "Empresa Fictícia ou Real da Região", "location": "${province}, Canada", "matchPercentage": "X%", "url": "https://ca.indeed.com/jobs?q=exemplo", "source": "Indeed" }]`;

  try {
    console.log(">>> Iniciando chamadas paralelas para a API Gemini...");
    
    // Fazer chamadas em paralelo para economizar tempo
    const [atsText, cvText, jobsTextRaw] = await Promise.all([
      callGeminiWithRetry(adsPrompt),
      callGeminiWithRetry(optimizedCvPrompt),
      callGeminiWithRetry(jobsPrompt)
    ]);

    console.log(">>> Todas as chamadas concluídas com sucesso!");

    let jobs = [];
    try {
      let cleanJson = jobsTextRaw.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
      }
      jobs = JSON.parse(cleanJson);
    } catch {
      console.error("Falha ao fazer parse do JSON de vagas:", jobsTextRaw);
      // Fallback para não quebrar a UI
      jobs = [];
    }

    return {
      atsReview: atsText,
      optimizedCv: cvText,
      jobRecommendations: jobs
    };
  } catch (error: unknown) {
    console.error("Erro na integração com Gemini:", error);
    const err = error instanceof Error ? error : new Error(String(error));
    
    if (err.message.includes('pasted-image') || err.message.includes('image input')) {
      throw new Error("Detectamos que o texto do seu currículo contém dados de imagem. Por favor, limpe o texto e tente novamente com apenas texto puro.");
    }
    
    // Mensagem amigável para erro de sobrecarga
    if (err.message.includes('503') || err.message.includes('high demand') || err.message.includes('Service Unavailable')) {
      throw new Error("Os servidores da IA estão temporariamente ocupados devido à alta demanda. Por favor, aguarde 1-2 minutos e tente novamente.");
    }
    
    throw error;
  }
}