import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy, AlertCircle } from "lucide-react"

interface CopyButtonProps {
  text: string
  variant?: "default" | "outline"
  size?: "default" | "sm" | "lg"
}

export function CopyButton({ text, variant = "outline", size = "sm" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)

  const handleCopy = async () => {
    setError(false)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-9999px"
        textArea.style.top = "-9999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const success = document.execCommand("copy")
        document.body.removeChild(textArea)
        if (!success) throw new Error("execCommand failed")
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
      setError(true)
      setTimeout(() => setError(false), 3000)
    }
  }

  if (error) {
    return (
      <Button variant="destructive" size={size} onClick={handleCopy} aria-live="polite">
        <AlertCircle className="h-4 w-4 mr-2" aria-hidden="true" />
        Erro ao copiar
      </Button>
    )
  }

  return (
    <Button
      variant={copied ? "default" : variant}
      size={size}
      onClick={handleCopy}
      aria-label={copied ? "Texto copiado!" : "Copiar texto"}
      aria-live="polite"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" aria-hidden="true" /> Copiado!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" aria-hidden="true" /> Copiar
        </>
      )}
    </Button>
  )
}
