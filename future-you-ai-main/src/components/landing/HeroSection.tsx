import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Brain, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-health-blue/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-health-green/10 rounded-full blur-3xl animate-pulse-slow delay-500" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-medium">
              <Activity className="w-4 h-4" />
              <span>AI-Powered Preventive Healthcare</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-primary-foreground leading-tight">
              Meet Your{" "}
              <span className="gradient-text-hero">
                Future Self
              </span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Create your AI-powered digital twin that predicts health risks, simulates future scenarios, and guides you toward a healthier tomorrow.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild variant="hero" size="xl">
                <Link to="/auth">
                  Start Your Journey
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <a href="#how-it-works">
                  Learn More
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
              <div className="text-center lg:text-left">
                <div className="text-3xl md:text-4xl font-display font-bold text-accent">95%</div>
                <div className="text-sm text-primary-foreground/60">Prediction Accuracy</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl md:text-4xl font-display font-bold text-accent">10+</div>
                <div className="text-sm text-primary-foreground/60">Years Simulation</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl md:text-4xl font-display font-bold text-accent">24/7</div>
                <div className="text-sm text-primary-foreground/60">Health Monitoring</div>
              </div>
            </div>
          </div>

          {/* Right content - Digital Twin Visualization */}
          <div className="relative hidden lg:block animate-fade-in-up">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent/30 to-health-green/30 blur-2xl animate-pulse-slow" />
              
              {/* Central figure */}
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-accent/20 to-transparent border border-accent/30 flex items-center justify-center">
                <div className="relative">
                  {/* Health indicators orbiting */}
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 p-3 rounded-xl bg-health-green/20 border border-health-green/40 animate-float">
                    <Heart className="w-6 h-6 text-health-green" />
                  </div>
                  <div className="absolute top-1/2 -right-20 -translate-y-1/2 p-3 rounded-xl bg-health-blue/20 border border-health-blue/40 animate-float delay-200">
                    <Activity className="w-6 h-6 text-health-blue" />
                  </div>
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 p-3 rounded-xl bg-health-amber/20 border border-health-amber/40 animate-float delay-300">
                    <Brain className="w-6 h-6 text-health-amber" />
                  </div>

                  {/* Central icon */}
                  <div className="w-32 h-32 rounded-full bg-accent/30 flex items-center justify-center animate-pulse-ring">
                    <div className="w-24 h-24 rounded-full bg-accent/50 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shadow-lg health-glow">
                        <Activity className="w-8 h-8 text-accent-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data streams */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                <defs>
                  <linearGradient id="streamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(174 72% 40%)" stopOpacity="0" />
                    <stop offset="50%" stopColor="hsl(174 72% 40%)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="hsl(174 72% 40%)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <circle cx="200" cy="200" r="180" fill="none" stroke="url(#streamGradient)" strokeWidth="1" strokeDasharray="5 10" className="animate-spin" style={{ animationDuration: '20s' }} />
                <circle cx="200" cy="200" r="150" fill="none" stroke="url(#streamGradient)" strokeWidth="1" strokeDasharray="10 15" className="animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }} />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-white/50" />
        </div>
      </div>
    </section>
  );
}