import { FileSearch, Sparkles, CheckCircle2 } from "lucide-react"

const steps = [
  {
    icon: FileSearch,
    title: "Diagnóstico ATS Gratuito",
    description: "Saiba o que os sistemas automatizados (ATS) falham ao ler no seu currículo. Receba uma nota detalhada e pontos específicos de melhoria.",
  },
  {
    icon: Sparkles,
    title: "Otimização com IA",
    description: "Nossa IA reescreve suas experiências focando em resultados quantificáveis e palavras-chave do mercado canadense.",
  },
  {
    icon: CheckCircle2,
    title: "Padrão Canadense PDF",
    description: "Receba o currículo formatado no padrão exato do mercado do Canadá, pronto para aplicar nas principais plataformas.",
  }
]

export function HowItWorks() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pattern-grid opacity-20" />
      
      <div className="container relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Section Header - Centered */}
        <div className="text-center mb-16 lg:mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-border" />
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-primary">
              Processo
            </span>
            <div className="h-px w-12 bg-border" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Otimize seu currículo em<br />três passos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Um processo simples, rápido e eficaz para transformar seu currículo 
            em uma máquina de conseguir entrevistas.
          </p>
        </div>

        {/* Steps - Centered Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="group relative bg-card border border-border rounded-xl p-6 lg:p-8 hover:border-primary/30 transition-colors duration-300 text-center"
            >
              {/* Step Number */}
              <div className="text-5xl lg:text-6xl font-heading font-bold text-muted/30 mb-4">
                {String(index + 1).padStart(2, '0')}
              </div>

              {/* Icon */}
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
                <step.icon className="h-7 w-7 text-primary" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
