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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User | null;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Log Entry", icon: ClipboardPlus, href: "/log-entry" },
  { label: "AI Insights", icon: Bot, href: "/ai-insights" },
  { label: "Smart Collect", icon: Smartphone, href: "/smart-collect" },
  { label: "Simulations", icon: TrendingUp, href: "/simulations" },
  { label: "Predictions", icon: Target, href: "/predictions" },
  { label: "Profile", icon: UserCircle, href: "/profile" },
  { label: "Audit Log", icon: Shield, href: "/audit" },
];

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
        {/* Top Bar */}
        <div className="hidden lg:flex h-14 items-center justify-between px-6 bg-card border-b border-border sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="flex items-center gap-2 flex-1 px-3 py-1.5 rounded-lg bg-secondary text-sm text-muted-foreground">
              <Search className="w-4 h-4" />
              <span>Search metrics, insights...</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
              <Bell className="w-[18px] h-[18px]" />
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(), "MMMM d, yyyy")}</span>
            </div>
            <Link
              to="/ai-insights"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </Link>
          </div>
        </div>

        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
