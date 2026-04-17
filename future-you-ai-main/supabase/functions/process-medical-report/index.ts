import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Google AI Gemini API — production endpoint
const AI_GATEWAY = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

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
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Missing image data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GOOGLE_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "system",
            content: `You are a medical report OCR and extraction AI. Analyze the medical report image and extract all health values you can find.

Extract any of these parameters if visible:
- blood_glucose (mg/dL)
- hemoglobin (g/dL)
- cholesterol_total (mg/dL)
- cholesterol_hdl (mg/dL)
- cholesterol_ldl (mg/dL)
- triglycerides (mg/dL)
- blood_pressure_systolic (mmHg)
- blood_pressure_diastolic (mmHg)
- heart_rate (BPM)
- bmi
- weight_kg
- height_cm
- hba1c (%)
- creatinine (mg/dL)
- uric_acid (mg/dL)
- thyroid_tsh (mIU/L)
- vitamin_d (ng/mL)
- iron (mcg/dL)
- white_blood_cells (per mcL)
- red_blood_cells (million per mcL)
- platelets (per mcL)

Also extract:
- report_date (if visible)
- lab_name (if visible)
- doctor_name (if visible)
- report_type (e.g., "Complete Blood Count", "Lipid Panel", "Metabolic Panel")

For each extracted value, include the unit and whether it's in normal range.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all health values from this medical report image.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_medical_values",
              description: "Extract structured medical values from the report image",
              parameters: {
                type: "object",
                properties: {
                  report_type: { type: "string" },
                  report_date: { type: "string" },
                  lab_name: { type: "string" },
                  doctor_name: { type: "string" },
                  values: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        parameter: { type: "string" },
                        value: { type: "number" },
                        unit: { type: "string" },
                        normal_range: { type: "string" },
                        status: { type: "string", enum: ["normal", "low", "high", "critical"] },
                      },
                      required: ["parameter", "value", "unit"],
                      additionalProperties: false,
                    },
                  },
                  confidence: { type: "number" },
                  notes: { type: "string" },
                },
                required: ["values", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_medical_values" } },
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
    let extracted = { values: [], confidence: 0 };
    if (toolCall?.function?.arguments) {
      extracted = JSON.parse(toolCall.function.arguments);
    }

    return new Response(
      JSON.stringify({ extracted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("OCR processing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
