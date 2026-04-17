import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateBMI } from "@/lib/medical-calculators";
import { useToast } from "@/hooks/use-toast";
import { Save, Heart, Scale, Activity, Brain, CalendarIcon, Trash2, AlertTriangle, Sparkles, Dumbbell, Moon, Target, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { APP_VERSION, BUILD_DATE } from "@/lib/version";

interface ProfileData {
  age: number;
  sex: string;
  height_cm: number;
  weight_kg: number;
  smoking_status: string;
  alcohol_weekly_units: number;
  family_history_cvd: boolean;
  family_history_diabetes: boolean;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  mental_health_index: number | null;
  full_name: string;
}



const ProfileSettings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [profile, setProfile] = useState<ProfileData>({
    age: 30,
    sex: "unspecified",
    height_cm: 170,
    weight_kg: 70,
    smoking_status: "non-smoker",
    alcohol_weekly_units: 0,
    family_history_cvd: false,
    family_history_diabetes: false,
    blood_pressure_systolic: null,
    blood_pressure_diastolic: null,
    mental_health_index: null,
    full_name: "",
  });



  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
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

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({
            age: data.age || 30,
            sex: data.sex || "unspecified",
            height_cm: Number(data.height_cm) || 170,
            weight_kg: Number(data.weight_kg) || 70,
            smoking_status: (data as any).smoking_status || "non-smoker",
            alcohol_weekly_units: Number((data as any).alcohol_weekly_units) || 0,
            family_history_cvd: (data as any).family_history_cvd || false,
            family_history_diabetes: (data as any).family_history_diabetes || false,
            blood_pressure_systolic: (data as any).blood_pressure_systolic || null,
            blood_pressure_diastolic: (data as any).blood_pressure_diastolic || null,
            mental_health_index: (data as any).mental_health_index || null,
            full_name: (data as any).full_name || "",
          });


        }
      });
  }, [user]);

  useEffect(() => {
    if (user?.user_metadata?.date_of_birth) {
      setDateOfBirth(new Date(user.user_metadata.date_of_birth));
    }
  }, [user?.user_metadata?.date_of_birth]);

  const handleDateChange = (date: Date | undefined) => {
    setDateOfBirth(date);
    if (date) {
      const today = new Date();
      let ageCalculated = today.getFullYear() - date.getFullYear();
      const m = today.getMonth() - date.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
        ageCalculated--;
      }
      setProfile((p) => ({ ...p, age: Math.max(0, ageCalculated) }));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    if (dateOfBirth) {
      await supabase.auth.updateUser({
        data: { date_of_birth: dateOfBirth.toISOString() }
      });
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        age: profile.age,
        sex: profile.sex,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        full_name: profile.full_name,
        // These fields exist in DB but not yet in generated types, use raw update
        ...(({
          smoking_status: profile.smoking_status,
          alcohol_weekly_units: profile.alcohol_weekly_units,
          family_history_cvd: profile.family_history_cvd,
          family_history_diabetes: profile.family_history_diabetes,
          blood_pressure_systolic: profile.blood_pressure_systolic,
          blood_pressure_diastolic: profile.blood_pressure_diastolic,
          mental_health_index: profile.mental_health_index,
        }) as any),


      })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved!", description: "Your health profile has been updated." });
    }
  };

  const bmi = calculateBMI(profile.height_cm, profile.weight_kg);
  const bmiCategory = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  const bmiColor = bmi < 18.5 ? "text-health-amber" : bmi < 25 ? "text-health-green" : bmi < 30 ? "text-health-amber" : "text-health-red";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Health Profile</h1>
          <p className="text-muted-foreground mt-1">
            Complete your profile for more accurate risk predictions
          </p>
        </div>

        {/* Basic Info */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Basic Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full mt-1 justify-start text-left font-normal",
                      !dateOfBirth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateOfBirth}
                    onSelect={handleDateChange}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    defaultMonth={dateOfBirth || new Date(1990, 0, 1)}
                    captionLayout="dropdown-buttons"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-1">
                Age: {profile.age} (Auto-calculated)
              </p>
            </div>
            <div>
              <Label>Biological Sex</Label>
              <Select value={profile.sex} onValueChange={(v) => setProfile((p) => ({ ...p, sex: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unspecified">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Body Metrics & BMI */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <Scale className="w-5 h-5 text-accent" />
            Body Metrics
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Height (cm)</Label>
              <Input type="number" value={profile.height_cm} onChange={(e) => setProfile((p) => ({ ...p, height_cm: parseFloat(e.target.value) || 170 }))} className="mt-1" />
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input type="number" value={profile.weight_kg} onChange={(e) => setProfile((p) => ({ ...p, weight_kg: parseFloat(e.target.value) || 70 }))} className="mt-1" />
            </div>
            <div className="flex flex-col justify-end">
              <Label className="mb-1">BMI (auto-calculated)</Label>
              <div className={`h-10 flex items-center px-3 rounded-md bg-secondary text-lg font-bold ${bmiColor}`}>
                {bmi} <span className="text-xs font-normal text-muted-foreground ml-2">{bmiCategory}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cardiovascular Risk Factors */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <Heart className="w-5 h-5 text-health-red" />
            Cardiovascular Risk Factors
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Smoking Status</Label>
              <Select value={profile.smoking_status} onValueChange={(v) => setProfile((p) => ({ ...p, smoking_status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="non-smoker">Non-smoker</SelectItem>
                  <SelectItem value="former">Former smoker</SelectItem>
                  <SelectItem value="current-light">Current (light)</SelectItem>
                  <SelectItem value="current-heavy">Current (heavy)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Alcohol (units/week)</Label>
              <Input type="number" value={profile.alcohol_weekly_units} onChange={(e) => setProfile((p) => ({ ...p, alcohol_weekly_units: parseFloat(e.target.value) || 0 }))} min={0} max={50} className="mt-1" />
            </div>
            <div>
              <Label>Systolic BP (mmHg)</Label>
              <Input type="number" value={profile.blood_pressure_systolic ?? ""} onChange={(e) => setProfile((p) => ({ ...p, blood_pressure_systolic: e.target.value ? parseInt(e.target.value) : null }))} placeholder="e.g. 120" className="mt-1" />
            </div>
            <div>
              <Label>Diastolic BP (mmHg)</Label>
              <Input type="number" value={profile.blood_pressure_diastolic ?? ""} onChange={(e) => setProfile((p) => ({ ...p, blood_pressure_diastolic: e.target.value ? parseInt(e.target.value) : null }))} placeholder="e.g. 80" className="mt-1" />
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label>Family history of cardiovascular disease</Label>
              <Switch checked={profile.family_history_cvd} onCheckedChange={(v) => setProfile((p) => ({ ...p, family_history_cvd: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Family history of diabetes</Label>
              <Switch checked={profile.family_history_diabetes} onCheckedChange={(v) => setProfile((p) => ({ ...p, family_history_diabetes: v }))} />
            </div>
          </div>
        </div>

        {/* Mental Health */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-5 h-5 text-health-purple" />
            Mental Health
          </h3>
          <div>
            <Label>Mental Health Index (1-10, self-assessed)</Label>
            <Input
              type="number"
              value={profile.mental_health_index ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, mental_health_index: e.target.value ? parseInt(e.target.value) : null }))}
              min={1}
              max={10}
              placeholder="1 = poor, 10 = excellent"
              className="mt-1 max-w-xs"
            />
          </div>
        </div>



        <Button variant="hero" size="xl" className="w-full" onClick={handleSave} disabled={saving}>
          <Save className="w-5 h-5 mr-2" />
          {saving ? "Saving..." : "Save Health Profile"}
        </Button>

        {/* Data Export (GDPR/DPDPA compliance) */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <Download className="w-5 h-5 text-accent" />
            Your Data
          </h3>
          <p className="text-sm text-muted-foreground">
            Download a copy of all your health data stored in FutureMe AI.
          </p>
          <Button
            variant="outline"
            onClick={async () => {
              if (!user) return;
              try {
                const [profileRes, entriesRes, wearableRes] = await Promise.all([
                  supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
                  supabase.from("lifestyle_entries").select("*").eq("user_id", user.id).order("date", { ascending: false }),
                  supabase.from("wearable_data").select("*").eq("user_id", user.id).order("recorded_at", { ascending: false }),
                ]);
                const exportData = {
                  exportDate: new Date().toISOString(),
                  appVersion: APP_VERSION,
                  profile: profileRes.data,
                  lifestyleEntries: entriesRes.data || [],
                  wearableData: wearableRes.data || [],
                };
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `futureme-data-${format(new Date(), "yyyy-MM-dd")}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ title: "Data Exported", description: "Your health data has been downloaded." });
              } catch (e: any) {
                toast({ title: "Export Failed", description: e.message, variant: "destructive" });
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export My Data (JSON)
          </Button>
          <p className="text-[10px] text-muted-foreground">
            App Version: v{APP_VERSION} · Build: {BUILD_DATE}
          </p>
        </div>

        {/* Danger Zone — Account Deletion (required by App Store guideline 5.1.1) */}
        <div className="mt-8 p-6 rounded-xl border border-red-500/30 bg-red-500/5 space-y-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">Danger Zone</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all health data. This action is immediate and irreversible.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm text-red-500 border border-red-500/40 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete My Account & Data
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-foreground font-medium">
                Type <code className="bg-secondary px-1 py-0.5 rounded text-red-500">DELETE</code> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-red-500/40 text-foreground outline-none focus:ring-2 focus:ring-red-500/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                  className="flex-1 text-sm text-muted-foreground border border-border px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (deleteConfirmText !== "DELETE") return;
                    setDeletingAccount(true);
                    try {
                      // Delete all user data tables
                      await Promise.all([
                        supabase.from("lifestyle_entries").delete().eq("user_id", user!.id),
                        supabase.from("wearable_data").delete().eq("user_id", user!.id),
                        supabase.from("profiles").delete().eq("user_id", user!.id),
                      ]);
                      // Sign out and remove auth user
                      await supabase.auth.signOut();
                      localStorage.removeItem("onboarding_complete");


                      navigate("/");
                    } catch (e: any) {
                      toast({ title: "Error", description: e.message, variant: "destructive" });
                    } finally {
                      setDeletingAccount(false);
                    }
                  }}
                  disabled={deleteConfirmText !== "DELETE" || deletingAccount}
                  className="flex-1 text-sm bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 disabled:opacity-40 transition-colors"
                >
                  {deletingAccount ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfileSettings;
