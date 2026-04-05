const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;

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

async function callDeepSeek(prompt: string): Promise<string> {
  const url = "https://api.deepseek.com/v1/chat/completions";
  
  console.log(">>> Chamando DeepSeek API em vez de Gemini <<<");
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("DeepSeek API Error:", errorData);
    throw new Error(`Erro da IA DeepSeek: ${errorData?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  if (!data?.choices || data.choices.length === 0) {
    throw new Error("A IA não conseguiu processar seu currículo. Por favor, tente novamente.");
  }
  
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("A IA não gerou conteúdo. Por favor, tente novamente.");
  }
  
  return text;
}

export async function generateAllContent(resumeText: string, noc: string, province: string): Promise<GenerativeResponse> {
  if (!apiKey) {
    throw new Error("VITE_DEEPSEEK_API_KEY não está configurada no arquivo .env. Configure a chave da DeepSeek para continuar.");
  }

  console.log(">>> DEEPSEEK INPUT - Raw text length:", resumeText.length);
  console.log(">>> DEEPSEEK INPUT - Contains pasted-image?", resumeText.includes('pasted-image'));
  console.log(">>> DEEPSEEK INPUT - First 100 chars:", resumeText.substring(0, 100));

  let cleanedText = String(resumeText)
    .replace(/pasted-image\d*/gi, '')
    .replace(/data:image\S*/gi, '')
    .replace(/data:application\S*/gi, '')
    .replace(/\[image[^\]]*\]/gi, '')
    .replace(/\[.*?\]/gi, '')
    .replace(/png|jpg|jpeg|gif|bmp|webp/gi, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  console.log(">>> DEEPSEEK OUTPUT - Cleaned text length:", cleanedText.length);
  console.log(">>> DEEPSEEK OUTPUT - Still contains pasted-image?", cleanedText.includes('pasted-image'));

  if (cleanedText.length < 50) {
    throw new Error("O texto do currículo está vazio ou muito curto. Por favor, envie um currículo com pelo menos 50 caracteres de texto.");
  }

  const adsPrompt = `Você é um Analista de RH e Recrutador Especialista pelo mercado do Canadá. \n\nO candidato almeja vagas para o [NOC: ${noc}] na província de [${province}], Canadá. O currículo original dele é:\n"""\n${cleanedText}\n"""\n\nGere uma avaliação de ATS forte. Analise verbos de ação, uso de métricas (quantificação) e o formato do Canadá (sem fotos, dados pessoais extras). Devolva em formato puro de Markdown. Comece indo direto ao ponto sobre o que não funciona.`;
  
  const optimizedCvPrompt = `Você é um Especialista em Carreiras no Canadá. O candidato atualmente reside no BRASIL e está buscando oportunidades na província canadense de ${province} (NOC: ${noc}).\n\nCurrículo original:\n${cleanedText}\n\nINSTRUÇÕES IMPORTANTES:\n1. Preserve EXATAMENTE a localização atual (cidade/estado brasileiro) do candidato - NÃO substitua pela província canadense\n2. Apenas adicione que o objetivo é trabalhar em ${province}, Canadá\n3. Reescreva de forma IMPECÁVEL em Markdown\n4. Use Action Verbs no formato STAR\n5. Adicione resumo objetivo mencionando o objetivo de trabalhar no Canadá\n\nRetorne *apenas* o currículo formatado em Markdown, pronto para o Canadá.`;
  
  const jobsPrompt = `Você é um Recrutador Canadense.\n\nSugira 5 vagas reais que existem (ou cargos de alta demanda comuns) no Canadá focado no NOC ${noc} na região de ${province}.\n\nPara o currículo:\n${cleanedText.substring(0, 1000)}...\n\nRetorne EXATAMENTE UM JSON ARRAY puro, sem aspas invertidas de markdown, contendo: [{ "title": "", "company": "Empresa Fictícia ou Real da Região", "location": "${province}, Canada", "matchPercentage": "X%", "url": "https://ca.indeed.com/jobs?q=exemplo", "source": "Indeed" }]`;

  try {
    const atsText = await callDeepSeek(adsPrompt);
    const cvText = await callDeepSeek(optimizedCvPrompt);
    const jobsTextRaw = await callDeepSeek(jobsPrompt);

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
    console.error("=== ERRO COMPLETO NA INTEGRAÇÃO ===");
    console.error("Error object:", error);
    
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    
    // Se o erro mencionar pasted-image, significa que a API retornou isso (ou é um erro antigo)
    if (err.message.includes('pasted-image')) {
      console.error(">>>>> A IA RETORNOU ERRO RELACIONADO A PASTED-IMAGE <<<<<")
      throw new Error("A IA não conseguiu processar o currículo. Por favor, tente com um currículo diferente.")
    }
    
    // Se for outro erro da API DeepSeek
    if (err.message.includes('DeepSeek')) {
      throw new Error(err.message)
    }
    
    throw err;
  }
}