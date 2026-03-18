import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  // Handle CORS preflight requests
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
    const { messages, userProfile } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Invalid messages array provided.");
    }

    const systemPrompt = `You are the FutureMe AI Helpful Chat Assistant.
    
Your role is to act as a highly knowledgeable, friendly, and patient guide explicitly designed to help the user understand health metrics, the FutureMe AI platform, and medical concepts in detail.

Guidelines:
1. Provide detailed, explanatory, and clear answers. Do not just summarize; explain the "why" and "how".
2. If the user asks about a medical concept (e.g., "What is Framingham CVD score?", "How does sleep affect HRV?"), break it down using simple analogies but retain scientific accuracy.
3. You are a conversational agent, NOT an automated analytical summarizer. You can ask follow-up questions if they need more help.
4. Keep the tone empathetic and professional.

User Context:
${userProfile ? JSON.stringify(userProfile, null, 2) : "No context provided."}
`;

    // Construct the payload for the Gemini API via the gateway
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    ];

    const response = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview", // Base model used across the app
        messages: apiMessages,
        temperature: 0.7, // Slightly higher for conversational feel
      }),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("RATE_LIMITED");
      if (response.status === 402) throw new Error("PAYMENT_REQUIRED");
      const text = await response.text();
      throw new Error(`AI Gateway error [${response.status}]: ${text}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Chat Assistant Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage === "RATE_LIMITED") {
      return new Response(
        JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (errorMessage === "PAYMENT_REQUIRED") {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
