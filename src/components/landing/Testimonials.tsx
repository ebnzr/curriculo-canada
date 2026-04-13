import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Lucas M.",
    role: "Software Engineer",
    location: "Toronto, ON",
    text: "Eu mandava dezenas de e-mails usando o currículo do Brasil traduzido. O CurrículoCanadá mudou tudo: em 2 semanas recebi 3 callbacks. O formato canadense realmente faz diferença.",
    rating: 5
  },
  {
    name: "Fernanda R.",
    role: "Marketing Specialist",
    location: "Vancouver, BC",
    text: "Eu não percebia que ter foto e idade era um erro fatal lá fora. O diagnóstico ATS gratuito abriu meus olhos. Valeu cada centavo do investimento.",
    rating: 5
  },
  {
    name: "Rafael C.",
    role: "Project Manager",
    location: "Calgary, AB",
    text: "O mais incrível é que meu LinkedIn foi rescrito de um jeito focado no Canadá. Recebi conexão de recruiters do meu NOC em menos de uma semana.",
    rating: 5
  }
]

export function Testimonials() {
  return (
    <section className="relative py-20 lg:py-32 bg-secondary text-secondary-foreground overflow-hidden">
      <div className="absolute inset-0 opacity-5" aria-hidden="true">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center gap-4 mb-6" aria-hidden="true">
            <div className="h-px w-12 bg-secondary-foreground/20" />
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-secondary-foreground/50">
              Depoimentos
            </span>
            <div className="h-px w-12 bg-secondary-foreground/20" />
          </div>
          <h2 className="text-display-sm text-secondary-foreground mb-4">
            Histórias de Sucesso
          </h2>
          <p className="text-lg text-secondary-foreground/70 leading-relaxed max-w-2xl mx-auto">
            Brasileiros que transformaram suas carreiras e conquistaram
            entrevistas no mercado canadense.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {testimonials.map((review, i) => (
            <article
              key={i}
              className="group relative flex flex-col bg-secondary-foreground/5 backdrop-blur-sm rounded-lg border border-secondary-foreground/10 hover:border-secondary-foreground/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-6 lg:p-8 flex flex-col flex-1">
                <div className="flex items-center gap-1 mb-4" aria-hidden="true">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-primary text-primary" aria-hidden="true" />
                  ))}
                </div>
                <span className="sr-only">{review.rating} estrelas de 5</span>

                <blockquote className="text-secondary-foreground/90 leading-relaxed mb-6 flex-1 relative">
                  <Quote className="absolute -top-2 -left-2 h-6 w-6 text-primary/10" strokeWidth={1.5} aria-hidden="true" />
                  <span className="relative z-10">"{review.text}"</span>
                </blockquote>

                <footer className="pt-4 border-t border-secondary-foreground/10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30" aria-hidden="true">
                      <span className="text-sm font-heading font-semibold text-primary">
                        {review.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-heading font-semibold text-secondary-foreground">
                        {review.name}
                      </div>
                      <div className="text-sm text-secondary-foreground/60">
                        {review.role}
                      </div>
                      <div className="text-xs text-primary font-medium">
                        {review.location}
                      </div>
                    </div>
                  </div>
                </footer>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 lg:mt-16 max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-lg bg-secondary-foreground/5 border border-secondary-foreground/10 p-8 lg:p-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" aria-hidden="true" />

            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-heading font-bold text-primary">98%</div>
                <div className="text-sm text-secondary-foreground/70 mt-2 font-medium">Taxa de satisfação</div>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-heading font-bold text-primary">3x</div>
                <div className="text-sm text-secondary-foreground/70 mt-2 font-medium">Mais entrevistas</div>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-heading font-bold text-primary">1.000+</div>
                <div className="text-sm text-secondary-foreground/70 mt-2 font-medium">Currículos analisados</div>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-heading font-bold text-primary">2 sem</div>
                <div className="text-sm text-secondary-foreground/70 mt-2 font-medium">Tempo médio para resultado</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
