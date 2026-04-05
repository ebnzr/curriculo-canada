import { supabase } from './supabase';

/**
 * Creates an AbacatePay Checkout link by invoking our secure Supabase Edge Function
 */
export async function createCheckoutSession(cpf: string, phone: string, returnUrl?: string) {
  console.log("Iniciando criação de sessão de checkout...");
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) throw new Error("Usuário não autenticado no Supabase.");

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`;

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ 
        returnUrl: returnUrl || window.location.href,
        cpf,
        phone,
        userId: session.user.id,
        userEmail: session.user.email
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Erro detalhado da Function:", result);
      throw new Error(result.message || "Erro na criação do checkout");
    }

    if (!result.url) {
      throw new Error("URL de checkout não encontrada na resposta.");
    }

    return result.url;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error("Falha na chamada de pagamento:", error);
    throw error;
  }
}
