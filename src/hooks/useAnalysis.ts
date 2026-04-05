import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { generateAllContent } from "@/lib/gemini"

export interface AnalysisData {
  id?: string
  user_id: string
  original_text: string
  ats_score: number
  critical_flaws: Record<string, unknown>[]
  generated_resume: string
  ats_review?: string
  suggested_jobs: {
    title: string
    company: string
    location: string
    matchPercentage: number
    url?: string
    source?: string
  }[]
}

interface UseAnalysisOptions {
  onSuccess?: (data: AnalysisData) => void
  onError?: (error: Error) => void
}

export function useAnalysis(options: UseAnalysisOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalysis = useCallback(async (userId: string, forceGenerate = false) => {
    setError(null)
    setLoading(true)
    
    try {
      const { data: dbData, error: dbError } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (dbError) throw dbError
      
      if (dbData && dbData.length > 0 && !forceGenerate) {
        return dbData[0]
      }

      return null
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e))
      setError(error.message)
      options.onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [options])

  const generateAnalysis = useCallback(async (
    userId: string,
    resumeText: string,
    noc: string,
    province: string,
    fallbackScore?: number,
    fallbackFlaws?: Record<string, unknown>[]
  ) => {
    setError(null)
    setGenerating(true)
    
    try {
      const geminiResult = await generateAllContent(
        resumeText, 
        noc || "General", 
        province || "Canada"
      )
      
      const newAnalysis = {
        user_id: userId,
        original_text: resumeText,
        ats_score: fallbackScore || 45,
        critical_flaws: fallbackFlaws || [],
        generated_resume: geminiResult.optimizedCv,
        generated_linkedin: null,
        suggested_jobs: geminiResult.jobRecommendations,
        ats_review: geminiResult.atsReview,
      }

      const { data: savedData, error: insertError } = await supabase
        .from('analyses')
        .insert([newAnalysis])
        .select()
        .single()
      
      if (insertError) throw insertError
      
      if (savedData) {
        options.onSuccess?.(savedData)
        return savedData
      }
      
      return newAnalysis
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e))
      setError(error.message)
      options.onError?.(error)
      throw error
    } finally {
      setGenerating(false)
    }
  }, [options])

  return {
    loading,
    generating,
    error,
    fetchAnalysis,
    generateAnalysis,
    clearError: () => setError(null)
  }
}
