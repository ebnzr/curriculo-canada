import { Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { cleanResumeText } from '@/stores/wizardStore'

const styles = StyleSheet.create({
  page: {
    padding: 25,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.3,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#1a365d',
  },
  headerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 11,
    color: '#4a5568',
    marginBottom: 3,
  },
  headerTagline: {
    fontSize: 9,
    color: '#718096',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a365d',
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e0',
  },
  normalText: {
    marginBottom: 3,
    color: '#2d3748',
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 25,
    right: 25,
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e0',
    paddingTop: 5,
  },
  footerText: {
    fontSize: 7,
    color: '#a0aec0',
  },
})

function ResumeHeader({ data }: { data: string }) {
  const lines = (data || '').split('\n').filter((l: string) => l.trim())
  
  return (
    <View style={styles.header}>
      <Text style={styles.headerName}>{lines[0] || 'Profissional'}</Text>
      {lines[1] && <Text style={styles.headerTitle}>{lines[1]}</Text>}
      {lines.slice(2).join(' | ') && <Text style={styles.headerTagline}>{lines.slice(2).join(' | ')}</Text>}
    </View>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={styles.sectionTitle}>{children}</Text>
  )
}

function ResumeDocument({ content }: { content: string }) {
  const sections: Record<string, string> = {}
  
  if (content) {
    const lines = content.split('\n')
    let currentSection = ''
    let currentContent: string[] = []
    
    lines.forEach(line => {
      const trimmed = line.trim()
      if (!trimmed) return
      
      if (trimmed.match(/^(RESUMO|EXPERIÊNCIA|EDUCAÇÃO|HABILIDADES|CONTATO|OBJECTIVE|SUMMARY|EXPERIENCE|EDUCATION|SKILLS|CONTACT)/i)) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n')
        }
        currentSection = trimmed.replace(/^#+\s*/, '').toUpperCase()
        currentContent = []
      } else {
        currentContent.push(trimmed)
      }
    })
    
    if (currentSection) {
      sections[currentSection] = currentContent.join('\n')
    }
  }
  
  return (
    <Page size="A4" style={styles.page}>
      <ResumeHeader data={sections['CONTATO'] || sections['CONTACT'] || 'Profissional\nEspecialista em Carreiras\nBrasil'} />
      
      {(sections['RESUMO'] || sections['SUMMARY']) && (
        <View style={styles.section}>
          <SectionTitle>Resumo Profissional</SectionTitle>
          <Text style={styles.normalText}>{sections['RESUMO'] || sections['SUMMARY']}</Text>
        </View>
      )}
      
      {(sections['EXPERIÊNCIA'] || sections['EXPERIENCE']) && (
        <View style={styles.section}>
          <SectionTitle>Experiência Profissional</SectionTitle>
          <Text style={styles.normalText}>{sections['EXPERIÊNCIA'] || sections['EXPERIENCE']}</Text>
        </View>
      )}
      
      {(sections['EDUCAÇÃO'] || sections['EDUCATION']) && (
        <View style={styles.section}>
          <SectionTitle>Formação Acadêmica</SectionTitle>
          <Text style={styles.normalText}>{sections['EDUCAÇÃO'] || sections['EDUCATION']}</Text>
        </View>
      )}
      
      {(sections['HABILIDADES'] || sections['SKILLS']) && (
        <View style={styles.section}>
          <SectionTitle>Habilidades</SectionTitle>
          <Text style={styles.normalText}>{sections['HABILIDADES'] || sections['SKILLS']}</Text>
        </View>
      )}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Currículo Otimizado para o Mercado Canadense • Gerado por CurrículoCanada AI
        </Text>
      </View>
    </Page>
  )
}

export async function generateProfessionalResumePdf(content: string): Promise<Blob> {
  try {
    // Limpeza extra agressiva
    let cleanedContent = String(content || '')
    const hasPastedImage = cleanedContent.includes('pasted-image')
    const hasDataImage = cleanedContent.includes('data:image')
    
    if (hasPastedImage || hasDataImage) {
      console.warn("DETECTADO dados de imagem! Limpando...")
      alert("Detectado dados de imagem no currículo. Estes dados podem comprometer o processo. Por favor, copie manualmente o conteúdo do seu currículo eCarregue um PDF diferente.")
    }
    
    cleanedContent = cleanedContent
      .replace(/pasted-image\d*/gi, '')
      .replace(/data:image\S*/gi, '')
      .replace(/data:application\S*/gi, '')
      .replace(/\[image[^\]]*\]/gi, '')
      .replace(/\[.*?\]/gi, '')
      .replace(/png|jpg|jpeg|gif|bmp|webp/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    console.log("Gerando PDF profissional com texto limpo:", cleanedContent.substring(0, 100))
    
    if (!cleanedContent || cleanedContent.length < 10) {
      throw new Error("Conteúdo do currículo está vazio após limpeza")
    }
    
    const blob = await pdf(<ResumeDocument content={cleanedContent} />).toBlob()
    
    console.log("PDF gerado, tamanho:", blob.size)
    return blob
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    throw error
  }
}

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileCheck, Download, Loader2 } from "lucide-react"
import ReactMarkdown from 'react-markdown'

interface TabResumeProps {
  content: string
}

export function TabResume({ content }: TabResumeProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownloadPdf = async () => {
    console.log("Conteúdo original (primeiros 100 chars):", content?.substring(0, 100))
    console.log("Contém pasted-image?", content?.includes('pasted-image'))
    
    const cleanedContent = cleanResumeText(content || '')
    console.log("Conteúdo limpo (primeiros 100 chars):", cleanedContent?.substring(0, 100))
    
    if (!cleanedContent || cleanedContent.length < 10) {
      alert("Erro: conteúdo do currículo está vazio.")
      return
    }
    
    setDownloading(true)
    try {
      console.log("Iniciando download do PDF...")
      const blob = await generateProfessionalResumePdf(cleanedContent)
      
      console.log("Blob gerado, tamanho:", blob.size)
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'Meu_Curriculo_Profissional_Canada.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert("PDF baixado com sucesso!")
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error("Erro ao gerar PDF:", error)
      alert(`Erro ao gerar PDF: ${error.message}`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Seu Novo Currículo Adaptado</h2>
          <p className="text-muted-foreground">Design profissional canadense pronto para envio.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPdf} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} 
            {downloading ? "Gerando PDF..." : "Baixar PDF Profissional"}
          </Button>
          <Button onClick={() => {
            navigator.clipboard.writeText(content || "")
            alert("Currículo copiado!")
          }}>
            <FileCheck className="h-4 w-4 mr-2" /> Copiar Tudo
          </Button>
        </div>
      </div>
      
      <div className="p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{content.replace(/\\n/g, '\n')}</ReactMarkdown>
      </div>
    </div>
  )
}