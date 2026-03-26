import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  iconOnly?: boolean;
  withText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function BrandLogo({ 
  className, 
  iconOnly = false, 
  withText = true,
  size = "md" 
}: BrandLogoProps) {
  const sizes = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto",
    lg: "h-10 w-auto",
    xl: "h-14 w-auto",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-14 h-14",
  };

  return (
    <div className={cn("flex items-center gap-2.5 group", className)}>
      <div className={cn("relative flex-shrink-0", iconSizes[size])}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2DD4BF" /> {/* teal-400 */}
              <stop offset="50%" stopColor="#10B981" /> {/* emerald-500 */}
              <stop offset="100%" stopColor="#059669" /> {/* emerald-600 */}
            </linearGradient>
          </defs>
          
          {/* Stylized Geometric 'S' / Infinity Shape from the user's second image */}
          <path
            d="M30 40 C 30 25, 70 25, 70 40 L 70 45 C 70 60, 30 60, 30 75 L 30 80 C 30 95, 70 95, 70 80"
            stroke="url(#logo-gradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500 group-hover:stroke-[12px]"
          />
          
          {/* Inner accent dots/lines to match the geometric complexity */}
          <circle cx="50" cy="50" r="5" fill="url(#logo-gradient)" />
          <path
            d="M40 35 L 60 35 M 40 65 L 60 65"
            stroke="url(#logo-gradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {!iconOnly && withText && (
        <span className={cn(
          "font-display font-black tracking-tighter text-foreground uppercase pt-0.5",
          size === "sm" ? "text-base" : size === "md" ? "text-xl" : size === "lg" ? "text-2xl" : "text-4xl"
        )}>
          Future<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">Me</span>
        </span>
      )}
    </div>
  );
}
