import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://canadapath.ai"

interface CheckoutRequest {
  returnUrl: string
  cpf: string
  phone: string
  userId: string
  userEmail: string
}

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey",
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  const apiKey = Deno.env.get("ABACATEPAY_API_KEY")
  if (!apiKey) {
    console.error("ABACATEPAY_API_KEY is not configured")
    return new Response(JSON.stringify({ error: "Payment service not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  try {
    const body: CheckoutRequest = await req.json()
    const { returnUrl, cpf, phone, userId, userEmail } = body

    if (!returnUrl || !cpf || !phone || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }

    const isDev = apiKey.startsWith("abc_dev_")

    if (isDev) {
      console.log("Development mode — returning mock checkout URL")
      const mockCheckoutUrl = `${returnUrl.split("/").slice(0, 3).join("/")}/payment-sandbox?mock=true&userId=${userId}`
      return new Response(JSON.stringify({ url: mockCheckoutUrl, mock: true, sandbox: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }

    const payload = {
      customer: {
        name: userEmail.split("@")[0],
        email: userEmail,
        document: cpf,
        phone: phone,
      },
      payment: {
        value: 5900,
        currency: "BRL",
        description: "CurrículoCanada - Premium Package",
      },
      redirectUrls: {
        success: `${returnUrl}?payment=success`,
        failure: `${returnUrl}?payment=failure`,
      },
      metadata: {
        userId: userId,
      },
    }

    const response = await fetch("https://api.abacatepay.com/v1/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("AbacatePay API Error:", errorData)
      return new Response(JSON.stringify({ error: "Failed to create checkout" }), {
        status: response.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }

    const data = await response.json()

    return new Response(JSON.stringify({ url: data.url || data.checkoutUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  } catch (error) {
    console.error("Error creating checkout:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }
})
