import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  Activity,
  LayoutDashboard,
  ClipboardPlus,
  TrendingUp,
  Target,
  LogOut,
  Menu,
  X,
  Bot,
  Shield,
  UserCircle,
  Smartphone,
  Bell,
  Search,
  Calendar,
  FileText,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { FloatingChatbot } from "./FloatingChatbot";
import { useTheme } from "@/components/theme-provider";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User | null;
}

const navItems = [
  { label: "Dashboard",    icon: LayoutDashboard, href: "/dashboard" },
  { label: "Profile",      icon: UserCircle,      href: "/profile" },
  { label: "Log Entry",    icon: ClipboardPlus,   href: "/log-entry" },
  { label: "Smart Collect",icon: Smartphone,      href: "/smart-collect" },
  { label: "Predictions",  icon: Target,          href: "/predictions" },
  { label: "Simulations",  icon: TrendingUp,      href: "/simulations" },
  { label: "AI Insights",  icon: Bot,             href: "/ai-insights" },
  { label: "Audit Log",    icon: Shield,          href: "/audit" },
];

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      {/* Desktop Sidebar — dark navy using CSS sidebar tokens */}
      <aside
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 w-[240px]"
        style={{ background: "hsl(var(--sidebar-background))" }}
      >
        {/* Subtle top accent glow line */}
        <div
          className="h-0.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, hsl(var(--sidebar-primary)) 50%, transparent 100%)",
          }}
        />

        {/* Logo */}
        <div
          className="h-16 flex items-center gap-3 px-5"
          style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "hsl(var(--sidebar-primary) / 0.2)" }}
          >
            <Activity
              className="w-5 h-5"
              style={{ color: "hsl(var(--sidebar-primary))" }}
            />
          </div>
          <span
            className="text-lg font-display font-bold"
            style={{ color: "hsl(var(--sidebar-foreground))" }}
          >
            FutureMe AI
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                style={
                  isActive
                    ? {
                        background: "hsl(var(--sidebar-primary))",
                        color: "hsl(var(--sidebar-primary-foreground))",
                        fontWeight: 600,
                      }
                    : {
                        color: "hsl(var(--sidebar-foreground) / 0.8)",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background =
                      "hsl(var(--sidebar-accent))";
                    (e.currentTarget as HTMLElement).style.color =
                      "hsl(var(--sidebar-accent-foreground))";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLElement).style.color =
                      "hsl(var(--sidebar-foreground) / 0.8)";
                  }
                }}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div
          className="p-3"
          style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}
        >
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(var(--sidebar-primary) / 0.15)" }}
            >
              <span
                className="text-sm font-bold"
                style={{ color: "hsl(var(--sidebar-primary))" }}
              >
                {user?.user_metadata?.full_name?.charAt(0) ||
                  user?.email?.charAt(0) ||
                  "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "hsl(var(--sidebar-foreground))" }}
              >
                {user?.user_metadata?.full_name || "User"}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "hsl(var(--sidebar-foreground) / 0.5)" }}
              >
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: "hsl(var(--sidebar-foreground) / 0.6)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "hsl(var(--sidebar-accent))";
              (e.currentTarget as HTMLElement).style.color =
                "hsl(var(--sidebar-foreground))";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color =
                "hsl(var(--sidebar-foreground) / 0.6)";
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-accent" />
          </div>
          <span className="font-display font-bold text-foreground">
            FutureMe AI
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-foreground"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-card pt-14">
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                    isActive
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-[240px] pt-14 lg:pt-0">
        {/* Top Bar — refined alignment and depth */}
        <div className="hidden lg:flex h-16 items-center justify-between px-8 bg-card border-b border-border sticky top-0 z-30 shadow-sm backdrop-blur-md bg-card/80">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="flex items-center gap-3 flex-1 px-4 py-2 rounded-xl bg-secondary/50 border border-border/50 text-sm text-muted-foreground transition-all hover:bg-secondary/80 focus-within:ring-2 focus-within:ring-accent/20">
              <Search className="w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search metrics, predictive insights, or health history..." 
                className="bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-secondary/30 px-3 py-1.5 rounded-lg border border-border/50">
              <Calendar className="w-4 h-4 text-accent" />
              <span>{format(new Date(), "EEEE, MMMM do")}</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="relative p-2.5 rounded-xl hover:bg-secondary text-muted-foreground transition-all"
                title="Toggle Dark Mode"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className="relative p-2.5 rounded-xl hover:bg-secondary text-muted-foreground transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-card rounded-full" />
              </button>
              <Link
                to="/ai-insights"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-all shadow-md shadow-accent/20 active:scale-95"
              >
                <FileText className="w-4 h-4" />
                Generate Insight Report
              </Link>
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">{children}</div>
      </main>

      {/* Global Chatbot Widget */}
      <FloatingChatbot />
    </div>
  );
}
