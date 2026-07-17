// Supabase Edge Function to send team invites via Email, SMS, or WhatsApp
// Uses Resend for email and Clickatell for SMS/WhatsApp

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "@supabase/supabase-js"
import * as Sentry from "@sentry/deno"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const CLICKATELL_API_KEY = Deno.env.get("CLICKATELL_API_KEY")
const SENTRY_DSN = Deno.env.get("SENTRY_DSN")

// Initialize Sentry
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.2,
    environment: Deno.env.get("SUPABASE_ENV") || "production",
  })
  console.log("[Sentry] Initialized for Edge Function")
} else {
  console.warn("[Sentry] DSN not configured, skipping initialization")
}

interface InviteRequest {
  inviteId: string
  method: "email" | "sms" | "whatsapp"
}

serve(async (req) => {
  console.log("[send-invite] Function invoked, method:", req.method)

  // CORS headers
  if (req.method === "OPTIONS") {
    console.log("[send-invite] Handling OPTIONS request")
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  try {
    console.log("[send-invite] Processing POST request")

    // Get the authorization header (validated by Supabase gateway already)
    const authHeader = req.headers.get("Authorization")
    console.log("[send-invite] Auth header present:", !!authHeader)

    if (!authHeader) {
      console.error("[send-invite] Missing authorization header")
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      })
    }

    console.log("[send-invite] Request authenticated, processing invite")

    // Create Supabase client with service role to bypass RLS
    // (this function needs to read invites/orgs/memberships regardless of RLS)
    // Auth is already validated by Supabase's gateway
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Parse request body
    const { inviteId, method } = (await req.json()) as InviteRequest

    if (!inviteId || !method) {
      console.error("[send-invite] Missing inviteId or method")
      return new Response(JSON.stringify({ error: "Missing inviteId or method" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      })
    }

    // Get invite details from database
    console.log("[send-invite] Fetching invite:", inviteId)
    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .select(`
        *,
        organizations (
          name
        )
      `)
      .eq("id", inviteId)
      .single()

    if (inviteError || !invite) {
      console.error("[send-invite] Failed to fetch invite:", inviteError)
      return new Response(JSON.stringify({
        error: "Invite not found",
        details: inviteError?.message,
        inviteId
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("[send-invite] Invite found:", { id: invite.id, orgId: invite.organization_id })

    // Get inviter name from the membership record (which includes display_name)
    console.log("[send-invite] Fetching inviter membership for:", invite.invited_by)
    const { data: membership, error: memberError } = await supabase
      .from("memberships")
      .select("user_display_name, user_email")
      .eq("organization_id", invite.organization_id)
      .eq("user_id", invite.invited_by)
      .single()

    if (memberError) {
      console.warn("[send-invite] Could not fetch inviter membership:", memberError)
    }

    const inviterName = membership?.user_display_name ||
                       membership?.user_email?.split('@')[0] ||
                       "A team member"
    const orgName = invite.organizations.name
    const inviteCode = invite.invite_code

    console.log("[send-invite] Sending invite via", method, "to", invite.email)

    // Send via chosen method
    if (method === "email") {
      if (!RESEND_API_KEY) {
        return new Response(JSON.stringify({ error: "Email service not configured" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }

      const emailResult = await sendEmail(invite.email, inviterName, orgName, inviteCode)

      if (!emailResult.success) {
        return new Response(JSON.stringify({ error: emailResult.error }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }

      return new Response(JSON.stringify({ success: true, method: "email" }), {
        headers: { "Content-Type": "application/json" },
      })
    } else if (method === "sms" || method === "whatsapp") {
      if (!CLICKATELL_API_KEY) {
        return new Response(JSON.stringify({ error: "SMS/WhatsApp service not configured" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }

      // SMS/WhatsApp invites store the recipient in `phone`, not `email`
      // (the client sets email = null for those methods), so send to the phone.
      if (!invite.phone) {
        return new Response(JSON.stringify({ error: "No phone number on this invite" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }

      const messageResult = await sendMessage(invite.phone, inviterName, orgName, inviteCode, method)

      if (!messageResult.success) {
        return new Response(JSON.stringify({ error: messageResult.error }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }

      return new Response(JSON.stringify({ success: true, method }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ error: "Invalid method" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[send-invite] Error in send-invite function:", error)

    // Capture error in Sentry
    if (SENTRY_DSN) {
      Sentry.captureException(error, {
        contexts: {
          function: {
            name: "send-invite",
            invoked_at: new Date().toISOString(),
          },
        },
      })
    }

    return new Response(JSON.stringify({
      error: error.message,
      details: error.toString(),
      stack: error.stack
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    })
  }
})

async function sendEmail(
  email: string,
  inviterName: string,
  orgName: string,
  inviteCode: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "HerdTrackr <invites@herdtrackr.co.za>",
        to: email,
        subject: `You've been invited to join ${orgName} on HerdTrackr`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">HerdTrackr</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Farm Management Made Simple</p>
              </div>

              <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">You've Been Invited!</h2>

                <p style="font-size: 16px; color: #4b5563;">
                  <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on HerdTrackr.
                </p>

                <p style="font-size: 16px; color: #4b5563;">
                  HerdTrackr helps you manage your livestock, track health records, monitor weights, and much more.
                </p>

                <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your Invite Code</p>
                  <p style="margin: 0; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                    ${inviteCode}
                  </p>
                </div>

                <div style="background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #4338ca;">
                    <strong>How to join:</strong>
                  </p>
                  <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #4338ca;">
                    <li>Download HerdTrackr from the App Store or Google Play</li>
                    <li>Sign up with this email address: <strong>${email}</strong></li>
                    <li>Enter the invite code above when prompted</li>
                  </ol>
                </div>

                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  This invitation expires in 7 days.
                </p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                  HerdTrackr - Professional Livestock Management<br>
                  This email was sent to ${email}
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Resend error:", errorData)

      // Capture Resend API error in Sentry
      if (SENTRY_DSN) {
        Sentry.captureMessage(`Resend API error: ${errorData.message || "Unknown error"}`, {
          level: "error",
          contexts: {
            resend: {
              email,
              orgName,
              statusCode: response.status,
              errorData,
            },
          },
        })
      }

      return { success: false, error: `Failed to send email: ${errorData.message || "Unknown error"}` }
    }

    return { success: true }
  } catch (error) {
    console.error("Error sending email:", error)

    // Capture exception in Sentry
    if (SENTRY_DSN) {
      Sentry.captureException(error, {
        contexts: {
          email_send: {
            email,
            orgName,
          },
        },
      })
    }

    return { success: false, error: error.message }
  }
}

async function sendMessage(
  phoneOrEmail: string,
  inviterName: string,
  orgName: string,
  inviteCode: string,
  method: "sms" | "whatsapp",
): Promise<{ success: boolean; error?: string }> {
  try {
    // Clickatell API endpoint
    const endpoint = method === "whatsapp"
      ? "https://platform.clickatell.com/v1/message"
      : "https://platform.clickatell.com/messages"

    const message = `Hi! ${inviterName} invited you to join ${orgName} on HerdTrackr.

Your invite code: ${inviteCode}

Download the app and enter this code to join the team. Valid for 7 days.`

    const body = method === "whatsapp"
      ? {
          messages: [{
            channel: "whatsapp",
            to: phoneOrEmail,
            content: message,
          }],
        }
      : {
          text: message,
          to: [phoneOrEmail],
        }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: CLICKATELL_API_KEY!,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Clickatell error:", errorData)

      // Capture Clickatell API error in Sentry
      if (SENTRY_DSN) {
        Sentry.captureMessage(`Clickatell API error: ${errorData.error || "Unknown error"}`, {
          level: "error",
          contexts: {
            clickatell: {
              method,
              phoneOrEmail,
              orgName,
              statusCode: response.status,
              errorData,
            },
          },
        })
      }

      return { success: false, error: `Failed to send ${method}: ${errorData.error || "Unknown error"}` }
    }

    return { success: true }
  } catch (error) {
    console.error(`Error sending ${method}:`, error)

    // Capture exception in Sentry
    if (SENTRY_DSN) {
      Sentry.captureException(error, {
        contexts: {
          message_send: {
            method,
            phoneOrEmail,
            orgName,
          },
        },
      })
    }

    return { success: false, error: error.message }
  }
}
