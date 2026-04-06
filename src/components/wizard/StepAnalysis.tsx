import { useEffect, useRef, useState } from "react"
import { useWizardStore } from "@/stores/wizardStore"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { useNavigate } from "react-router-dom"
import { Loader2, Sparkles } from "lucide-react"
import { generateAllContent } from "@/lib/aiProvider"

export function StepAnalysis() {
  const { noc, province, city, resumeText } = useWizardStore()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("Iniciando análise...")

  const hasRun = useRef(false)

  useEffect(() => {
    if (authLoading) {
      setStatusMessage("Verificando autenticação...")
      return
    }

    if (hasRun.current) return
    hasRun.current = true

    if (!user) {
      setError("Usuário não autenticado. Faça login novamente.")
      setLoading(false)
      return
    }

    const runAnalysis = async () => {
      const cleanedText = (resumeText || '').trim()

      if (!cleanedText || cleanedText.length < 50) {
        setError("Currículo não encontrado. Por favor, volte e faça o upload novamente.")
        setLoading(false)
        return
      }

      const messages = [
        "Lendo seu currículo...",
        "Inspecionando compatibilidade com ATS...",
        "Analisando keywords para o NOC " + noc + "...",
        "Verificando formatação contra padrões do " + (province || "Canadá") + "...",
        "Gerando currículo otimizado...",
        "Buscando vagas compatíveis...",
      ]

      let msgIndex = 0
      const interval = setInterval(() => {
        msgIndex++
        if (msgIndex < messages.length) {
          setProgress(Math.min(msgIndex * 15, 90))
          setStatusMessage(messages[msgIndex])
        }
      }, 2000)

      try {
        setStatusMessage("Conectando aos servidores da IA...")

        const result = await generateAllContent(
          cleanedText,
          noc || "General",
          province || "Canada",
          city || undefined
        )

        const { error: dbError } = await supabase.from('analyses').upsert({
          user_id: user.id,
          original_text: cleanedText,
          ats_score: 65,
          critical_flaws: [],
          generated_resume: result.optimizedCv,
          ats_review: result.atsReview,
          suggested_jobs: result.jobRecommendations
        }, { onConflict: 'user_id' })

        if (dbError) {
          console.error("Erro ao salvar análise:", dbError)
          throw new Error("Erro ao salvar análise no banco de dados.")
        }

        clearInterval(interval)
        setProgress(100)
        setStatusMessage("Análise concluída! Redirecionando...")

        setTimeout(() => {
          navigate('/dashboard?success=true')
        }, 1000)

      } catch (err) {
        console.error("Erro na análise:", err)
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
        setError(errorMessage)
        clearInterval(interval)
        setLoading(false)
      }
    }

    runAnalysis()
  }, [authLoading, user, noc, province, navigate, resumeText])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]" role="status" aria-live="polite">
        <div className="relative flex items-center justify-center mb-8">
          <Loader2 className="h-16 w-16 text-primary animate-spin" aria-hidden="true" />
          <Sparkles className="h-6 w-6 text-primary absolute animate-pulse" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-bold animate-pulse text-foreground">
          {progress < 20 ? "Lendo seu currículo..." :
           progress < 40 ? "Analisando compatibilidade com ATS..." :
           progress < 60 ? "Verificando keywords..." :
           progress < 80 ? "Gerando currículo otimizado..." :
           "Finalizando..."}
        </h3>
        <p className="text-primary mt-2 text-sm font-medium text-center max-w-sm">
          {statusMessage}
        </p>
        <p className="text-muted-foreground mt-2 text-sm text-center max-w-sm">
          Estamos processando seu currículo para o padrão canadense. Isso leva cerca de 20-40 segundos.
        </p>
        <div className="w-full max-w-xs mt-6" aria-hidden="true">
          <div className="bg-secondary h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">{progress}% concluído</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 text-center space-y-4">
        <div className="bg-destructive/10 p-4 rounded-full inline-block">
          <Loader2 className="h-8 w-8 text-destructive" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-destructive">Erro na Análise</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => navigate('/analyze')} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return null
}
