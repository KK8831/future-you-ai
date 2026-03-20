import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VoiceHealthInput } from "@/components/smart-collect/VoiceHealthInput";
import { CameraHeartRate } from "@/components/smart-collect/CameraHeartRate";
import { MedicalReportOCR } from "@/components/smart-collect/MedicalReportOCR";
import { GoogleFitConnect } from "@/components/smart-collect/GoogleFitConnect";
import { ScreenTimeCollect } from "@/components/smart-collect/ScreenTimeCollect";
import { Smartphone, Mic, Camera, FileText, Activity, Monitor } from "lucide-react";

const SmartCollect = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6 animate-fade-in">
        {/* Page header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Smart Data Collection
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Collect health data using your smartphone sensors, voice, and
              camera — all synced to your health profile
            </p>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Voice Health Logging */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-health-blue/10 flex items-center justify-center">
                <Mic className="w-5 h-5 text-health-blue" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-display font-semibold text-foreground">
                    Voice Health Log
                  </h2>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-health-green/10 text-health-green border border-health-green/20">
                    Browser
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Speak your health data naturally
                </p>
              </div>
            </div>
            <VoiceHealthInput userId={user?.id} />
          </div>

          {/* Camera Heart Rate */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-health-red/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-health-red" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-display font-semibold text-foreground">
                    Heart Rate Detection
                  </h2>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-health-green/10 text-health-green border border-health-green/20">
                    Browser
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Place finger on camera to measure BPM
                </p>
              </div>
            </div>
            <CameraHeartRate userId={user?.id} />
          </div>

          {/* Medical Report OCR */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-health-green/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-health-green" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-display font-semibold text-foreground">
                    Medical Report Scanner
                  </h2>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-health-green/10 text-health-green border border-health-green/20">
                    Browser
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Scan lab reports to auto-extract values
                </p>
              </div>
            </div>
            <MedicalReportOCR userId={user?.id} />
          </div>

          {/* Google Fit / Health Connect */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-health-amber/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-health-amber" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-display font-semibold text-foreground">
                    Google Fit / Health Connect
                  </h2>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-health-amber/10 text-health-amber border border-health-amber/20">
                    Android
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sync wearable & fitness data
                </p>
              </div>
            </div>
            <GoogleFitConnect userId={user?.id} />
          </div>

          {/* Screen Time Tracker */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-display font-semibold text-foreground">
                    Screen Time Tracker
                  </h2>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    Android
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-fetch daily screen time from your device
                </p>
              </div>
            </div>
            <ScreenTimeCollect userId={user?.id} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SmartCollect;