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
      JSON.stringify({ error: "GOOGLE_AI_API_KEY is not configured in Supabase Secrets." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing transcript text" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Using Native Gemini API instead of OpenAI wrapper for guaranteed JSON Schema adherence
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `Analyze the following voice transcript and extract health parameters: "${transcript}"` }]
            }
          ],
          systemInstruction: {
            parts: [{ text: `You are a health data extraction AI. Extract health parameters from spoken text.
Extract any of these parameters if mentioned:
- physical_activity_minutes (exercise/walking/running minutes)
- sleep_hours (hours slept)
- diet_quality_score (1-10 scale, infer from food descriptions)
- stress_level (1-10 scale, infer from descriptions)
- screen_time_hours (hours on screens)
- steps (step count)
- heart_rate (BPM)
- blood_pressure_systolic
- blood_pressure_diastolic
- blood_glucose (mg/dL)
- weight_kg
- symptoms (array of symptom strings)
- notes (any additional context)

Be smart about inference: "I had a salad and grilled chicken" → diet_quality_score: 7-8
"I was very stressed today" → stress_level: 7-8
"I walked 6000 steps" → steps: 6000, physical_activity_minutes: ~60` }]
          },
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                physical_activity_minutes: { type: "NUMBER" },
                sleep_hours: { type: "NUMBER" },
                diet_quality_score: { type: "NUMBER" },
                stress_level: { type: "NUMBER" },
                screen_time_hours: { type: "NUMBER" },
                steps: { type: "NUMBER" },
                heart_rate: { type: "NUMBER" },
                blood_pressure_systolic: { type: "NUMBER" },
                blood_pressure_diastolic: { type: "NUMBER" },
                blood_glucose: { type: "NUMBER" },
                weight_kg: { type: "NUMBER" },
                symptoms: { type: "ARRAY", items: { type: "STRING" } },
                notes: { type: "STRING" },
                confidence: { type: "NUMBER", description: "Confidence score from 0.0 to 1.0" },
              },
              required: ["confidence"]
            }
          }
        })
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI API error [${response.status}]: ${text}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const extracted = JSON.parse(resultText);

    return new Response(
      JSON.stringify({ extracted, transcript }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    } catch (error: unknown) {
      console.error("Voice processing error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
});
