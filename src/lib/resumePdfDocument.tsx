import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { StructuredResume } from '@/lib/resumeTypes'
import type { StyleAdjustments } from '@/lib/resumeLayoutFixer'

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
    { src: 'Helvetica-Oblique', fontStyle: 'italic' },
    { src: 'Helvetica-BoldOblique', fontWeight: 'bold', fontStyle: 'italic' },
  ],
})

// Configurações padrão de layout
const DEFAULT_CONFIG = {
  sectionSpacing: 14,
  itemSpacing: 8,
  lineHeight: 1.4,
  pagePadding: 36,
}

// Props adicionais para controle de layout
export interface ResumePdfDocumentProps {
  resume: StructuredResume
  forcedBreaks?: string[]  // Seções que devem ter quebra de página antes
  styleAdjustments?: StyleAdjustments  // Ajustes de estilo calculados
}

function createStyles(adjustments?: StyleAdjustments) {
  const sectionSpacing = adjustments?.sectionSpacing ?? DEFAULT_CONFIG.sectionSpacing
  const lineHeight = adjustments?.lineHeight ?? DEFAULT_CONFIG.lineHeight
  const pagePadding = adjustments?.pageMargins?.top ?? DEFAULT_CONFIG.pagePadding

  return StyleSheet.create({
    page: {
      padding: pagePadding,
      fontFamily: 'Helvetica',
      fontSize: 10,
      lineHeight: lineHeight,
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
    },
    header: {
      marginBottom: sectionSpacing,
      paddingBottom: 12,
      borderBottomWidth: 2,
      borderBottomColor: '#1e3a8a',
      textAlign: 'center',
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1e3a8a',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 6,
    },
    title: {
      fontSize: 11,
      color: '#4b5563',
      marginBottom: 6,
    },
    contact: {
      fontSize: 9,
      color: '#6b7280',
      textAlign: 'center',
      marginTop: 4,
    },
    section: {
      marginBottom: sectionSpacing,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#1e3a8a',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    summary: {
      fontSize: 10,
      color: '#374151',
      lineHeight: lineHeight,
      textAlign: 'justify',
    },
    expHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 2,
    },
    expTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#1a1a1a',
      flex: 1,
    },
    expDate: {
      fontSize: 9,
      color: '#6b7280',
      fontStyle: 'italic',
      textAlign: 'right',
    },
    expCompany: {
      fontSize: 9.5,
      color: '#4b5563',
      fontStyle: 'italic',
      marginBottom: 4,
    },
    bullet: {
      flexDirection: 'row',
      marginBottom: 2,
      paddingLeft: 12,
    },
    bulletDot: {
      fontSize: 9,
      color: '#1e3a8a',
      marginRight: 6,
      width: 10,
    },
    bulletText: {
      fontSize: 10,
      color: '#374151',
      flex: 1,
      lineHeight: lineHeight,
      textAlign: 'justify',
    },
    eduHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 2,
    },
    eduDegree: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#1a1a1a',
      flex: 1,
    },
    eduDate: {
      fontSize: 9,
      color: '#6b7280',
      fontStyle: 'italic',
      textAlign: 'right',
    },
    eduSchool: {
      fontSize: 9.5,
      color: '#4b5563',
      fontStyle: 'italic',
      marginBottom: 2,
    },
    skillCategory: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#1a1a1a',
      width: 'auto',
    },
    skillItems: {
      fontSize: 10,
      color: '#374151',
      flex: 1,
      flexWrap: 'wrap',
    },
    skillRow: {
      flexDirection: 'row',
      marginBottom: 3,
      paddingLeft: 12,
      flexWrap: 'wrap',
    },
    footer: {
      position: 'absolute',
      bottom: 24,
      left: pagePadding,
      right: pagePadding,
      borderTopWidth: 0.5,
      borderTopColor: '#e2e8f0',
      paddingTop: 6,
      textAlign: 'center',
    },
    footerText: {
      fontSize: 7,
      color: '#9ca3af',
    },
  })
}

function Bullet({ text, styles }: { text: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  )
}

function ResumeHeader({ resume, styles }: { resume: StructuredResume; styles: ReturnType<typeof createStyles> }) {
  const contactParts = [
    resume.contact.location,
    resume.contact.email,
    resume.contact.phone,
    resume.contact.linkedin,
  ].filter(Boolean)

  return (
    <View style={styles.header}>
      <Text style={styles.name}>{resume.name || 'YOUR NAME'}</Text>
      {resume.title && <Text style={styles.title}>{resume.title}</Text>}
      <Text style={styles.contact}>{contactParts.join(' | ')}</Text>
    </View>
  )
}

function SummarySection({ summary, styles }: { summary: string; styles: ReturnType<typeof createStyles> }) {
  if (!summary) return null
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Professional Summary</Text>
      <Text style={styles.summary}>{summary}</Text>
    </View>
  )
}

function ExperienceSection({ 
  experience, 
  styles,
  forceBreak 
}: { 
  experience: StructuredResume['experience']
  styles: ReturnType<typeof createStyles>
  forceBreak?: boolean
}) {
  if (!experience || experience.length === 0) return null
  
  return (
    <View style={styles.section} break={forceBreak}>
      <Text style={styles.sectionTitle}>Professional Experience</Text>
      {experience.map((exp, idx) => (
        <View key={idx} style={{ marginBottom: 10 }} wrap={false}>
          <View style={styles.expHeader}>
            <Text style={styles.expTitle}>{exp.title}</Text>
            {(exp.startDate || exp.endDate) && (
              <Text style={styles.expDate}>
                {exp.startDate}{exp.startDate && exp.endDate ? ' — ' : ''}{exp.endDate}
              </Text>
            )}
          </View>
          <Text style={styles.expCompany}>
            {exp.company}{exp.location ? ` | ${exp.location}` : ''}
          </Text>
          
          {exp.highlights.map((h, i) => (
            <Bullet key={i} text={h} styles={styles} />
          ))}
        </View>
      ))}
    </View>
  )
}

function EducationSection({ 
  education, 
  styles,
  forceBreak 
}: { 
  education: StructuredResume['education']
  styles: ReturnType<typeof createStyles>
  forceBreak?: boolean
}) {
  if (!education || education.length === 0) return null
  
  return (
    <View style={styles.section} wrap={false} break={forceBreak}>
      <Text style={styles.sectionTitle}>Education</Text>
      {education.map((edu, idx) => (
        <View key={idx} style={{ marginBottom: 8 }} wrap={false}>
          <View style={styles.eduHeader}>
            <Text style={styles.eduDegree}>{edu.degree}</Text>
            {edu.graduationDate && <Text style={styles.eduDate}>{edu.graduationDate}</Text>}
          </View>
          <Text style={styles.eduSchool}>
            {edu.institution}{edu.location ? ` | ${edu.location}` : ''}
          </Text>
          
          {edu.highlights && edu.highlights.map((h, i) => (
            <Bullet key={i} text={h} styles={styles} />
          ))}
        </View>
      ))}
    </View>
  )
}

function SkillsSection({ 
  skills, 
  styles,
  forceBreak 
}: { 
  skills: StructuredResume['skills']
  styles: ReturnType<typeof createStyles>
  forceBreak?: boolean
}) {
  if (!skills || skills.length === 0) return null
  
  return (
    <View style={styles.section} wrap={false} break={forceBreak}>
      <Text style={styles.sectionTitle}>Skills</Text>
      {skills.map((skill, idx) => (
        <View key={idx} style={{ marginBottom: 4, paddingLeft: 12, flexDirection: 'row' }}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={{ fontSize: 10, color: '#374151', flex: 1, lineHeight: 1.4 }}>
            <Text style={{ fontWeight: 'bold', color: '#1a1a1a' }}>{skill.category}:</Text>
            <Text> {skill.items.join(', ')}</Text>
          </Text>
        </View>
      ))}
    </View>
  )
}

function CertificationsSection({ 
  certifications, 
  styles,
  forceBreak 
}: { 
  certifications: StructuredResume['certifications']
  styles: ReturnType<typeof createStyles>
  forceBreak?: boolean
}) {
  if (!certifications || certifications.length === 0) return null
  
  return (
    <View style={styles.section} wrap={false} break={forceBreak}>
      <Text style={styles.sectionTitle}>Certifications</Text>
      {certifications.map((cert, idx) => (
        <View key={idx} style={{ marginBottom: 2, flexDirection: 'row' }}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            {cert.name}{cert.issuer ? ` — ${cert.issuer}` : ''}{cert.date ? ` (${cert.date})` : ''}
          </Text>
        </View>
      ))}
    </View>
  )
}

function LanguagesSection({ 
  languages, 
  styles,
  forceBreak 
}: { 
  languages: StructuredResume['languages']
  styles: ReturnType<typeof createStyles>
  forceBreak?: boolean
}) {
  if (!languages || languages.length === 0) return null
  
  return (
    <View style={styles.section} wrap={false} break={forceBreak}>
      <Text style={styles.sectionTitle}>Languages</Text>
      {languages.map((lang, idx) => (
        <View key={idx} style={{ marginBottom: 2, flexDirection: 'row' }}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            {lang.language} — {lang.proficiency}
          </Text>
        </View>
      ))}
    </View>
  )
}

export function ResumePdfDocument({ 
  resume, 
  forcedBreaks = [],
  styleAdjustments 
}: ResumePdfDocumentProps) {
  const styles = createStyles(styleAdjustments)
  
  // Verificar quais seções precisam de quebra forçada
  const shouldForceBreak = (sectionName: string) => forcedBreaks.includes(sectionName)
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ResumeHeader resume={resume} styles={styles} />
        
        <SummarySection summary={resume.summary} styles={styles} />
        
        <ExperienceSection 
          experience={resume.experience} 
          styles={styles}
          forceBreak={shouldForceBreak('experience')}
        />
        
        <EducationSection 
          education={resume.education} 
          styles={styles}
          forceBreak={shouldForceBreak('education')}
        />
        
        <SkillsSection 
          skills={resume.skills} 
          styles={styles}
          forceBreak={shouldForceBreak('skills')}
        />
        
        <CertificationsSection 
          certifications={resume.certifications} 
          styles={styles}
          forceBreak={shouldForceBreak('certifications')}
        />
        
        <LanguagesSection 
          languages={resume.languages} 
          styles={styles}
          forceBreak={shouldForceBreak('languages')}
        />
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Optimized for the Canadian Job Market • Generated by CurrículoCanada AI
          </Text>
        </View>
      </Page>
    </Document>
  )
}