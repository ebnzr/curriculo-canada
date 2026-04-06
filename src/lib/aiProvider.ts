import { supabase } from './supabase'

export interface JobRecommendation {
  title: string
  company: string
  location: string
  matchPercentage: number
  url: string
  source: string
}

export interface GenerativeResponse {
  atsReview: string
  optimizedCv: string
  jobRecommendations: JobRecommendation[]
}

export async function generateAllContent(
  resumeText: string,
  noc: string,
  province: string,
  city?: string
): Promise<GenerativeResponse> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("Usuário não autenticado. Faça login para continuar.")
  }

  // Retry logic for Edge Function calls
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[AI Provider] Attempt ${attempt + 1}/${maxRetries}`)
      
      const { data, error } = await supabase.functions.invoke('generate-analysis', {
        body: { resumeText, noc, province, city },
        headers: {
          'x-dev-mode': import.meta.env.DEV ? 'true' : 'false'
        }
      })

      if (error) {
        const message = error.message || "Erro ao processar análise."
        lastError = new Error(message)

        if (message.includes("Premium subscription required") || message.includes("403")) {
          throw new Error("Acesso premium necessário para gerar a análise completa.")
        }
        if (message.includes("429") || message.includes("Limite diário")) {
          throw new Error("Limite diário de análises atingido. Tente novamente amanhã.")
        }
        if (message.includes("503") || message.includes("ocupados")) {
          if (attempt < maxRetries - 1) {
            console.log(`[AI Provider] Got 503, retrying in ${Math.pow(2, attempt)}s...`)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
            continue
          }
          throw new Error("Os servidores da IA estão temporariamente ocupados. Aguarde 1-2 minutos e tente novamente.")
        }

        // For other errors, retry unless it's a client error
        if (!message.includes("400") && !message.includes("401") && attempt < maxRetries - 1) {
          console.log(`[AI Provider] Got error: ${message}, retrying...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }

        throw lastError
      }

      console.log(`[AI Provider] Success on attempt ${attempt + 1}`)
      return data as GenerativeResponse
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      
      if (attempt < maxRetries - 1) {
        console.log(`[AI Provider] Attempt ${attempt + 1} failed, retrying...`, lastError.message)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error("Falha ao processar análise após múltiplas tentativas.")
}
