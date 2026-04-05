import { useState, useRef } from "react"
import { useWizardStore } from "@/stores/wizardStore"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Upload } from "lucide-react"
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export function StepUpload() {
  const { setStep } = useWizardStore()
  const [resumeText, setResumeText] = useState("")
  const [error, setError] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function cleanText(text: string): string {
    return text
      .replace(/pasted-image\d*/gi, '')
      .replace(/data:image\S*/gi, '')
      .replace(/\[.*?\]/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function handleContinue() {
    const cleaned = cleanText(resumeText)
    if (cleaned.length < 50) {
      setError("O currículo está muito curto. Adicione mais conteúdo (mínimo 50 caracteres).")
      return
    }
    setError("")
    // Armazenar no sessionStorage para próximo step (paywall)
    sessionStorage.setItem('wizardBackup', JSON.stringify({
      resumeText: cleaned,
      noc: useWizardStore.getState().noc,
      province: useWizardStore.getState().province
    }))
    setStep(3)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    setIsParsing(true)

    try {
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let fullText = ""
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items
            .filter((item) => 'str' in item)
            .map((item) => (item as { str: string }).str)
            .join(" ")
          fullText += pageText + "\n\n"
        }
        
        const extractedText = cleanText(fullText)
        
        if (!extractedText || extractedText.length < 50) {
          setError("O PDF parece ser uma imagem escaneada. Use um PDF com texto selecionável.")
          setIsParsing(false)
          return
        }
        
        setResumeText(extractedText)
      } else if (file.type === "text/plain") {
        const text = await file.text()
        setResumeText(cleanText(text))
      } else {
        setError("Formato não suportado. Use PDF ou arquivo de texto.")
      }
    } catch (err) {
      console.error(err)
      setError("Erro ao ler arquivo. Tente novamente.")
    } finally {
      setIsParsing(false)
    }
  }

  function handleFileUpload() {
    fileInputRef.current?.click()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Upload de arquivo */}
      <div className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <div 
            onClick={isParsing ? undefined : handleFileUpload}
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isParsing ? 'border-muted bg-muted/20' : 'border-primary/30 hover:border-primary/50 hover:bg-primary/5'}`}
          >
            {isParsing ? (
              <span className="text-sm text-muted-foreground">Processando...</span>
            ) : (
              <>
                <Upload className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-medium">Clique para enviar arquivo</p>
                <p className="text-xs text-muted-foreground">PDF ou texto</p>
              </>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept=".pdf,.txt"
            className="hidden"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="h-px bg-border flex-1"></span>
          <span className="text-xs text-muted-foreground uppercase font-semibold">Ou cole o texto</span>
          <span className="h-px bg-border flex-1"></span>
        </div>

        <div className="space-y-2">
          <Textarea 
            placeholder="Cole o conteúdo do seu currículo aqui..."
            className="min-h-[200px] resize-y p-4 text-sm"
            value={resumeText}
            onChange={(e) => setResumeText(cleanText(e.target.value))}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{resumeText.length} caracteres</span>
          </div>
          {error && <p className="text-destructive text-sm font-medium">{error}</p>}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
        <Button onClick={handleContinue} className="flex gap-2">
          <FileText className="h-4 w-4" /> Analisar com IA
        </Button>
      </div>
    </div>
  )
}