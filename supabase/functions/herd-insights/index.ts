import { createClient } from "@supabase/supabase-js"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const MODEL = "gemini-3.1-flash-lite"
const DAILY_LIMIT = 3
const CACHE_HOURS = 24
const MAX_SNAPSHOT_BYTES = 75_000

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405)

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Authentication required" }, 401)
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Service configuration is incomplete" }, 503)
    }
    if (!geminiApiKey) {
      return jsonResponse({ error: "Herd Insights is not enabled yet" }, 503)
    }

    const token = authHeader.slice("Bearer ".length)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: authData, error: authError } = await supabase.auth.getUser(token)
    const user = authData.user
    if (authError || !user) return jsonResponse({ error: "Invalid session" }, 401)

    const body = (await req.json()) as { organizationId?: string; snapshot?: unknown }
    if (!body.organizationId || !body.snapshot) {
      return jsonResponse({ error: "organizationId and snapshot are required" }, 400)
    }

    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("organization_id", body.organizationId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .maybeSingle()
    if (!membership) return jsonResponse({ error: "Farm access denied" }, 403)

    const snapshotJson = JSON.stringify(body.snapshot)
    if (new TextEncoder().encode(snapshotJson).byteLength > MAX_SNAPSHOT_BYTES) {
      return jsonResponse({ error: "Farm summary is too large" }, 413)
    }

    const inputHash = await sha256(snapshotJson)
    const cacheCutoff = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString()
    const { data: cached } = await supabase
      .from("herd_insight_runs")
      .select("response, created_at")
      .eq("organization_id", body.organizationId)
      .eq("input_hash", inputHash)
      .gte("created_at", cacheCutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const dayStart = new Date()
    dayStart.setUTCHours(0, 0, 0, 0)
    const { count: runsToday } = await supabase
      .from("herd_insight_runs")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", body.organizationId)
      .gte("created_at", dayStart.toISOString())

    if (cached?.response) {
      return jsonResponse({
        ...cached.response,
        cached: true,
        remainingToday: Math.max(0, DAILY_LIMIT - (runsToday ?? 0)),
      })
    }
    if ((runsToday ?? 0) >= DAILY_LIMIT) {
      return jsonResponse({ error: "Daily analysis limit reached. Try again tomorrow." }, 429)
    }

    const prompt = `You are HerdTrackr's cautious livestock operations assistant.
Analyse only the supplied farm metrics. Do not diagnose disease or invent missing facts.
Prioritize urgent animal welfare, overdue husbandry work, pasture overstocking, grazing rotation,
weight-loss signals, breeding follow-ups, vaccinations, water, minerals and ticks.
Keep the summary under 55 words. Return 2 to 5 distinct insights, most urgent first.
Every action must be specific, brief and achievable. If records are sparse, say what should be recorded.
Use South African farming terminology and metric units. This is operational guidance, not veterinary advice.

FARM METRICS:
${snapshotJson}`

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // New Gemini authorization keys must be sent as a request header.
          // Keeping the secret out of the URL also prevents it appearing in
          // proxy and request logs.
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 700,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              required: ["summary", "insights"],
              properties: {
                summary: { type: "STRING" },
                insights: {
                  type: "ARRAY",
                  minItems: 2,
                  maxItems: 5,
                  items: {
                    type: "OBJECT",
                    required: ["priority", "title", "reason", "action"],
                    properties: {
                      priority: { type: "STRING", enum: ["high", "medium", "low"] },
                      title: { type: "STRING" },
                      reason: { type: "STRING" },
                      action: { type: "STRING" },
                    },
                  },
                },
              },
            },
          },
        }),
      },
    )

    if (!geminiResponse.ok) {
      const detail = await geminiResponse.text()
      console.error("[herd-insights] Gemini error", geminiResponse.status, detail)
      return jsonResponse({ error: "The analysis service is temporarily unavailable" }, 502)
    }

    const gemini = await geminiResponse.json()
    const responseText = gemini?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!responseText) return jsonResponse({ error: "The model returned no analysis" }, 502)

    const parsed = JSON.parse(responseText) as { summary: string; insights: unknown[] }
    const response = {
      summary: parsed.summary,
      insights: parsed.insights,
      generatedAt: new Date().toISOString(),
    }
    const usage = gemini?.usageMetadata ?? {}

    const { error: insertError } = await supabase.from("herd_insight_runs").insert({
      organization_id: body.organizationId,
      user_id: user.id,
      input_hash: inputHash,
      response,
      model: MODEL,
      input_tokens: usage.promptTokenCount ?? null,
      output_tokens: usage.candidatesTokenCount ?? null,
    })
    if (insertError) console.error("[herd-insights] Cache insert failed", insertError)

    return jsonResponse({
      ...response,
      cached: false,
      remainingToday: Math.max(0, DAILY_LIMIT - (runsToday ?? 0) - 1),
    })
  } catch (error) {
    console.error("[herd-insights] Unexpected error", error)
    return jsonResponse({ error: "Could not generate herd insights" }, 500)
  }
})
