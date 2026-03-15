// Supabase Edge Function to send team invites via Email, SMS, or WhatsApp
// Uses Resend for email and Clickatell for SMS/WhatsApp

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const CLICKATELL_API_KEY = Deno.env.get("CLICKATELL_API_KEY")

interface InviteRequest {
  inviteId: string
  method: "email" | "sms" | "whatsapp"
}

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Parse request body
    const { inviteId, method } = (await req.json()) as InviteRequest

    if (!inviteId || !method) {
      return new Response(JSON.stringify({ error: "Missing inviteId or method" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get invite details from database
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
      return new Response(JSON.stringify({ error: "Invite not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get inviter details
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", invite.invited_by)
      .single()

    const inviterName = inviterProfile?.display_name || "A team member"
    const orgName = invite.organizations.name
    const inviteCode = invite.invite_code

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

      const messageResult = await sendMessage(invite.email, inviterName, orgName, inviteCode, method)

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
    console.error("Error in send-invite function:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
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
      return { success: false, error: `Failed to send email: ${errorData.message || "Unknown error"}` }
    }

    return { success: true }
  } catch (error) {
    console.error("Error sending email:", error)
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
      return { success: false, error: `Failed to send ${method}: ${errorData.error || "Unknown error"}` }
    }

    return { success: true }
  } catch (error) {
    console.error(`Error sending ${method}:`, error)
    return { success: false, error: error.message }
  }
}
