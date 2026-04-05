import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function CTA() {
  return (
    <section className="relative py-20 lg:py-32 bg-primary overflow-hidden">
      {/* Subtle Maple Leaf Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="maple-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path 
                d="M50 20 L55 35 L70 35 L58 45 L63 60 L50 50 L37 60 L42 45 L30 35 L45 35 Z" 
                fill="currentColor"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#maple-pattern)" />
        </svg>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-dark opacity-90" />

      <div className="container relative px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-8">
          <Sparkles className="h-3.5 w-3.5 text-white/80" />
          <span className="text-xs font-medium text-white/90 tracking-wide">
            Análise gratuita disponível
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 leading-tight">
          Pronto para conquistar sua vaga no Canadá?
        </h2>

        {/* Description */}
        <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
          Pare de ser rejeitado automaticamente por robôs de RH. 
          Transforme seu currículo em uma máquina de conseguir entrevistas.
        </p>

        {/* CTA Button - Login Required */}
        <Link to="/login?redirect=/analyze">
          <Button 
            size="lg"
            className="h-14 px-10 text-base font-semibold bg-white text-primary hover:bg-white/90 shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5 transition-all duration-300"
          >
            Faça login para começar
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>

        {/* Trust Note */}
        <p className="text-sm text-white/60 mt-6">
          Login rápido via Google • Resultados em segundos
        </p>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
    </section>
  )
}
