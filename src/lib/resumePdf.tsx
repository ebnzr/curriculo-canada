import type { StructuredResume } from '@/lib/resumeTypes'

export async function generatePdfBlob(resume: StructuredResume): Promise<Blob> {
  const [{ pdf }, { ResumePdfDocument }, React] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./resumePdfDocument'),
    import('react'),
  ])
  const element = React.createElement(ResumePdfDocument, { resume })
  return pdf(element as Parameters<typeof pdf>[0]).toBlob()
}

export async function downloadPdf(resume: StructuredResume, filename = 'Canadian_Resume.pdf'): Promise<void> {
  const blob = await generatePdfBlob(resume)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
