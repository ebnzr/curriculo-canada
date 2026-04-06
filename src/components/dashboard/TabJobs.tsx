import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export interface JobRecommendation {
  title: string
  company: string
  location: string
  matchPercentage: number
  url?: string
  source?: string
}

interface TabJobsProps {
  jobs: JobRecommendation[]
}

export function TabJobs({ jobs }: TabJobsProps) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Match de Vagas (Mercado Alvo)</h2>
          <p className="text-muted-foreground">Oportunidades recentes extraídas pela IA de acordo com o seu perfil.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <p className="text-muted-foreground text-lg font-medium">Nenhuma vaga encontrada.</p>
          <p className="text-muted-foreground text-sm max-w-sm">
            Gere uma nova análise para receber sugestões de vagas compatíveis com o seu perfil e NOC.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Match de Vagas (Mercado Alvo)</h2>
        <p className="text-muted-foreground">Oportunidades recentes extraídas pela IA de acordo com o seu perfil.</p>
      </div>
      <div className="space-y-4">
        {jobs.map((job, index) => (
          <div key={index} className="p-4 bg-background border border-border/50 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-primary/50 transition-colors">
            <div>
              <h3 className="font-bold text-lg text-primary">{job.title}</h3>
              <p className="text-muted-foreground text-sm">{job.company} • {job.location}</p>
              <div className="text-xs font-semibold mt-2 inline-flex border px-2 py-1 rounded bg-muted/20">
                Match: {job.matchPercentage}%
              </div>
            </div>
            {job.url && job.url !== '#' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(job.url, '_blank', 'noopener,noreferrer')}
                aria-label={`Ver vaga de ${job.title} em ${job.source || 'Busca'}`}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Ver Vaga ({job.source || 'Busca'})
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
