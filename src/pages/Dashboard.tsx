import { useEffect, useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/useAuth"
import { Sparkles, Loader2, FileCheck, PartyPopper, CheckCircle, FileText, Zap, Briefcase } from "lucide-react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { TabResume } from "@/components/dashboard/TabResume"
import { TabReview } from "@/components/dashboard/TabReview"
import { TabJobs } from "@/components/dashboard/TabJobs"
import type { JobRecommendation } from "@/components/dashboard/TabJobs"

interface AnalysisData {
  id?: string
  user_id: string
  original_text: string
  ats_score: number
  critical_flaws: Record<string, unknown>[]
  generated_resume: string
  ats_review?: string
  suggested_jobs: JobRecommendation[]
}

export function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [fetchError, setFetchError] = useState<string | null>(null)

  const loadAnalysis = useCallback(async () => {
    if (!user) return
    setFetchError(null)

    try {
      const { data: dbData, error: dbError } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (dbError) throw dbError

      if (dbData && dbData.length > 0) {
        const row = dbData[0]

        const cleanText = (text: string) => {
          return (text || '')
            .replace(/pasted-image\d*/gi, '')
            .replace(/data:image\S*/gi, '')
            .replace(/data:application\S*/gi, '')
            .replace(/\[image[^\]]*\]/gi, '')
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            .trim()
        }

        setData({
          ...row,
          original_text: cleanText(row.original_text),
          generated_resume: cleanText(row.generated_resume),
          ats_review: cleanText(row.ats_review),
        })
        setLoading(false)
        return
      }

      console.log("Nenhuma análise encontrada. Usuário precisa fazer análise.")
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e))
      console.error("Dashboard Error:", error)
      setFetchError("Ocorreu um erro ao carregar sua análise. " + (error.message || "Tente novamente em instantes."))
    } finally {
      setGenerating(false)
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })

    if (authLoading) return

    if (searchParams.get('success') === 'true') {
      setShowSuccess(true)
      window.history.replaceState({}, '', '/dashboard')
    }

    if (user) {
      loadAnalysis()
    } else {
      setLoading(false)
    }
  }, [user, authLoading, searchParams, loadAnalysis])

  const successModal = showSuccess && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-primary/5 animate-in zoom-in duration-500">
      <div className="bg-background border border-primary/20 shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)] rounded-3xl p-8 max-w-md w-full text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse"></div>

        <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
          <PartyPopper className="h-10 w-10 text-primary" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-foreground">Pagamento Confirmado!</h2>
          <p className="text-lg font-medium text-primary">Bem-vindo ao Canadá Path AI Premium.</p>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed">
          Você acaba de dar o passo mais importante da sua jornada. <br />
          <strong>O seu futuro no Canadá começa agora.</strong> <br /><br />
          Nossa IA está trabalhando 100% focada em transformar sua experiência em um passaporte para o mercado canadense.
        </p>

        <Button onClick={() => setShowSuccess(false)} className="w-full h-12 rounded-xl text-base font-extrabold shadow-lg shadow-primary/20 group">
          Explorar Meu Dashboard
          <CheckCircle className="ml-2 h-5 w-5 group-hover:scale-125 transition-transform" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )

  if (loading || generating) {
    return (
      <div className="min-h-screen bg-background">
        {successModal}
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 text-center p-4" role="status" aria-live="polite">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" aria-hidden="true"></div>
            <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" aria-hidden="true" />
          </div>
          <div className="space-y-4 max-w-md mx-auto">
            <h2 className="text-3xl font-black tracking-tight">
              {generating ? "A IA está processando seu Currículo..." : "Conectando ao sistema..."}
            </h2>
            <p className="text-muted-foreground text-lg italic leading-relaxed">
              {generating
                ? "Estamos reestruturando suas experiências para o padrão canadense. Isso leva cerca de 20 a 40 segundos."
                : "\"A paciência é amarga, mas seu fruto é doce.\" — Jean-Jacques Rousseau"}
            </p>
            {generating && (
              <div className="pt-6 flex flex-col items-center space-y-4" aria-hidden="true">
                <div className="flex gap-3">
                  <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 bg-primary rounded-full animate-bounce"></span>
                </div>
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-2/3 animate-progress origin-left"></div>
                </div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] opacity-70">Otimizando para ATS Canadense</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    const isPremium = profile?.is_premium
    return (
      <div className="min-h-screen bg-background">
        {successModal}
        <div className="container mx-auto max-w-2xl py-20 px-4 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-muted w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <FileCheck className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black">Nenhum resultado encontrado</h2>
            <p className="text-muted-foreground text-lg">
              {isPremium
                ? "Você é um membro Premium, mas não encontramos sua análise. Vamos gerá-la agora?"
                : "Parece que você ainda não tem uma análise completa. Comece agora para formatar seu currículo para o Canadá."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {isPremium ? (
              <Button size="lg" onClick={() => navigate('/analyze')} disabled={generating} className="h-14 px-8 rounded-2xl font-bold shadow-xl shadow-primary/20">
                {generating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> : <Sparkles className="mr-2 h-5 w-5" aria-hidden="true" />}
                Gerar Análise com IA Agora
              </Button>
            ) : (
              <Button size="lg" onClick={() => navigate('/analyze')} className="h-14 px-8 rounded-2xl font-bold">
                Iniciar Nova Análise
              </Button>
            )}
          </div>

          {fetchError && (
            <div
              role="alert"
              className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium animate-in fade-in zoom-in duration-300"
            >
              <p>{fetchError}</p>
              {fetchError.includes("Não encontramos o texto") && (
                <Button variant="link" onClick={() => navigate('/analyze')} className="text-destructive font-bold p-0 h-auto mt-1">
                  Voltar para o início e colar currículo
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {successModal}
      <div className="container mx-auto max-w-5xl py-8 px-4 space-y-8 animate-in fade-in duration-500">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <div className="bg-primary/20 p-2 rounded-full">
              <Sparkles className="w-6 h-6 text-primary" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-primary tracking-wider uppercase">Acesso Premium Ativo</p>
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
              Padrão Canadense (Canadá)
            </div>
          </div>
          <h1 className="text-3xl font-black mt-4">Olá, {profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "viajante"}!</h1>
          <p className="text-muted-foreground mt-2 text-lg">Aqui está o resultado da análise detalhada da nossa Inteligência Artificial.</p>
        </div>

        <Tabs defaultValue="optimized" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-1.5 border-2 border-primary/20 shadow-lg shadow-primary/5">
            <TabsTrigger value="optimized" className="rounded-xl font-bold data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 py-3 px-2 transition-all duration-200 flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Currículo Otimizado</span>
              <span className="sm:hidden">Otimizado</span>
            </TabsTrigger>
            <TabsTrigger value="review" className="rounded-xl font-bold data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 py-3 px-2 transition-all duration-200 flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Raio-X (Original)</span>
              <span className="sm:hidden">Raio-X</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="rounded-xl font-bold data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 py-3 px-2 transition-all duration-200 flex items-center justify-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Vagas e Oportunidades</span>
              <span className="sm:hidden">Vagas</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-8 border-2 border-primary/20 rounded-2xl bg-gradient-to-br from-card to-card/50 shadow-xl shadow-primary/10 p-6 sm:p-8 min-h-[500px]">
            <TabsContent value="optimized" className="mt-0">
              <TabResume content={data?.generated_resume || ""} />
            </TabsContent>

            <TabsContent value="review" className="mt-0">
              <TabReview content={data?.ats_review || ""} />
            </TabsContent>

            <TabsContent value="jobs" className="mt-0">
              <TabJobs jobs={data?.suggested_jobs || []} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  )
}
