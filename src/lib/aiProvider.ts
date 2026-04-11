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
  linkedinProfile?: Record<string, unknown> | null
}

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Timeout wrapper para qualquer promise
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout de ${ms / 1000}s atingido em: ${label}`)), ms)
    ),
  ])
}

// Obter token de autenticação com timeout
async function getAccessToken(): Promise<string> {
  console.log('[AI Provider] Getting access token...')
  
  // Tentar getSession primeiro (mais rápido, do cache)
  try {
    const { data: { session }, error } = await withTimeout(
      supabase.auth.getSession(),
      5000,
      'getSession'
    )
    
    if (!error && session?.access_token) {
      console.log('[AI Provider] Got token from session cache')
      
      // Verificar se está perto de expirar
      const expiresAt = session.expires_at
      const now = Math.floor(Date.now() / 1000)
      
      if (expiresAt && expiresAt > now + 120) {
        // Token válido por mais de 2 minutos, usar direto
        console.log('[AI Provider] Token valid, expires in', expiresAt - now, 'seconds')
        return session.access_token
      }
      
      // Token expirando em breve, tentar refresh
      console.log('[AI Provider] Token expiring soon, refreshing...')
      try {
        const { data: refreshData, error: refreshError } = await withTimeout(
          supabase.auth.refreshSession(),
          10000,
          'refreshSession'
        )
        if (!refreshError && refreshData.session?.access_token) {
          console.log('[AI Provider] Token refreshed successfully')
          return refreshData.session.access_token
        }
      } catch (refreshErr) {
        console.warn('[AI Provider] Refresh failed, using existing token:', refreshErr)
      }
      
      // Fallback: usar o token existente mesmo que esteja perto de expirar
      return session.access_token
    }
  } catch (sessionErr) {
    console.warn('[AI Provider] getSession failed:', sessionErr)
  }
  
  // Última tentativa: refreshSession
  try {
    const { data: refreshData, error: refreshError } = await withTimeout(
      supabase.auth.refreshSession(),
      10000,
      'refreshSession (fallback)'
    )
    if (!refreshError && refreshData.session?.access_token) {
      console.log('[AI Provider] Got token from refresh (fallback)')
      return refreshData.session.access_token
    }
  } catch (e) {
    console.error('[AI Provider] All auth methods failed:', e)
  }
  
  throw new Error("Sessão não encontrada ou expirada. Faça login novamente.")
}

// Chamada à Edge Function com retry
async function invokeWithRetry(
  resumeText: string,
  noc: string,
  province: string,
  city: string | undefined,
  accessToken: string,
  maxRetries = 2
): Promise<GenerativeResponse> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AI Provider] Attempt ${attempt + 1}/${maxRetries + 1}...`)
      
      const functionUrl = `https://kbtbttdwkdtugrcgzwcn.supabase.co/functions/v1/generate-analysis`
      
      // AbortController para timeout de 90 segundos
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 90000)
      
      console.log(`[AI Provider] Calling function at:`, functionUrl)
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          resumeText,
          noc,
          province,
          city,
        }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      console.log(`[AI Provider] Response status:`, response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[AI Provider] HTTP error ${response.status}:`, errorText)
        
        // Parse da mensagem de erro do servidor
        let serverError = errorText
        try {
          const parsed = JSON.parse(errorText)
          serverError = parsed.error || parsed.message || errorText
        } catch { /* não é JSON */ }
        
        // Se for erro de autorização, não adianta retry
        if (response.status === 401 || response.status === 403) {
          throw new Error(serverError || `Erro de autorização (${response.status}). Faça login novamente.`)
        }
        
        // Se for erro de validação (4xx), não adianta retry
        if (response.status >= 400 && response.status < 500) {
          throw new Error(serverError || `Erro ${response.status}`)
        }
        
        // Se for erro de servidor (500, 503), tentar novamente
        if (response.status >= 500 && attempt < maxRetries) {
          lastError = new Error(`HTTP ${response.status}: ${serverError}`)
          const waitTime = Math.pow(2, attempt) * 2000
          console.log(`[AI Provider] Server error, retrying in ${waitTime}ms...`)
          await delay(waitTime)
          continue
        }
        
        throw new Error(serverError || `Erro ${response.status}`)
      }

      const responseBody = await response.json()
      console.log('[AI Provider] Success on attempt', attempt + 1)
      return responseBody as GenerativeResponse
      
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        lastError = new Error('A análise demorou demais (timeout de 90s). Tente novamente.')
        console.error(`[AI Provider] Request timed out on attempt ${attempt + 1}`)
      } else {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.error(`[AI Provider] Error on attempt ${attempt + 1}:`, lastError.message)
      }
      
      // Não retry para erros de auth, validação ou abort
      const msg = lastError.message
      if (msg.includes('401') || msg.includes('403') || msg.includes('Premium') || msg.includes('Faça login')) {
        break
      }
      
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 2000
        console.log(`[AI Provider] Retrying in ${waitTime}ms...`)
        await delay(waitTime)
      }
    }
  }

  throw lastError || new Error("Falha após múltiplas tentativas.")
}

export async function generateAllContent(
  resumeText: string,
  noc: string,
  province: string,
  city?: string
): Promise<GenerativeResponse> {
  console.log('[AI Provider] === Starting analysis ===')
  
  const accessToken = await getAccessToken()
  
  console.log('[AI Provider] Token obtained, length:', accessToken.length)
  console.log('[AI Provider] Token header:', accessToken.split('.')[0])
  
  try {
    return await invokeWithRetry(
      resumeText,
      noc,
      province,
      city,
      accessToken
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('[AI Provider] Final error:', errorMessage)
    
    // Mensagens amigáveis para o usuário
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout') || errorMessage.includes('AbortError')) {
      throw new Error("A análise demorou demais. Tente novamente em alguns segundos.")
    }
    if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
      throw new Error("Serviço temporariamente indisponível. Aguarde 1 minuto e tente novamente.")
    }
    if (errorMessage.includes('500')) {
      throw new Error("Erro interno no processamento. Tente novamente ou contate o suporte.")
    }
    if (errorMessage.includes('Premium')) {
      throw new Error("Assinatura Premium necessária para gerar a análise.")
    }
    
    throw err
  }
}
