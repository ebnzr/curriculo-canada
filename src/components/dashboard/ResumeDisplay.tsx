import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Download, FileCheck, AlertCircle, Eye, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { parseResumeMarkdown, type StructuredResume } from "@/lib/resumeTypes"
import { generatePdfBlob, downloadPdf } from "@/lib/resumePdf"
import { downloadDocx } from "@/lib/resumeDocx"
import { QualityAlert } from "@/components/resume/QualityAlert"
import type { LayoutValidationResult } from "@/lib/resumeLayoutValidator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ResumeDisplayProps {
  content: string
}

export function ResumeDisplay({ content }: ResumeDisplayProps) {
  const [downloading, setDownloading] = useState<"pdf" | "word" | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [parsedResume, setParsedResume] = useState<StructuredResume | null>(null)
  const [showQualityAlert, setShowQualityAlert] = useState(false)
  const [validationResult, setValidationResult] = useState<LayoutValidationResult | null>(null)
  const [pendingPdfGeneration, setPendingPdfGeneration] = useState(false)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const resumeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (content) {
      try {
        const structured = parseResumeMarkdown(content)
        setParsedResume(structured)
      } catch (e) {
        console.error("Failed to parse resume markdown:", e)
        setParsedResume(null)
      }
    }
  }, [content])

  // Limpar URL de preview quando o componente desmontar
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }
    }
  }, [pdfPreviewUrl])

  const handlePreviewPdf = async () => {
    if (!parsedResume) {
      setDownloadError("Não foi possível gerar preview. Currículo não estruturado.")
      return
    }
    
    setIsGeneratingPreview(true)
    setDownloadError(null)
    
    try {
      // Limpar URL anterior se existir
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }
      
      // Gerar PDF com validação
      const result = await generatePdfBlob(parsedResume)
      
      if (result.blob) {
        const url = URL.createObjectURL(result.blob)
        setPdfPreviewUrl(url)
        setPdfBlob(result.blob)
        setValidationResult(result.validationResult)
        setShowPreview(true)
        
        // Se houver problemas, mostrar alerta também
        if (result.hasIssues || result.validationResult.issues.length > 0) {
          setShowQualityAlert(true)
        }
      }
    } catch (err) {
      console.error("Erro ao gerar preview:", err)
      setDownloadError("Erro ao gerar preview do PDF. Tente novamente.")
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  const handleClosePreview = () => {
    setShowPreview(false)
  }

  const handleDownloadPdf = async () => {
    setDownloading("pdf")
    setDownloadError(null)
    try {
      if (parsedResume) {
        // Gerar PDF com validação
        const result = await generatePdfBlob(parsedResume)
        
        if (result.hasIssues || result.validationResult.issues.length > 0) {
          // Mostrar alerta de qualidade antes de prosseguir
          setValidationResult(result.validationResult)
          setShowQualityAlert(true)
          setPendingPdfGeneration(true)
          setPdfBlob(result.blob || null)
          setDownloading(null)
          return
        }
        
        // Baixar diretamente se não houver problemas
        await downloadPdf(parsedResume, "Canadian_Resume.pdf", true)
      } else {
        // Fallback para html2pdf
        if (!resumeRef.current) throw new Error("Resume element not found")
        const html2pdf = (await import("html2pdf.js")).default
        const opt = {
          margin: 10,
          filename: "Canadian_Resume.pdf",
          image: { type: "jpeg" as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
        }
        await html2pdf().set(opt).from(resumeRef.current).save()
      }
    } catch (err) {
      console.error("Erro ao gerar PDF:", err)
      setDownloadError("Erro ao gerar PDF. Tente o formato Word.")
    } finally {
      setDownloading(null)
    }
  }

  const handleConfirmPdfGeneration = async () => {
    if (!pdfBlob) {
      // Se não temos blob armazenado, precisamos regenerar
      if (!parsedResume) return
      try {
        const result = await generatePdfBlob(parsedResume, true)
        if (result.blob) {
          const url = URL.createObjectURL(result.blob)
          const link = document.createElement('a')
          link.href = url
          link.download = "Canadian_Resume.pdf"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
        setShowQualityAlert(false)
        setPendingPdfGeneration(false)
        setPdfBlob(null)
      } catch (err) {
        console.error("Erro ao gerar PDF:", err)
        setDownloadError("Erro ao gerar PDF. Tente o formato Word.")
        setPendingPdfGeneration(false)
      }
      return
    }
    
    // Usar blob já gerado
    try {
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = "Canadian_Resume.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setShowQualityAlert(false)
      setPendingPdfGeneration(false)
      setPdfBlob(null)
    } catch (err) {
      console.error("Erro ao baixar PDF:", err)
      setDownloadError("Erro ao baixar PDF. Tente novamente.")
      setPendingPdfGeneration(false)
    }
  }

  const handleDownloadWord = async () => {
    setDownloading("word")
    setDownloadError(null)
    try {
      if (parsedResume) {
        await downloadDocx(parsedResume, "Canadian_Resume.docx")
      } else {
        await downloadDocxFromMarkdown(content)
      }
    } catch (err) {
      console.error("Erro ao gerar Word:", err)
      setDownloadError("Erro ao gerar Word. Tente o formato PDF.")
    } finally {
      setDownloading(null)
    }
  }

  const handleCopyText = async () => {
    setDownloadError(null)
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      setDownloadError("Não foi possível copiar. Selecione o texto manualmente.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Quality Alert Dialog */}
      {validationResult && (
        <QualityAlert
          isOpen={showQualityAlert}
          onClose={() => {
            setShowQualityAlert(false)
            setPendingPdfGeneration(false)
          }}
          validationResult={validationResult}
          onGeneratePdf={handleConfirmPdfGeneration}
          onDownloadDocx={handleDownloadWord}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Seu Currículo Otimizado</h2>
          <p className="text-muted-foreground">Pronto para o mercado canadense</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handlePreviewPdf}
            disabled={isGeneratingPreview || !parsedResume}
            aria-label="Visualizar currículo em PDF"
          >
            {isGeneratingPreview ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            Visualizar PDF
          </Button>

          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={!!downloading || pendingPdfGeneration}
            aria-label="Baixar currículo em PDF"
          >
            {downloading === "pdf" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            Baixar PDF
          </Button>

          <Button
            variant="outline"
            onClick={handleDownloadWord}
            disabled={!!downloading}
            aria-label="Baixar currículo em Word"
          >
            {downloading === "word" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <FileCheck className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            Baixar Word
          </Button>

          <Button onClick={handleCopyText} aria-label="Copiar todo o texto do currículo">
            <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
            Copiar Tudo
          </Button>
        </div>
      </div>

      {downloadError && (
        <div role="alert" className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{downloadError}</span>
        </div>
      )}

      {parsedResume && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Currículo estruturado detectado — PDF e Word profissionais disponíveis
            </span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Nome: {parsedResume.name} | Experiências: {parsedResume.experience.length} | Educação: {parsedResume.education.length} | Skills: {parsedResume.skills.length}
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        <div
          ref={resumeRef}
          className="p-8 md:p-12 max-w-4xl mx-auto prose prose-sm dark:prose-invert max-w-none"
          style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>

      {/* PDF Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>Preview do Currículo PDF</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClosePreview}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {validationResult && validationResult.issues.length > 0 && (
              <p className="text-sm text-amber-600 mt-2">
                ⚠️ Detectados {validationResult.issues.filter(i => i.severity === 'CRITICAL').length} problemas de layout. 
                <button 
                  onClick={() => setShowQualityAlert(true)}
                  className="underline hover:text-amber-700"
                >
                  Ver detalhes
                </button>
              </p>
            )}
          </DialogHeader>
          <div className="flex-1 bg-gray-100 p-4 overflow-auto" style={{ height: '70vh' }}>
            {pdfPreviewUrl ? (
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full border-0 bg-white shadow-lg"
                title="PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Erro ao carregar preview</p>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={handleClosePreview}>
              Fechar
            </Button>
            <Button onClick={handleDownloadPdf} disabled={!!downloading}>
              {downloading === "pdf" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Baixar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="text-center text-xs text-muted-foreground">
        <p>Currículo otimizado para o mercado canadense • Formatos PDF e Word disponíveis</p>
      </div>
    </div>
  )
}

async function downloadDocxFromMarkdown(content: string): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = await import("docx")
  const { saveAs } = await import("file-saver")

  const lines = content.split("\n")
  const children: unknown[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      children.push(new Paragraph({ spacing: { after: 100 } }))
      continue
    }

    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace("# ", ""),
              bold: true,
              size: 44,
              color: "1E3A8A",
              allCaps: true,
              font: "Calibri",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
        })
      )
    } else if (trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace("## ", ""),
              bold: true,
              size: 24,
              color: "1E3A8A",
              allCaps: true,
              font: "Calibri",
            }),
          ],
          spacing: { before: 240, after: 60 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: "E2E8F0" },
          },
        })
      )
    } else if (trimmed.startsWith("### ")) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace("### ", ""),
              bold: true,
              size: 22,
              color: "1A1A1A",
              font: "Calibri",
            }),
          ],
          spacing: { before: 120, after: 40 },
        })
      )
    } else if (/^[-•*]\s/.test(trimmed)) {
      const text = trimmed.replace(/^[-•*]\s*/, "")
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "•  ", bold: true, size: 21, color: "1E3A8A", font: "Calibri" }),
            new TextRun({ text, size: 21, color: "374151", font: "Calibri" }),
          ],
          indent: { left: 360, hanging: 360 },
          spacing: { after: 40 },
        })
      )
    } else if (trimmed.startsWith("*") && trimmed.endsWith("*") && !trimmed.startsWith("**")) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace(/\*/g, ""),
              italics: true,
              size: 19,
              color: "6B7280",
              font: "Calibri",
            }),
          ],
          spacing: { after: 40 },
        })
      )
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed, size: 21, color: "374151", font: "Calibri" })],
          spacing: { after: 60 },
        })
      )
    }
  }

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: { font: "Calibri", size: 21, color: "374151" },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: children as ConstructorParameters<typeof Document>[0]["sections"][0]["children"],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, "Canadian_Resume.docx")
}
