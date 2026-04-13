import { Sparkles, FileText, TrendingUp, Clock, ArrowRight } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function Hero() {
  const { user, loading } = useAuth()

  return (
    <section className="relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 pattern-dots opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/98 to-muted/20" />

      <div className="container relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="py-16 lg:py-24">
          
          {/* Editorial Masthead */}
          <div className="mb-10 lg:mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">
                CurrículoCanadá • Edição 2025
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>

          {/* Centered Content */}
          <div className="max-w-3xl mx-auto text-center">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary tracking-wide">
                1.000+ currículos analisados
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight text-foreground leading-[0.95] mb-6">
              Vença o ATS e<br />
              conquiste sua vaga no{" "}
              <span className="relative inline-block">
                Canadá
                <svg
                  className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-2 sm:h-3 text-primary"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 8C40 2 80 2 100 6C120 10 160 10 198 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
              Descubra por que você não está sendo chamado para entrevistas.
              Analisamos seu currículo contra vagas reais do mercado canadense
              e criamos uma versão otimizada pela IA em segundos.
            </p>

            {/* CTA Button */}
            {loading ? (
              <div className="h-11 w-48 bg-primary/20 rounded-lg animate-pulse" aria-hidden="true" />
            ) : user ? (
              <Button
                asChild
                size="lg"
                className="gap-2 rounded-lg shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:-translate-y-0.5"
              >
                <Link to="/analyze">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Analisar meu Currículo
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="gap-2 rounded-lg shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:-translate-y-0.5"
              >
                <Link to="/login">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Faça login para analisar seu currículo
                </Link>
              </Button>
            )}
          </div>

          {/* Stats Row - Centered Below */}
          <div className="mt-16 lg:mt-20 flex flex-wrap items-center justify-center gap-8 lg:gap-12 pt-8 border-t border-border/50 max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-heading font-bold text-foreground">98%</div>
                <div className="text-xs text-muted-foreground">Satisfação</div>
              </div>
            </div>
            
            <div className="w-px h-10 bg-border hidden sm:block" />
            
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-heading font-bold text-foreground">3x</div>
                <div className="text-xs text-muted-foreground">Mais entrevistas</div>
              </div>
            </div>
            
            <div className="w-px h-10 bg-border hidden sm:block" />
            
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-heading font-bold text-foreground">&lt;60s</div>
                <div className="text-xs text-muted-foreground">Tempo de análise</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}