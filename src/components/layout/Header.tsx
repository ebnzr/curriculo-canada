import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LogOut, LayoutDashboard, PlusCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useWizardStore } from "@/stores/wizardStore"

export function Header() {
  const { user, profile, loading, logout } = useAuth()
  const resetWizard = useWizardStore((state) => state.reset)
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      // Aguardar um momento para garantir que o estado foi atualizado
      setTimeout(() => {
        navigate("/", { replace: true })
      }, 100)
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      navigate("/", { replace: true })
    }
  }

  const handleNewAnalysis = () => {
    resetWizard()
    navigate("/analyze")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center group">
          <img
            src="/logo.png?v=2"
            alt="Currículo Canadá"
            className="h-[60px] w-auto object-contain"
          />
        </Link>

        <div className="flex items-center justify-end gap-2 sm:gap-4">
          {user && !loading ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden sm:block text-sm font-medium text-muted-foreground max-w-[150px] truncate">
                {profile?.name || user.user_metadata?.full_name || user.email}
              </span>

              <div className="hidden sm:block w-px h-4 bg-border" aria-hidden="true" />

              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewAnalysis}
                className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-primary"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                Nova Análise
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewAnalysis}
                className="sm:hidden h-9 w-9"
                aria-label="Nova Análise"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
              </Button>

              {profile?.is_premium && (
                <Link to="/dashboard">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex items-center gap-2 text-sm font-medium border-border hover:border-primary hover:text-primary"
                  >
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    Dashboard
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sair
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="sm:hidden h-9 w-9 text-muted-foreground"
                aria-label="Sair da conta"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <nav aria-label="Navegação principal">
              <Link to="/login">
                <Button
                  size="sm"
                  className="text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Entrar
                </Button>
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
