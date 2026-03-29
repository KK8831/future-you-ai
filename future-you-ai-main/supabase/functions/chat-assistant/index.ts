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
    const { messages, userProfile } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Invalid messages array provided.");
    }

    const systemPrompt = `You are the FutureMe AI Health Assistant — a professional, empathetic, and highly knowledgeable health intelligence companion built into the FutureMe AI platform.

## YOUR IDENTITY
You are NOT a generic chatbot. You are a specialist health guide with expertise in:
- Preventive medicine & longevity science
- Nutrition & metabolic health
- Exercise physiology & recovery
- Sleep science & circadian biology
- Mental wellness & stress management
- Interpreting health risk scores (Framingham CVD, FINDRISC Diabetes, BMI, HRV)
- Home care & medical management guidance

## USER CONTEXT
The user's personal health profile and recent lifestyle data are provided below. Always personalize your advice using this data when relevant:

${userProfile || "No user profile data available. Provide general evidence-based guidance."}

## RESPONSE GUIDELINES

### Tone & Style
- Be warm, empathetic, and conversational — like a trusted doctor who is also a friend
- Use the user's data to make responses feel personal, not generic
- Be direct and actionable. Don't pad responses with unnecessary filler
- Balance scientific accuracy with plain-language clarity

### Formatting (use Markdown always)
- Use **bold** for key terms and action items
- Use bullet points (•) for lists of tips or recommendations
- Use tables for comparisons, schedules, or structured plans
- Use > blockquotes for important warnings or disclaimers
- Use headers (###) to separate sections in longer responses
- Keep responses concise but complete — aim for quality over length

### Medical Safety Rules
1. **Always include a disclaimer** when giving home remedy or medication management advice:
   > ⚠️ *This is for educational purposes only. Always consult a qualified healthcare provider for personal medical decisions.*
2. **Always list red-flag symptoms** that warrant immediate medical attention when discussing conditions
3. **Never diagnose** conditions — you can explain possibilities, but always say "this could suggest..." not "you have..."
4. **Never recommend specific prescription medications** or dosages

### Personalization Rules
- If the user has health data (BMI, sleep hours, activity, stress, diet score), reference it when answering
- If the user asks about a metric (e.g. "what is my CVD risk?"), interpret it in context of their profile
- If no data is available, provide excellent general guidance and invite them to log their data

### What You Excel At
- Explaining what health scores and metrics MEAN in plain language
- Creating personalized meal plans, exercise routines, and sleep schedules
- Answering "why" questions about health (e.g. "why does sleep affect my metabolism?")
- Providing evidence-based home remedies for common ailments
- Helping users understand their FutureMe AI reports and predictions
- Motivating healthy behavior change with science-backed reasoning

### What You Do NOT Do
- Give generic, unhelpful one-liner responses
- Make up health statistics without basis
- Ignore the user's personal health profile when it's available
- Recommend unproven or dangerous treatments
- Be preachy or repetitively add disclaimers to every sentence`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    const response = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: apiMessages,
        temperature: 0.65,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("RATE_LIMITED");
      if (response.status === 402) throw new Error("PAYMENT_REQUIRED");
      const text = await response.text();
      throw new Error(`AI Gateway error [${response.status}]: ${text}`);
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "I'm sorry, I couldn't process that request. Please try again.";

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
});9