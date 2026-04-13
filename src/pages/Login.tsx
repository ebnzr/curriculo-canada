import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";
import { Sparkles, Shield, Zap, FileCheck, ArrowRight, Linkedin, Target, Scan } from "lucide-react";

export function Login() {
  const { user, loading, loginWithGoogle } = useAuth();

  if (user) {
    return <Navigate to="/analyze" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
      {/* Left Side - Value Proposition */}
      <div className="flex-1 bg-gradient-to-br from-primary/5 via-primary/10 to-muted/50 flex items-center justify-center p-8 lg:p-16">
        <div className="max-w-md space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary tracking-wide">
                Acesso Gratuito
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-heading font-bold tracking-tight text-foreground leading-tight">
              Prepare seu currículo para o{" "}
              <span className="text-primary">mercado canadense</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Análise ATS gratuita + currículo otimizado por IA para aumentar suas chances de contratação no Canadá.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Scan className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Análise ATS Gratuita</h3>
                <p className="text-sm text-muted-foreground">
                  Análise gratuita do seu currículo com base no ATS. Descubra se seu currículo passa nos sistemas de rastreamento de candidatos usados pelas empresas canadenses.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Otimização com IA</h3>
                <p className="text-sm text-muted-foreground">
                  Receba um currículo reescrito no padrão canadense em segundos, pronto para ser usado em suas candidaturas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Linkedin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Perfil Completo para LinkedIn</h3>
                <p className="text-sm text-muted-foreground">
                  Geração de perfil otimizado para o LinkedIn, aumentando sua visibilidade para recrutadores no Canadá.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Raio-X de Carreira</h3>
                <p className="text-sm text-muted-foreground">
                  Análise completa com dicas e orientações personalizadas para você dar um salto na carreira em direção aos seus objetivos no Canadá.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Dados Seguros</h3>
                <p className="text-sm text-muted-foreground">
                  Seus dados são protegidos e nunca compartilhados com terceiros
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">1.000+</span> currículos analisados • {" "}
              <span className="font-semibold text-foreground">98%</span> de satisfação
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-start justify-center p-8 lg:p-16 bg-background lg:pt-24">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Bem-vindo de volta
            </h2>
            <p className="text-muted-foreground text-sm">
              Entre com sua conta Google para continuar
            </p>
          </div>

          <Button
            onClick={loginWithGoogle}
            disabled={loading}
            className="w-full h-12 text-base font-medium gap-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm transition-all duration-200"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {loading ? "Entrando..." : "Continuar com Google"}
            {!loading && <ArrowRight className="h-4 w-4 ml-auto" />}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ao continuar, você concorda com nossos termos
              </span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Usamos cookies para melhorar sua experiência.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <a href="#" className="text-primary hover:underline">Termos de Uso</a>
              <span className="text-border">•</span>
              <a href="#" className="text-primary hover:underline">Privacidade</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
