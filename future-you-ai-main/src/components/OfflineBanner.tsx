import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      // Show the "Back online" state briefly before hiding
      setTimeout(() => {
        setShowBanner(false);
        setJustReconnected(false);
      }, 2500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-300",
        justReconnected
          ? "bg-green-500 text-white"
          : "bg-slate-900 text-white border-b border-red-500/40"
      )}
      style={{ paddingTop: `calc(0.5rem + env(safe-area-inset-top))` }}
    >
      <WifiOff className={cn("w-4 h-4 flex-shrink-0", justReconnected && "hidden")} />
      <span>
        {justReconnected
          ? "✓ Back online — your data is syncing"
          : "No internet connection. Some features may be unavailable."}
      </span>
    </div>
  );
}
