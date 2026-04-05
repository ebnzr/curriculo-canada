import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ABACATEPAY_API_KEY = Deno.env.get("ABACATEPAY_API_KEY") || "abc_dev_FuwPSrrbzr6jGgx3Yn6Ft3JX"

interface CheckoutRequest {
  returnUrl: string
  cpf: string
  phone: string
  userId: string
  userEmail: string
}

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    })
  }

  try {
    const body: CheckoutRequest = await req.json()
    const { returnUrl, cpf, phone, userId, userEmail } = body

    if (!returnUrl || !cpf || !phone || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      })
    }

    const isDev = ABACATEPAY_API_KEY.startsWith("abc_dev_")
    
    if (isDev) {
      console.log("Modo desenvolvimento - criando checkout simulado")
      const mockCheckoutUrl = `http://localhost:5173/payment-sandbox?mock=true&userId=${userId}`
      return new Response(JSON.stringify({ url: mockCheckoutUrl, mock: true, sandbox: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      })
    }

    const payload = {
      customer: {
        name: userEmail.split("@")[0],
        email: userEmail,
        document: cpf,
        phone: phone
      },
      payment: {
        value: 4990,
        currency: "BRL",
        description: "CurrículoCanada - Premium Package"
      },
      redirectUrls: {
        success: `${returnUrl}?payment=success`,
        failure: `${returnUrl}?payment=failure`
      },
      metadata: {
        userId: userId
      }
    }

    const response = await fetch("https://api.abacatepay.com/v1/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": ABACATEPAY_API_KEY
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("AbacatePay API Error:", errorData)
      return new Response(JSON.stringify({ error: "Failed to create checkout", details: errorData }), {
        status: response.status,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      })
    }

    const data = await response.json()
    
    return new Response(JSON.stringify({ url: data.url || data.checkoutUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    })

  } catch (error) {
    console.error("Error creating checkout:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    })
  }
})
