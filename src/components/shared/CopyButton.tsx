import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

interface CopyButtonProps {
  text: string
  variant?: "default" | "outline"
  size?: "default" | "sm" | "lg"
}

export function CopyButton({ text, variant = "outline", size = "sm" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <Button variant={copied ? "default" : variant} size={size} onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" /> Copiado
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" /> Copiar
        </>
      )}
    </Button>
  )
}
