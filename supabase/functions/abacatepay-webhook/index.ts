import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const WEBHOOK_SECRET = Deno.env.get("ABACATEPAY_WEBHOOK_SECRET")!

interface WebhookPayload {
  event: string
  data: {
    id: string
    status: string
    customer: {
      email: string
      document: string
    }
    metadata: {
      userId: string
    }
  }
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const signature = req.headers.get("x-abacatepay-signature")
    const body = await req.text()

    if (WEBHOOK_SECRET && signature !== WEBHOOK_SECRET) {
      console.error("Invalid webhook signature")
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    const payload: WebhookPayload = JSON.parse(body)

    if (payload.event !== "payment.success") {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    }

    const userId = payload.data.metadata?.userId

    if (!userId) {
      console.error("No userId in webhook metadata")
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { error } = await supabase
      .from("profiles")
      .update({ is_premium: true })
      .eq("id", userId)

    if (error) {
      console.error("Error updating user premium status:", error)
      return new Response(JSON.stringify({ error: "Failed to update user" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }

    console.log(`User ${userId} upgraded to premium successfully`)

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("Webhook error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
