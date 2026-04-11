/**
 * Módulo de validação de layout para currículos
 * Detecta problemas de quebra de página antes da geração do PDF
 */

import type { StructuredResume } from './resumeTypes'

// Constantes de layout para página A4 em pontos tipográficos (pt)
// react-pdf usa pt como unidade padrão
const PAGE_HEIGHT = 841.89   // A4 height em pt
// const PAGE_WIDTH = 595.28    // A4 width em pt - usado futuramente
const MARGIN_TOP = 36        // 0.5 polegada em pt
const MARGIN_BOTTOM = 36     // 0.5 polegada em pt
// const MARGIN_SIDES = 36      // 0.5 polegada em pt - usado futuramente

// Área útil da página
const CONTENT_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM
// const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_SIDES * 2  // Usado futuramente para validação de largura

// Exportações nomeadas para uso em outros módulos
export { PAGE_HEIGHT, CONTENT_HEIGHT }

// Alturas estimadas (em pt) - ajustadas para react-pdf
const HEIGHTS = {
  header: 70,           // Nome + contato + borda
  sectionTitle: 24,     // Título da seção com padding e margem
  summaryLine: 14,      // Linha de texto do summary
  experienceHeader: 30, // Título + empresa
  experienceBullet: 16, // Cada bullet point
  educationItem: 36,    // Grau + instituição
  skillCategory: 18,    // Categoria + itens
  certification: 16,    // Certificação
  language: 16,         // Idioma
  sectionSpacing: 14,   // Espaço entre seções
  itemSpacing: 6,       // Espaço entre itens
  minContentAfterTitle: 40, // Mínimo de conteúdo após um título de seção
}

// Thresholds para detecção de problemas
export const THRESHOLDS = {
  minSectionSpace: 0.25,      // 25% da página = mínimo para iniciar seção
  orphanLines: 2,             // Mínimo de linhas no início/fim de parágrafo
  widowLines: 2,
  minFontSize: 9.5,           // Tamanho mínimo de fonte permitido
  maxContentReduction: 0.15,  // Máximo de 15% de redução de espaçamento
}

export type LayoutIssueType = 
  | 'SECTION_SPLIT' 
  | 'ORPHAN' 
  | 'WIDOW' 
  | 'MARGIN' 
  | 'CUTOFF'
  | 'PAGE_OVERFLOW'

export type Severity = 'CRITICAL' | 'WARNING'

export interface LayoutIssue {
  type: LayoutIssueType
  severity: Severity
  section: string
  description: string
  suggestion: string
  pageNumber?: number
}

export interface SectionLayout {
  name: string
  estimatedHeight: number
  startY: number
  endY: number
  pageNumber: number
  riskOfSplit: boolean
}

export interface LayoutValidationResult {
  isValid: boolean
  issues: LayoutIssue[]
  estimatedPages: number
  sections: SectionLayout[]
  recommendations: string[]
}

/**
 * Calcula altura estimada do header (nome + contato)
 */
function calculateHeaderHeight(resume: StructuredResume): number {
  let height = HEIGHTS.header
  
  // Adicionar altura do título se existir
  if (resume.title) {
    height += 16
  }
  
  return height
}

/**
 * Calcula altura estimada do summary
 */
function calculateSummaryHeight(summary: string): number {
  if (!summary) return 0
  
  // Estimar número de linhas baseado no comprimento do texto
  // Largura útil ~650px, ~65 caracteres por linha em fonte 10pt
  const charsPerLine = 65
  const lines = Math.ceil(summary.length / charsPerLine)
  
  return HEIGHTS.sectionTitle + (lines * HEIGHTS.summaryLine) + HEIGHTS.sectionSpacing
}

/**
 * Calcula altura estimada da seção de experiência
 */
function calculateExperienceHeight(experience: StructuredResume['experience']): number {
  if (!experience || experience.length === 0) return 0
  
  let height = HEIGHTS.sectionTitle
  
  for (const exp of experience) {
    height += HEIGHTS.experienceHeader
    
    // Altura dos bullets
    for (const highlight of exp.highlights) {
      const bulletLines = Math.ceil(highlight.length / 60)
      height += bulletLines * HEIGHTS.experienceBullet
    }
    
    height += HEIGHTS.itemSpacing
  }
  
  height += HEIGHTS.sectionSpacing
  return height
}

/**
 * Calcula altura estimada da seção de educação
 */
function calculateEducationHeight(education: StructuredResume['education']): number {
  if (!education || education.length === 0) return 0
  
  let height = HEIGHTS.sectionTitle
  
  for (const edu of education) {
    height += HEIGHTS.educationItem
    
    // Highlights adicionais
    if (edu.highlights) {
      for (const highlight of edu.highlights) {
        const bulletLines = Math.ceil(highlight.length / 60)
        height += bulletLines * 16
      }
    }
    
    height += HEIGHTS.itemSpacing
  }
  
  height += HEIGHTS.sectionSpacing
  return height
}

/**
 * Calcula altura estimada da seção de habilidades
 */
function calculateSkillsHeight(skills: StructuredResume['skills']): number {
  if (!skills || skills.length === 0) return 0
  
  let height = HEIGHTS.sectionTitle
  
  for (const _skill of skills) {
    height += HEIGHTS.skillCategory
  }
  
  height += HEIGHTS.sectionSpacing
  return height
}

/**
 * Calcula altura estimada da seção de certificações
 */
function calculateCertificationsHeight(certifications: StructuredResume['certifications']): number {
  if (!certifications || certifications.length === 0) return 0
  
  let height = HEIGHTS.sectionTitle
  height += certifications.length * HEIGHTS.certification
  height += HEIGHTS.sectionSpacing
  return height
}

/**
 * Calcula altura estimada da seção de idiomas
 */
function calculateLanguagesHeight(languages: StructuredResume['languages']): number {
  if (!languages || languages.length === 0) return 0
  
  let height = HEIGHTS.sectionTitle
  height += languages.length * HEIGHTS.language
  height += HEIGHTS.sectionSpacing
  return height
}

/**
 * Calcula o layout completo do currículo
 */
export function calculateLayout(resume: StructuredResume): {
  sections: SectionLayout[]
  totalHeight: number
  estimatedPages: number
} {
  const sections: SectionLayout[] = []
  let currentY = 0  // Posição relativa ao conteúdo (sem margens)
  let currentPage = 1
  
  // Header
  const headerHeight = calculateHeaderHeight(resume)
  sections.push({
    name: 'header',
    estimatedHeight: headerHeight,
    startY: currentY,
    endY: currentY + headerHeight,
    pageNumber: currentPage,
    riskOfSplit: false,
  })
  currentY += headerHeight
  
  // Summary
  if (resume.summary) {
    const summaryHeight = calculateSummaryHeight(resume.summary)
    const riskOfSplit = detectSectionSplitRisk(currentY, summaryHeight, currentPage)
    
    sections.push({
      name: 'summary',
      estimatedHeight: summaryHeight,
      startY: currentY % CONTENT_HEIGHT,
      endY: (currentY + summaryHeight) % CONTENT_HEIGHT,
      pageNumber: currentPage,
      riskOfSplit,
    })
    
    currentY += summaryHeight
    currentPage = Math.floor(currentY / CONTENT_HEIGHT) + 1
  }
  
  // Experience
  if (resume.experience && resume.experience.length > 0) {
    const expHeight = calculateExperienceHeight(resume.experience)
    const riskOfSplit = detectSectionSplitRisk(currentY, expHeight, currentPage)
    
    sections.push({
      name: 'experience',
      estimatedHeight: expHeight,
      startY: currentY % CONTENT_HEIGHT + MARGIN_TOP,
      endY: (currentY + expHeight) % CONTENT_HEIGHT + MARGIN_TOP,
      pageNumber: currentPage,
      riskOfSplit,
    })
    
    currentY += expHeight
    currentPage = Math.floor(currentY / CONTENT_HEIGHT) + 1
  }
  
  // Education
  if (resume.education && resume.education.length > 0) {
    const eduHeight = calculateEducationHeight(resume.education)
    const riskOfSplit = detectSectionSplitRisk(currentY, eduHeight, currentPage)
    
    sections.push({
      name: 'education',
      estimatedHeight: eduHeight,
      startY: currentY % CONTENT_HEIGHT + MARGIN_TOP,
      endY: (currentY + eduHeight) % CONTENT_HEIGHT + MARGIN_TOP,
      pageNumber: currentPage,
      riskOfSplit,
    })
    
    currentY += eduHeight
    currentPage = Math.floor(currentY / CONTENT_HEIGHT) + 1
  }
  
  // Skills
  if (resume.skills && resume.skills.length > 0) {
    const skillsHeight = calculateSkillsHeight(resume.skills)
    const riskOfSplit = detectSectionSplitRisk(currentY, skillsHeight, currentPage)
    
    sections.push({
      name: 'skills',
      estimatedHeight: skillsHeight,
      startY: currentY % CONTENT_HEIGHT + MARGIN_TOP,
      endY: (currentY + skillsHeight) % CONTENT_HEIGHT + MARGIN_TOP,
      pageNumber: currentPage,
      riskOfSplit,
    })
    
    currentY += skillsHeight
    currentPage = Math.floor(currentY / CONTENT_HEIGHT) + 1
  }
  
  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    const certHeight = calculateCertificationsHeight(resume.certifications)
    const riskOfSplit = detectSectionSplitRisk(currentY, certHeight, currentPage)
    
    sections.push({
      name: 'certifications',
      estimatedHeight: certHeight,
      startY: currentY % CONTENT_HEIGHT + MARGIN_TOP,
      endY: (currentY + certHeight) % CONTENT_HEIGHT + MARGIN_TOP,
      pageNumber: currentPage,
      riskOfSplit,
    })
    
    currentY += certHeight
    currentPage = Math.floor(currentY / CONTENT_HEIGHT) + 1
  }
  
  // Languages
  if (resume.languages && resume.languages.length > 0) {
    const langHeight = calculateLanguagesHeight(resume.languages)
    const riskOfSplit = detectSectionSplitRisk(currentY, langHeight, currentPage)
    
    sections.push({
      name: 'languages',
      estimatedHeight: langHeight,
      startY: currentY % CONTENT_HEIGHT + MARGIN_TOP,
      endY: (currentY + langHeight) % CONTENT_HEIGHT + MARGIN_TOP,
      pageNumber: currentPage,
      riskOfSplit,
    })
    
    currentY += langHeight
    currentPage = Math.floor(currentY / CONTENT_HEIGHT) + 1
  }
  
  return {
    sections,
    totalHeight: currentY,
    estimatedPages: currentPage,
  }
}

/**
 * Detecta risco de divisão de seção entre páginas
 * Retorna true se a seção deve ser movida para a próxima página
 */
function detectSectionSplitRisk(currentY: number, sectionHeight: number, _currentPage: number): boolean {
  const positionOnPage = currentY % CONTENT_HEIGHT
  const remainingSpace = CONTENT_HEIGHT - positionOnPage
  
  // Se a seção não cabe no espaço restante
  const wouldBeSplit = sectionHeight > remainingSpace
  
  // Se temos muito pouco espaço restante (menos que o título + conteúdo mínimo)
  // devemos mover para a próxima página para evitar título órfão
  const minSpaceNeeded = HEIGHTS.sectionTitle + HEIGHTS.minContentAfterTitle
  const hasInsufficientSpace = remainingSpace < minSpaceNeeded
  
  // Se a seção é pequena o suficiente que faria sentido mantê-la unida
  const isSmallSection = sectionHeight < CONTENT_HEIGHT * 0.5
  
  // Devemos forçar quebra se:
  // 1. A seção seria dividida E é pequena o suficiente para ficar em uma página
  // 2. OU temos espaço insuficiente para o título + conteúdo mínimo
  return (wouldBeSplit && isSmallSection) || (hasInsufficientSpace && sectionHeight > remainingSpace)
}

/**
 * Detecta problemas de órfãs e viúvas em parágrafos
 * Nota: Função disponível para uso futuro
 * 
 * eslint-disable-next-line @typescript-eslint/no-unused-vars
 */
/*
function detectOrphansAndWidows(
  text: string, 
  startY: number, 
  lineHeight: number
): LayoutIssue[] {
  const issues: LayoutIssue[] = []
  
  // Estimar número de linhas
  const charsPerLine = 60
  const totalLines = Math.ceil(text.length / charsPerLine)
  
  // Calcular onde o texto termina
  const endY = startY + (totalLines * lineHeight)
  
  // Verificar se o texto cruza página
  const startPage = Math.floor(startY / CONTENT_HEIGHT)
  const endPage = Math.floor(endY / CONTENT_HEIGHT)
  
  if (startPage !== endPage) {
    // Calcular linhas na primeira página
    const linesOnFirstPage = Math.floor((CONTENT_HEIGHT - (startY % CONTENT_HEIGHT)) / lineHeight)
    // Calcular linhas na última página
    const linesOnLastPage = totalLines - linesOnFirstPage
    
    // Detectar viúva (poucas linhas no início)
    if (linesOnFirstPage < THRESHOLDS.widowLines && totalLines > THRESHOLDS.widowLines) {
      issues.push({
        type: 'WIDOW',
        severity: 'WARNING',
        section: 'text',
        description: `Texto começa com apenas ${linesOnFirstPage} linha(s) na página`,
        suggestion: 'Mover texto para próxima página ou adicionar mais conteúdo',
        pageNumber: startPage + 1,
      })
    }
    
    // Detectar órfã (poucas linhas no final)
    if (linesOnLastPage < THRESHOLDS.orphanLines && totalLines > THRESHOLDS.orphanLines) {
      issues.push({
        type: 'ORPHAN',
        severity: 'WARNING',
        section: 'text',
        description: `Texto termina com apenas ${linesOnLastPage} linha(s) na página`,
        suggestion: 'Mover texto para página anterior ou expandir conteúdo',
        pageNumber: endPage + 1,
      })
    }
  }
  
  return issues
}
*/

/**
 * Valida o layout completo do currículo
 */
export function validateLayout(resume: StructuredResume): LayoutValidationResult {
  const { sections, totalHeight: _totalHeight, estimatedPages } = calculateLayout(resume)
  const issues: LayoutIssue[] = []
  const recommendations: string[] = []
  
  // Verificar seções com risco de divisão
  for (const section of sections) {
    if (section.riskOfSplit) {
      issues.push({
        type: 'SECTION_SPLIT',
        severity: 'CRITICAL',
        section: section.name,
        description: `Seção "${section.name}" pode ser dividida entre páginas`,
        suggestion: `Inserir quebra de página antes da seção "${section.name}"`,
        pageNumber: section.pageNumber,
      })
      
      recommendations.push(`Mover seção "${section.name}" para próxima página`)
    }
  }
  
  // Verificar se currículo excede página única (quando deveria caber)
  const hasOnePageContent = sections.length <= 4 && 
    (resume.experience?.length ?? 0) <= 2 && 
    (resume.education?.length ?? 0) <= 2
  
  if (hasOnePageContent && estimatedPages > 1) {
    issues.push({
      type: 'PAGE_OVERFLOW',
      severity: 'WARNING',
      section: 'document',
      description: 'Currículo com pouco conteúdo ocupando múltiplas páginas',
      suggestion: 'Ajustar espaçamentos para otimizar uso do espaço',
    })
    
    recommendations.push('Reduzir espaçamentos entre seções para manter em 1 página')
  }
  
  // Verificar margens (se conteúdo está muito próximo das bordas)
  // Isso seria mais relevante na validação pós-renderização
  
  return {
    isValid: issues.filter(i => i.severity === 'CRITICAL').length === 0,
    issues,
    estimatedPages,
    sections,
    recommendations,
  }
}

/**
 * Sugere correções automáticas para problemas detectados
 */
export function suggestFixes(validationResult: LayoutValidationResult): {
  forcePageBreaks: string[]
  adjustSpacing: boolean
  reduceSpacing: boolean
} {
  const forcePageBreaks: string[] = []
  let adjustSpacing = false
  let reduceSpacing = false
  
  for (const issue of validationResult.issues) {
    switch (issue.type) {
      case 'SECTION_SPLIT':
        forcePageBreaks.push(issue.section)
        break
      case 'PAGE_OVERFLOW':
        reduceSpacing = true
        break
      case 'ORPHAN':
      case 'WIDOW':
        adjustSpacing = true
        break
    }
  }
  
  return {
    forcePageBreaks,
    adjustSpacing,
    reduceSpacing,
  }
}

export default {
  validateLayout,
  calculateLayout,
  suggestFixes,
  PAGE_HEIGHT,
  CONTENT_HEIGHT,
  THRESHOLDS,
}