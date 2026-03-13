import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-health-blue/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary-foreground">
            Start Building Your{" "}
            <span className="gradient-text-hero">Digital Twin</span>{" "}
            Today
          </h2>
          
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">
            Take control of your health future. Join thousands of users who are already predicting and preventing health risks with FutureMe AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="hero" size="xl">
              <Link to="/auth">
                Create Your Digital Twin
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 pt-8 text-primary-foreground/60 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Privacy Protected</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <span>No Credit Card Required</span>
            <div className="w-px h-4 bg-white/20" />
            <span>For Educational Use</span>
          </div>
        </div>
      </div>
    </section>
  );
}