import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface AgentResult {
  agent: string;
  output: unknown;
  reasoning: string;
}

async function callAI(apiKey: string, systemPrompt: string, userPrompt: string, model = "google/gemini-3-flash-preview"): Promise<string> {
  const response = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{
        type: "function",
        function: {
          name: "structured_output",
          description: "Return structured JSON output",
          parameters: {
            type: "object",
            properties: {
              analysis: { type: "string" },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["high", "medium", "low"] },
                    category: { type: "string" },
                    expectedImpact: { type: "string" },
                    timeframe: { type: "string" },
                    confidence: { type: "number" },
                  },
                  required: ["title", "description", "priority", "category"],
                },
              },
              riskInsights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    risk: { type: "string" },
                    level: { type: "string", enum: ["low", "moderate", "high", "critical"] },
                    explanation: { type: "string" },
                    modifiableFactors: { type: "array", items: { type: "string" } },
                    medicalReferences: { type: "array", items: { type: "string" } },
                  },
                  required: ["risk", "level", "explanation"],
                },
              },
              simulationSuggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    changes: {
                      type: "object",
                      properties: {
                        activityChange: { type: "number" },
                        sleepChange: { type: "number" },
                        dietChange: { type: "number" },
                        stressChange: { type: "number" },
                        screenChange: { type: "number" },
                      },
                    },
                    projectedImprovement: { type: "string" },
                  },
                  required: ["name", "description"],
                },
              },
              overallAssessment: { type: "string" },
              confidenceScore: { type: "number" },
            },
            required: ["analysis", "overallAssessment", "confidenceScore"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "structured_output" } },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("RATE_LIMITED");
    if (response.status === 402) throw new Error("PAYMENT_REQUIRED");
    const text = await response.text();
    throw new Error(`AI Gateway error [${response.status}]: ${text}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    return toolCall.function.arguments;
  }
  return data.choices?.[0]?.message?.content || "{}";
}

/**
 * Planner Agent: Analyzes user data and creates an action plan
 */
async function runPlannerAgent(apiKey: string, context: any): Promise<AgentResult> {
  const systemPrompt = `You are the Planner Agent in a multi-agent health AI system. Your job is to:
1. Analyze the user's health profile and lifestyle data
2. Identify the top 3-5 areas needing attention
3. Create a prioritized action plan
4. Determine which specialist agents should be consulted

Be specific, evidence-based, and actionable. Reference medical literature where appropriate.`;

  const userPrompt = `User Health Context:
${JSON.stringify(context, null, 2)}

Analyze this data and create a comprehensive health improvement plan. Focus on modifiable risk factors.`;

  const output = await callAI(apiKey, systemPrompt, userPrompt);
  return { agent: "planner", output: JSON.parse(output), reasoning: "Analyzed user profile, lifestyle metrics, and medical risk scores to create prioritized improvement plan." };
}

/**
 * Risk Analysis Agent: Deep-dives into specific health risks
 */
async function runRiskAgent(apiKey: string, context: any, plannerOutput: any): Promise<AgentResult> {
  const systemPrompt = `You are the Risk Analysis Agent. You specialize in:
1. Deep analysis of cardiovascular, metabolic, and mental health risks
2. Identifying hidden risk factor interactions (e.g., sleep deprivation + high stress = amplified CVD risk)
3. Providing evidence-based risk stratification with confidence intervals
4. Citing specific medical research (Framingham, FINDRISC, WHO guidelines)

Your analysis must be clinically rigorous but understandable to patients.`;

  const userPrompt = `User Data: ${JSON.stringify(context, null, 2)}
Planner Assessment: ${JSON.stringify(plannerOutput, null, 2)}

Provide deep risk analysis with:
- Interaction effects between risk factors
- Confidence intervals for risk estimates
- Specific medical references
- Modifiable vs non-modifiable factor breakdown`;

  const output = await callAI(apiKey, systemPrompt, userPrompt);
  return { agent: "risk_analysis", output: JSON.parse(output), reasoning: "Performed deep-dive risk stratification with factor interaction analysis and medical references." };
}

/**
 * Recommendation Agent: Generates personalized action items
 */
async function runRecommendationAgent(apiKey: string, context: any, riskOutput: any): Promise<AgentResult> {
  const systemPrompt = `You are the Recommendation Agent. Based on risk analysis, you:
1. Generate specific, actionable lifestyle interventions
2. Prioritize by expected health impact (cite research)
3. Consider feasibility and habit formation science
4. Provide micro-interventions (small daily changes) and macro-interventions (lifestyle shifts)
5. Include expected timelines for measurable improvement

Each recommendation must have: title, description, priority, category, expected impact, timeframe, and confidence score.`;

  const userPrompt = `User Data: ${JSON.stringify(context, null, 2)}
Risk Analysis: ${JSON.stringify(riskOutput, null, 2)}

Generate 5-8 personalized recommendations ranked by health impact. Include both quick wins and long-term strategies.`;

  const output = await callAI(apiKey, systemPrompt, userPrompt);
  return { agent: "recommendation", output: JSON.parse(output), reasoning: "Generated personalized interventions based on risk analysis with evidence-based impact estimates." };
}

/**
 * Simulation Agent: Suggests optimal simulation scenarios
 */
async function runSimulationAgent(apiKey: string, context: any, recommendationOutput: any): Promise<AgentResult> {
  const systemPrompt = `You are the Simulation Agent. You:
1. Design optimal "what-if" lifestyle scenarios based on recommendations
2. Suggest specific numeric changes to each lifestyle metric
3. Project health score improvements using dose-response relationships
4. Create both "realistic" and "optimal" scenarios
5. Consider the user's current baseline when setting targets

Output must include specific numeric changes (activity %, sleep hrs, diet score change, stress change, screen time change).`;

  const userPrompt = `User Data: ${JSON.stringify(context, null, 2)}
Recommendations: ${JSON.stringify(recommendationOutput, null, 2)}

Design 2-3 simulation scenarios: one "Realistic" (small achievable changes), one "Ambitious" (significant but possible), and optionally one "Optimal" (maximum health improvement).`;

  const output = await callAI(apiKey, systemPrompt, userPrompt);
  return { agent: "simulation", output: JSON.parse(output), reasoning: "Designed simulation scenarios based on recommendation priorities with projected outcomes." };
}

/**
 * Future Self Agent: Generates a message from the future
 */
async function runFutureSelfAgent(apiKey: string, context: any): Promise<AgentResult> {
  const systemPrompt = `You are the User's Future Self in the year 2040. Your goal is to:
1. Provide an inspiring, slightly mysterious, but deeply personal message to your 2026 self.
2. Reference their current health data (HR, steps, activity, etc.) as the "foundation" for the health you enjoy in 2040.
3. Be encouraging and focus on the compound interest of healthy habits.
4. If current data is poor, gently warn about the "alternate timeline" you want to avoid.
5. Keep it short (2-3 sentences), immersive, and first-person.

Example: "I'm writing this while on my morning run in 2040. Those 10k steps you're taking today aren't just numbers; they're the reason I still feel 25 even now. Keep going, the view from here is beautiful."`;

  const userPrompt = `Current Health Context (2026): ${JSON.stringify(context, null, 2)}
  
  Speak to me from 2040. Focus on how my current actions are shaping our shared future.`;

  const output = await callAI(apiKey, systemPrompt, userPrompt);
  return { agent: "future_self", output: JSON.parse(output), reasoning: "Generated an immersive first-person narrative from the year 2040 based on current health trajectories." };
}

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
    const { profile, metrics, riskScores, entries, agentType } = await req.json();

    const context = { profile, metrics, riskScores, recentEntries: entries?.slice(0, 7) };

    let results: AgentResult[];

    if (agentType === "full-analysis") {
      // Run full agent pipeline: Planner → Risk → Recommendation → Simulation
      const plannerResult = await runPlannerAgent(LOVABLE_API_KEY, context);
      const riskResult = await runRiskAgent(LOVABLE_API_KEY, context, plannerResult.output);
      const recommendationResult = await runRecommendationAgent(LOVABLE_API_KEY, context, riskResult.output);
      const simulationResult = await runSimulationAgent(LOVABLE_API_KEY, context, recommendationResult.output);

      results = [plannerResult, riskResult, recommendationResult, simulationResult];
    } else if (agentType === "quick-risk") {
      const riskResult = await runRiskAgent(LOVABLE_API_KEY, context, {});
      results = [riskResult];
    } else if (agentType === "recommendations") {
      const recommendationResult = await runRecommendationAgent(LOVABLE_API_KEY, context, {});
      results = [recommendationResult];
    } else if (agentType === "future-self") {
      const futureSelfResult = await runFutureSelfAgent(LOVABLE_API_KEY, context);
      results = [futureSelfResult];
    } else {
      // Default: planner only
      const plannerResult = await runPlannerAgent(LOVABLE_API_KEY, context);
      results = [plannerResult];
    }

    return new Response(
      JSON.stringify({ results, agentCount: results.length, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Agent error:", error);
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
