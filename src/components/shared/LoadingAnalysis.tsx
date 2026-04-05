import { Loader2 } from "lucide-react"

interface LoadingAnalysisProps {
  message?: string
  submessage?: string
  showProgress?: boolean
}

export function LoadingAnalysis({ 
  message = "A IA está processando seu Currículo...",
  submessage = "Estamos reestruturando suas experiências para o padrão canadense. Isso leva cerca de 20 a 40 segundos.",
  showProgress = true
}: LoadingAnalysisProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 text-center p-4">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
        <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
      </div>
      <div className="space-y-4 max-w-md mx-auto">
        <h2 className="text-3xl font-black tracking-tight">
          {message}
        </h2>
        <p className="text-muted-foreground text-lg italic leading-relaxed">
          "{submessage}"
        </p>
        {showProgress && (
          <div className="pt-6 flex flex-col items-center space-y-4">
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
  )
}
