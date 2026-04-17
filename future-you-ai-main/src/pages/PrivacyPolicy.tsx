import { Link } from "react-router-dom";
import { Shield, Mail, Phone } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <BrandLogo size="sm" />
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">Privacy Policy</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div>
          <div className="inline-flex items-center gap-2 bg-teal-500/10 text-teal-600 text-sm font-medium px-3 py-1 rounded-full mb-4">
            <Shield className="w-4 h-4" />
            Privacy Policy
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Your Privacy Matters
          </h1>
          <p className="text-muted-foreground mt-2">Last Updated: April 6, 2026</p>
          <p className="text-muted-foreground">
            This policy explains how FutureMe AI collects, uses, and safeguards your personal health data.
          </p>
        </div>

        {[
          {
            title: "1. Information We Collect",
            content: [
              "We collect the following personal information:",
              "Profile Data: Name, age, sex, weight, height.",
              "Health Metrics: Steps, heart rate, sleep duration, physical activity, blood pressure, and blood glucose.",
              "Sensor Data (Android only): Camera data is processed locally for optical heart rate measurement (PPG). Video frames are NEVER saved or transmitted.",
              "Health Connect Data: Read/write access to steps, activity, and vitals from other fitness apps.",
              "Medical Reports: Uploaded blood test reports and their extracted health values.",
            ],
          },
          {
            title: "2. How We Use Your Information",
            content: [
              "To calculate your biological age and generate personalized health predictions.",
              "To power AI-driven recommendations and Future Self simulations.",
              "To provide health risk scores and longevity forecasts based on established medical research.",
              "To improve our predictive algorithms (using anonymized, aggregated data only).",
              "We never sell your health data to third parties.",
            ],
          },
          {
            title: "3. Data Storage & Security",
            content: [
              "All data is stored on Supabase infrastructure with row-level security (RLS) policies — only you can access your own records.",
              "Passwords are hashed and never stored in plaintext.",
              "All data is transmitted over HTTPS/TLS encryption.",
              "Camera-based heart rate measurements are processed locally on your device and never stored as video or images.",
            ],
          },
          {
            title: "4. Your Rights",
            content: [
              "Access: You can view all your stored health data from your Profile settings.",
              "Export: You can export your data at any time from the AI Insights page.",
              "Deletion: You can permanently delete your account and all associated data from your Profile settings. Deletion is immediate and irreversible.",
              "Correction: You can edit any health data entry at any time from the Log Entry page.",
            ],
          },
          {
            title: "5. Third-Party Services",
            content: [
              "Supabase (database & authentication) — supabase.com/privacy",
              "Google Gemini AI (AI recommendations) — policies.google.com/privacy",
              "We do not integrate with advertising networks or data brokers.",
            ],
          },
          {
            title: "6. Children's Privacy",
            content: [
              "FutureMe AI is not intended for users under 13 years of age. We do not knowingly collect data from children.",
            ],
          },
          {
            title: "7. Changes to This Policy",
            content: [
              "We will notify you via email and in-app notification if this policy changes materially. Continued use of the app after changes constitutes acceptance.",
            ],
          },
        ].map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              {section.title}
            </h2>
            <ul className="space-y-2">
              {section.content.map((item, i) => (
                <li key={i} className="flex gap-3 text-muted-foreground text-sm leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Contact */}
        <section className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            Contact Us
          </h2>
          <p>
            In accordance with GDPR, DPDPA, and Google Play policies, you have the right to request the deletion of your personal data.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <strong>How to delete your data:</strong> You can delete your account and all associated health data directly within the app by going to <strong>Profile Settings {'>'} Danger Zone {'>'} Delete Account</strong>. Alternatively, you can request data deletion by emailing us at <a href="mailto:privacy@futureme.ai" className="text-teal-500 underline">privacy@futureme.ai</a>. 
            Upon deletion, all your health records, predictions, and profile information will be permanently erased from our servers within 30 days.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <strong>How to export your data:</strong> You can download a structured JSON copy of all your stored data via <strong>Profile Settings {'>'} Export My Data</strong>.
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <a
              href="mailto:privacy@futureme.ai"
              className="flex items-center gap-2 text-teal-500 hover:underline"
            >
              <Mail className="w-4 h-4" />
              privacy@futureme.ai
            </a>
            <a
              href="tel:8432614795"
              className="flex items-center gap-2 text-teal-500 hover:underline"
            >
              <Phone className="w-4 h-4" />
              +91 8432614795
            </a>
          </div>
        </section>

        <div className="text-center pt-4 border-t border-border">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to FutureMe AI
          </Link>
        </div>
      </main>
    </div>
  );
}
