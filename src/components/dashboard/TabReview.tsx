import ReactMarkdown from 'react-markdown'

interface TabReviewProps {
  content: string
}

export function TabReview({ content }: TabReviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Raio-X de Carreira</h2>
        <p className="text-muted-foreground">Por que seu CV original falharia aos olhos de um recrutador americano/canadense.</p>
      </div>
      <div className="p-6 bg-muted/30 rounded-xl border border-destructive/20 prose prose-sm sm:prose-base dark:prose-invert max-w-none">
        <ReactMarkdown>{(content || "Sua análise ATS vai aqui.").replace(/\\n/g, '\n')}</ReactMarkdown>
      </div>
    </div>
  )
}
