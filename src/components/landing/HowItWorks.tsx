import { FileSearch, Sparkles, CheckCircle2, Linkedin, Target, Briefcase } from "lucide-react"

const features = [
  {
    icon: FileSearch,
    title: "Diagnóstico ATS Gratuito",
    description: "Saiba o que os sistemas automatizados (ATS) falham ao ler no seu currículo. Receba uma nota detalhada e dicas de melhoria.",
  },
  {
    icon: Sparkles,
    title: "Otimização com IA",
    description: "Nossa IA reescreve suas experiências focando em resultados quantificáveis e palavras-chave do mercado canadense.",
  },
  {
    icon: CheckCircle2,
    title: "Padrão Canadense PDF",
    description: "Receba o currículo formatado no padrão exato do Canadá, pronto para aplicar nas principais plataformas profissionais.",
  },
  {
    icon: Target,
    title: "Raio-X de Carreira",
    description: "Uma análise completa do seu perfil direcionada especificamente para seus objetivos profissionais e de imigração no Canadá.",
  },
  {
    icon: Linkedin,
    title: "Perfil LinkedIn",
    description: "Receba uma versão do seu perfil e resumo totalmente estruturada em inglês, pronta para networking internacional e chamativa para recrutadores.",
  },
  {
    icon: Briefcase,
    title: "Recomendação de Vagas",
    description: "Descubra vagas reais no mercado canadense com alta probabilidade de fit com o seu perfil atual e experiências.",
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
              Recursos
            </span>
            <div className="h-px w-12 bg-border" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Tudo o que você precisa<br />para o mercado canadense
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mais do que um simples currículo, oferecemos um ecossistema completo 
            para maximizar suas chances e transformar sua carreira.
          </p>
        </div>

        {/* Features - Centered Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative bg-card border border-border rounded-xl p-6 lg:p-8 hover:border-primary/50 transition-colors duration-300"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              
              {/* Icon */}
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors relative z-10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-heading font-semibold text-foreground mb-3 relative z-10">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm lg:text-base text-muted-foreground leading-relaxed relative z-10">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
