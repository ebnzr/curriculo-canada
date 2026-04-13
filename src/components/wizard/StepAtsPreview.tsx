import { useEffect, useState } from "react"
import { useWizardStore } from "@/stores/wizardStore"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
  Linkedin,
  FileText,
  Target,
} from "lucide-react"

function getScoreColor(score: number): string {
  if (score >= 80) return "#22C55E" // Competitivo (Verde)
  if (score >= 40) return "#F59E0B" // Razoável (Laranja)
  return "#EF4444" // Reprovável (Vermelho)
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Competitivo"
  if (score >= 40) return "Razoável"
  return "Reprovável"
}

function getScoreMessage(score: number): string {
  if (score >= 80)
    return "Seu currículo tem uma ótima base. Você está pronto para competir no mercado canadense!"
  if (score >= 40)
    return "O seu currículo tem potencial, mas precisa de ajustes na triagem automática (ATS)."
  return "Seu currículo apresenta erros críticos e será rejeitado pelos sistemas ATS antes de chegar ao recrutador."
}

/**
 * SVG Gauge / Speedometer component
 * Renders a gradient scale with a black needle indicating the score.
 */
function AtsGauge({ score, animated }: { score: number; animated: boolean }) {
  const size = 300
  const strokeWidth = 16
  const radius = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2 + 10

  const startAngle = 180
  const endAngle = 0
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const arcStart = {
    x: cx + radius * Math.cos(toRad(startAngle)),
    y: cy - radius * Math.sin(toRad(startAngle)),
  }
  const arcEndBg = {
    x: cx + radius * Math.cos(toRad(endAngle)),
    y: cy - radius * Math.sin(toRad(endAngle)),
  }

  const bgPath = `M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 0 1 ${arcEndBg.x} ${arcEndBg.y}`

  // The needle extends from the center outwards
  const needleLength = radius - strokeWidth - 8

  const displayScore = animated ? score : 0
  const activeColor = getScoreColor(displayScore)

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[340px] mx-auto">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
        className="overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />   {/* Red */}
            <stop offset="50%" stopColor="#F59E0B" />  {/* Orange */}
            <stop offset="100%" stopColor="#22C55E" /> {/* Green */}
          </linearGradient>
        </defs>

        {/* Gradual Scale Arc */}
        <path
          d={bgPath}
          fill="none"
          stroke="url(#score-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Internal Tick Marks */}
        {[40, 80].map((tick) => {
          const angle = startAngle - (tick / 100) * 180
          const innerR = radius - strokeWidth / 2 + 2
          const outerR = radius + strokeWidth / 2 - 2
          return (
            <line
              key={tick}
              x1={cx + innerR * Math.cos(toRad(angle))}
              y1={cy - innerR * Math.sin(toRad(angle))}
              x2={cx + outerR * Math.cos(toRad(angle))}
              y2={cy - outerR * Math.sin(toRad(angle))}
              stroke="white"
              strokeWidth={3}
              className="opacity-70"
            />
          )
        })}

        {/* Black Needle */}
        <g
          className="transition-transform duration-[1500ms] ease-out"
          style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${animated ? (score / 100) * 180 : 0}deg)` }}
        >
          {/* Base pointing left (180 deg) */}
          <path
            d={`M ${cx} ${cy + 6} L ${cx - needleLength} ${cy} L ${cx} ${cy - 6} Z`}
            fill="#171717"
            stroke="#171717"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <circle cx={cx} cy={cy} r="10" fill="#171717" />
          <circle cx={cx} cy={cy} r="4" fill="#ffffff" />
        </g>
      </svg>

      {/* Subtle Legend below the gauge */}
      <div className="flex justify-between w-full px-4 mt-4 opacity-80 gap-2">
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div className="w-6 h-1.5 rounded-full bg-red-500"></div>
          <span className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider text-center">Reprovável</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div className="w-6 h-1.5 rounded-full bg-amber-500"></div>
          <span className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider text-center">Razoável</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div className="w-6 h-1.5 rounded-full bg-green-500"></div>
          <span className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider text-center">Competitivo</span>
        </div>
      </div>

      {/* Large Score Display below the legend */}
      <div className="flex flex-col items-center mt-10">
        <span
          className="text-7xl font-heading font-black tabular-nums transition-colors duration-700 leading-none"
          style={{ color: activeColor }}
        >
          {displayScore}
        </span>
        <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase mt-2">
          / 100
        </span>
      </div>
    </div>
  )
}

export function StepAtsPreview() {
  const { atsScore, atsIssues, setStep } = useWizardStore()
  const [animated, setAnimated] = useState(false)

  const errors = atsIssues.filter((i) => i.type === "error")
  const warnings = atsIssues.filter((i) => i.type === "warning")

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300)
    return () => clearTimeout(timer)
  }, [])

  const scoreColor = getScoreColor(atsScore)
  const scoreLabel = getScoreLabel(atsScore)

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 border border-primary/15 px-4 py-1.5 mb-2">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary tracking-wide">
            Análise ATS Gratuita
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-heading font-black text-foreground">
          Diagnóstico do seu Currículo
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Veja como os sistemas automatizados de RH (ATS) interpretam o seu currículo hoje.
        </p>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center">
        <AtsGauge score={atsScore} animated={animated} />

        {/* Score label badge */}
        <div
          className="mt-2 px-4 py-1.5 rounded-full text-sm font-bold text-white transition-all duration-700"
          style={{ backgroundColor: animated ? scoreColor : "#A8A29E" }}
        >
          {animated ? scoreLabel : "Calculando..."}
        </div>
      </div>

      {/* Score message */}
      <p className="text-center text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
        {animated ? getScoreMessage(atsScore) : "Analisando seu currículo..."}
      </p>

      {/* Issues summary */}
      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <div className="text-2xl font-heading font-black text-red-700">{errors.length}</div>
            <div className="text-xs font-medium text-red-600/80">
              {errors.length === 1 ? "Erro crítico" : "Erros críticos"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-heading font-black text-amber-700">{warnings.length}</div>
            <div className="text-xs font-medium text-amber-600/80">
              {warnings.length === 1 ? "Ponto de atenção" : "Pontos de atenção"}
            </div>
          </div>
        </div>
      </div>

      {/* Issue list (abbreviated — show first 3) */}
      <div className="max-w-md mx-auto space-y-2">
        {atsIssues.slice(0, 3).map((issue, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50 border border-border text-sm"
          >
            {issue.type === "error" ? (
              <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <span className="text-foreground/80 leading-snug">{issue.message}</span>
          </div>
        ))}

        {atsIssues.length > 3 && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>
              + {atsIssues.length - 3} {atsIssues.length - 3 === 1 ? "item bloqueado" : "itens bloqueados"} — disponível no relatório completo
            </span>
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Desbloqueie o pacote completo
          </span>
        </div>
      </div>

      {/* Upsell features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
        {[
          { icon: Target, label: "Raio-X de Carreira" },
          { icon: FileText, label: "Currículo Otimizado" },
          { icon: Linkedin, label: "Perfil LinkedIn" },
        ].map((feat, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/10"
          >
            <feat.icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground">{feat.label}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <Button
          size="lg"
          onClick={() => setStep(4)}
          className="w-full max-w-sm h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 gap-2"
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          Desbloquear Análise Completa
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Taxa única • Sem assinaturas • Resultado imediato
        </p>
      </div>
    </div>
  )
}
