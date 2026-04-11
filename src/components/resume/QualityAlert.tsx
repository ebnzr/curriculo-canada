import { useState } from 'react'
import { AlertTriangle, FileText, Download, CheckCircle, XCircle, Info } from 'lucide-react'
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
    return <XCircle className="h-5 w-5 text-red-500" />
  }
  return <AlertTriangle className="h-5 w-5 text-yellow-500" />
}

function IssueItem({ issue }: { issue: LayoutIssue }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <IssueIcon severity={issue.severity} />
      <div className="flex-1">
        <p className="font-medium text-sm">{issue.description}</p>
        {issue.suggestion && (
          <p className="text-sm text-muted-foreground mt-1">{issue.suggestion}</p>
        )}
        {issue.pageNumber && (
          <p className="text-xs text-muted-foreground mt-1">Página {issue.pageNumber}</p>
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
      // Só fechar o dialog se a geração foi bem-sucedida
      onClose()
    } catch (error) {
      // Manter o dialog aberto em caso de erro para o usuário ver o contexto
      console.error('Erro ao gerar PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasCriticalIssues ? (
              <>
                <XCircle className="h-6 w-6 text-red-500" />
                Problemas de Layout Detectados
              </>
            ) : (
              <>
                <Info className="h-6 w-6 text-blue-500" />
                Revisão de Layout
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasCriticalIssues 
              ? 'Detectamos problemas que podem afetar a aparência do seu currículo PDF.'
              : 'Seu currículo está quase pronto! Aqui está uma análise do layout:'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[50vh] overflow-y-auto pr-2">
          <div className="space-y-4 pr-4">
            {/* Resumo */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Páginas estimadas: {validationResult.estimatedPages}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {validationResult.issues.length === 0 
                    ? 'Nenhum problema detectado'
                    : `${criticalIssues.length} crítico(s), ${warnings.length} aviso(s)`}
                </p>
              </div>
            </div>
            
            {/* Problemas Críticos */}
            {criticalIssues.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-600 mb-2">
                  Problemas Críticos
                </h4>
                <div className="space-y-2">
                  {criticalIssues.map((issue, idx) => (
                    <IssueItem key={idx} issue={issue} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Avisos */}
            {warnings.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-yellow-600 mb-2">
                  Avisos
                </h4>
                <div className="space-y-2">
                  {warnings.map((issue, idx) => (
                    <IssueItem key={idx} issue={issue} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Recomendações */}
            {validationResult.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Recomendações</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {validationResult.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Sem problemas */}
            {validationResult.issues.length === 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium text-green-800">Layout Aprovado!</p>
                  <p className="text-sm text-green-700">
                    Seu currículo está pronto para gerar o PDF.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onDownloadDocx}
            className="w-full sm:w-auto"
          >
            <FileText className="mr-2 h-4 w-4" />
            Baixar DOCX
          </Button>
          
          <Button
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="w-full sm:w-auto"
            variant={hasCriticalIssues ? "destructive" : "default"}
          >
            {isGenerating ? (
              <>Gerando...</>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {hasCriticalIssues ? 'Gerar PDF Mesmo Assim' : 'Gerar PDF'}
              </>
            )}
          </Button>
        </DialogFooter>
        
        {hasCriticalIssues && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Recomendamos baixar o DOCX para ajustes manuais se o PDF não ficar satisfatório.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}