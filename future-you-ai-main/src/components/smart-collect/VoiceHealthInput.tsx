import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  Check,
  AlertCircle,
  Settings,
  Info,
} from "lucide-react";
import { format } from "date-fns";

interface VoiceHealthInputProps {
  userId?: string;
}

interface ExtractedData {
  physical_activity_minutes?: number;
  sleep_hours?: number;
  diet_quality_score?: number;
  stress_level?: number;
  screen_time_hours?: number;
  steps?: number;
  heart_rate?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  blood_glucose?: number;
  weight_kg?: number;
  symptoms?: string[];
  notes?: string;
  confidence?: number;
}

const paramLabels: Record<string, string> = {
  physical_activity_minutes: "Activity (min)",
  sleep_hours: "Sleep (hrs)",
  diet_quality_score: "Diet Quality",
  stress_level: "Stress Level",
  screen_time_hours: "Screen Time (hrs)",
  steps: "Steps",
  heart_rate: "Heart Rate (BPM)",
  blood_pressure_systolic: "BP Systolic",
  blood_pressure_diastolic: "BP Diastolic",
  blood_glucose: "Blood Glucose (mg/dL)",
  weight_kg: "Weight (kg)",
};

export function VoiceHealthInput({ userId }: VoiceHealthInputProps) {
  const {
    isListening,
    transcript,
    error,
    isSupported,
    isPermissionDenied,
    startListening,
    stopListening,
    clearTranscript,
  } = useVoiceInput();
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(
    null
  );
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const processTranscript = async () => {
    if (!transcript.trim()) return;
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "process-voice-input",
        {
          body: { transcript },
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setExtractedData(data.extracted);
      toast({
        title: "Data extracted!",
        description: "Review the extracted values below.",
      });
    } catch (e: any) {
      toast({
        title: "Processing failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const saveExtractedData = async () => {
    if (!userId || !extractedData) return;
    setSaving(true);

    try {
      const today = format(new Date(), "yyyy-MM-dd");

      const lifestyleFields: Record<string, any> = {};
      if (extractedData.physical_activity_minutes != null)
        lifestyleFields.physical_activity_minutes =
          extractedData.physical_activity_minutes;
      if (extractedData.sleep_hours != null)
        lifestyleFields.sleep_hours = extractedData.sleep_hours;
      if (extractedData.diet_quality_score != null)
        lifestyleFields.diet_quality_score = extractedData.diet_quality_score;
      if (extractedData.stress_level != null)
        lifestyleFields.stress_level = extractedData.stress_level;
      if (extractedData.screen_time_hours != null)
        lifestyleFields.screen_time_hours = extractedData.screen_time_hours;
      if (extractedData.notes) lifestyleFields.notes = extractedData.notes;
      if (extractedData.symptoms?.length) {
        lifestyleFields.notes = [
          lifestyleFields.notes,
          `Symptoms: ${extractedData.symptoms.join(", ")}`,
        ]
          .filter(Boolean)
          .join(". ");
      }

      if (Object.keys(lifestyleFields).length > 0) {
        await supabase.from("lifestyle_entries").upsert(
          { user_id: userId, entry_date: today, ...lifestyleFields },
          { onConflict: "user_id,entry_date" }
        );
      }

      const wearableEntries: any[] = [];
      if (extractedData.heart_rate != null) {
        wearableEntries.push({
          user_id: userId,
          data_type: "heart_rate",
          value: extractedData.heart_rate,
          unit: "bpm",
          source: "voice_input",
        });
      }
      if (extractedData.steps != null) {
        wearableEntries.push({
          user_id: userId,
          data_type: "steps",
          value: extractedData.steps,
          unit: "count",
          source: "voice_input",
        });
      }
      if (extractedData.blood_glucose != null) {
        wearableEntries.push({
          user_id: userId,
          data_type: "blood_glucose",
          value: extractedData.blood_glucose,
          unit: "mg/dL",
          source: "voice_input",
        });
      }

      if (wearableEntries.length > 0) {
        await supabase.from("wearable_data").insert(wearableEntries);
      }

      const profileFields: Record<string, any> = {};
      if (extractedData.weight_kg != null)
        profileFields.weight_kg = extractedData.weight_kg;
      if (extractedData.blood_pressure_systolic != null)
        profileFields.blood_pressure_systolic =
          extractedData.blood_pressure_systolic;
      if (extractedData.blood_pressure_diastolic != null)
        profileFields.blood_pressure_diastolic =
          extractedData.blood_pressure_diastolic;

      if (Object.keys(profileFields).length > 0) {
        await supabase
          .from("profiles")
          .update(profileFields)
          .eq("user_id", userId);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({
        title: "Data saved!",
        description: "Health parameters updated from voice input.",
      });
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Not supported — show a clear, styled card
  if (!isSupported) {
    return (
      <div className="rounded-xl bg-health-amber/5 border border-health-amber/30 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-health-amber/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-health-amber" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Speech Recognition Not Available
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your current browser doesn't support the Web Speech API.
            </p>
          </div>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground pl-11">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-health-green flex-shrink-0" />
            Use <strong className="text-foreground">Google Chrome</strong> on
            Android or desktop
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-health-green flex-shrink-0" />
            Page must be served over{" "}
            <strong className="text-foreground">HTTPS</strong> (or localhost)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-health-amber flex-shrink-0" />
            Firefox, Safari, and Edge have limited speech support
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upfront permission notice */}
      {!isListening && !transcript && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-health-blue/5 border border-health-blue/20">
          <Info className="w-4 h-4 text-health-blue mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Your browser will ask for <strong>microphone access</strong> — click{" "}
            <strong>Allow</strong> when prompted.
          </p>
        </div>
      )}

      {/* Recording controls */}
      <div className="flex items-center gap-3">
        <Button
          variant={isListening ? "destructive" : "default"}
          onClick={isListening ? stopListening : startListening}
          className="flex-1"
        >
          {isListening ? (
            <span className="flex items-center gap-2">
              <MicOff className="w-4 h-4" /> Stop Recording
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Mic className="w-4 h-4" /> Start Speaking
            </span>
          )}
        </Button>
      </div>

      {/* Live indicator */}
      {isListening && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-health-red/5 border border-health-red/20">
          <div className="w-3 h-3 rounded-full bg-health-red animate-pulse" />
          <span className="text-sm text-health-red font-medium">
            Listening...
          </span>
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div className="p-4 rounded-lg bg-secondary/30 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Transcript:</p>
          <p className="text-sm text-foreground">{transcript}</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={processTranscript} disabled={processing}>
              {processing ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Send className="w-3 h-3" /> Extract Data
                </span>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={clearTranscript}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Extracted data preview */}
      {extractedData && (
        <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
          <p className="text-xs text-accent font-medium mb-2">
            Extracted Parameters (Confidence:{" "}
            {Math.round((extractedData.confidence || 0) * 100)}%)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(extractedData)
              .filter(
                ([key, val]) =>
                  val != null &&
                  key !== "confidence" &&
                  key !== "notes" &&
                  key !== "symptoms" &&
                  paramLabels[key]
              )
              .map(([key, val]) => (
                <div key={key} className="p-2 rounded-md bg-card text-sm">
                  <span className="text-muted-foreground">
                    {paramLabels[key]}:
                  </span>{" "}
                  <span className="font-semibold text-foreground">
                    {val as any}
                  </span>
                </div>
              ))}
          </div>
          {extractedData.symptoms && extractedData.symptoms.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Symptoms: {extractedData.symptoms.join(", ")}
            </p>
          )}
          <Button
            size="sm"
            className="mt-3 w-full"
            onClick={saveExtractedData}
            disabled={saving}
          >
            {saved ? (
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" /> Saved!
              </span>
            ) : saving ? (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </span>
            ) : (
              "Save to Health Profile"
            )}
          </Button>
        </div>
      )}

      {/* Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Try saying:</p>
        <p>"I slept 6 hours and walked 8000 steps today"</p>
        <p>"My blood pressure is 120 over 80"</p>
        <p>"I had a healthy breakfast, stress level is moderate"</p>
      </div>

      {/* Error with permission guidance */}
      {error && (
        <div className="rounded-lg bg-health-red/10 border border-health-red/30 p-3 space-y-2">
          <p className="text-xs text-health-red">{error}</p>
          {isPermissionDenied && (
            <div className="flex items-start gap-2 pt-1">
              <Settings className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                In Chrome: click the lock/camera icon in the address bar →{" "}
                <strong>Microphone → Allow</strong>, then refresh the page.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
