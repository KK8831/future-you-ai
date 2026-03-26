import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-muted/40 via-muted/70 to-muted/40 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] rounded-xl",
        className
      )}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Live Biometrics skeleton */}
      <section className="space-y-3">
        <Shimmer className="h-5 w-32" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-36 p-4 rounded-2xl bg-card border border-border/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <Shimmer className="h-8 w-8 rounded-xl" />
                <Shimmer className="h-3 w-12" />
              </div>
              <Shimmer className="h-6 w-16" />
              <Shimmer className="h-3 w-20" />
            </div>
          ))}
        </div>
      </section>

      {/* Main grid skeleton */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          {/* Future Vision card */}
          <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-4">
            <div className="flex items-center gap-3">
              <Shimmer className="h-9 w-9 rounded-xl" />
              <Shimmer className="h-6 w-36" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Shimmer className="h-3 w-24" />
                  <Shimmer className="h-8 w-16" />
                </div>
              ))}
            </div>
            <Shimmer className="h-2 w-full rounded-full" />
          </div>

          {/* Risk predictions grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {[0, 1].map((i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border/50 space-y-3">
                <Shimmer className="h-5 w-40" />
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="space-y-1">
                    <div className="flex justify-between">
                      <Shimmer className="h-3 w-24" />
                      <Shimmer className="h-3 w-10" />
                    </div>
                    <Shimmer className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Digital Twin sidebar */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <Shimmer className="h-5 w-28" />
              <Shimmer className="h-5 w-16 rounded-full" />
            </div>
            <Shimmer className="h-36 w-36 rounded-full mx-auto" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Shimmer className="h-3 w-20" />
                  <Shimmer className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>

          {/* AI Message card */}
          <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-3">
            <div className="flex items-center gap-2">
              <Shimmer className="h-7 w-7 rounded-full" />
              <Shimmer className="h-4 w-32" />
            </div>
            <Shimmer className="h-3 w-full" />
            <Shimmer className="h-3 w-5/6" />
            <Shimmer className="h-3 w-4/6" />
          </div>
        </div>
      </div>

      {/* Recommendations grid */}
      <div className="grid md:grid-cols-[2fr_1fr] gap-6">
        <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-4">
          <Shimmer className="h-5 w-44" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl bg-secondary/30 border border-border/30">
              <Shimmer className="h-10 w-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-4 w-3/4" />
                <Shimmer className="h-3 w-full" />
                <Shimmer className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-3">
          <Shimmer className="h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-xl border border-border/30">
              <Shimmer className="h-8 w-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Shimmer className="h-3 w-20" />
                <Shimmer className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
