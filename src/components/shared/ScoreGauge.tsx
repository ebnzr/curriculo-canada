import { useEffect, useState, useRef } from "react"

interface ScoreGaugeProps {
  score: number
  size?: number
}

export function ScoreGauge({ score, size = 120 }: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)
  const animationRef = useRef<number>()

  useEffect(() => {
    setIsAnimating(true)
    const duration = 1500 // 1.5 segundos de animação
    const startTime = performance.now()
    const startValue = 0
    
    // Se o score for 0, fazemos uma animação especial:
    // sobe até 20, depois desce para 0 (indicando "análise completa - resultado zero")
    const hasZeroScore = score === 0
    const peakValue = hasZeroScore ? 20 : score
    const holdAtPeak = hasZeroScore ? 600 : 0 // tempo no pico para score 0
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      
      let currentScore: number
      
      if (hasZeroScore && elapsed < duration * 0.4) {
        // Fase 1: sobe até 20 (40% do tempo)
        const progress = elapsed / (duration * 0.4)
        currentScore = startValue + (peakValue - startValue) * easeOutQuart(progress)
      } else if (hasZeroScore && elapsed < duration * 0.4 + holdAtPeak) {
        // Fase 2: segura no pico por um momento
        currentScore = peakValue
      } else if (hasZeroScore) {
        // Fase 3: desce para 0
        const returnElapsed = elapsed - (duration * 0.4 + holdAtPeak)
        const returnDuration = duration * 0.6 - holdAtPeak
        const progress = Math.min(returnElapsed / returnDuration, 1)
        currentScore = peakValue * (1 - easeInQuart(progress))
      } else {
        // Animação normal para scores > 0
        const progress = Math.min(elapsed / duration, 1)
        currentScore = startValue + (score - startValue) * easeOutQuart(progress)
      }
      
      setDisplayScore(Math.round(currentScore))
      
      if (elapsed < duration) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayScore(score)
        setIsAnimating(false)
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [score])
  
  // Easing functions para movimento natural
  function easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4)
  }
  
  function easeInQuart(t: number): number {
    return t * t * t * t
  }

  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (displayScore / 100) * circumference

  const getColor = () => {
    if (score >= 70) return "#166534"
    if (score >= 40) return "#92400e"
    return "#991b1b"
  }

  const getLabel = () => {
    if (score >= 70) return "Bom"
    if (score >= 40) return "Regular"
    return "Crítico"
  }

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Pontuação ATS: ${score} de 100 — ${getLabel()}`}
    >
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        aria-hidden="true"
      >
        {/* Fundo do gauge */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted-foreground/20"
        />
        {/* Arco de progresso animado */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-75 ${isAnimating ? '' : 'drop-shadow-sm'}`}
          style={{
            filter: isAnimating ? 'drop-shadow(0 0 4px ' + getColor() + '40)' : undefined
          }}
        />
      </svg>
      {/* Centro com número */}
      <div className="absolute flex flex-col items-center justify-center" aria-hidden="true">
        <span 
          className={`text-3xl font-black transition-transform duration-150 ${isAnimating ? 'scale-110' : 'scale-100'}`} 
          style={{ color: getColor() }}
        >
          {displayScore}
        </span>
        <span className="text-xs text-muted-foreground font-medium">/100</span>
      </div>
      {/* Indicador de análise completa para score 0 */}
      {score === 0 && !isAnimating && (
        <div 
          className="absolute -bottom-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
        >
          Análise completa
        </div>
      )}
    </div>
  )
}
