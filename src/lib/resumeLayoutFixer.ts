/**
 * Módulo de correção automática de layout para currículos
 * Aplica estratégias de correção permitidas sem comprometer aparência profissional
 */

import type { StructuredResume } from './resumeTypes'
import { 
  validateLayout, 
  suggestFixes, 
  calculateLayout,
  type LayoutValidationResult,
  CONTENT_HEIGHT,
} from './resumeLayoutValidator'

// Configurações de correção permitidas
const CORRECTION_CONFIG = {
  // Espaçamentos que podem ser ajustados
  minSectionSpacing: 10,      // Mínimo de 10px entre seções (original: 16)
  minItemSpacing: 4,          // Mínimo de 4px entre itens (original: 8)
  minLineHeight: 1.3,         // Mínimo line-height (original: 1.4)
  
  // Limites de segurança
  maxSpacingReduction: 0.25,  // Máximo de 25% de redução
  minMargin: 36,              // Mínimo de 0.5 polegada de margem
}

export interface LayoutFixResult {
  fixed: boolean
  resume: StructuredResume
  adjustments: string[]
  warnings: string[]
}

export interface StyleAdjustments {
  sectionSpacing: number
  itemSpacing: number
  lineHeight: number
  pageMargins: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

/**
 * Tenta corrigir problemas de layout automaticamente
 */
export function autoFixLayout(
  resume: StructuredResume,
  validationResult: LayoutValidationResult
): LayoutFixResult {
  const adjustments: string[] = []
  const warnings: string[] = []
  let fixed = false
  
  // Obter sugestões de correção
  const fixes = suggestFixes(validationResult)
  
  // Estratégia 1: Inserir quebras de página antes de seções problemáticas
  if (fixes.forcePageBreaks.length > 0) {
    adjustments.push(`Inserir quebras de página antes de: ${fixes.forcePageBreaks.join(', ')}`)
    fixed = true
  }
  
  // Estratégia 2: Reduzir espaçamentos se houver overflow de página
  if (fixes.reduceSpacing) {
    const spacingAdjustment = reduceSpacing(resume)
    if (spacingAdjustment.reduced) {
      adjustments.push(`Espaçamentos reduzidos em ${Math.round(spacingAdjustment.reduction * 100)}%`)
      fixed = true
    } else {
      warnings.push('Não foi possível reduzir espaçamentos sem comprometer legibilidade')
    }
  }
  
  // Estratégia 3: Ajustar espaçamentos para evitar órfãs/viúvas
  if (fixes.adjustSpacing) {
    adjustments.push('Espaçamentos ajustados para evitar linhas órfãs/viúvas')
    fixed = true
  }
  
  // Não revalidar com o mesmo resume - as correções são aplicadas via metadata
  // O fixed indica que tentamos aplicar correções, não que todos os problemas desapareceram
  // A validação final deve considerar os ajustes aplicados
  const hasCriticalIssues = validationResult.issues.some(i => i.severity === 'CRITICAL')
  
  // Se aplicamos quebras de página forçadas, consideramos como "tentativa de correção"
  // mesmo que o layout original ainda tenha problemas
  if (fixes.forcePageBreaks.length > 0 && hasCriticalIssues) {
    fixed = true  // Correções foram aplicadas, mas usuário deve ser avisado
    warnings.push('Quebras de página adicionadas para evitar seções divididas')
  }
  
  return {
    fixed,
    resume,
    adjustments,
    warnings,
  }
}

/**
 * Reduz espaçamentos de forma controlada
 */
function reduceSpacing(resume: StructuredResume): { reduced: boolean; reduction: number } {
  // Verificar se redução é possível sem comprometer qualidade
  const currentLayout = calculateLayout(resume)
  
  // Se já está em 1 página, não precisa reduzir
  if (currentLayout.estimatedPages === 1) {
    return { reduced: false, reduction: 0 }
  }
  
  // Calcular quanto espaço precisa ser economizado
  // Para currículos de múltiplas páginas, calcular excesso apenas na última página
  const contentWithoutMargins = currentLayout.totalHeight - 36 // MARGIN_TOP = 36
  const lastPageUsed = contentWithoutMargins % CONTENT_HEIGHT
  const excessHeight = lastPageUsed > 0 ? lastPageUsed - CONTENT_HEIGHT : 0
  
  // Se estamos usando menos de 90% da última página, não precisa reduzir
  if (lastPageUsed < CONTENT_HEIGHT * 0.9) {
    return { reduced: false, reduction: 0 }
  }
  
  // Estimar economia possível com redução de espaçamentos
  const sectionCount = currentLayout.sections.length
  const potentialSavings = sectionCount * (16 - CORRECTION_CONFIG.minSectionSpacing)
  
  // Se economia potencial é suficiente
  if (potentialSavings >= excessHeight) {
    const reduction = Math.min(
      excessHeight / (sectionCount * 16),
      CORRECTION_CONFIG.maxSpacingReduction
    )
    
    return { reduced: true, reduction }
  }
  
  return { reduced: false, reduction: 0 }
}

/**
 * Calcula ajustes de estilo recomendados
 */
export function calculateStyleAdjustments(
  validationResult: LayoutValidationResult
): StyleAdjustments {
  const baseAdjustments: StyleAdjustments = {
    sectionSpacing: 16,
    itemSpacing: 8,
    lineHeight: 1.4,
    pageMargins: {
      top: 36,  // Alinhado com DEFAULT_CONFIG.pagePadding
      bottom: 36,
      left: 36,
      right: 36,
    },
  }
  
  const fixes = suggestFixes(validationResult)
  
  // Aplicar reduções se necessário
  if (fixes.reduceSpacing) {
    baseAdjustments.sectionSpacing = CORRECTION_CONFIG.minSectionSpacing
    baseAdjustments.itemSpacing = CORRECTION_CONFIG.minItemSpacing
    baseAdjustments.lineHeight = CORRECTION_CONFIG.minLineHeight
  }
  
  return baseAdjustments
}

/**
 * Determina quais seções devem ter quebra de página forçada
 */
export function getForcedPageBreaks(
  validationResult: LayoutValidationResult
): string[] {
  const breaks: string[] = []
  
  for (const issue of validationResult.issues) {
    if (issue.type === 'SECTION_SPLIT' && issue.severity === 'CRITICAL') {
      breaks.push(issue.section)
    }
  }
  
  return breaks
}

/**
 * Verifica se é possível corrigir automaticamente
 */
export function canAutoFix(validationResult: LayoutValidationResult): boolean {
  const criticalIssues = validationResult.issues.filter(i => i.severity === 'CRITICAL')
  
  // Só pode corrigir automaticamente se:
  // 1. Todos os problemas críticos são SECTION_SPLIT
  // 2. Não há problemas de overflow extremo
  const onlySectionSplits = criticalIssues.every(i => i.type === 'SECTION_SPLIT')
  const noExtremeOverflow = !validationResult.issues.some(
    i => i.type === 'PAGE_OVERFLOW' && validationResult.estimatedPages > 2
  )
  
  return onlySectionSplits && noExtremeOverflow
}

/**
 * Gera mensagem para o usuário quando correção automática falha
 */
export function generateFailureMessage(
  validationResult: LayoutValidationResult
): {
  title: string
  message: string
  suggestion: string
} {
  const criticalCount = validationResult.issues.filter(i => i.severity === 'CRITICAL').length
  
  if (criticalCount === 0) {
    return {
      title: 'Aviso de Layout',
      message: 'Detectamos alguns problemas menores no layout do currículo.',
      suggestion: 'Você pode gerar o PDF mesmo assim ou baixar a versão DOCX para ajustes manuais.',
    }
  }
  
  if (validationResult.estimatedPages > 2) {
    return {
      title: 'Currículo Muito Extenso',
      message: `O currículo gerado ocuparia ${validationResult.estimatedPages} páginas, o que pode não ser ideal para o mercado canadense.`,
      suggestion: 'Recomendamos baixar a versão DOCX e resumir algumas experiências para manter em 1-2 páginas.',
    }
  }
  
  const splitSections = validationResult.issues
    .filter(i => i.type === 'SECTION_SPLIT')
    .map(i => i.section)
    .join(', ')
  
  return {
    title: 'Problemas de Quebra de Página',
    message: `As seguintes seções podem ser divididas entre páginas: ${splitSections}.`,
    suggestion: 'Baixe a versão DOCX para ter controle total sobre o layout, ou gere o PDF e verifique o resultado.',
  }
}

/**
 * Prepara o currículo para geração com correções aplicadas
 */
export function prepareResumeForPdf(
  resume: StructuredResume
): {
  resume: StructuredResume
  forcedBreaks: string[]
  styleAdjustments: StyleAdjustments
  hasIssues: boolean
  userMessage?: {
    title: string
    message: string
    suggestion: string
  }
} {
  // Validar layout
  const validation = validateLayout(resume)
  
  // Tentar correção automática
  const fixResult = autoFixLayout(resume, validation)
  
  // Obter quebras forçadas
  const forcedBreaks = getForcedPageBreaks(validation)
  
  // Calcular ajustes de estilo
  const styleAdjustments = calculateStyleAdjustments(validation)
  
  // Verificar se ainda há problemas
  const hasIssues = !fixResult.fixed && validation.issues.some(i => i.severity === 'CRITICAL')
  
  // Gerar mensagem para usuário se necessário
  let userMessage
  if (hasIssues || fixResult.warnings.length > 0) {
    userMessage = generateFailureMessage(validation)
  }
  
  return {
    resume: fixResult.resume,
    forcedBreaks,
    styleAdjustments,
    hasIssues,
    userMessage,
  }
}

export default {
  autoFixLayout,
  calculateStyleAdjustments,
  getForcedPageBreaks,
  canAutoFix,
  generateFailureMessage,
  prepareResumeForPdf,
}