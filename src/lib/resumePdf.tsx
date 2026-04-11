import type { StructuredResume } from '@/lib/resumeTypes'
import { prepareResumeForPdf } from '@/lib/resumeLayoutFixer'
import type { LayoutValidationResult } from '@/lib/resumeLayoutValidator'

export interface PdfGenerationResult {
  success: boolean
  blob?: Blob
  validationResult: LayoutValidationResult
  hasIssues: boolean
  userMessage?: {
    title: string
    message: string
    suggestion: string
  }
}

export async function generatePdfBlob(
  resume: StructuredResume,
  skipValidation = false
): Promise<PdfGenerationResult> {
  // Preparar currículo com validação e correções
  const preparation = skipValidation 
    ? { 
        resume, 
        forcedBreaks: [] as string[], 
        styleAdjustments: undefined, 
        hasIssues: false,
        userMessage: undefined
      }
    : prepareResumeForPdf(resume)
  
  const [{ pdf }, { ResumePdfDocument }, React] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./resumePdfDocument'),
    import('react'),
  ])
  
  const element = React.createElement(ResumePdfDocument, { 
    resume: preparation.resume,
    forcedBreaks: preparation.forcedBreaks,
    styleAdjustments: preparation.styleAdjustments,
  })
  
  const blob = await pdf(element as Parameters<typeof pdf>[0]).toBlob()
  
  // Revalidar após geração para ter resultado atualizado
  const { validateLayout } = await import('./resumeLayoutValidator')
  const validationResult = validateLayout(preparation.resume)
  
  return {
    success: true,
    blob,
    validationResult,
    hasIssues: preparation.hasIssues,
    userMessage: preparation.userMessage,
  }
}

export async function downloadPdf(
  resume: StructuredResume, 
  filename = 'Canadian_Resume.pdf',
  skipValidation = false
): Promise<PdfGenerationResult> {
  const result = await generatePdfBlob(resume, skipValidation)
  
  if (result.blob) {
    const url = URL.createObjectURL(result.blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  return result
}

// Função para validar sem gerar PDF
export async function validateResumeLayout(
  resume: StructuredResume
): Promise<LayoutValidationResult> {
  const { validateLayout } = await import('./resumeLayoutValidator')
  return validateLayout(resume)
}