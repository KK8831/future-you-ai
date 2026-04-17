import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISCLAIMER_ACCEPTED_KEY = "medical_disclaimer_accepted";

/**
 * Full-screen medical disclaimer modal — shown once on first app launch.
 * Required by Google Play Health & Fitness app policy.
 */
export function MedicalDisclaimerModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
    if (!accepted) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(DISCLAIMER_ACCEPTED_KEY, new Date().toISOString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/20 to-red-500/10 border-b border-border p-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Important Health Disclaimer
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Please read before using FutureMe AI
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground leading-relaxed">
              <strong className="text-amber-500">FutureMe AI is NOT a medical device</strong> and does not provide medical diagnoses, treatments, or medical advice.
            </div>
          </div>

          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-2" />
              All health scores (Framingham CVD, FINDRISC Diabetes, BMI), predictions, and AI-generated insights are for <strong className="text-foreground">informational and educational purposes only</strong>.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-2" />
              Heart rate measurements via camera (PPG) are <strong className="text-foreground">estimates only</strong> and should not be used for clinical decision-making.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-2" />
              Always consult a <strong className="text-foreground">qualified healthcare provider</strong> before making any health-related decisions based on information from this app.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-2" />
              In case of a medical emergency, <strong className="text-foreground">call your local emergency services immediately</strong>.
            </li>
          </ul>
        </div>

        {/* Action */}
        <div className="p-6 border-t border-border bg-secondary/20">
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleAccept}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            I Understand — This Is Not Medical Advice
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            By continuing, you acknowledge that FutureMe AI is an informational wellness tool only.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact inline disclaimer banner — used on pages that show health data/analysis.
 */
export function MedicalDisclaimerBanner({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20",
      className
    )}>
      <Shield className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        <strong className="text-amber-500/90">Disclaimer:</strong>{" "}
        All health scores, predictions, and AI recommendations are for informational purposes only and are not a substitute for professional medical advice. Always consult your healthcare provider.
      </p>
    </div>
  );
}
