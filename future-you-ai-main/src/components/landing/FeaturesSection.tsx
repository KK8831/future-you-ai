import { Activity, Brain, TrendingUp, Shield, Zap, Target } from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Digital Twin Creation",
    description: "Build a dynamic virtual representation of your lifestyle that evolves with every data point you provide.",
    color: "accent",
  },
  {
    icon: TrendingUp,
    title: "Future Simulations",
    description: "Explore multiple lifestyle scenarios and see projected outcomes years into your future.",
    color: "health-green",
  },
  {
    icon: Brain,
    title: "AI Risk Prediction",
    description: "Machine learning models analyze your patterns to predict potential health risks before they manifest.",
    color: "health-blue",
  },
  {
    icon: Target,
    title: "Personalized Recommendations",
    description: "Receive tailored lifestyle changes based on your unique profile and predicted risk factors.",
    color: "health-amber",
  },
  {
    icon: Shield,
    title: "Preventive Intelligence",
    description: "Shift from reactive to proactive healthcare with actionable insights for long-term wellness.",
    color: "health-purple",
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "Your digital twin continuously adapts as you log new activities, ensuring predictions stay relevant.",
    color: "accent",
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
  accent: { bg: "bg-accent/10", border: "border-accent/30", text: "text-accent" },
  "health-green": { bg: "bg-health-green/10", border: "border-health-green/30", text: "text-health-green" },
  "health-blue": { bg: "bg-health-blue/10", border: "border-health-blue/30", text: "text-health-blue" },
  "health-amber": { bg: "bg-health-amber/10", border: "border-health-amber/30", text: "text-health-amber" },
  "health-purple": { bg: "bg-health-purple/10", border: "border-health-purple/30", text: "text-health-purple" },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
            Powered by{" "}
            <span className="gradient-text">Predictive AI</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our advanced AI models analyze your lifestyle patterns to create a comprehensive view of your health trajectory.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const colors = colorClasses[feature.color];
            return (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-card border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                {/* Icon */}
                <div className={`inline-flex p-4 rounded-xl ${colors.bg} ${colors.border} border mb-6`}>
                  <feature.icon className={`w-6 h-6 ${colors.text}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}