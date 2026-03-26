import { LucideIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  actionPath?: string;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  actionPath,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center animate-fade-in rounded-2xl border border-dashed border-border/60 bg-card/30 backdrop-blur-sm",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 text-accent">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[240px] mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && actionPath && (
        <Button asChild variant="hero" size="sm" className="gap-2">
          <Link to={actionPath}>
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}
