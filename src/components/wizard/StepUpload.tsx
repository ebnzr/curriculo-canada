import { useState, useRef } from "react"
import { useWizardStore, cleanResumeText } from "@/stores/wizardStore"
import type { AtsIssue } from "@/stores/wizardStore"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Upload } from "lucide-react"
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

/**
 * Quick local ATS heuristic analysis.
 * Checks for common resume problems that ATS systems flag.
 * Returns a score (0-100) and a list of issues found.
 */
function computeAtsPreview(text: string): { score: number; issues: AtsIssue[] } {
  const issues: AtsIssue[] = []
  let score = 100
  let hasDealbreaker = false
  const lower = text.toLowerCase()

  // 1. FATORES ELIMINATÓRIOS (Deal-breakers)
  // 1.1 Foto ou imagem (No Canadá isso gera descarte)
  if (/\b(foto|photo|imagem|image|picture|retrato|perfil\.jpg|perfil\.png)\b/i.test(text)) {
    issues.push({ type: "error", message: "Deal-breaker (Erro Crítico): Referência explícita a foto detectada. No Canadá, currículos com foto são descartados imediatamente pela triagem automática." })
    score -= 30
    hasDealbreaker = true
  }

  // 1.2 Dados pessoais sensíveis
  const personalDataRegex = /\b(cpf|rg|cnh|estado civil|marital status|data de nascimento|date of birth|idade|age|nacionalidade|nationality|casad[oa]|solteir[oa]|brasileir[oa]|sexo|gender|masculino|feminino|male|female|dob)\b/i
  const documentFormatRegex = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/ // CPF pattern
  if (personalDataRegex.test(text) || documentFormatRegex.test(text)) {
    issues.push({ type: "error", message: "Deal-breaker (Erro Crítico): Dados pessoais sensíveis detectados (ex: idade, estado civil, documentos). Prática estritamente proibida em seleções norte-americanas." })
    score -= 30
    hasDealbreaker = true
  }

  // 1.3 Idioma predominante (Português sem termos em inglês)
  const ptOnlyPatterns = /\b(experiência profissional|formação acadêmica|dados pessoais|ensino fundamental|ensino médio|objetivo profissional|qualificações)\b/i
  const englishTerms = /\b(experience|education|skills|summary|profile|project|university|degree|bachelor|master)\b/i
  if (ptOnlyPatterns.test(text) && !englishTerms.test(text)) {
    issues.push({ type: "error", message: "Deal-breaker (Erro Crítico): Currículo com alta densidade de termos em português. O sistema ATS canadense não fará o parsing adequado e descartará seu perfil." })
    score -= 40
    hasDealbreaker = true
  }

  // 2. AVALIAÇÃO ESTRUTURAL (Essential Format)
  // 2.1 E-mail ausente
  if (!/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    issues.push({ type: "error", message: "Avaliação Estrutural: Nenhum e-mail de contato detectado. Falha gravíssima de parsing que impede o recrutador de prosseguir." })
    score -= 20
  }

  // 2.2 Seções faltando
  if (!/\b(experience|history|experiência|trabalho|emprego|employment)\b/i.test(text)) {
    issues.push({ type: "warning", message: "Avaliação Estrutural: Seção de 'Profissional Experience' ausente ou mal formatada. O ATS não conseguirá atrelar tempo de experiência." })
    score -= 15
  }

  if (!/\b(education|formação|graduação|universidade|university|bachelor|master|mba|bacharelado|mestrado|degree|college)\b/i.test(text)) {
    issues.push({ type: "warning", message: "Avaliação Estrutural: Ausência de histórico acadêmico ou falha do ATS em localizar seção de 'Education'." })
    score -= 15
  }

  if (!/\b(skills|competências|habilidades|tecnologias|technologies|tools|ferramentas|expertise|proficiencies)\b/i.test(text)) {
    issues.push({ type: "warning", message: "Avaliação Estrutural: Sem seção clara de 'Skills'. O motor do ATS depende desta seção primariamente para validar os requisitos da vaga." })
    score -= 10
  }

  // 2.3 LinkedIn
  if (!/linkedin\.com/i.test(lower)) {
    issues.push({ type: "warning", message: "Avaliação Estrutural: URL do LinkedIn omitida. Mais de 80% dos recrutadores canadenses ativam triagem em duas camadas via digital profile." })
    score -= 10
  }

  // 3. AVALIAÇÃO DE IMPACTO (Content Quality)
  // 3.1 Falta de métricas e quantificação
  const hasMetrics = /\d+\s*%/.test(text) || /\$\s*\d+/.test(text) || /\b(aument[ou]|reduz[iu]|cresciment|melhori|increase|decreas|improv|grow)/i.test(text)
  if (!hasMetrics) {
    issues.push({ type: "warning", message: "Avaliação de Impacto: Faltam resultados ou métricas quantificáveis (impacto financeiro, volumetria, %). Formatos que focam apenas em tarefas têm baixo ranqueamento." })
    score -= 10
  }

  // 3.2 Action Verbs
  const actionVerbs = /\b(managed|led|delivered|achieved|designed|developed|created|implemented|optimized|spearheaded|orchestrated|coorden|gerenci|lider|desenvolv|cri)\b/i
  if (!actionVerbs.test(text)) {
    issues.push({ type: "warning", message: "Avaliação de Impacto: Baixa densidade de verbos de ação fortes (ex: Managed, Achieved, Implemented). Isso reduz seu escore semântico." })
    score -= 10
  }

  // 3.3 Text Length
  if (text.length < 500) {
    issues.push({ type: "warning", message: "Avaliação de Impacto: Volume de texto muito inferior ao padrão aceitável. Conteúdo insuficiente para indexação." })
    score -= 15
  } else if (text.split(/\s+/).length > 2500) {
    issues.push({ type: "warning", message: "Avaliação de Impacto: Extensão incompatível. O mercado canadense exige concisão (ideal de 1 a 2 páginas). Currículos prolixos sofrem penalidade de legibilidade." })
    score -= 10
  }

  // 3.4 Outdated practices
  if (/\b(referências|references available|disponíveis sob demanda)\b/i.test(text)) {
    issues.push({ type: "warning", message: "Avaliação de Impacto: Uso de expressões obsoletas como 'Referências sob solicitação'. Indica não conformidade com templates modernos." })
    score -= 5
  }

  // 4. REGULADORES DE PONTUAÇÃO
  // Se encontrou deal-breakers, corta a nota severamente
  if (hasDealbreaker && score > 35) {
    score = 35 // Garante status Reprovável Crítico (< 40)
  }

  score = Math.min(score, 100)

  // Se tudo passou na regra rígida
  if (issues.length === 0) {
    score = 88
    issues.push({ type: "warning", message: "Avaliação Avançada: O currículo atende aos requisitos estruturais básicos do Canadá. Requer análise de Inteligência Artificial para garantir compatibilidade sintática com regras de NOC específicas." })
  }

  // Ordenar para jogar erros e deal-breakers pro topo da lista exibida
  issues.sort((a, b) => {
    if (a.type === "error" && b.type !== "error") return -1;
    if (a.type !== "error" && b.type === "error") return 1;
    return 0;
  });

  return { score, issues }
}

export function StepUpload() {
  const { setStep, setResumeText, setAtsPreview } = useWizardStore()
  const [localText, setLocalText] = useState("")
  const [error, setError] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleContinue() {
    const cleaned = cleanResumeText(localText)
    if (cleaned.length < 50) {
      setError("O currículo está muito curto. Adicione mais conteúdo (mínimo 50 caracteres).")
      return
    }
    setError("")
    setResumeText(cleaned)

    // Compute local ATS score
    const { score, issues } = computeAtsPreview(localText)
    setAtsPreview(score, issues)

    // Go to ATS preview step (step 3)
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

        const extractedText = cleanResumeText(fullText)

        if (!extractedText || extractedText.length < 50) {
          setError("O PDF parece ser uma imagem escaneada. Use um PDF com texto selecionável.")
          setIsParsing(false)
          return
        }

        setLocalText(extractedText)
      } else if (file.type === "text/plain") {
        const text = await file.text()
        setLocalText(cleanResumeText(text))
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
      <div className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <div
            onClick={isParsing ? undefined : handleFileUpload}
            role="button"
            tabIndex={isParsing ? -1 : 0}
            aria-label="Clique para enviar arquivo PDF ou texto"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFileUpload() }}
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isParsing ? 'border-muted bg-muted/20 cursor-not-allowed' : 'border-primary/30 hover:border-primary/50 hover:bg-primary/5'}`}
          >
            {isParsing ? (
              <span className="text-sm text-muted-foreground">Processando...</span>
            ) : (
              <>
                <Upload className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
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
            aria-hidden="true"
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
            value={localText}
            aria-label="Texto do currículo"
            onChange={(e) => setLocalText(e.target.value)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{localText.length} caracteres</span>
          </div>
          {error && <p className="text-destructive text-sm font-medium" role="alert">{error}</p>}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
        <Button onClick={handleContinue} className="flex gap-2">
          <FileText className="h-4 w-4" aria-hidden="true" /> Analisar Currículo
        </Button>
      </div>
    </div>
  )
}

