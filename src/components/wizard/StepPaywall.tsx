import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, LockKeyhole, Sparkles, Loader2, AlertCircle } from "lucide-react"
import { createCheckoutSession } from "@/lib/abacatepay"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useWizardStore } from "@/stores/wizardStore"

function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(cpf[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  return rest === parseInt(cpf[10])
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "")
  return digits
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (!digits) return ""
  
  if (digits.length <= 2) return `+${digits}`
  if (digits.length <= 4) return `+${digits.slice(0, 2)} (${digits.slice(2)}`
  if (digits.length <= 9) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`
  return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
}

export function StepPaywall() {
  const [loading, setLoading] = useState(false)
  const [cpf, setCpf] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [cpfError, setCpfError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [cityError, setCityError] = useState("")
  const [paymentError, setPaymentError] = useState("")
  const [showOverlay, setShowOverlay] = useState(false)
  const [showAuthForm, setShowAuthForm] = useState(false)
  const { user } = useAuth()
  const { setStep, setContext, noc, province } = useWizardStore()
  const navigate = useNavigate()

  function handleUnlockClick() {
    if (!user) {
      navigate('/login')
      return
    }
    setShowAuthForm(true)
  }

  async function handlePayment() {
    setCpfError("")
    setPhoneError("")
    setCityError("")
    setPaymentError("")

    if (!user) {
      navigate('/login')
      return
    }

    const cleanCpf = cpf.replace(/\D/g, "")
    if (!isValidCpf(cleanCpf)) {
      setCpfError("Por favor, informe um CPF válido para a emissão da nota fiscal.")
      return
    }

    const cleanPhone = phone.replace(/\D/g, "")
    if (cleanPhone.length < 10) {
      setPhoneError("Por favor, informe um telefone de contato válido (mínimo 10 dígitos).")
      return
    }

    const cleanCity = city.trim()
    if (!cleanCity || cleanCity.length < 2) {
      setCityError("Por favor, informe a cidade onde você atualmente reside.")
      return
    }

    setLoading(true)
    setShowOverlay(true)

    try {
      await supabase.from('profiles').update({ cpf: cleanCpf, phone: cleanPhone, current_city: cleanCity }).eq('id', user.id)
      
      setContext(noc, province, cleanCity)

      const url = await createCheckoutSession(cleanCpf, cleanPhone)

      if (url.includes('mock=true') || url.includes('localhost') || url.includes('payment=success') || url.includes('payment-sandbox')) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        await supabase.from('profiles').update({ is_premium: true }).eq('id', user.id)
        setStep(4)
        setLoading(false)
        setShowOverlay(false)
        return
      }

      const width = 450
      const height = 750
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      const popup = window.open(
        url,
        "AbacatePay",
        `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
      )

      if (!popup) {
        window.location.href = url
        return
      }

      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer)
          setShowOverlay(false)
          setLoading(false)
        } else {
          try {
            if (popup.location.href.includes('success=true')) {
              clearInterval(timer)
              popup.close()
              setStep(4)
            }
          } catch {
            // Erro de cross-origin esperado
          }
        }
      }, 500)

    } catch (error: unknown) {
      setShowOverlay(false)
      const msg = error instanceof Error ? error.message : "Erro desconhecido"
      setPaymentError(`Erro ao processar pagamento: ${msg}`)
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center space-y-6">
      <div className="bg-primary/10 p-4 rounded-full mb-2">
        <Sparkles className="h-10 w-10 text-primary" aria-hidden="true" />
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
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" className="w-full h-14 text-base font-bold shadow-xl" onClick={handleUnlockClick}>
              <LockKeyhole className="h-5 w-5 mr-2" aria-hidden="true" />
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
                value={formatCpf(cpf)}
                onChange={(e) => { setCpf(e.target.value.replace(/\D/g, "")); setCpfError("") }}
                maxLength={14}
                className="h-11"
                aria-describedby={cpfError ? "cpf-error" : undefined}
                aria-invalid={!!cpfError}
              />
              {cpfError && (
                <p id="cpf-error" className="text-destructive text-xs flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" /> {cpfError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-xs font-bold uppercase text-muted-foreground">WhatsApp / Celular</label>
              <Input
                id="phone"
                placeholder="+55 (11) 98765-4321"
                value={formatPhone(phone)}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setPhoneError("") }}
                maxLength={20}
                className="h-11"
                aria-describedby={phoneError ? "phone-error" : undefined}
                aria-invalid={!!phoneError}
              />
              {phoneError && (
                <p id="phone-error" className="text-destructive text-xs flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" /> {phoneError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="city" className="text-xs font-bold uppercase text-muted-foreground">Cidade Atual (Residência)</label>
              <Input
                id="city"
                placeholder="Ex: São Paulo, Toronto, Miami"
                value={city}
                onChange={(e) => { setCity(e.target.value); setCityError("") }}
                className="h-11"
                aria-describedby={cityError ? "city-error" : undefined}
                aria-invalid={!!cityError}
              />
              <p className="text-muted-foreground text-xs">Cidade e estado/país onde você atualmente reside. Será utilizada no currículo canadense.</p>
              {cityError && (
                <p id="city-error" className="text-destructive text-xs flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" /> {cityError}
                </p>
              )}
            </div>

            {paymentError && (
              <p className="text-destructive text-sm flex items-center gap-1 p-3 bg-destructive/10 rounded-lg" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {paymentError}
              </p>
            )}

            <Button size="lg" disabled={loading} className="w-full h-14 text-base font-bold shadow-xl" onClick={handlePayment}>
              {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" /> : <LockKeyhole className="h-5 w-5 mr-2" aria-hidden="true" />}
              Ir para Pagamento
            </Button>
          </div>
        )}
      </div>

      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/40 transition-all duration-300" role="status" aria-live="polite">
          <div className="bg-background w-full max-w-sm rounded-3xl shadow-2xl relative overflow-hidden flex flex-col border border-white/10 p-8 text-center space-y-6">
            <div className="bg-primary/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <LockKeyhole className="h-10 w-10 text-primary" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-2xl text-foreground">Acesso Seguro</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Você está sendo redirecionado para o ambiente de criptografia bancária da AbacatePay.
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-3 border-t border-border mt-4">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-primary animate-pulse uppercase tracking-wider py-4">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Conectando terminal...
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
            onClick={() => { setStep(4) }}
          >
            Modo Dev - Pular Pagamento
          </Button>
        )}
      </div>
    </div>
  )
}
