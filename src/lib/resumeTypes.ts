/**
 * Structured resume data model inspired by OpenResume architecture.
 * Instead of rendering raw markdown, we parse AI output into structured
 * sections that can be rendered consistently in PDF, DOCX, and HTML.
 */

export interface ResumeContact {
  email: string
  phone: string
  location: string
  linkedin?: string
}

export interface ResumeExperience {
  title: string
  company: string
  startDate: string
  endDate: string
  location: string
  highlights: string[]
}

export interface ResumeEducation {
  degree: string
  institution: string
  graduationDate: string
  location: string
  highlights?: string[]
}

export interface ResumeSkill {
  category: string
  items: string[]
}

export interface ResumeProject {
  name: string
  description: string
  highlights?: string[]
}

export interface ResumeCertification {
  name: string
  issuer?: string
  date?: string
}

export interface ResumeLanguage {
  language: string
  proficiency: string
}

/**
 * Complete structured resume data
 */
export interface StructuredResume {
  name: string
  title: string
  contact: ResumeContact
  summary: string
  experience: ResumeExperience[]
  education: ResumeEducation[]
  skills: ResumeSkill[]
  projects?: ResumeProject[]
  certifications?: ResumeCertification[]
  languages?: ResumeLanguage[]
}

/**
 * Parse AI markdown output into structured resume data.
 * Handles the format that our Groq/Gemini prompts generate:
 * # Name
 * contact line
 * ## SECTION
 * ### Title - Company
 * *date | location*
 * - bullet
 */
export function parseResumeMarkdown(markdown: string): StructuredResume {
  const cleaned = markdown
    .replace(/^```(?:markdown)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  const lines = cleaned.split('\n')

  const resume: StructuredResume = {
    name: '',
    title: '',
    contact: { email: '', phone: '', location: '', linkedin: '' },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
  }

  let currentSection = ''
  let currentExp: ResumeExperience | null = null
  let currentEdu: ResumeEducation | null = null
  let currentProject: ResumeProject | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (!line) continue

    // Name: # Name
    if (/^#\s/.test(line) && !/^##\s/.test(line)) {
      resume.name = line.replace(/^#\s*/, '').trim()
      continue
    }

    // Section: ## SECTION
    if (/^##\s/.test(line) && !/^###\s/.test(line)) {
      // Save any pending items
      if (currentExp) { resume.experience.push(currentExp); currentExp = null }
      if (currentEdu) { resume.education.push(currentEdu); currentEdu = null }
      if (currentProject) { resume.projects!.push(currentProject); currentProject = null }

      currentSection = line.replace(/^##\s*/, '').trim().toUpperCase()
      continue
    }

    // Sub-item: ### Title - Company or ### Degree - Institution
    if (/^###\s/.test(line)) {
      const content = line.replace(/^###\s*/, '').trim()

      if (currentSection.includes('EXPERIENCE')) {
        if (currentExp) resume.experience.push(currentExp)
        const parts = content.split(/\s*[-–—]\s*/)
        currentExp = {
          title: parts[0]?.trim() || '',
          company: parts.slice(1).join(' - ').trim() || '',
          startDate: '',
          endDate: '',
          location: '',
          highlights: [],
        }
      } else if (currentSection.includes('EDUCATION')) {
        if (currentEdu) resume.education.push(currentEdu)
        const parts = content.split(/\s*[-–—]\s*/)
        currentEdu = {
          degree: parts[0]?.trim() || '',
          institution: parts.slice(1).join(' - ').trim() || '',
          graduationDate: '',
          location: '',
          highlights: [],
        }
      } else if (currentSection.includes('PROJECT')) {
        if (currentProject) resume.projects!.push(currentProject)
        currentProject = {
          name: content,
          description: '',
          highlights: [],
        }
      }
      continue
    }

    // Italic line: *date | location*
    if (/^\*.*\*$/.test(line) && !line.startsWith('**')) {
      const content = line.replace(/^\*|\*$/g, '').trim()
      const parts = content.split(/\s*\|\s*/)

      if (currentExp) {
        const datePart = parts[0]?.trim() || ''
        const dateMatch = datePart.match(/(.+?)\s*[-–—]\s*(.+)/)
        if (dateMatch) {
          currentExp.startDate = dateMatch[1].trim()
          currentExp.endDate = dateMatch[2].trim()
        } else {
          currentExp.startDate = datePart
        }
        currentExp.location = parts[1]?.trim() || ''
      } else if (currentEdu) {
        currentEdu.graduationDate = parts[0]?.trim() || ''
        currentEdu.location = parts[1]?.trim() || ''
      }
      continue
    }

    // Bullet: - item or • item
    if (/^[-•*]\s/.test(line)) {
      const text = line.replace(/^[-•*]\s*/, '').trim()

      if (currentExp) {
        currentExp.highlights.push(text)
      } else if (currentEdu) {
        currentEdu.highlights!.push(text)
      } else if (currentProject) {
        currentProject.highlights!.push(text)
      } else if (currentSection.includes('SKILL')) {
        // Skills can be: - **Category:** item1, item2
        const skillMatch = text.match(/\*\*(.+?):\*\*\s*(.+)/)
        if (skillMatch) {
          resume.skills.push({
            category: skillMatch[1].trim(),
            items: skillMatch[2].split(',').map(s => s.trim()).filter(Boolean),
          })
        } else {
          // Simple list item
          const existing = resume.skills.find(s => s.category === 'Other')
          if (existing) {
            existing.items.push(text)
          } else {
            resume.skills.push({ category: 'Other', items: [text] })
          }
        }
      } else if (currentSection.includes('CERTIFICATION') || currentSection.includes('CERTIFICATE')) {
        const certParts = text.split(/\s*[|–—-]\s*/)
        resume.certifications!.push({
          name: certParts[0]?.trim() || text,
          issuer: certParts[1]?.trim(),
          date: certParts[2]?.trim(),
        })
      } else if (currentSection.includes('LANGUAGE')) {
        const langParts = text.split(/\s*[–—-]\s*|\s*\(\s*|\s*\)\s*/)
        resume.languages!.push({
          language: langParts[0]?.trim() || text,
          proficiency: langParts[1]?.trim() || '',
        })
      }
      continue
    }

    // Regular text (contact line or summary or description)
    if (currentSection === '') {
      // This is the contact line (right after name)
      if (!resume.contact.email && !resume.contact.phone) {
        parseContactLine(line, resume.contact)
      } else if (!resume.title) {
        resume.title = line
      }
    } else if (currentSection.includes('SUMMARY') || currentSection.includes('OBJECTIVE')) {
      resume.summary += (resume.summary ? ' ' : '') + line
    } else if (currentProject) {
      currentProject.description += (currentProject.description ? ' ' : '') + line
    }
  }

  // Save any pending items
  if (currentExp) resume.experience.push(currentExp)
  if (currentEdu) resume.education.push(currentEdu)
  if (currentProject) resume.projects!.push(currentProject)

  // Clean up empty arrays
  if (resume.projects && resume.projects.length === 0) resume.projects = undefined
  if (resume.certifications && resume.certifications.length === 0) resume.certifications = undefined
  if (resume.languages && resume.languages.length === 0) resume.languages = undefined

  return resume
}

function parseContactLine(line: string, contact: ResumeContact): void {
  const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/)
  if (emailMatch) contact.email = emailMatch[0]

  const phoneMatch = line.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)
  if (phoneMatch) contact.phone = phoneMatch[0]

  const linkedinMatch = line.match(/linkedin\.com\/in\/[\w-]+/i)
  if (linkedinMatch) contact.linkedin = linkedinMatch[0]

  // Location is everything before email or the whole line if no email
  const parts = line.split('|').map(s => s.trim())
  if (parts.length > 0 && parts[0] && !parts[0].includes('@')) {
    contact.location = parts[0]
  }
}
