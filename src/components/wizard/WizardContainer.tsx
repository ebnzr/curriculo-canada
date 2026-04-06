import { useEffect } from "react"
import { useWizardStore } from "@/stores/wizardStore"
import { StepContext } from "./StepContext"
import { StepUpload } from "./StepUpload"
import { StepAnalysis } from "./StepAnalysis"
import { StepPaywall } from "./StepPaywall"
import { Progress } from "@/components/ui/progress"

export function WizardContainer() {
  const currentStep = useWizardStore((state) => state.currentStep)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  // Calcule o progresso baseado em 4 etapas
  const progressValue = (currentStep / 4) * 100

  return (
    <div className="flex flex-col items-center justify-start p-4 md:p-8 w-full max-w-4xl mx-auto space-y-8 mt-4 md:mt-8">
      {/* Etapa Title & Progress bar */}
      <div className="w-full max-w-2xl text-center space-y-4">
        <h1 className="text-3xl font-bold">
          {currentStep === 1 && "Prepare o Contexto"}
          {currentStep === 2 && "Forneça seu Currículo Atual"}
          {currentStep === 3 && "Pagamento"}
          {currentStep === 4 && "Analisando..."}
        </h1>
        <Progress value={progressValue} className="w-full h-2" aria-label={`Progresso: Etapa ${currentStep} de 4`} />
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span className={currentStep === 1 ? "text-red-600 font-semibold" : ""}>Onde você quer chegar</span>
          <span className={currentStep === 2 ? "text-red-600 font-semibold" : ""}>Seu Currículo</span>
          <span className={currentStep === 3 ? "text-red-600 font-semibold" : ""}>Pagamento</span>
          <span className={currentStep === 4 ? "text-red-600 font-semibold" : ""}>Análise IA</span>
        </div>
      </div>

      {/* Rendeirização das Etapas (Step logic) */}
      <div className="w-full max-w-2xl bg-card border rounded-2xl shadow-sm overflow-hidden">
        {currentStep === 1 && <StepContext />}
        {currentStep === 2 && <StepUpload />}
        {currentStep === 3 && <StepPaywall />}
        {currentStep === 4 && <StepAnalysis />}
      </div>
    </div>
  )
}
