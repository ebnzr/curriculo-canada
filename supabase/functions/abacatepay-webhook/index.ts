import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

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

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, 2), 16)
  }
  return bytes.buffer
}

async function verifyHmacSignature(secret: string, body: string, signature: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    const expectedBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body))
    const expectedHex = Array.from(new Uint8Array(expectedBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    if (expectedHex.length !== signature.length) return false
    let diff = 0
    for (let i = 0; i < expectedHex.length; i++) {
      diff |= expectedHex.charCodeAt(i) ^ signature.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  const webhookSecret = Deno.env.get("ABACATEPAY_WEBHOOK_SECRET")
  if (!webhookSecret) {
    console.error("ABACATEPAY_WEBHOOK_SECRET is not configured")
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const signature = req.headers.get("x-abacatepay-signature") || ""
    const body = await req.text()

    const isValid = await verifyHmacSignature(webhookSecret, body, signature)
    if (!isValid) {
      console.error("Invalid webhook signature")
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const payload: WebhookPayload = JSON.parse(body)

    if (payload.event !== "payment.success") {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    const userId = payload.data.metadata?.userId

    if (!userId) {
      console.error("No userId in webhook metadata")
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log(`User ${userId} upgraded to premium successfully`)

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Webhook error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
