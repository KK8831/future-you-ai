import { User } from "@supabase/supabase-js";
import { UserCircle } from "lucide-react";

interface PatientProfileCardProps {
  user: User | null;
}

export function PatientProfileCard({ user }: PatientProfileCardProps) {
  const name = user?.user_metadata?.full_name || "User";
  const email = user?.email || "";

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt={name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <UserCircle className="w-7 h-7 text-accent" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{name}</h3>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
        <div>
          <p className="text-[10px] text-muted-foreground">Member Since</p>
          <p className="text-xs font-medium text-foreground">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Platform</p>
          <p className="text-xs font-medium text-accent">FutureMe AI</p>
        </div>
      </div>
    </div>
  );
}
