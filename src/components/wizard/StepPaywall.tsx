import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, LockKeyhole, Sparkles, Loader2 } from "lucide-react"
import { createCheckoutSession } from "@/lib/abacatepay"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useWizardStore } from "@/stores/wizardStore"

export function StepPaywall() {
  const [loading, setLoading] = useState(false)
  const [cpf, setCpf] = useState("")
  const [phone, setPhone] = useState("")
  const [showOverlay, setShowOverlay] = useState(false)
  const [showAuthForm, setShowAuthForm] = useState(false)
  const { user } = useAuth()
  const { setStep } = useWizardStore()
  const navigate = useNavigate()

  function handleUnlockClick() {
    if (!user) {
      alert("Você precisa estar logado para processar o pagamento. Redirecionando...");
      navigate('/login')
      return
    }
    setShowAuthForm(true)
  }

  async function handlePayment() {
    // Limpar texto antes de salvar
    const stored = sessionStorage.getItem('wizardBackup')
    const storedData = stored ? JSON.parse(stored) : {}
    const cleanedText = (storedData.resumeText || '')
      .replace(/pasted-image[^\s]*/gi, '')
      .replace(/data:image[^\s]*/gi, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    sessionStorage.setItem('wizardBackup', JSON.stringify({
      ...storedData,
      resumeText: cleanedText
    }));
    
    if (!user) {
      alert("Você precisa estar logado para processar o pagamento. Redirecionando...");
      navigate('/login')
      return
    }
    
    if (!cpf || cpf.length < 11) {
      alert("Por favor, informe um CPF válido para a emissão da nota fiscal.");
      return;
    }

    if (!phone || phone.length < 10) {
      alert("Por favor, informe um telefone de contato válido.");
      return;
    }

    setLoading(true)
    setShowOverlay(true)

    try {
      await supabase.from('profiles').update({ cpf, phone }).eq('id', user.id);
      
      const url = await createCheckoutSession(cpf, phone)
      console.log("Checkout URL gerada:", url);
      
      // Modo Sandbox: simula pagamento sem abrir popup externo
      if (url.includes('mock=true') || url.includes('localhost') || url.includes('payment=success') || url.includes('payment-sandbox')) {
        // Simula o processamento do pagamento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Atualiza status premium do usuário
        await supabase.from('profiles').update({ is_premium: true }).eq('id', user.id);
        
        // Vai para análise (passo 4)
        setStep(4)
        setLoading(false)
        setShowOverlay(false)
        return;
      }
      
      // Modo Produção: abre popup com URL real
      const width = 450;
      const height = 750;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        url,
        "AbacatePay",
        `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
      );

      if (!popup) {
        window.location.href = url;
        return;
      }
      
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setShowOverlay(false);
          setLoading(false);
        } else {
          try {
            if (popup.location.href.includes('success=true')) {
              clearInterval(timer);
              popup.close();
              // Vai para análise (passo 4)
              setStep(4)
            }
          } catch {
            // Erro de cross-origin
          }
        }
      }, 500);
      
    } catch (error: unknown) {
      setShowOverlay(false);
      console.error("Erro no fluxo de pagamento:", error)
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro: ${msg}`);
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center space-y-6">
      <div className="bg-primary/10 p-4 rounded-full mb-2">
        <Sparkles className="h-10 w-10 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-black">Libere seu Sucesso no Canadá</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Descubra todos os erros do seu currículo e faça com que a nossa IA gere as correções perfeitamente formatadas para você baixar.
        </p>
      </div>

      <div className="w-full max-w-sm bg-card border shadow-lg rounded-2xl p-6 text-left space-y-4 my-4">
        <div className="flex items-center justify-between border-b pb-4">
           <div>
             <h3 className="font-bold">Acesso Premium</h3>
             <p className="text-sm text-muted-foreground mt-1">Taxa única. Sem assinaturas.</p>
           </div>
           <div className="text-right">
             <div className="text-xs text-muted-foreground line-through">R$ 97,00</div>
             <div className="text-2xl font-black text-primary">R$ 59</div>
           </div>
        </div>

        {!showAuthForm ? (
          <>
            <ul className="space-y-3 py-2 text-sm">
              {["Relatório ATS completo (Destravado)", "Currículo Canadense Gerado (PDF/Doc)", "Perfil Otimizado para o LinkedIn", "5 Vagas Compatíveis Recomendadas"].map((item, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" className="w-full h-14 text-base font-bold shadow-xl" onClick={handleUnlockClick}>
              <LockKeyhole className="h-5 w-5 mr-2" />
              Desbloquear Versão Final
            </Button>
          </>
        ) : (
          <div className="space-y-4 pt-2 border-t animate-in fade-in zoom-in duration-300">
            <h4 className="text-sm font-bold text-foreground">Quase lá! Para emitir sua fatura:</h4>
            <div className="space-y-1.5">
              <label htmlFor="cpf" className="text-xs font-bold uppercase text-muted-foreground">CPF (para Nota Fiscal)</label>
              <Input 
                id="cpf"
                placeholder="000.000.000-00" 
                value={cpf}
                onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
                maxLength={11}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-xs font-bold uppercase text-muted-foreground">WhatsApp / Celular</label>
              <Input 
                id="phone"
                placeholder="(00) 00000-0000" 
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                maxLength={11}
                className="h-11"
              />
            </div>
            <Button size="lg" disabled={loading} className="w-full h-14 text-base font-bold shadow-xl" onClick={handlePayment}>
              {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <LockKeyhole className="h-5 w-5 mr-2" />}
              Ir para Pagamento
            </Button>
          </div>
        )}
      </div>

      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/40 transition-all duration-300">
          <div className="bg-background w-full max-w-sm rounded-3xl shadow-2xl relative overflow-hidden flex flex-col border border-white/10 p-8 text-center space-y-6">
            <div className="bg-primary/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <LockKeyhole className="h-10 w-10 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-bold text-2xl text-foreground">Acesso Seguro</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Você está sendo redirecionado para o ambiente de criptografia bancária da AbacatePay.
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-3 border-t border-border mt-4">
               <div className="flex items-center justify-center gap-2 text-xs font-bold text-primary animate-pulse uppercase tracking-wider py-4">
                 <Loader2 className="h-4 w-4 animate-spin" /> Conectando terminal...
               </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground w-full max-w-xs">
          Pagamento 100% seguro via AbacatePay com emissão de nota fiscal brasileira.
        </p>
        {import.meta.env.DEV && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-muted-foreground hover:text-primary"
            onClick={() => {
              setStep(4)
            }}
          >
            🔧 Modo Dev - Pular Pagamento
          </Button>
        )}
      </div>
    </div>
  )
}
