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

    console.log("[send-invite] Sending invite via", method, "to", invite.email)

    // Send via chosen method
    if (method === "email") {
      if (!RESEND_API_KEY) {
        return new Response(JSON.stringify({ error: "Email service not configured" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }

      const emailResult = await sendEmail(invite.email, inviterName, orgName)

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

      const messageResult = await sendMessage(invite.phone, inviterName, orgName, method)

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
          <body style="margin: 0; padding: 0; background-color: #F5F3F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F3F0; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%;">

                    <!-- Logo -->
                    <tr>
                      <td align="center" style="padding-bottom: 32px;">
                        <img src="https://geczhyukynirvpdjnbel.supabase.co/storage/v1/object/public/assets/herd-logo.png" alt="HerdTrackr" width="72" height="72" style="display: block; border-radius: 16px;">
                      </td>
                    </tr>

                    <!-- Main card -->
                    <tr>
                      <td style="background-color: #FFFFFF; border-radius: 16px; padding: 40px 36px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

                        <p style="margin: 0 0 6px; font-size: 22px; font-weight: 700; color: #1E1A16; text-align: center;">
                          You're Invited! 🎉
                        </p>
                        <p style="margin: 0 0 32px; font-size: 15px; color: #8C857C; text-align: center;">
                          Join ${orgName} on HerdTrackr
                        </p>

                        <!-- Info box -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background-color: #F5F3F0; border-radius: 10px; padding: 20px;">
                              <p style="margin: 0; font-size: 13px; color: #8C857C; text-align: center; line-height: 1.6;">
                                <strong style="color: #1E1A16;">${inviterName}</strong> has invited you to collaborate on <strong style="color: #1E1A16;">${orgName}</strong>'s livestock management.
                              </p>
                            </td>
                          </tr>
                        </table>

                        <!-- Get the app button -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0 8px;">
                          <tr>
                            <td align="center">
                              <a href="https://apps.apple.com/za/app/herdtrackr/id6760476630" style="display: inline-block; background-color: #4A8C3F; color: #FFFFFF; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 12px;">
                                Get HerdTrackr for iPhone
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 16px 0 8px; font-size: 13px; color: #B5AFA6; text-align: center;">
                          This invitation expires in <strong style="color: #8C857C;">7 days</strong>
                        </p>

                        <!-- Divider -->
                        <hr style="border: none; border-top: 1px solid #F0EDE8; margin: 24px 0 20px;">

                        <p style="margin: 0 0 16px; font-size: 14px; color: #1E1A16; font-weight: 600; text-align: center;">
                          How to join:
                        </p>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 6px 0;">
                              <p style="margin: 0; font-size: 13px; color: #8C857C; line-height: 1.6;">
                                <strong style="color: #4A8C3F;">1.</strong> Download HerdTrackr from the App Store (Android coming soon)
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0;">
                              <p style="margin: 0; font-size: 13px; color: #8C857C; line-height: 1.6;">
                                <strong style="color: #4A8C3F;">2.</strong> Sign in with this email: <strong style="color: #1E1A16;">${email}</strong>
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0;">
                              <p style="margin: 0; font-size: 13px; color: #8C857C; line-height: 1.6;">
                                <strong style="color: #4A8C3F;">3.</strong> Tap <strong style="color: #1E1A16;">Accept</strong> on the ${orgName} invite that appears on your home screen
                              </p>
                            </td>
                          </tr>
                        </table>

                        <hr style="border: none; border-top: 1px solid #F0EDE8; margin: 20px 0;">

                        <p style="margin: 0; font-size: 13px; color: #B5AFA6; text-align: center; line-height: 1.6;">
                          If you don't know this person or don't want to join, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 32px 20px 0; text-align: center;">
                        <p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #4A8C3F;">
                          HerdTrackr
                        </p>
                        <p style="margin: 0 0 12px; font-size: 12px; color: #B5AFA6;">
                          Smart livestock management for Southern Africa
                        </p>
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                          <tr>
                            <td style="font-size: 12px; color: #8C857C; padding: 0 8px;">
                              &#9993; support@herdtrackr.co.za
                            </td>
                            <td style="font-size: 12px; color: #DDD8D0; padding: 0;">|</td>
                            <td style="font-size: 12px; color: #8C857C; padding: 0 8px;">
                              &#9742; +27 60 878 3715
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 12px 0 0; font-size: 11px; color: #DDD8D0;">
                          © 2026 HerdTrackr (Pty) Ltd · South Africa
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
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
  method: "sms" | "whatsapp",
): Promise<{ success: boolean; error?: string }> {
  try {
    // Clickatell API endpoint
    const endpoint = method === "whatsapp"
      ? "https://platform.clickatell.com/v1/message"
      : "https://platform.clickatell.com/messages"

    const message = `Hi! ${inviterName} invited you to join ${orgName} on HerdTrackr.

Get the app (iPhone): https://apps.apple.com/za/app/herdtrackr/id6760476630

Sign in with this number/email, then tap Accept on the invite that appears on your home screen. Valid for 7 days.`

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
