import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { StructuredResume } from '@/lib/resumeTypes'

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
    { src: 'Helvetica-Oblique', fontStyle: 'italic' },
    { src: 'Helvetica-BoldOblique', fontWeight: 'bold', fontStyle: 'italic' },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    lineHeight: 1.4,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 11,
    color: '#4b5563',
    marginBottom: 4,
  },
  contact: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  summary: {
    fontSize: 9.5,
    color: '#374151',
    lineHeight: 1.5,
    marginBottom: 4,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  expTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  expDate: {
    fontSize: 9,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  expCompany: {
    fontSize: 9.5,
    color: '#4b5563',
    marginBottom: 4,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  bulletDot: {
    fontSize: 9,
    color: '#1e3a8a',
    marginRight: 6,
    width: 8,
  },
  bulletText: {
    fontSize: 9.5,
    color: '#374151',
    flex: 1,
    lineHeight: 1.45,
  },
  eduHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  eduDegree: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  eduDate: {
    fontSize: 9,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  eduSchool: {
    fontSize: 9.5,
    color: '#4b5563',
    marginBottom: 2,
  },
  skillCategory: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  skillItems: {
    fontSize: 9.5,
    color: '#374151',
    marginBottom: 4,
    paddingLeft: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#9ca3af',
  },
})

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  )
}

function ResumeHeader({ resume }: { resume: StructuredResume }) {
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

function SummarySection({ summary }: { summary: string }) {
  if (!summary) return null
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Professional Summary</Text>
      <Text style={styles.summary}>{summary}</Text>
    </View>
  )
}

function ExperienceSection({ experience }: { experience: StructuredResume['experience'] }) {
  if (!experience || experience.length === 0) return null
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Professional Experience</Text>
      {experience.map((exp, idx) => (
        <View key={idx} style={{ marginBottom: 8 }}>
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
            <Bullet key={i} text={h} />
          ))}
        </View>
      ))}
    </View>
  )
}

function EducationSection({ education }: { education: StructuredResume['education'] }) {
  if (!education || education.length === 0) return null
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Education</Text>
      {education.map((edu, idx) => (
        <View key={idx} style={{ marginBottom: 6 }}>
          <View style={styles.eduHeader}>
            <Text style={styles.eduDegree}>{edu.degree}</Text>
            {edu.graduationDate && <Text style={styles.eduDate}>{edu.graduationDate}</Text>}
          </View>
          <Text style={styles.eduSchool}>
            {edu.institution}{edu.location ? ` | ${edu.location}` : ''}
          </Text>
          {edu.highlights && edu.highlights.map((h, i) => (
            <Bullet key={i} text={h} />
          ))}
        </View>
      ))}
    </View>
  )
}

function SkillsSection({ skills }: { skills: StructuredResume['skills'] }) {
  if (!skills || skills.length === 0) return null
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Skills</Text>
      {skills.map((skill, idx) => (
        <View key={idx} style={{ marginBottom: 3 }}>
          <Text style={styles.skillCategory}>{skill.category}:</Text>
          <Text style={styles.skillItems}>{skill.items.join(', ')}</Text>
        </View>
      ))}
    </View>
  )
}

function CertificationsSection({ certifications }: { certifications: StructuredResume['certifications'] }) {
  if (!certifications || certifications.length === 0) return null
  return (
    <View style={styles.section}>
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

function LanguagesSection({ languages }: { languages: StructuredResume['languages'] }) {
  if (!languages || languages.length === 0) return null
  return (
    <View style={styles.section}>
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

export function ResumePdfDocument({ resume }: { resume: StructuredResume }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ResumeHeader resume={resume} />
        <SummarySection summary={resume.summary} />
        <ExperienceSection experience={resume.experience} />
        <EducationSection education={resume.education} />
        <SkillsSection skills={resume.skills} />
        <CertificationsSection certifications={resume.certifications} />
        <LanguagesSection languages={resume.languages} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Optimized for the Canadian Job Market • Generated by CurrículoCanada AI
          </Text>
        </View>
      </Page>
    </Document>
  )
}
