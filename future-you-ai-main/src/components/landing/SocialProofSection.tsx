import { Trophy, Flame, Users, Zap, Shield, BarChart3 } from "lucide-react";

const stats = [
  { icon: Trophy, value: "15+", label: "Achievements to Unlock", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { icon: Flame,  value: "100+", label: "Day Streak Challenge", color: "text-orange-500", bg: "bg-orange-500/10" },
  { icon: Users,  value: "Global", label: "Health Leaderboards", color: "text-blue-500", bg: "bg-blue-500/10" },
  { icon: Zap,    value: "4", label: "AI Analysis Agents", color: "text-purple-500", bg: "bg-purple-500/10" },
  { icon: Shield, value: "E2E", label: "Encrypted & Private", color: "text-green-500", bg: "bg-green-500/10" },
  { icon: BarChart3, value: "PDF", label: "Health Reports", color: "text-cyan-500", bg: "bg-cyan-500/10" },
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Fitness Enthusiast",
    text: "FutureMe AI made me realize my sleep was the bottleneck. After following the AI recommendations, my energy levels skyrocketed.",
    avatar: "S",
    color: "bg-pink-500",
  },
  {
    name: "Dr. Raj P.",
    role: "General Practitioner",
    text: "I recommend FutureMe to my patients. The PDF health reports are remarkably detailed and help in our consultations.",
    avatar: "R",
    color: "bg-blue-500",
  },
  {
    name: "Alex K.",
    role: "Marathon Runner",
    text: "The streak system and achievements keep me accountable. I've logged every single day for 47 days now!",
    avatar: "A",
    color: "bg-green-500",
  },
];

export function SocialProofSection() {
  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-6">
        {/* Stats Row */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-health-blue">Serious Results</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every feature is designed to help you build lasting habits and make data-driven health decisions.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-20">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="text-center p-5 rounded-2xl bg-card border border-border hover:border-accent/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
            >
              <div className={`inline-flex p-3 rounded-xl ${stat.bg} mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-display font-bold text-foreground group-hover:text-accent transition-colors">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Loved by Health-Conscious People
          </h3>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-card border border-border hover:border-accent/20 transition-all duration-300 hover:shadow-lg"
            >
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}
