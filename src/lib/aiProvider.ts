import { generateAllContent as generateWithGroq } from './groq'
import { generateAllContent as generateWithGemini } from './gemini'

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

export async function generateAllContent(resumeText: string, noc: string, province: string): Promise<GenerativeResponse> {
  console.log("=== AI PROVIDER - Tentando Groq primeiro ===");
  
  try {
    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (groqApiKey) {
      console.log(">>> Chamando Groq API...");
      const result = await generateWithGroq(resumeText, noc, province);
      console.log(">>> Groq concluído com sucesso!");
      return result;
    } else {
      console.log(">>> Groq API key não configurada, usando Gemini como fallback");
    }
  } catch (groqError) {
    console.error(">>> Groq falhou, tentando Gemini como fallback:", groqError);
    
    try {
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (geminiApiKey) {
        console.log(">>> Chamando Gemini API (fallback)...");
        const result = await generateWithGemini(resumeText, noc, province);
        console.log(">>> Gemini (fallback) concluído com sucesso!");
        return result;
      }
    } catch (geminiError) {
      console.error(">>> Gemini também falhou:", geminiError);
      const gemErr = geminiError instanceof Error ? geminiError : new Error(String(geminiError));
      throw new Error(`Todas as IAs falharam. Groq: ${groqError instanceof Error ? groqError.message : String(groqError)}. Gemini: ${gemErr.message}`);
    }
    
    throw new Error("Nenhuma IA está configurada. Configure VITE_GROQ_API_KEY ou VITE_GEMINI_API_KEY no arquivo .env.");
  }

  // Se chegou aqui, Groq não estava configurado
  console.log(">>> Usando Gemini como provider principal...");
  return generateWithGemini(resumeText, noc, province);
}
