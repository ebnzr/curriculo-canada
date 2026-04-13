import { useState } from 'react'
import { FileText, CheckCircle, Sparkles, Lightbulb, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { LayoutValidationResult, LayoutIssue } from '@/lib/resumeLayoutValidator'

interface QualityAlertProps {
  isOpen: boolean
  onClose: () => void
  validationResult: LayoutValidationResult
  onGeneratePdf: () => void
  onDownloadDocx: () => void
}

function IssueIcon({ severity }: { severity: LayoutIssue['severity'] }) {
  if (severity === 'CRITICAL') {
    return <Sparkles className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
  }
  return <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
}

function IssueItem({ issue }: { issue: LayoutIssue }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/40 backdrop-blur-sm border border-secondary/20">
      <IssueIcon severity={issue.severity} />
      <div className="flex-1 space-y-1">
        <p className="font-medium text-[13px] leading-tight text-foreground">{issue.description}</p>
        {issue.suggestion && (
          <p className="text-[13px] text-muted-foreground/90 leading-relaxed">{issue.suggestion}</p>
        )}
        {issue.pageNumber && (
          <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider pt-1">
            Página {issue.pageNumber}
          </p>
        )}
      </div>
    </div>
  )
}

export function QualityAlert({
  isOpen,
  onClose,
  validationResult,
  onGeneratePdf,
  onDownloadDocx,
}: QualityAlertProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  
  const criticalIssues = validationResult.issues.filter(i => i.severity === 'CRITICAL')
  const warnings = validationResult.issues.filter(i => i.severity === 'WARNING')
  const hasCriticalIssues = criticalIssues.length > 0
  
  const handleGeneratePdf = async () => {
    setIsGenerating(true)
    try {
      await onGeneratePdf()
      onClose()
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] z-[100] sm:rounded-[24px] bg-background/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-border/40 p-0 gap-0 overflow-hidden flex flex-col">
        
        <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto min-h-0">
          
          <DialogHeader className="space-y-4 text-left">
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <span className="text-lg font-semibold tracking-tight text-foreground">
                Dicas Exclusivas de Formatação
              </span>
            </DialogTitle>
            <DialogDescription className="text-[13.5px] leading-relaxed text-muted-foreground">
              {hasCriticalIssues 
                ? 'Nossa inteligência artificial preparou recomendações valiosas para a apresentação do seu currículo. Como a renderização em PDF pode ter algumas divergências de formatação, sugerimos baixar e editar na versão DOCX para melhor precisão.'
                : 'Seu currículo foi muito bem estruturado pela nossa inteligência artificial e está com um layout excelente!'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            
            {/* Problemas Críticos */}
            {criticalIssues.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Otimizações de Alto Impacto
                </h4>
                <div className="grid gap-2">
                  {criticalIssues.map((issue, idx) => (
                    <IssueItem key={idx} issue={issue} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Avisos */}
            {warnings.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[12px] font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
                  Refinamentos
                </h4>
                <div className="grid gap-2">
                  {warnings.map((issue, idx) => (
                    <IssueItem key={idx} issue={issue} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Recomendações */}
            {validationResult.recommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[12px] font-semibold text-primary uppercase tracking-wider border-b border-border/40 pb-2">
                  Próximos Passos
                </h4>
                <ul className="text-[13px] text-muted-foreground space-y-2">
                  {validationResult.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-primary/60">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Sem problemas */}
            {validationResult.issues.length === 0 && (
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-green-800 dark:text-green-300">Layout Aprovado!</p>
                  <p className="text-[13px] text-green-700/80 dark:text-green-400/80 leading-relaxed">
                    Seu currículo está elegante, legível e pronto para ser gerado em PDF com alta qualidade.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions with integrated tip */}
        <div className="bg-secondary/30 border-t border-border/40 p-4 sm:p-6 sm:px-8 shrink-0">
          
          {hasCriticalIssues && (
            <div className="mb-5 flex gap-3 text-left bg-background/50 p-4 rounded-xl border border-border/50 shadow-sm">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground font-medium">Dica de Sucesso:</strong> A formatação em DOCX permite que você corrija os itens acima e tenha total controle do design do seu documento final.
              </p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-3 sm:space-x-0 w-full sm:justify-end">
            <Button
              onClick={handleGeneratePdf}
              disabled={isGenerating}
              className="w-full sm:w-auto h-11 px-6 rounded-full font-medium"
              variant="outline"
            >
              {isGenerating ? (
                <>Gerando...</>
              ) : (
                'Baixar PDF mesmo assim'
              )}
            </Button>
            
            <Button
              onClick={onDownloadDocx}
              className="w-full sm:w-auto h-11 px-6 rounded-full font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <FileText className="mr-2 h-4 w-4" />
              Baixar Perfeito em DOCX
            </Button>
          </DialogFooter>
        </div>

      </DialogContent>
    </Dialog>
  )
}