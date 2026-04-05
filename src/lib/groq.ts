const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;

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

const GROQ_MODELS = ['llama-3.1-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGroqWithRetry(
  prompt: string,
  maxRetries = 3,
  modelIndex = 0
): Promise<string> {
  const model = GROQ_MODELS[modelIndex];
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  console.log(`=== CALLGROQ - Modelo: ${model} ===`);
  console.log(`=== CALLGROQ - Prompt length: ${prompt.length}`);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`>>> Groq tentativa ${attempt + 1}/${maxRetries + 1} com modelo ${model}...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.error?.message || response.statusText;
        const statusCode = response.status;

        console.error(`Groq erro ${statusCode}:`, errorMessage);

        if ((statusCode === 429 || statusCode === 503) && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Rate limit/sobrecarga. Aguardando ${waitTime}ms...`);
          await delay(waitTime);
          continue;
        }

        if (attempt >= maxRetries && modelIndex < GROQ_MODELS.length - 1) {
          console.log(`Modelo ${model} falhou. Tentando próximo modelo...`);
          return callGroqWithRetry(prompt, maxRetries, modelIndex + 1);
        }

        throw new Error(`Erro Groq ${statusCode}: ${errorMessage}`);
      }

      const data = await response.json();

      if (!data?.choices || data.choices.length === 0) {
        throw new Error("Groq não retornou resposta.");
      }

      const text = data?.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error("Groq retornou resposta vazia.");
      }

      console.log(`✓ Sucesso com Groq modelo ${model} na tentativa ${attempt + 1}`);
      return text;

    } catch (error) {
      if (modelIndex >= GROQ_MODELS.length - 1 && attempt >= maxRetries) {
        throw error;
      }

      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Erro na tentativa ${attempt + 1}. Aguardando ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }

      if (modelIndex < GROQ_MODELS.length - 1) {
        console.log(`Tentando modelo alternativo ${GROQ_MODELS[modelIndex + 1]}...`);
        return callGroqWithRetry(prompt, maxRetries, modelIndex + 1);
      }

      throw error;
    }
  }

  throw new Error("Não foi possível processar após várias tentativas com Groq.");
}

export async function generateAllContent(resumeText: string, noc: string, province: string): Promise<GenerativeResponse> {
  if (!groqApiKey) {
    throw new Error("VITE_GROQ_API_KEY não está configurada no arquivo .env.");
  }

  console.log(">>> GROQ INPUT - Raw length:", resumeText.length);

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

  console.log(">>> GROQ OUTPUT - Cleaned length:", cleanedText.length);

  if (cleanedText.length < 50) {
    throw new Error("O texto do currículo está vazio ou muito curto.");
  }

  const adsPrompt = `Você é um Analista de RH e Recrutador Especialista pelo mercado do Canadá. 

O candidato almeja vagas para o [NOC: ${noc}] na província de [${province}], Canadá. O currículo original dele é:
"""
${cleanedText}
"""

Gere uma avaliação de ATS forte. Analise verbos de ação, uso de métricas (quantificação) e o formato do Canadá (sem fotos, dados pessoais extras). Devolva em formato puro de Markdown. Comece indo direto ao ponto sobre o que não funciona.`;

  const optimizedCvPrompt = `CRITICAL INSTRUCTION: You are a resume formatter. You MUST return the output in EXACT markdown format with headers.

Transform this resume into Canadian format. You MUST use these EXACT markdown headers:

# [Full Name]
[Contact line: City, Province | email | phone | LinkedIn]

## PROFESSIONAL SUMMARY
[2-3 sentence summary paragraph]

## PROFESSIONAL EXPERIENCE

### [Job Title] - [Company Name]
*[Start Date] - [End Date] | [City, Country]*
- [Achievement with metric]
- [Achievement with metric]
- [Achievement with metric]

### [Previous Job Title] - [Previous Company]
*[Start Date] - [End Date] | [City, Country]*
- [Achievement with metric]
- [Achievement with metric]

## EDUCATION

### [Degree] - [Institution]
*[Graduation Year] | [City, Country]*

## SKILLS
- **Technical:** [skills]
- **Software:** [tools]
- **Languages:** [languages with proficiency]

Input resume to transform:
${cleanedText}

Target: NOC ${noc} in ${province}, Canada

RULES:
- You MUST start with # for the name
- You MUST use ## for each section header
- You MUST use ### for job titles and education entries
- You MUST use - for bullet points
- You MUST use *italics* for dates/locations
- Include metrics in experience bullets
- Use action verbs (Led, Developed, Implemented, etc.)
- NO photos, age, or personal details
- Return ONLY the markdown resume, nothing else`;

  const jobsPrompt = `Você é um Recrutador Canadense.

Sugira 5 vagas reais que existem (ou cargos de alta demanda comuns) no Canadá focado no NOC ${noc} na região de ${province}.

Para o currículo:
${cleanedText.substring(0, 1000)}...

Retorne EXATAMENTE UM JSON ARRAY puro, sem aspas invertidas de markdown, contendo: [{ "title": "", "company": "Empresa Fictícia ou Real da Região", "location": "${province}, Canada", "matchPercentage": "X%", "url": "https://ca.indeed.com/jobs?q=exemplo", "source": "Indeed" }]`;

  try {
    console.log(">>> Iniciando chamadas paralelas para Groq...");

    const [atsText, cvText, jobsTextRaw] = await Promise.all([
      callGroqWithRetry(adsPrompt),
      callGroqWithRetry(optimizedCvPrompt),
      callGroqWithRetry(jobsPrompt)
    ]);

    console.log(">>> Todas as chamadas Groq concluídas com sucesso!");

    let jobs = [];
    try {
      let cleanJson = jobsTextRaw.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
      }
      jobs = JSON.parse(cleanJson);
    } catch {
      console.error("Falha ao fazer parse do JSON de vagas:", jobsTextRaw);
      jobs = [];
    }

    return {
      atsReview: atsText,
      optimizedCv: cvText,
      jobRecommendations: jobs
    };
  } catch (error: unknown) {
    console.error("Erro na integração com Groq:", error);
    const err = error instanceof Error ? error : new Error(String(error));
    throw new Error(`Erro na IA Groq: ${err.message}`);
  }
}
