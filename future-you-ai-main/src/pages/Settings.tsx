import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "@/components/theme-provider";
import {
  Bell,
  Moon,
  Sun,
  Shield,
  Download,
  Trash2,
  AlertTriangle,
  Settings as SettingsIcon,
  Palette,
  Database,
  Lock,
  FileDown,
} from "lucide-react";

const Settings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { hasPermission, scheduleDailyStreakReminder } = useNotifications();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    setNotificationsEnabled(hasPermission);
  }, [hasPermission]);

  const handleNotificationToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    await scheduleDailyStreakReminder(enabled);
    toast({
      title: enabled ? "Notifications Enabled 🔔" : "Notifications Disabled",
      description: enabled
        ? "You'll receive a daily reminder at 8:00 PM to log your health data."
        : "Daily reminders have been turned off.",
    });
  };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);

    try {
      const [entriesRes, profileRes, wearableRes] = await Promise.all([
        supabase.from("lifestyle_entries").select("*").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("wearable_data").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: profileRes.data,
        lifestyleEntries: entriesRes.data || [],
        wearableData: wearableRes.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `futureme_data_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Data Exported ✅", description: "Your health data has been downloaded as a JSON file." });
    } catch (e) {
      toast({ title: "Export Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    }

    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE" || !user) return;
    setDeleting(true);

    try {
      // Delete all user data from tables
      await Promise.all([
        supabase.from("lifestyle_entries").delete().eq("user_id", user.id),
        supabase.from("wearable_data").delete().eq("user_id", user.id),
        supabase.from("simulations").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("user_id", user.id),
      ]);

      await supabase.auth.signOut();
      toast({ title: "Account Deleted", description: "All your data has been permanently removed." });
      navigate("/");
    } catch (e) {
      toast({ title: "Deletion Failed", description: "Please contact support.", variant: "destructive" });
    }

    setDeleting(false);
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex h-full items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pt-4">

        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-accent" /> Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage your preferences, privacy, and data.</p>
        </div>

        {/* Appearance */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-4 h-4 text-accent" /> Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                <div>
                  <Label className="font-medium">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Switch between light and dark themes.</p>
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-orange-500" />
                <div>
                  <Label className="font-medium">Daily Streak Reminder</Label>
                  <p className="text-xs text-muted-foreground">Get a push notification at 8:00 PM to log your data.</p>
                </div>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-accent" /> Data & Privacy
            </CardTitle>
            <CardDescription>Your data is stored securely on Supabase with Row Level Security.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileDown className="w-5 h-5 text-green-500" />
                <div>
                  <Label className="font-medium">Export All Data</Label>
                  <p className="text-xs text-muted-foreground">Download your health data as a JSON file.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={exporting}
                className="gap-1.5"
              >
                <Download className="w-4 h-4" />
                {exporting ? "Exporting..." : "Export"}
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-blue-500" />
                <div>
                  <Label className="font-medium">Privacy Policy</Label>
                  <p className="text-xs text-muted-foreground">Read our data privacy and usage policy.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/privacy-policy")}>
                View
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-card border-red-500/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-500">
              <Shield className="w-4 h-4" /> Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-sm text-red-500">Delete Account</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This will permanently delete your account and all associated health data. This action cannot be undone.
                  </p>

                  {!showDeleteConfirm ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="mt-3 gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" /> Delete My Account
                    </Button>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <Label className="text-xs text-red-500 font-semibold">Type "DELETE" to confirm:</Label>
                      <input
                        type="text"
                        value={deleteText}
                        onChange={(e) => setDeleteText(e.target.value)}
                        className="w-full max-w-xs bg-background border border-red-500/30 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                        placeholder="DELETE"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteText !== "DELETE" || deleting}
                          onClick={handleDeleteAccount}
                        >
                          {deleting ? "Deleting..." : "Confirm Permanent Deletion"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default Settings;
