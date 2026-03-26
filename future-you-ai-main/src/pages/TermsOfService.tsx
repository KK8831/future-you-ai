import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Shield, Lock, Eye, FileText, Scale } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-4xl py-12 px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-accent/10">
            <Scale className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold">Terms of Service</h1>
            <p className="text-muted-foreground mt-2">Last Updated: March 22, 2024</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
          <section className="bg-secondary/30 p-6 rounded-xl border border-border">
            <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              1. Agreement to Terms
            </h2>
            <p>
              By accessing or using FutureMe AI, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-4">2. Use of Service</h2>
            <p>
              FutureMe AI provides health projections, data analysis, and wellness recommendations based on user-provided data and wearable device synchronization.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>You must be at least 18 years old to use this service.</li>
              <li>You are responsible for maintaining the confidentiality of your account.</li>
              <li>The service is for personal, non-commercial use only.</li>
            </ul>
          </section>

          <section className="p-6 rounded-xl border border-health-amber/30 bg-health-amber/5">
            <h2 className="text-xl font-display font-bold text-health-amber mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              3. Medical Disclaimer
            </h2>
            <p className="text-foreground font-medium">
              FUTUREME AI IS NOT A MEDICAL DEVICE AND DOES NOT PROVIDE MEDICAL ADVICE.
            </p>
            <p className="mt-2 text-sm italic">
              All projections, scores (Framingham, FINDRISC), and AI-generated insights are for educational and informational purposes only. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-accent" />
              4. Data Privacy & Wearables
            </h2>
            <p>
              Your data is stored securely using Supabase (Postgres with AES-256 encryption). We only access Google Fit/Health Connect data with your explicit permission as outlined in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-4">5. Intellectual Property</h2>
            <p>
              The service and its original content, features, and functionality are and will remain the exclusive property of FutureMe AI and its licensors.
            </p>
          </section>

          <section className="text-sm border-t border-border pt-8">
            <p>Questions about these terms? Contact us at support@futureme.ai</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
