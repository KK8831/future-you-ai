import { useState } from "react";
import { Sparkles, MessageSquare, ArrowRight, Loader2, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FutureSelfMessageProps {
  profile: any;
  metrics: any;
  riskScores: any;
}

export function FutureSelfMessage({ profile, metrics, riskScores }: FutureSelfMessageProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateFutureMessage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-health-agent", {
        body: {
          profile,
          metrics,
          riskScores,
          agentType: "future-self", // We'll handle this in the edge function if we can, or just default to planner
        },
      });

      if (error) throw error;

      // For now, if the agent doesn't support "future-self" specifically, 
      // we'll use a fallback or parse the planner output for a positive spin
      const insight = data.results?.[0]?.output?.overallAssessment || 
                      "Your future self is waiting. Every healthy choice today is a gift to your 2030 version of you.";
      
      setMessage(insight);
    } catch (err) {
      console.error(err);
      toast({
        title: "Future Connection Error",
        description: "Could not reach your future self right now. Try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/10 via-background to-secondary/30 border border-accent/20 relative overflow-hidden h-full flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -mr-16 -mt-16" />
      
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center animate-pulse">
            <Bot className="w-4 h-4 text-accent" />
          </div>
          <h3 className="text-sm font-display font-bold text-foreground">A Message from 2030</h3>
        </div>

        {message ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <p className="text-sm italic text-muted-foreground leading-relaxed">
              "{message}"
            </p>
            <div className="flex items-center gap-1 text-[10px] text-accent font-medium uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              Manifesting your best self
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Curious what your future self has to say about your progress today?
            </p>
          </div>
        )}
      </div>

      <div className="mt-4">
        {!message ? (
          <Button 
            onClick={generateFutureMessage} 
            disabled={loading}
            variant="outline"
            size="sm"
            className="w-full bg-background/50 hover:bg-accent hover:text-accent-foreground border-accent/20 group transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />}
            Connect to 2030
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-auto text-[10px] text-muted-foreground hover:text-accent flex items-center gap-1"
            onClick={() => setMessage(null)}
          >
            New connection <ArrowRight className="w-2 h-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
