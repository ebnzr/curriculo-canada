import { useEffect } from "react"
import { useWizardStore } from "@/stores/wizardStore"
import { StepContext } from "./StepContext"
import { StepUpload } from "./StepUpload"
import { StepAtsPreview } from "./StepAtsPreview"
import { StepAnalysis } from "./StepAnalysis"
import { StepPaywall } from "./StepPaywall"
import { Progress } from "@/components/ui/progress"

const TOTAL_STEPS = 5

const stepLabels = [
  { step: 1, label: "Onde você quer chegar" },
  { step: 2, label: "Seu Currículo" },
  { step: 3, label: "Análise ATS Grátis" },
  { step: 4, label: "Pagamento" },
  { step: 5, label: "Currículo e LinkedIn Otimizados" },
]

const stepTitles: Record<number, string> = {
  1: "Prepare o Contexto",
  2: "Forneça seu Currículo Atual",
  3: "Diagnóstico ATS Gratuito",
  4: "Pagamento",
  5: "Analisando...",
}

export function WizardContainer() {
  const currentStep = useWizardStore((state) => state.currentStep)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  const progressValue = (currentStep / TOTAL_STEPS) * 100

  return (
    <div className="flex flex-col items-center justify-start p-4 md:p-8 w-full max-w-4xl mx-auto space-y-8 mt-4 md:mt-8">
      {/* Etapa Title & Progress bar */}
      <div className="w-full max-w-2xl text-center space-y-4">
        <h1 className="text-3xl font-bold">
          {stepTitles[currentStep] ?? ""}
        </h1>
        <Progress value={progressValue} className="w-full h-2" aria-label={`Progresso: Etapa ${currentStep} de ${TOTAL_STEPS}`} />
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          {stepLabels.map(({ step, label }) => (
            <span
              key={step}
              className={currentStep === step ? "text-primary font-semibold" : currentStep > step ? "text-foreground/70" : ""}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Rendeirização das Etapas (Step logic) */}
      <div className="w-full max-w-2xl bg-card border rounded-2xl shadow-sm overflow-hidden">
        {currentStep === 1 && <StepContext />}
        {currentStep === 2 && <StepUpload />}
        {currentStep === 3 && <StepAtsPreview />}
        {currentStep === 4 && <StepPaywall />}
        {currentStep === 5 && <StepAnalysis />}
      </div>
    </div>
  )
}
