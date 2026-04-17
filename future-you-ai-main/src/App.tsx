import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { OfflineBanner } from "./components/OfflineBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MedicalDisclaimerModal } from "./components/MedicalDisclaimer";
import { PwaInstallBanner } from "./components/PwaInstallBanner";

// Lazy load all pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LogEntry = lazy(() => import("./pages/LogEntry"));
const Simulations = lazy(() => import("./pages/Simulations"));
const Predictions = lazy(() => import("./pages/Predictions"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const AuditDashboard = lazy(() => import("./pages/AuditDashboard"));
const AIInsights = lazy(() => import("./pages/AIInsights"));
const SmartCollect = lazy(() => import("./pages/SmartCollect"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Admin = lazy(() => import("./pages/Admin"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Social = lazy(() => import("./pages/Social"));
const Achievements = lazy(() => import("./pages/Achievements"));
const WeeklyDigest = lazy(() => import("./pages/WeeklyDigest"));
const Settings = lazy(() => import("./pages/Settings"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Simple loading placeholder for Suspense
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-6">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-health-green/20 border-t-health-green rounded-full animate-spin" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing FutureMe AI...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider defaultTheme="light">
          <OfflineBanner />
          <MedicalDisclaimerModal />
          <PwaInstallBanner />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/log-entry" element={<LogEntry />} />
              <Route path="/simulations" element={<Simulations />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/audit" element={<AuditDashboard />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/social" element={<Social />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/ai-insights" element={<AIInsights />} />
              <Route path="/weekly-digest" element={<WeeklyDigest />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/smart-collect" element={<SmartCollect />} />
              <Route path="/privacy-policy" element={<ErrorBoundary section="Privacy Policy"><PrivacyPolicy /></ErrorBoundary>} />
              <Route path="/terms" element={<ErrorBoundary section="Terms of Service"><TermsOfService /></ErrorBoundary>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;