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

export interface UserProfile {
  id: string
  display_name?: string
  email?: string
  is_premium: boolean
  cpf?: string
  phone?: string
  created_at?: string
  updated_at?: string
}

export interface Analysis {
  id?: string
  user_id: string
  original_text: string
  ats_score: number
  critical_flaws: Record<string, unknown>[]
  generated_resume: string
  ats_review?: string
  suggested_jobs: JobRecommendation[]
  created_at?: string
}
