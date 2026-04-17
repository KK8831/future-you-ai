import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
  if (!GOOGLE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GOOGLE_AI_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { framinghamScore, findriscScore, framinghamCategory, findriscCategory, profile, metrics } = await req.json();

    const prompt = `You are a medical health interpreter for a digital twin health platform. You have been given validated epidemiological risk scores calculated using the Framingham CVD Risk Score and FINDRISC Diabetes Risk Score formulas.

Your role is NOT to calculate risks — that's already done by the medical logic layer. Your role is to INTERPRET and EXPLAIN these scores in plain language.

Patient Profile:
- Age: ${profile?.age || "unknown"}
- Sex: ${profile?.sex || "unspecified"}
- BMI: ${profile?.bmi || "unknown"}

Lifestyle Averages (14-day):
- Physical Activity: ${metrics?.avgActivityMinutes || 0} min/day
- Sleep: ${metrics?.avgSleepHours || 0} hrs/night
- Diet Quality: ${metrics?.avgDietScore || 0}/10
- Stress Level: ${metrics?.avgStressLevel || 0}/10
- Screen Time: ${metrics?.avgScreenTimeHours || 0} hrs/day

Validated Risk Scores:
- Framingham CVD: ${framinghamScore}% (${framinghamCategory})
- FINDRISC Diabetes: ${findriscScore}% (${findriscCategory})

Provide a 3-4 sentence interpretation of what these scores mean for this person's health trajectory. Be specific, actionable, and cite which lifestyle factors are the biggest modifiable risk drivers. Do NOT recalculate scores. Use empathetic but direct clinical communication.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GOOGLE_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`AI Gateway failed [${response.status}]: ${errorBody}`);
    }

    const data = await response.json();
    const interpretation = data.choices?.[0]?.message?.content || "Unable to generate interpretation.";

    return new Response(
      JSON.stringify({ interpretation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error interpreting risks:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
