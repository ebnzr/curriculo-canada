import { useState, useCallback } from "react"
import { createCheckoutSession } from "@/lib/abacatepay"

interface UsePaymentOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function usePayment(options: UsePaymentOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initiateCheckout = useCallback(async (
    cpf: string,
    phone: string,
    returnUrl?: string
  ) => {
    setError(null)
    setLoading(true)
    
    try {
      const checkoutUrl = await createCheckoutSession(cpf, phone, returnUrl)
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl
        options.onSuccess?.()
      }
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e))
      setError(error.message)
      options.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [options])

return {
    loading,
    error,
    initiateCheckout,
    clearError: () => setError(null)
  };
}
