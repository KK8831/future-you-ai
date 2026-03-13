import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const LogEntry = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [activityMinutes, setActivityMinutes] = useState(30);
  const [sleepHours, setSleepHours] = useState(7);
  const [dietScore, setDietScore] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [screenTimeHours, setScreenTimeHours] = useState(4);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load existing entry for selected date
  useEffect(() => {
    if (user && entryDate) {
      loadExistingEntry();
    }
  }, [user, entryDate]);

  const loadExistingEntry = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("lifestyle_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", format(entryDate, "yyyy-MM-dd"))
      .maybeSingle();

    if (data) {
      setActivityMinutes(data.physical_activity_minutes);
      setSleepHours(Number(data.sleep_hours));
      setDietScore(data.diet_quality_score);
      setStressLevel(data.stress_level);
      setScreenTimeHours(Number(data.screen_time_hours));
      setNotes(data.notes || "");
    } else {
      // Reset to defaults if no entry exists
      setActivityMinutes(30);
      setSleepHours(7);
      setDietScore(5);
      setStressLevel(5);
      setScreenTimeHours(4);
      setNotes("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    const entryData = {
      user_id: user.id,
      entry_date: format(entryDate, "yyyy-MM-dd"),
      physical_activity_minutes: activityMinutes,
      sleep_hours: sleepHours,
      diet_quality_score: dietScore,
      stress_level: stressLevel,
      screen_time_hours: screenTimeHours,
      notes: notes || null,
    };

    const { error } = await supabase
      .from("lifestyle_entries")
      .upsert(entryData, { onConflict: "user_id,entry_date" });

    setSaving(false);

    if (error) {
      toast({
        title: "Error saving entry",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({
        title: "Entry saved!",
        description: "Your lifestyle data has been recorded.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Log Daily Entry</h1>
          <p className="text-muted-foreground mt-1">
            Record your lifestyle metrics to update your digital twin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Date picker */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <Label className="text-base font-medium">Entry Date</Label>
            <p className="text-sm text-muted-foreground mb-4">Select the date for this entry</p>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12",
                    !entryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {entryDate ? format(entryDate, "EEEE, MMMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={entryDate}
                  onSelect={(date) => date && setEntryDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Physical Activity */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="text-base font-medium">Physical Activity</Label>
                <p className="text-sm text-muted-foreground">Minutes of exercise or movement</p>
              </div>
              <span className="text-2xl font-bold text-health-green">{activityMinutes} min</span>
            </div>
            <Slider
              value={[activityMinutes]}
              onValueChange={(v) => setActivityMinutes(v[0])}
              max={180}
              step={5}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 min</span>
              <span>30 min (target)</span>
              <span>180 min</span>
            </div>
          </div>

          {/* Sleep Hours */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="text-base font-medium">Sleep Duration</Label>
                <p className="text-sm text-muted-foreground">Hours of sleep last night</p>
              </div>
              <span className="text-2xl font-bold text-health-blue">{sleepHours} hrs</span>
            </div>
            <Slider
              value={[sleepHours]}
              onValueChange={(v) => setSleepHours(v[0])}
              max={12}
              step={0.5}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 hrs</span>
              <span>7-9 hrs (ideal)</span>
              <span>12 hrs</span>
            </div>
          </div>

          {/* Diet Quality */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="text-base font-medium">Diet Quality</Label>
                <p className="text-sm text-muted-foreground">Overall nutrition quality today</p>
              </div>
              <span className="text-2xl font-bold text-health-amber">{dietScore}/10</span>
            </div>
            <Slider
              value={[dietScore]}
              onValueChange={(v) => setDietScore(v[0])}
              min={1}
              max={10}
              step={1}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 (Poor)</span>
              <span>5 (Average)</span>
              <span>10 (Excellent)</span>
            </div>
          </div>

          {/* Stress Level */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="text-base font-medium">Stress Level</Label>
                <p className="text-sm text-muted-foreground">Your perceived stress today</p>
              </div>
              <span className="text-2xl font-bold text-health-purple">{stressLevel}/10</span>
            </div>
            <Slider
              value={[stressLevel]}
              onValueChange={(v) => setStressLevel(v[0])}
              min={1}
              max={10}
              step={1}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 (Relaxed)</span>
              <span>5 (Moderate)</span>
              <span>10 (Very Stressed)</span>
            </div>
          </div>

          {/* Screen Time */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="text-base font-medium">Screen Time</Label>
                <p className="text-sm text-muted-foreground">Hours on screens (phone, computer, TV)</p>
              </div>
              <span className="text-2xl font-bold text-health-red">{screenTimeHours} hrs</span>
            </div>
            <Slider
              value={[screenTimeHours]}
              onValueChange={(v) => setScreenTimeHours(v[0])}
              max={16}
              step={0.5}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 hrs</span>
              <span>&lt;6 hrs (goal)</span>
              <span>16 hrs</span>
            </div>
          </div>

          {/* Notes */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <Label htmlFor="notes" className="text-base font-medium">Additional Notes</Label>
            <p className="text-sm text-muted-foreground mb-4">Any extra details about your day</p>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Had a stressful meeting, went for a long walk, ate mostly vegetables..."
              className="min-h-24"
            />
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            variant="hero"
            size="xl"
            className="w-full"
            disabled={saving}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                Saving...
              </span>
            ) : saved ? (
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                Saved!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-5 h-5" />
                Save Entry
              </span>
            )}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default LogEntry;