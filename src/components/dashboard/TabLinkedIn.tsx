import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy, Linkedin, User, Briefcase, GraduationCap, Award, Languages, Wrench } from "lucide-react"

export interface LinkedInProfile {
  headline?: string
  about?: string
  experiences?: {
    role: string
    company: string
    location?: string
    period?: string
    description?: string
    bullets: string[]
  }[]
  education?: {
    degree: string
    institution: string
    year?: string
    description?: string
  }[]
  skills?: string[]
  certifications?: {
    name: string
    issuer?: string
    year?: string
  }[]
  languages?: {
    language: string
    proficiency: string
  }[]
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      aria-label={`Copiar ${label}`}
      className="shrink-0 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
          Copiado!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          Copiar
        </>
      )}
    </Button>
  )
}

function SectionCard({
  icon: Icon,
  title,
  copyText,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  copyText: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-background border border-border/50 rounded-xl shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-foreground/80">{title}</h3>
        </div>
        <CopyButton text={copyText} label={title} />
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

interface TabLinkedInProps {
  profile: LinkedInProfile | null | undefined
}

export function TabLinkedIn({ profile }: TabLinkedInProps) {
  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Perfil LinkedIn Otimizado</h2>
          <p className="text-muted-foreground">Seu perfil completo otimizado para recrutadores canadenses.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="bg-muted/50 p-4 rounded-2xl">
            <Linkedin className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-muted-foreground text-lg font-medium">Perfil LinkedIn não disponível.</p>
          <p className="text-muted-foreground text-sm max-w-sm">
            Gere uma nova análise para receber seu perfil LinkedIn completo e otimizado para o Canadá.
          </p>
        </div>
      </div>
    )
  }

  // Build copy text for all experiences combined
  const experiencesCopyText = (profile.experiences || [])
    .map((exp) => {
      let text = `${exp.role} - ${exp.company}`
      if (exp.location) text += ` | ${exp.location}`
      if (exp.period) text += `\n${exp.period}`
      if (exp.description) text += `\n${exp.description}`
      if (exp.bullets?.length) text += `\n${exp.bullets.map((b) => `• ${b}`).join("\n")}`
      return text
    })
    .join("\n\n")

  const educationCopyText = (profile.education || [])
    .map((edu) => {
      let text = `${edu.degree} - ${edu.institution}`
      if (edu.year) text += ` (${edu.year})`
      if (edu.description) text += `\n${edu.description}`
      return text
    })
    .join("\n\n")

  const skillsCopyText = (profile.skills || []).join(" · ")

  const certificationsCopyText = (profile.certifications || [])
    .map((cert) => {
      let text = cert.name
      if (cert.issuer) text += ` — ${cert.issuer}`
      if (cert.year) text += ` (${cert.year})`
      return text
    })
    .join("\n")

  const languagesCopyText = (profile.languages || [])
    .map((lang) => `${lang.language}: ${lang.proficiency}`)
    .join("\n")

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Linkedin className="h-6 w-6 text-[#0A66C2]" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-foreground">Perfil LinkedIn Otimizado</h2>
        </div>
        <p className="text-muted-foreground">
          Copie cada seção e cole diretamente no seu perfil do LinkedIn. Tudo já está em inglês e otimizado para SEO de recrutadores canadenses.
        </p>
      </div>

      <div className="space-y-4">
        {/* Headline */}
        {profile.headline && (
          <SectionCard icon={User} title="Headline (Título)" copyText={profile.headline}>
            <p className="text-lg font-semibold text-foreground leading-relaxed">{profile.headline}</p>
            <p className="text-xs text-muted-foreground mt-2 italic">
              💡 Cole em: LinkedIn → Perfil → Editar → Headline
            </p>
          </SectionCard>
        )}

        {/* About */}
        {profile.about && (
          <SectionCard icon={User} title="Sobre (About)" copyText={profile.about}>
            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{profile.about}</div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              💡 Cole em: LinkedIn → Perfil → Sobre → Editar
            </p>
          </SectionCard>
        )}

        {/* Experience */}
        {profile.experiences && profile.experiences.length > 0 && (
          <SectionCard icon={Briefcase} title="Experiência Profissional" copyText={experiencesCopyText}>
            <div className="space-y-5">
              {profile.experiences.map((exp, index) => (
                <div key={index} className={index > 0 ? "pt-4 border-t border-border/30" : ""}>
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div>
                      <h4 className="font-bold text-base text-primary">{exp.role}</h4>
                      <p className="text-sm text-muted-foreground">
                        {exp.company}
                        {exp.location && ` · ${exp.location}`}
                      </p>
                    </div>
                    {exp.period && (
                      <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full shrink-0">
                        {exp.period}
                      </span>
                    )}
                  </div>
                  {exp.description && (
                    <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{exp.description}</p>
                  )}
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {exp.bullets.map((bullet, bi) => (
                        <li key={bi} className="text-sm text-foreground/80 flex gap-2">
                          <span className="text-primary font-bold mt-0.5 shrink-0">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic">
              💡 Cole cada experiência em: LinkedIn → Perfil → Experiência → Adicionar
            </p>
          </SectionCard>
        )}

        {/* Education */}
        {profile.education && profile.education.length > 0 && (
          <SectionCard icon={GraduationCap} title="Educação" copyText={educationCopyText}>
            <div className="space-y-4">
              {profile.education.map((edu, index) => (
                <div key={index} className={index > 0 ? "pt-3 border-t border-border/30" : ""}>
                  <h4 className="font-bold text-sm text-foreground">{edu.degree}</h4>
                  <p className="text-sm text-muted-foreground">
                    {edu.institution}
                    {edu.year && ` · ${edu.year}`}
                  </p>
                  {edu.description && (
                    <p className="text-xs text-foreground/70 mt-1">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              💡 Cole em: LinkedIn → Perfil → Educação → Adicionar
            </p>
          </SectionCard>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <SectionCard icon={Wrench} title="Competências (Skills)" copyText={skillsCopyText}>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              💡 Adicione uma por uma em: LinkedIn → Perfil → Competências → Adicionar
            </p>
          </SectionCard>
        )}

        {/* Certifications */}
        {profile.certifications && profile.certifications.length > 0 && (
          <SectionCard icon={Award} title="Certificações e Licenças" copyText={certificationsCopyText}>
            <div className="space-y-3">
              {profile.certifications.map((cert, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Award className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{cert.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cert.issuer}
                      {cert.year && ` · ${cert.year}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              💡 Cole em: LinkedIn → Perfil → Licenças e Certificações → Adicionar
            </p>
          </SectionCard>
        )}

        {/* Languages */}
        {profile.languages && profile.languages.length > 0 && (
          <SectionCard icon={Languages} title="Idiomas" copyText={languagesCopyText}>
            <div className="space-y-2">
              {profile.languages.map((lang, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <span className="text-sm font-medium text-foreground">{lang.language}</span>
                  <span className="text-xs bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                    {lang.proficiency}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              💡 Cole em: LinkedIn → Perfil → Idiomas → Adicionar
            </p>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
