import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const QUICK_ACTIONS = [
  { label: "🏠 Home Remedies", prompt: "I can't go to the hospital right now. Can you suggest some safe home remedies for common ailments like colds, stress, or minor pains?" },
  { label: "💊 Medical Management", prompt: "I need help with medical management at home. Can you explain how to manage common chronic conditions or understand medication schedules?" },
  { label: "🔮 Predict My Health 2040", prompt: "Can you simulate my health trajectory for the next 15 years based on my profile?" },
  { label: "😴 Improve My Sleep", prompt: "I want to improve my sleep quality. What changes should I prioritize based on my current data?" },
  { label: "⚡ Longevity Tips", prompt: "What are the top 3 high-impact habits I can start today to increase my healthspan?" },
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// OFFLINE FALLBACK KNOWLEDGE BASE
// Used when the AI API is unavailable. Preserved from original implementation.
// ---------------------------------------------------------------------------
const KNOWLEDGE_BASE: Record<string, { keywords: string[], variations: string[] }> = {
  diet: {
    keywords: ["diet", "nutrition", "food", "eat", "meal", "protein", "carbs", "sugar"],
    variations: [
      `**Comprehensive Nutrition Protocol:**

- **Proteins:** 1.6g–2.2g per kg of body weight for muscle maintenance.
- **Fats:** Prioritize monounsaturated fats (extra virgin olive oil) and Omega-3s.
- **Carbohydrates:** Focus on low-glycemic, high-fiber sources (quinoa, sweet potatoes).

> **Rationale:** This protocol stabilizes insulin levels and provides sustained energy throughout the day.`,
      `**Metabolic Health Strategy:**

- **Circadian Eating:** Consume your meals within an 8–10 hour window aligned to daylight hours.
- **Fiber Focus:** Aim for 35g+ of daily fiber to support a healthy microbiome.
- **Hydration:** Drink 30ml of water per kg of body weight daily.

> **Rationale:** Synchronizing nutrition with your biological clock improves metabolic flexibility and insulin sensitivity.`
    ]
  },
  weekly_diet: {
    keywords: ["weekly", "7 day", "three day", "3 day", "long term"],
    variations: [
      `**7-Day Structured Nutrition Plan:**

| Day | Breakfast | Lunch | Dinner | Snack |
|:---:|:---|:---|:---|:---|
| **1** | Eggs & Spinach | Chicken Salad | Baked Salmon | Almonds |
| **2** | Greek Yogurt | Turkey Wrap | Beef Stir-fry | Apple |
| **3** | Oats & Berries | Tuna Salad | Grilled Tempeh | Walnuts |
| **4** | Chia Pudding | Quinoa Bowl | Roasted Chicken | Pear |
| **5** | Omelette | Lentil Soup | Baked Cod | Cashews |
| **6** | Protein Shake | Chickpea Salad | Steak & Veggies | Berries |
| **7** | Whole Grain Toast | Turkey Salad | Vegetable Curry | Pecans |

**Scientific Rationale:** This plan rotates high-quality protein sources and varying fiber types to ensure a complete micro-nutrient profile while preventing 'diet fatigue'.`
    ]
  },
  keto_diet: {
    keywords: ["keto", "low carb", "ketogenic", "ketosis"],
    variations: [
      `**Advanced Keto Protocol (High Fat / Low Carb):**

| Meal | Food |
|:---|:---|
| **Breakfast** | 3 Eggs & Bacon sautéed in grass-fed butter |
| **Lunch** | Spinach & Arugula salad with grilled pork belly, avocado oil dressing |
| **Dinner** | Pan-seared Salmon with asparagus and hollandaise sauce |

**Macronutrient Target:** 70% Fat · 25% Protein · 5% Net Carbs

> **Scientific Rationale:** By restricting carbohydrates, the body shifts into ketosis — utilizing stored body fat as the primary fuel source via ketone bodies.`
    ]
  },
  vegan_diet: {
    keywords: ["vegan", "plant based", "vegetarian", "no meat"],
    variations: [
      `**Plant-Based Longevity Plan:**

| Meal | Food |
|:---|:---|
| **Breakfast** | Buckwheat porridge with flax seeds, blueberries, and soy milk |
| **Lunch** | Black bean & sweet potato burritos with walnut-based filling |
| **Dinner** | Red lentil dahl with ginger, turmeric, and steamed kale |

- **Essential:** B12 supplementation daily + pair iron-rich greens with Vitamin C for absorption.

> **Scientific Rationale:** High polyphenol and fiber intake from plant sources is strongly correlated with reduced systemic inflammation markers.`
    ]
  },
  exercise: {
    keywords: ["exercise", "fitness", "workout", "training", "activity", "gym", "run", "lift"],
    variations: [
      `**Optimized Training Protocol (VO2 & Strength):**

| Type | Frequency | Focus |
|:---|:---|:---|
| **Resistance** | 3x / week | Compound: Squat, Hinge, Push, Pull |
| **Zone 2 Cardio** | 150 min / week | Conversational pace, sustained HR |
| **Zone 5 HIIT** | 1x / week | 4-min intervals at 90%+ max HR |

> **Scientific Rationale:** This combination addresses both metabolic efficiency and functional muscle mass — the two strongest predictors of physical longevity.`
    ]
  },
  sleep: {
    keywords: ["sleep", "rest", "insomnia", "bed", "night", "circadian"],
    variations: [
      `**Elite Sleep Hygiene Protocol:**

| Time Before Bed | Action |
|:---|:---|
| **3 hours** | Stop eating — digestion raises core temp, blocking deep sleep |
| **2 hours** | Switch to warm lighting, cool room to 18°C (64°F) |
| **1 hour** | Zero screens — 480nm blue light suppresses melatonin for 4+ hours |
| **Daily** | Wake at same time (±30 min) — even weekends, to anchor your circadian clock |

> **Scientific Rationale:** Deep sleep & REM are critical for glymphatic drainage (brain detox) and emotional regulation. Consistency is more important than duration.`
    ]
  },
  mental: {
    keywords: ["stress", "mental", "anxiety", "focus", "meditation", "mindfulness", "brain"],
    variations: [
      `**Neuro-Resilience Framework:**

### Quick Interventions (< 5 min)
- **Physiological Sigh:** Two quick inhales through the nose, then one long exhale through the mouth. Rapidly lowers heart rate.
- **Box Breathing:** Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 4 cycles.

### Daily Habits
- **Digital Minimalism:** Enable Greyscale mode on your phone to reduce dopamine-loop triggers.
- **NSDR (Non-Sleep Deep Rest):** 20-minute guided body scan session to reset cognitive focus.

> **Scientific Rationale:** Managing autonomic nervous system arousal prevents decision fatigue and lowers chronic cortisol — a key driver of metabolic and cardiovascular risk.`
    ]
  },
  heart: {
    keywords: ["heart", "cardio", "blood pressure", "bp", "cholesterol", "artery"],
    variations: [
      `**Cardiovascular Optimization Plan:**

### Nutrition
- **Nitric Oxide Boosters:** Beets, garlic, and leafy greens to improve arterial flexibility.
- **Lipid Management:** Swap saturated fats for monounsaturated fats (avocados, olive oil, nuts).

### Lifestyle
- **Post-Meal Walk:** 10 minutes after each meal significantly lowers post-prandial glucose and reduces cardiac strain.
- **Stress Reduction:** Chronic cortisol directly stiffens arterial walls — prioritize sleep and recovery.

> **Scientific Rationale:** Reducing glycemic spikes after meals protects the endothelium (arterial lining) — the first site of cardiovascular damage.`
    ]
  }
};

// Offline fallback: keyword-based local response generator
const generateLocalResponse = (input: string, profile: any): string => {
  const query = input.toLowerCase();

  // Selection seed
  let seed = (query.length + new Date().getMinutes()) % 3;

  // Intent Mapping
  const isAskingForPlan = query.includes("plan") || query.includes("schedule") || query.includes("routine");
  const isAskingForWeekly = query.includes("weekly") || query.includes("week") || query.includes("7 day") || query.includes("3 day");
  const isKeto = query.includes("keto") || query.includes("low carb");
  const isVegan = query.includes("vegan") || query.includes("plant based");

  // Custom logic for predictions
  if (query.includes("predict") || query.includes("2040")) {
    const age = profile?.age || 30;
    const trajectory = age < 40 ? "Excellent" : "Stable";
    return `**Future Health Projection (On-Device Model):**\n\nBased on your Age (${age}) and profile, you have an **${trajectory}** projected health trajectory. Maintaining your current activity level is the most vital factor for your 2040 results.`;
  }

  // Knowledge base matching
  for (const category in KNOWLEDGE_BASE) {
    if (KNOWLEDGE_BASE[category].keywords.some(k => query.includes(k))) {
      // Specialized Intent Selection
      if (category === 'diet') {
        if (isAskingForWeekly) return KNOWLEDGE_BASE.weekly_diet.variations[0];
        if (isKeto) return KNOWLEDGE_BASE.keto_diet.variations[0];
        if (isVegan) return KNOWLEDGE_BASE.vegan_diet.variations[0];
      }

      const variants = KNOWLEDGE_BASE[category].variations;
      const index = isAskingForPlan ? 0 : seed % variants.length;
      let response = variants[index];

      // Personalization injection
      if (profile?.weight_kg && (category === 'diet' || category === 'weekly_diet')) {
        const waterAmount = Math.round(profile.weight_kg * 0.033 * 10) / 10;
        response = response.replace("30ml of water per kg", `${waterAmount}L of water (customized for your ${profile.weight_kg}kg weight)`);
      }

      return response;
    }
  }

  return "I'm operating in **High-Privacy Local Mode**. I have specialized health data for **Diet, Exercise, Sleep, Heart Health, and Stress**. How can I assist with your wellness goals today?";
};

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "👋 Hi! I'm your **FutureMe AI Health Assistant**.\n\nI can help you with:\n- 🔍 Understanding your health metrics & risk scores\n- 🥗 Personalized diet & nutrition advice\n- 🏋️ Exercise & recovery strategies\n- 😴 Sleep optimization\n- 🧠 Stress & mental wellness\n- 💊 Home remedies & medical management\n\nWhat would you like to explore today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length]);

  // Fetch full user context: profile + last 7 days of lifestyle entries
  const getUserContext = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const [profileRes, entriesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("age, sex, height_cm, weight_kg, activity_level, health_goals")
          .eq("user_id", session.user.id)
          .single(),
        supabase
          .from("lifestyle_entries")
          .select("date, activity_minutes, sleep_hours, diet_score, stress_level, screen_time_hours, notes")
          .eq("user_id", session.user.id)
          .order("date", { ascending: false })
          .limit(7),
      ]);

      return {
        profile: profileRes.data || null,
        recentEntries: entriesRes.data || [],
      };
    } catch {
      return null;
    }
  };

  // Build rich profile + lifestyle context string to pass to AI
  const buildUserContextString = (userContext: any): string => {
    const p = userContext?.profile;
    const entries = userContext?.recentEntries;

    const profileContext = p
      ? `User Health Profile:
- Age: ${p.age ?? "unknown"} years
- Sex: ${p.sex ?? "unknown"}
- Height: ${p.height_cm ?? "unknown"} cm
- Weight: ${p.weight_kg ?? "unknown"} kg
- BMI: ${p.height_cm && p.weight_kg ? (p.weight_kg / Math.pow(p.height_cm / 100, 2)).toFixed(1) : "unknown"}
- Activity Level: ${p.activity_level ?? "unknown"}
- Health Goals: ${p.health_goals ?? "not specified"}`
      : "User profile: Not available";

    const entriesContext =
      entries && entries.length > 0
        ? `Recent 7-Day Lifestyle Data:\n${entries
            .map(
              (e: any) =>
                `• ${e.date}: Activity ${e.activity_minutes ?? "?"}min, Sleep ${e.sleep_hours ?? "?"}hrs, Diet ${e.diet_score ?? "?"}/10, Stress ${e.stress_level ?? "?"}/10, Screen ${e.screen_time_hours ?? "?"}hrs${e.notes ? `, Notes: ${e.notes}` : ""}`
            )
            .join("\n")}`
        : "Recent entries: No data logged yet";

    return `${profileContext}\n\n${entriesContext}`;
  };

  // Core send handler — calls chat-assistant edge function with full context
  const handleSendWithLiteral = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    // Optimistically add user message and capture updated list
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    let userProfile: any = null;

    try {
      // Fetch user health context
      const userContext = await getUserContext();
      userProfile = userContext?.profile || null;
      const contextString = buildUserContextString(userContext);

      // Build full conversation history for the AI (exclude system messages)
      const conversationHistory = updatedMessages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      // Call the proper dedicated chat-assistant edge function
      const { data, error } = await supabase.functions.invoke("chat-assistant", {
        body: {
          messages: conversationHistory,
          userProfile: contextString,
        },
      });

      if (error) throw new Error(error.message);

      if (data?.error) {
        if (data.error.includes("Rate") || data.error.includes("429")) throw new Error("RATE_LIMITED");
        if (data.error.includes("credit") || data.error.includes("402")) throw new Error("PAYMENT_REQUIRED");
        throw new Error(data.error);
      }

      const finalReply =
        data?.reply || "I'm sorry, I couldn't generate a response. Please try again.";

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: finalReply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      const msg = error?.message || "";

      // Graceful degradation: fall back to local knowledge base
      const fallbackReply = generateLocalResponse(text, userProfile);

      let toastDescription = "Falling back to local knowledge base.";
      if (msg === "RATE_LIMITED") {
        toastDescription = "Rate limit exceeded. Using local knowledge base.";
      } else if (msg === "PAYMENT_REQUIRED") {
        toastDescription = "AI credits exhausted. Using local knowledge base.";
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fallbackReply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);

      toast({
        title: "Connection Issue",
        description: toastDescription,
      });
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSend = () => {
    handleSendWithLiteral(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onQuickAction = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      handleSendWithLiteral(prompt);
    }, 10);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-105",
            "bg-accent text-accent-foreground flex items-center justify-center animate-fade-in"
          )}
          style={{ boxShadow: "0 8px 30px -4px hsl(var(--accent) / 0.5)" }}
          aria-label="Open health assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[350px] sm:w-[420px] h-[560px] max-h-[calc(100vh-48px)] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex-shrink-0">

          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">FutureMe Assistant</h3>
                <p className="text-[10px] text-accent font-medium flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                  </span>
                  AI-Powered · Health Specialist
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex w-full",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "flex gap-2 max-w-[88%]",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}>
                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-auto">
                    {message.role === "assistant" ? (
                      <div className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={cn(
                      "p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm",
                      message.role === "user"
                        ? "bg-accent text-accent-foreground rounded-br-none"
                        : "bg-secondary text-foreground rounded-bl-none"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1 prose-headings:mb-2 prose-headings:mt-3 prose-headings:text-foreground prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1 prose-blockquote:border-accent prose-blockquote:text-muted-foreground">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    <p className={cn(
                      "text-[9px] mt-1.5 opacity-60",
                      message.role === "user" ? "text-right" : "text-left"
                    )}>
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex w-full justify-start">
                <div className="flex gap-2 max-w-[88%] flex-row">
                  <div className="flex-shrink-0 mt-auto">
                    <div className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-secondary rounded-bl-none flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-secondary/30 border-t border-border mt-auto flex-shrink-0">
            {/* Quick Actions Scroll Area */}
            {messages.length < 5 && (
              <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar scroll-smooth">
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => onQuickAction(action.prompt)}
                    disabled={isTyping}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-medium text-accent hover:bg-accent hover:text-white transition-all duration-300 disabled:opacity-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask anything about your health..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                className="flex-1 bg-card text-sm border border-border/50 rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-accent transition-all disabled:opacity-50 shadow-inner"
              />
              <Button
                size="icon"
                onClick={() => handleSendWithLiteral(input)}
                disabled={!input.trim() || isTyping}
                className="rounded-xl flex-shrink-0 shadow-lg shadow-accent/20"
              >
                {isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[9px] text-muted-foreground/60">AI-powered · Not a substitute for professional medical advice</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}