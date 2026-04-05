import { ResumeDisplay } from "./ResumeDisplay"

interface TabResumeProps {
  content: string
}

export function TabResume({ content }: TabResumeProps) {
  if (!content) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum currículo encontrado.</p>
        <p className="text-sm">Faça uma análise para gerar seu currículo otimizado.</p>
      </div>
    )
  }

  return <ResumeDisplay content={content} />
}