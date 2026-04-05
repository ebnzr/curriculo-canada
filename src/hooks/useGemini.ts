import { useState, useCallback } from "react"
import { generateAllContent } from "@/lib/gemini"

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

interface UseGeminiOptions {
  onSuccess?: (result: GenerativeResponse) => void
  onError?: (error: Error) => void
}

export function useGemini(options: UseGeminiOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateContent = useCallback(async (
    resumeText: string,
    noc: string,
    province: string
  ) => {
    setError(null)
    setLoading(true)
    
    try {
      const result = await generateAllContent(resumeText, noc, province)
      options.onSuccess?.(result)
      return result
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e))
      setError(error.message)
      options.onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [options])

  return {
    loading,
    error,
    generateContent,
    clearError: () => setError(null)
  }
}
