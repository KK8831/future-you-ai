import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing transcript text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a health data extraction AI. Extract health parameters from spoken text.
Extract any of these parameters if mentioned:
- physical_activity_minutes (exercise/walking/running minutes)
- sleep_hours (hours slept)
- diet_quality_score (1-10 scale, infer from food descriptions)
- stress_level (1-10 scale, infer from descriptions)
- screen_time_hours (hours on screens)
- steps (step count)
- heart_rate (BPM)
- blood_pressure_systolic / blood_pressure_diastolic
- blood_glucose (mg/dL)
- weight_kg
- symptoms (array of symptom strings)
- notes (any additional context)

Be smart about inference: "I had a salad and grilled chicken" → diet_quality_score: 7-8
"I was very stressed today" → stress_level: 7-8
"I walked 6000 steps" → steps: 6000, physical_activity_minutes: ~60`,
          },
          { role: "user", content: transcript },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_health_data",
              description: "Extract structured health parameters from voice transcript",
              parameters: {
                type: "object",
                properties: {
                  physical_activity_minutes: { type: "number" },
                  sleep_hours: { type: "number" },
                  diet_quality_score: { type: "number" },
                  stress_level: { type: "number" },
                  screen_time_hours: { type: "number" },
                  steps: { type: "number" },
                  heart_rate: { type: "number" },
                  blood_pressure_systolic: { type: "number" },
                  blood_pressure_diastolic: { type: "number" },
                  blood_glucose: { type: "number" },
                  weight_kg: { type: "number" },
                  symptoms: { type: "array", items: { type: "string" } },
                  notes: { type: "string" },
                  confidence: { type: "number" },
                },
                required: ["confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_health_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      throw new Error(`AI Gateway error [${response.status}]: ${text}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let extracted = {};
    if (toolCall?.function?.arguments) {
      extracted = JSON.parse(toolCall.function.arguments);
    }

    return new Response(
      JSON.stringify({ extracted, transcript }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Voice processing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
