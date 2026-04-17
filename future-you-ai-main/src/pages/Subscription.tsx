import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Sparkles, 
  Infinity as InfinityIcon,
  Zap,
  TrendingUp,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Subscription = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (data) setProfile(data);
    setLoading(false);
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      // We will trigger the create-checkout-session edge function here
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { return_url: window.location.origin + '/subscription', user_id: user?.id }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e: any) {
      toast({
        title: "Checkout failed",
        description: e.message || "Failed to initiate checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex h-[subtitle] items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const isPremium = profile?.subscription_tier === 'premium';
  const apiCredits = profile?.api_credits ?? 0;

  return (
    <DashboardLayout user={user}>
      <div className="max-w-5xl mx-auto space-y-12 pb-12 animate-fade-in pt-6">
        
        {/* Header Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">
            Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-health-blue">Future Health</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Choose the plan that fits your journey. Upgrade to Premium for unmetered AI health analysis, deep forecasting, and limitless clinical insights.
          </p>
        </div>

        {/* Current Status Box */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Current Plan</p>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground capitalize">
                {isPremium ? "Premium Plan" : "Basic Plan"}
              </h2>
              {isPremium && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-health-blue/10 text-health-blue rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Active
                </span>
              )}
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 text-left md:text-right">
            {!isPremium && (
              <>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">AI Action Credits</p>
                <div className="flex items-center gap-2 md:justify-end">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((dot) => (
                      <div 
                        key={dot} 
                        className={`w-3 h-3 rounded-full ${dot <= apiCredits ? 'bg-accent shadow-[0_0_8px_rgba(255,107,107,0.6)]' : 'bg-muted'}`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-foreground">{apiCredits} Remaining</span>
                </div>
              </>
            )}
            {isPremium && (
              <div className="flex items-center gap-2 md:justify-end text-health-blue font-semibold">
                <InfinityIcon className="w-5 h-5" /> Unlimited AI Credits
              </div>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Free Plan */}
          <div className="bg-card border border-border rounded-3xl p-8 flex flex-col relative overflow-hidden transition-all hover:shadow-md">
            <h3 className="text-xl font-bold text-foreground">Basic</h3>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold text-foreground">
              ₹0
              <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
            </div>
            <p className="mt-4 text-muted-foreground text-sm">Perfect for tracking daily metrics and building lifelong habits.</p>
            
            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-health-green flex-shrink-0" />
                <span className="text-sm">Personalized Health Dashboard</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-health-green flex-shrink-0" />
                <span className="text-sm">Gamified Streak Tracking</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-health-green flex-shrink-0" />
                <span className="text-sm">Daily Manual Entry Logging</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                <span className="text-sm">3 Free AI Analyses</span>
              </li>
            </ul>
            
            <Button 
              variant="outline" 
              className="mt-8 w-full border-2" 
              disabled={!isPremium}
              onClick={() => {
                // If they are premium, this would handle downgrade/cancel via customer portal
                // For now, doing nothing
              }}
            >
              {isPremium ? "Downgrade" : "Current Plan"}
            </Button>
          </div>

          {/* Premium Plan */}
          <div className="bg-card border-2 border-accent rounded-3xl p-8 flex flex-col relative overflow-hidden shadow-lg shadow-accent/10 transform md:-translate-y-4">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-accent to-health-blue" />
            <div className="absolute top-4 right-4">
              <span className="bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Recommended
              </span>
            </div>

            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" /> Premium
            </h3>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold text-foreground">
              ₹499
              <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
            </div>
            <p className="mt-4 text-muted-foreground text-sm">Full power of FutureMe AI for advanced longevity planning.</p>
            
            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex items-center gap-3">
                <InfinityIcon className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-sm font-medium">Unlimited Gemini AI Health Analyses</span>
              </li>
              <li className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-sm font-medium">Smart Voice Logging Extraction</span>
              </li>
              <li className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-sm">14-Day Visual Trend Forecasts</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-sm">Professional Medical PDF Exports</span>
              </li>
            </ul>
            
            <Button 
              className="mt-8 w-full bg-foreground text-background hover:bg-foreground/90 font-semibold"
              onClick={handleUpgrade}
              disabled={checkoutLoading || isPremium}
            >
              {checkoutLoading ? (
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : isPremium ? (
                "You are Premium"
              ) : (
                <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Upgrade to Premium</span>
              )}
            </Button>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Subscription;
