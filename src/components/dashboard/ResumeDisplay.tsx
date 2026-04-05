import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Download, FileCheck } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { parseResumeMarkdown, type StructuredResume } from "@/lib/resumeTypes"
import { downloadPdf } from "@/lib/resumePdf"
import { downloadDocx } from "@/lib/resumeDocx"

interface ResumeDisplayProps {
  content: string
}

export function ResumeDisplay({ content }: ResumeDisplayProps) {
  const [downloading, setDownloading] = useState<"pdf" | "word" | null>(null)
  const [parsedResume, setParsedResume] = useState<StructuredResume | null>(null)
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

  const handleDownloadPdf = async () => {
    setDownloading("pdf")
    try {
      if (parsedResume) {
        await downloadPdf(parsedResume, "Canadian_Resume.pdf")
      } else {
        // Fallback: use html2pdf for raw markdown
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
      alert("Erro ao gerar PDF. Tente o formato Word.")
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadWord = async () => {
    setDownloading("word")
    try {
      if (parsedResume) {
        await downloadDocx(parsedResume, "Canadian_Resume.docx")
      } else {
        // Fallback: use raw docx generation from markdown
        await downloadDocxFromMarkdown(content)
      }
    } catch (err) {
      console.error("Erro ao gerar Word:", err)
      alert("Erro ao gerar Word. Tente o formato PDF.")
    } finally {
      setDownloading(null)
    }
  }

  const handleCopyText = () => {
    navigator.clipboard.writeText(content)
    alert("Currículo copiado!")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Seu Currículo Otimizado</h2>
          <p className="text-muted-foreground">Pronto para o mercado canadense</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={downloading === "pdf"}
          >
            {downloading === "pdf" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Baixar PDF
          </Button>

          <Button
            variant="outline"
            onClick={handleDownloadWord}
            disabled={downloading === "word"}
          >
            {downloading === "word" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4 mr-2" />
            )}
            Baixar Word
          </Button>

          <Button onClick={handleCopyText}>
            <FileText className="h-4 w-4 mr-2" />
            Copiar Tudo
          </Button>
        </div>
      </div>

      {/* Structured preview (if parsed successfully) */}
      {parsedResume && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Currículo estruturado detectado — PDF e Word profissionais disponíveis
            </span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Nome: {parsedResume.name} | Experiências: {parsedResume.experience.length} | Educação: {parsedResume.education.length} | Skills: {parsedResume.skills.length}
          </p>
        </div>
      )}

      {/* Markdown preview */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        <div
          ref={resumeRef}
          className="p-8 md:p-12 max-w-4xl mx-auto prose prose-sm dark:prose-invert max-w-none"
          style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        <p>Currículo otimizado para o mercado canadense • Formatos PDF e Word disponíveis</p>
      </div>
    </div>
  )
}

/**
 * Fallback DOCX generation from raw markdown (when parsing fails)
 */
async function downloadDocxFromMarkdown(content: string): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = await import("docx")
  const { saveAs } = await import("file-saver")

  const lines = content.split("\n")
  const children: any[] = []

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
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, "Canadian_Resume.docx")
}
