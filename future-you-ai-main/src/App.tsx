import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import LogEntry from "./pages/LogEntry";
import Simulations from "./pages/Simulations";
import Predictions from "./pages/Predictions";
import ProfileSettings from "./pages/ProfileSettings";
import AuditDashboard from "./pages/AuditDashboard";
import AIInsights from "./pages/AIInsights";
import SmartCollect from "./pages/SmartCollect";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider defaultTheme="light">
          <Routes>
            <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/log-entry" element={<LogEntry />} />
          <Route path="/simulations" element={<Simulations />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/audit" element={<AuditDashboard />} />
          <Route path="/ai-insights" element={<AIInsights />} />
          <Route path="/smart-collect" element={<SmartCollect />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;