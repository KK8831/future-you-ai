import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  Upload,
  Loader2,
  Check,
  FileImage,
  AlertTriangle,
  ImageIcon,
  Download,
} from "lucide-react";
import { usePdfExport } from "@/hooks/usePdfExport";

interface MedicalReportOCRProps {
  userId?: string;
}

interface ExtractedValue {
  parameter: string;
  value: number;
  unit: string;
  normal_range?: string;
  status?: "normal" | "low" | "high" | "critical";
}

interface OCRResult {
  report_type?: string;
  report_date?: string;
  lab_name?: string;
  doctor_name?: string;
  values: ExtractedValue[];
  confidence: number;
  notes?: string;
}

export function MedicalReportOCR({ userId }: MedicalReportOCRProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { exportToPdf, isExporting } = usePdfExport({ filename: "Medical_Report_OCR.pdf" });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum 10MB allowed.",
        variant: "destructive",
      });
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(",")[1]);
      setResult(null);
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const processReport = async () => {
    if (!imageBase64) return;
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "process-medical-report",
        {
          body: { imageBase64, mimeType },
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data.extracted);
      toast({
        title: "Report scanned!",
        description: `${data.extracted?.values?.length || 0} values extracted.`,
      });
    } catch (e: any) {
      toast({
        title: "OCR failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const saveResults = async () => {
    if (!userId || !result) return;
    setSaving(true);

    try {
      const profileUpdates: Record<string, any> = {};
      const wearableEntries: any[] = [];

      for (const v of result.values) {
        const key = v.parameter.toLowerCase().replace(/\s+/g, "_");

        if (key.includes("blood_pressure") && key.includes("systolic"))
          profileUpdates.blood_pressure_systolic = v.value;
        else if (key.includes("blood_pressure") && key.includes("diastolic"))
          profileUpdates.blood_pressure_diastolic = v.value;
        else if (key.includes("weight")) profileUpdates.weight_kg = v.value;
        else if (key.includes("height")) profileUpdates.height_cm = v.value;
        else {
          wearableEntries.push({
            user_id: userId,
            data_type: key,
            value: v.value,
            unit: v.unit,
            source: "medical_report_ocr",
            metadata: { normal_range: v.normal_range, status: v.status },
          });
        }
      }

      await supabase.from("medical_reports" as any).insert({
        user_id: userId,
        report_date:
          result.report_date || new Date().toISOString().split("T")[0],
        extracted_data: result,
        source: "camera_ocr",
      });

      if (Object.keys(profileUpdates).length > 0) {
        await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("user_id", userId);
      }

      if (wearableEntries.length > 0) {
        await supabase.from("wearable_data").insert(wearableEntries);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({
        title: "Report data saved!",
        description: "Health parameters updated from medical report.",
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

  const statusColor = (status?: string) => {
    switch (status) {
      case "normal":
        return "text-health-green";
      case "low":
        return "text-health-amber";
      case "high":
        return "text-health-amber";
      case "critical":
        return "text-health-red";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      {/* Desktop/gallery file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      {/* Mobile camera capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {!imagePreview ? (
        <div className="space-y-3">
          {/* Two clear buttons: gallery vs camera */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-5 rounded-xl border-2 border-dashed border-border hover:border-accent/50 transition-colors flex flex-col items-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                <ImageIcon className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Upload File
                </p>
                <p className="text-[11px] text-muted-foreground">
                  From gallery or disk
                </p>
              </div>
            </button>

            <button
              onClick={() => cameraInputRef.current?.click()}
              className="p-5 rounded-xl border-2 border-dashed border-border hover:border-accent/50 transition-colors flex flex-col items-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                <Camera className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Take Photo
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Mobile camera
                </p>
              </div>
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Supports JPG, PNG, WEBP — Max 10 MB
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img
              src={imagePreview}
              alt="Medical report"
              className="w-full max-h-48 object-cover"
            />
            <button
              onClick={() => {
                setImagePreview(null);
                setImageBase64(null);
                setResult(null);
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-card/80 text-foreground hover:bg-card text-base leading-none"
            >
              ×
            </button>
          </div>

          {!result && (
            <Button
              className="w-full"
              onClick={processReport}
              disabled={processing}
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Scanning
                  report...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FileImage className="w-4 h-4" /> Extract Health Values
                </span>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="p-4 rounded-lg bg-accent/5 border border-accent/20" id="ocr-results">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-accent font-medium">
              {result.report_type || "Medical Report"} — Confidence:{" "}
              {Math.round(result.confidence * 100)}%
            </p>
            {result.lab_name && (
              <p className="text-xs text-muted-foreground">{result.lab_name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            {result.values.map((v, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-md bg-card text-sm"
              >
                <span className="text-muted-foreground">{v.parameter}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {v.value} {v.unit}
                  </span>
                  {v.status && v.status !== "normal" && (
                    <AlertTriangle
                      className={`w-3.5 h-3.5 ${statusColor(v.status)}`}
                    />
                  )}
                  {v.status && (
                    <span className={`text-xs ${statusColor(v.status)}`}>
                      {v.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {result.notes && (
            <p className="text-xs text-muted-foreground mt-2">{result.notes}</p>
          )}

          <div className="grid grid-cols-2 gap-3 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportToPdf("ocr-results")}
              disabled={isExporting}
            >
              {isExporting ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> PDF...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" /> Save PDF
                </span>
              )}
            </Button>
            <Button
              size="sm"
              onClick={saveResults}
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
                <span className="flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Save Values
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
