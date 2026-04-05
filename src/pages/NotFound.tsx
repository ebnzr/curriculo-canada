import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { FileQuestion, ArrowLeft } from "lucide-react"

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <FileQuestion className="h-24 w-24 text-muted-foreground mb-6" />
      <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        Página não encontrada
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link to="/">
        <Button variant="default" size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Home
        </Button>
      </Link>
    </div>
  )
}
