/**
 * Professional DOCX resume generator using the docx library.
 * Renders structured resume data into a clean, ATS-friendly Word document.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
} from 'docx'
import type { StructuredResume } from '@/lib/resumeTypes'

const COLORS = {
  primary: '1E3A8A',
  dark: '1A1A1A',
  medium: '4B5563',
  light: '6B7280',
  border: 'E2E8F0',
  body: '374151',
}

const FONT = 'Calibri'
const SIZE_NAME = 44
const SIZE_SECTION = 24
const SIZE_TITLE = 22
const SIZE_BODY = 21
const SIZE_SMALL = 19

function sectionHeader(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: SIZE_SECTION,
        color: COLORS.primary,
        font: FONT,
        allCaps: true,
      }),
    ],
    spacing: { before: 240, after: 60 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border },
    },
  })
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: '•  ', bold: true, size: SIZE_BODY, color: COLORS.primary, font: FONT }),
      new TextRun({ text, size: SIZE_BODY, color: COLORS.body, font: FONT }),
    ],
    indent: { left: 360, hanging: 360 },
    spacing: { after: 40 },
  })
}

function boldLine(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: SIZE_BODY, color: COLORS.dark, font: FONT }),
      new TextRun({ text: value, size: SIZE_BODY, color: COLORS.body, font: FONT }),
    ],
    spacing: { after: 40 },
  })
}

/**
 * Generate a DOCX blob from structured resume data
 */
export async function generateDocxBlob(resume: StructuredResume): Promise<Blob> {
  const children: (Paragraph | any)[] = []

  // Name header
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: resume.name.toUpperCase(),
          bold: true,
          size: SIZE_NAME,
          color: COLORS.primary,
          font: FONT,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    })
  )

  // Professional title
  if (resume.title) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resume.title,
            size: SIZE_TITLE,
            color: COLORS.medium,
            font: FONT,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      })
    )
  }

  // Contact line
  const contactParts = [
    resume.contact.location,
    resume.contact.email,
    resume.contact.phone,
    resume.contact.linkedin,
  ].filter(Boolean)

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: contactParts.join(' | '),
          size: SIZE_SMALL,
          color: COLORS.light,
          font: FONT,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: COLORS.primary },
      },
    })
  )

  // Summary
  if (resume.summary) {
    children.push(sectionHeader('Professional Summary'))
    children.push(
      new Paragraph({
        children: [new TextRun({ text: resume.summary, size: SIZE_BODY, color: COLORS.body, font: FONT })],
        spacing: { after: 60 },
      })
    )
  }

  // Experience
  if (resume.experience.length > 0) {
    children.push(sectionHeader('Professional Experience'))
    for (const exp of resume.experience) {
      // Job title + date row
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.title, bold: true, size: SIZE_TITLE, color: COLORS.dark, font: FONT }),
          ],
          spacing: { before: 120, after: 20 },
        })
      )
      // Company + location + date
      const companyParts = [exp.company]
      if (exp.location) companyParts.push(exp.location)
      if (exp.startDate || exp.endDate) {
        companyParts.push(`${exp.startDate}${exp.startDate && exp.endDate ? ' — ' : ''}${exp.endDate}`)
      }
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: companyParts.join(' | '),
              italics: true,
              size: SIZE_SMALL,
              color: COLORS.medium,
              font: FONT,
            }),
          ],
          spacing: { after: 60 },
        })
      )
      // Bullets
      for (const h of exp.highlights) {
        children.push(bullet(h))
      }
    }
  }

  // Education
  if (resume.education.length > 0) {
    children.push(sectionHeader('Education'))
    for (const edu of resume.education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.degree, bold: true, size: SIZE_TITLE, color: COLORS.dark, font: FONT }),
          ],
          spacing: { before: 120, after: 20 },
        })
      )
      const eduParts = [edu.institution]
      if (edu.location) eduParts.push(edu.location)
      if (edu.graduationDate) eduParts.push(edu.graduationDate)
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: eduParts.join(' | '),
              italics: true,
              size: SIZE_SMALL,
              color: COLORS.medium,
              font: FONT,
            }),
          ],
          spacing: { after: 60 },
        })
      )
      if (edu.highlights) {
        for (const h of edu.highlights) {
          children.push(bullet(h))
        }
      }
    }
  }

  // Skills
  if (resume.skills.length > 0) {
    children.push(sectionHeader('Skills'))
    for (const skill of resume.skills) {
      children.push(boldLine(skill.category, skill.items.join(', ')))
    }
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    children.push(sectionHeader('Certifications'))
    for (const cert of resume.certifications) {
      const certText = [cert.name, cert.issuer, cert.date].filter(Boolean).join(' — ')
      children.push(bullet(certText))
    }
  }

  // Languages
  if (resume.languages && resume.languages.length > 0) {
    children.push(sectionHeader('Languages'))
    for (const lang of resume.languages) {
      children.push(bullet(`${lang.language} — ${lang.proficiency}`))
    }
  }

  const doc = new Document({
    creator: 'CurrículoCanada AI',
    title: `${resume.name} - Canadian Resume`,
    description: 'Professionally optimized resume for the Canadian job market',
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: { font: FONT, size: SIZE_BODY, color: COLORS.body },
          paragraph: { spacing: { line: 276, after: 0 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  })

  return Packer.toBlob(doc)
}

/**
 * Generate and download a DOCX file
 */
export async function downloadDocx(resume: StructuredResume, filename = 'Canadian_Resume.docx'): Promise<void> {
  const blob = await generateDocxBlob(resume)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
