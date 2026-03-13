import { ClipboardList, Cpu, LineChart, Lightbulb } from "lucide-react";

const steps = [
  {
    step: 1,
    icon: ClipboardList,
    title: "Log Your Lifestyle",
    description: "Record daily activities, sleep patterns, diet, stress levels, and screen time through our intuitive interface.",
  },
  {
    step: 2,
    icon: Cpu,
    title: "AI Builds Your Twin",
    description: "Our AI continuously processes your data to create and update a dynamic digital representation of your lifestyle.",
  },
  {
    step: 3,
    icon: LineChart,
    title: "Simulate Future Scenarios",
    description: "Explore 'what-if' scenarios to see how lifestyle changes could impact your health over 1-10 years.",
  },
  {
    step: 4,
    icon: Lightbulb,
    title: "Get Actionable Insights",
    description: "Receive personalized recommendations to reduce health risks and optimize your wellness journey.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-secondary/30 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to unlock your predictive health intelligence
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0 -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                {/* Step card */}
                <div className="relative z-10 p-8 rounded-2xl bg-card border border-border text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-accent/40">
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center shadow-lg">
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <step.icon className="w-8 h-8 text-accent" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}