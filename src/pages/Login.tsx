import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { Navigate } from "react-router-dom";

export function Login() {
  const { user, loginWithGoogle } = useAuth();

  if (user) {
    return <Navigate to="/analyze" replace />;
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-6 mt-12">
      <div className="w-full max-w-sm border rounded-xl p-8 bg-card shadow flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6">Acesse sua Conta</h2>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          Faça login via Google para continuar a analisar e otimizar seu currículo para o padrão canadense.
        </p>
        <Button onClick={loginWithGoogle} className="w-full h-12 flex gap-2">
          <LogIn className="w-5 h-5" /> Entrar com Google
        </Button>
      </div>
    </div>
  );
}
